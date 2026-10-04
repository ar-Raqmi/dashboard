import { assert, iso, nowIso, uuid } from '../db';
import { nextTaskOccurrence, type ExceptionMap } from '../recurrence';
import { BaseService, oneOf, optDate, reqStr, str } from './base';
import { LayoutStore } from './preferences';

export const PRIORITIES = ['high', 'medium', 'low'] as const;
export const STATUSES = ['pending', 'in_progress', 'completed'] as const;

interface TaskRow {
  id: string; title: string; dueDate: string | null; priority: string; status: string; createdAt: string;
  rrule: string | null; dtstart: string | null; recurrenceUntil: string | null; recurrenceCount: number | null;
}
/** Project (goal) and description live beside the Task row so the shared schema stays unchanged. */
type TaskMeta = Record<string, { goalId?: string | null; description?: string }>;
const TASK_META = 'overhaul:taskMeta';
/** Day each one-off task was completed (the Task table has no completion timestamp). */
type CompletionLog = Record<string, string>;
const COMPLETION_LOG = 'overhaul:completedOn';

/** Pulls UNTIL / COUNT out of an RRULE so the dedicated columns mirror the rule. */
function recurrenceBounds(rrule: string | null) {
  const until = rrule?.match(/UNTIL=(\d{4})(\d{2})(\d{2})/);
  const count = rrule?.match(/COUNT=(\d+)/);
  return { recurrenceUntil: until ? `${until[1]}-${until[2]}-${until[3]}` : null, recurrenceCount: count ? Number(count[1]) : null };
}
const validRRule = (v: unknown) => {
  if (v === null || v === undefined || v === '') return v === undefined ? undefined : null;
  assert(typeof v === 'string' && /^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)(;[A-Z]+=[A-Z0-9,+-]+)*$/.test(v), 400, 'Invalid repeat rule');
  return v;
};

export class TaskService extends BaseService {
  private meta = () => new LayoutStore(this.db, this.env, this.user);

  async list(args: { today?: unknown }) {
    const today = optDate(args.today) || new Date().toISOString().slice(0, 10);
    const [rows, meta, log, exceptions] = await Promise.all([
      this.db.all<TaskRow>('SELECT * FROM Task WHERE userId = ? ORDER BY createdAt DESC', this.user.id),
      this.meta().get<TaskMeta>(TASK_META, {}),
      this.meta().get<CompletionLog>(COMPLETION_LOG, {}),
      this.db.all<{ entityId: string; date: string; status: string | null }>("SELECT entityId, date, status FROM RecurrenceException WHERE userId = ? AND entityType = 'task'", this.user.id),
    ]);
    const map: ExceptionMap = Object.fromEntries(exceptions.map(e => [`${e.entityId}::${e.date}`, { status: e.status }]));
    const tasks = rows.map(t => {
      const occurrence = t.rrule && t.dtstart ? nextTaskOccurrence(t.rrule, t.dtstart, t.id, today, map) : null;
      return {
        id: t.id,
        title: t.title,
        dueDate: occurrence ?? t.dueDate,
        priority: PRIORITIES.includes(t.priority as never) ? t.priority : 'medium',
        status: t.rrule && occurrence && t.status === 'completed' ? 'pending' : t.status,
        createdAt: iso(t.createdAt),
        rrule: t.rrule,
        dtstart: t.dtstart,
        recurrenceUntil: t.recurrenceUntil,
        recurrenceCount: t.recurrenceCount,
        isRecurring: !!occurrence,
        occurrenceDate: occurrence,
        goalId: meta[t.id]?.goalId ?? null,
        description: meta[t.id]?.description ?? '',
      };
    });
    // Completed occurrences of repeating tasks plus logged one-off completions form the per-day history.
    const completions = [
      ...exceptions.filter(e => e.status === 'completed').map(e => ({ taskId: e.entityId, date: e.date })),
      ...rows.filter(t => !t.rrule && t.status === 'completed' && log[t.id]).map(t => ({ taskId: t.id, date: log[t.id] })),
    ];
    return { tasks, completions };
  }

  async create(args: Record<string, unknown>) {
    const title = reqStr(args.title, 'Task name', 300);
    const rrule = validRRule(args.rrule) ?? null;
    const dueDate = optDate(args.dueDate) ?? null;
    const dtstart = rrule ? optDate(args.dtstart) ?? dueDate ?? new Date().toISOString().slice(0, 10) : null;
    const id = uuid();
    await this.db.run(
      'INSERT INTO Task (id, userId, title, dueDate, priority, status, createdAt, rrule, dtstart, recurrenceUntil, recurrenceCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      id, this.user.id, title, dueDate ?? dtstart, oneOf(args.priority, PRIORITIES, 'medium'), oneOf(args.status, STATUSES, 'pending'), nowIso(),
      rrule, dtstart, recurrenceBounds(rrule).recurrenceUntil, recurrenceBounds(rrule).recurrenceCount,
    );
    await this.saveMeta(id, args);
    return id;
  }

