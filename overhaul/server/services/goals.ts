import { assert, bool, iso, nowIso, uuid } from '../db';
import { BaseService, reqStr } from './base';
import { TaskService } from './tasks';

interface GoalRow { id: string; title: string; progress: number; order: number | null; createdAt: string }
interface MilestoneRow { id: string; goalId: string; label: string; completed: number; order: number }

export class GoalService extends BaseService {
  async list() {
    const [goals, milestones] = await Promise.all([
      this.db.all<GoalRow>('SELECT id, title, progress, "order", createdAt FROM Goal WHERE userId = ? ORDER BY "order" ASC, createdAt ASC', this.user.id),
      this.db.all<MilestoneRow>('SELECT m.* FROM Milestone m JOIN Goal g ON g.id = m.goalId WHERE g.userId = ? ORDER BY m."order" ASC', this.user.id),
    ]);
    return goals.map(g => ({
      id: g.id,
      title: g.title,
      progress: g.progress,
      order: g.order ?? 0,
      createdAt: iso(g.createdAt),
      milestones: milestones.filter(m => m.goalId === g.id).map(m => ({ id: m.id, label: m.label, completed: bool(m.completed), order: m.order })),
    }));
  }

  async create(args: { title?: unknown; milestones?: unknown }) {
    const title = reqStr(args.title, 'Project name', 200);
    const labels = Array.isArray(args.milestones) ? args.milestones.map(m => String(m).trim()).filter(Boolean).slice(0, 100) : [];
    const max = await this.db.first<{ m: number | null }>('SELECT MAX("order") m FROM Goal WHERE userId = ?', this.user.id);
    const id = uuid();
    await this.db.batch([
      { sql: 'INSERT INTO Goal (id, userId, title, progress, "order", createdAt) VALUES (?, ?, ?, 0, ?, ?)', params: [id, this.user.id, title, (max?.m ?? -1) + 1, nowIso()] },
      ...labels.map((label, i) => ({ sql: 'INSERT INTO Milestone (id, goalId, label, completed, "order") VALUES (?, ?, ?, 0, ?)', params: [uuid(), id, label, i] })),
    ]);
    return id;
  }

  /** Renames a project; `progress` is only settable for goals without milestones. */
  async update(args: { id?: unknown; title?: unknown; progress?: unknown }) {
    const goal = await this.owned<GoalRow>('Goal', args.id, 'Project');
    const patch: Record<string, unknown> = {};
    if (args.title !== undefined) patch.title = reqStr(args.title, 'Project name', 200);
    if (args.progress !== undefined) {
      const count = await this.db.first<{ c: number }>('SELECT COUNT(*) c FROM Milestone WHERE goalId = ?', goal.id);
      assert(!count?.c, 400, 'Progress follows milestones for this project');
      patch.progress = Math.max(0, Math.min(100, Math.round(Number(args.progress) || 0)));
    }
    await this.db.update('Goal', goal.id, patch);
    return { success: true };
  }

  async remove(args: { id?: unknown }) {
    const goal = await this.owned<GoalRow>('Goal', args.id, 'Project');
    await this.db.batch([
      { sql: 'DELETE FROM Milestone WHERE goalId = ?', params: [goal.id] },
      { sql: 'DELETE FROM Goal WHERE id = ?', params: [goal.id] },
    ]);
    await new TaskService(this.db, this.env, this.user).unlinkGoal(goal.id);
    return { success: true };
  }

  async reorder(args: { ids?: unknown }) {
    assert(Array.isArray(args.ids), 400, 'Missing project order');
    await this.db.batch(args.ids.map((id, i) => ({ sql: 'UPDATE Goal SET "order" = ? WHERE id = ? AND userId = ?', params: [i, String(id), this.user.id] })));
    return { success: true };
  }

  async addMilestone(args: { goalId?: unknown; label?: unknown }) {
    const goal = await this.owned<GoalRow>('Goal', args.goalId, 'Project');
    const max = await this.db.first<{ m: number | null }>('SELECT MAX("order") m FROM Milestone WHERE goalId = ?', goal.id);
    await this.db.run('INSERT INTO Milestone (id, goalId, label, completed, "order") VALUES (?, ?, ?, 0, ?)', uuid(), goal.id, reqStr(args.label, 'Milestone', 300), (max?.m ?? -1) + 1);
    return this.recalculate(goal.id);
  }

  async updateMilestone(args: { id?: unknown; label?: unknown; completed?: unknown }) {
    const m = await this.milestone(args.id);
    await this.db.update('Milestone', m.id, {
      label: args.label === undefined ? undefined : reqStr(args.label, 'Milestone', 300),
      completed: args.completed === undefined ? undefined : !!args.completed,
    });
    return this.recalculate(m.goalId);
  }

  async toggleMilestone(args: { id?: unknown }) {
    const m = await this.milestone(args.id);
    await this.db.run('UPDATE Milestone SET completed = ? WHERE id = ?', bool(m.completed) ? 0 : 1, m.id);
    return this.recalculate(m.goalId);
  }

  async removeMilestone(args: { id?: unknown }) {
    const m = await this.milestone(args.id);
    await this.db.run('DELETE FROM Milestone WHERE id = ?', m.id);
    return this.recalculate(m.goalId);
  }

  private async milestone(id: unknown) {
    const m = await this.db.first<MilestoneRow>('SELECT m.* FROM Milestone m JOIN Goal g ON g.id = m.goalId WHERE m.id = ? AND g.userId = ?', String(id), this.user.id);
    assert(m, 404, 'Milestone not found');
    return m;
  }

  private async recalculate(goalId: string) {
    const r = await this.db.first<{ total: number; done: number }>('SELECT COUNT(*) total, SUM(completed) done FROM Milestone WHERE goalId = ?', goalId);
    const progress = r?.total ? Math.round(((r.done ?? 0) / r.total) * 100) : 0;
    await this.db.run('UPDATE Goal SET progress = ? WHERE id = ?', progress, goalId);
    return { progress };
  }
}