  async update(args: Record<string, unknown>) {
    const task = await this.owned<TaskRow>('Task', args.id, 'Task');
    const patch: Record<string, unknown> = {
      title: args.title === undefined ? undefined : reqStr(args.title, 'Task name', 300),
      dueDate: optDate(args.dueDate),
      priority: oneOf(args.priority, PRIORITIES),
      status: oneOf(args.status, STATUSES),
    };
    if (args.clearRecurrence) Object.assign(patch, { rrule: null, dtstart: null, recurrenceUntil: null, recurrenceCount: null });
    else if (args.rrule !== undefined) {
      const rrule = validRRule(args.rrule) ?? null;
      Object.assign(patch, { rrule, dtstart: rrule ? optDate(args.dtstart) ?? task.dtstart ?? task.dueDate ?? new Date().toISOString().slice(0, 10) : null, ...recurrenceBounds(rrule) });
    }
    await this.db.update('Task', task.id, patch);
    await this.saveMeta(task.id, args);
    if (patch.status && patch.status !== task.status) await this.logCompletion(task.id, patch.status === 'completed', args.today);
    return { success: true };
  }

  /** Toggles completion. For a repeating task, completes (or reopens) a single occurrence. */
  async toggle(args: { id?: unknown; occurrenceDate?: unknown; today?: unknown }) {
    const task = await this.owned<TaskRow>('Task', args.id, 'Task');
    if (task.rrule && typeof args.occurrenceDate === 'string') {
      return this.setOccurrence({ id: task.id, date: args.occurrenceDate, status: 'completed' });
    }
    const completing = task.status !== 'completed';
    await this.db.run('UPDATE Task SET status = ? WHERE id = ?', completing ? 'completed' : 'pending', task.id);
    await this.logCompletion(task.id, completing, args.today);
    return { success: true };
  }

  private async logCompletion(id: string, completed: boolean, today: unknown) {
    const log = await this.meta().get<CompletionLog>(COMPLETION_LOG, {});
    if (completed) log[id] = optDate(today) || new Date().toISOString().slice(0, 10);
    else if (id in log) delete log[id];
    else return;
    await this.meta().set(COMPLETION_LOG, log);
  }

  /** Marks one occurrence of a repeating task as completed / skipped, or clears the override. */
  async setOccurrence(args: { id?: unknown; date?: unknown; status?: unknown }) {
    const task = await this.owned<TaskRow>('Task', args.id, 'Task');
    const date = optDate(args.date);
    assert(date, 400, 'Missing occurrence date');
    await this.db.run("DELETE FROM RecurrenceException WHERE userId = ? AND entityType = 'task' AND entityId = ? AND date = ?", this.user.id, task.id, date);
    if (args.status !== null) {
      await this.db.run(
        "INSERT INTO RecurrenceException (id, userId, entityType, entityId, date, status, createdAt) VALUES (?, ?, 'task', ?, ?, ?, ?)",
        uuid(), this.user.id, task.id, date, oneOf(args.status, ['completed', 'cancelled'] as const), nowIso(),
      );
    }
    return { success: true };
  }

  async remove(args: { id?: unknown }) {
    const task = await this.owned<TaskRow>('Task', args.id, 'Task');
    await this.db.batch([
      { sql: 'DELETE FROM Task WHERE id = ?', params: [task.id] },
      { sql: "DELETE FROM RecurrenceException WHERE userId = ? AND entityType = 'task' AND entityId = ?", params: [this.user.id, task.id] },
    ]);
    await this.pruneMeta([task.id]);
    return { success: true };
  }

  async deleteCompleted() {
    const rows = await this.db.all<{ id: string }>("SELECT id FROM Task WHERE userId = ? AND status = 'completed' AND rrule IS NULL", this.user.id);
    await this.db.run("DELETE FROM Task WHERE userId = ? AND status = 'completed' AND rrule IS NULL", this.user.id);
    await this.pruneMeta(rows.map(r => r.id));
    return { removed: rows.length };
  }

  /** Detaches tasks from a goal that is being deleted. */
  async unlinkGoal(goalId: string) {
    const meta = await this.meta().get<TaskMeta>(TASK_META, {});
    let changed = false;
    for (const entry of Object.values(meta)) if (entry.goalId === goalId) { entry.goalId = null; changed = true; }
    if (changed) await this.meta().set(TASK_META, meta);
  }

  private async saveMeta(id: string, args: Record<string, unknown>) {
    if (args.goalId === undefined && args.description === undefined) return;
    const meta = await this.meta().get<TaskMeta>(TASK_META, {});
    const entry = { ...meta[id] };
    if (args.goalId !== undefined) {
      if (args.goalId) await this.owned('Goal', args.goalId, 'Project');
      entry.goalId = (args.goalId as string) || null;
    }
    if (args.description !== undefined) entry.description = str(args.description, 20000) ?? '';
    meta[id] = entry;
    if (!entry.goalId && !entry.description) delete meta[id];
    await this.meta().set(TASK_META, meta);
  }

  private async pruneMeta(ids: string[]) {
    const log = await this.meta().get<CompletionLog>(COMPLETION_LOG, {});
    if (ids.some(id => id in log)) {
      for (const id of ids) delete log[id];
      await this.meta().set(COMPLETION_LOG, log);
    }
    const meta = await this.meta().get<TaskMeta>(TASK_META, {});
    if (!ids.some(id => id in meta)) return;
    for (const id of ids) delete meta[id];
    await this.meta().set(TASK_META, meta);
  }
}
