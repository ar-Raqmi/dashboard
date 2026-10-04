import { assert, bool, nowIso, uuid } from '../db';
import { expandEvent, type ExceptionMap } from '../recurrence';
import { BaseService, optDate, reqStr } from './base';

interface EventRow {
  id: string; title: string; date: string; color: string | null; startTime: string | null; endTime: string | null; allDay: number | null;
  rrule: string | null; dtstart: string | null; recurrenceUntil: string | null; recurrenceCount: number | null;
}
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const optTime = (v: unknown) => (v === undefined ? undefined : v === null || v === '' ? null : (assert(TIME.test(String(v)), 400, 'Times must be HH:MM'), String(v)));
const rruleOf = (v: unknown) => {
  if (v === undefined) return undefined;
  if (!v) return null;
  assert(/^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)(;[A-Z]+=[A-Z0-9,+-]+)*$/.test(String(v)), 400, 'Invalid repeat rule');
  return String(v);
};
const bounds = (rrule: string | null) => {
  const until = rrule?.match(/UNTIL=(\d{4})(\d{2})(\d{2})/), count = rrule?.match(/COUNT=(\d+)/);
  return { recurrenceUntil: until ? `${until[1]}-${until[2]}-${until[3]}` : null, recurrenceCount: count ? Number(count[1]) : null };
};

export class EventService extends BaseService {
  async list(args: { today?: unknown }) {
    const today = optDate(args.today) || new Date().toISOString().slice(0, 10);
    const [rows, exceptions] = await Promise.all([
      this.db.all<EventRow>('SELECT * FROM CalendarEvent WHERE userId = ?', this.user.id),
      this.db.all<{ entityId: string; date: string; status: string | null; newDate: string | null; title: string | null }>(
        "SELECT entityId, date, status, newDate, title FROM RecurrenceException WHERE userId = ? AND entityType = 'event'", this.user.id),
    ]);
    const map: ExceptionMap = Object.fromEntries(exceptions.map(e => [`${e.entityId}::${e.date}`, e]));
    return rows
      .flatMap(e => expandEvent({
        id: e.id, title: e.title, date: e.date, color: e.color, startTime: e.startTime, endTime: e.endTime,
        allDay: e.allDay === null ? !e.startTime : bool(e.allDay), rrule: e.rrule, dtstart: e.dtstart,
        recurrenceUntil: e.recurrenceUntil, recurrenceCount: e.recurrenceCount,
      }, today, map))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || ''));
  }

  async create(args: Record<string, unknown>) {
    const date = optDate(args.date);
    assert(date, 400, 'Event date is required');
    const rrule = rruleOf(args.rrule) ?? null;
    const allDay = args.allDay === undefined ? !args.startTime : !!args.allDay;
    const id = uuid();
    await this.db.run(
      'INSERT INTO CalendarEvent (id, userId, title, date, color, startTime, endTime, allDay, rrule, dtstart, recurrenceUntil, recurrenceCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      id, this.user.id, reqStr(args.title, 'Event title', 300), date, typeof args.color === 'string' ? args.color : null,
      allDay ? null : optTime(args.startTime) ?? null, allDay ? null : optTime(args.endTime) ?? null, allDay ? 1 : 0,
      rrule, rrule ? date : null, bounds(rrule).recurrenceUntil, bounds(rrule).recurrenceCount,
    );
    return id;
  }

  async update(args: Record<string, unknown>) {
    const event = await this.owned<EventRow>('CalendarEvent', args.id, 'Event');
    const patch: Record<string, unknown> = {
      title: args.title === undefined ? undefined : reqStr(args.title, 'Event title', 300),
      date: optDate(args.date) ?? undefined,
      color: typeof args.color === 'string' ? args.color : undefined,
      startTime: optTime(args.startTime),
      endTime: optTime(args.endTime),
      allDay: args.allDay === undefined ? undefined : !!args.allDay,
    };
    if (patch.allDay === true) Object.assign(patch, { startTime: null, endTime: null });
    const rrule = rruleOf(args.rrule);
    if (rrule !== undefined) Object.assign(patch, { rrule, dtstart: rrule ? (patch.date ?? event.dtstart ?? event.date) : null, ...bounds(rrule) });
    else if (event.rrule && patch.date) patch.dtstart = patch.date;
    await this.db.update('CalendarEvent', event.id, patch);
    return { success: true };
  }

  /** Overrides a single occurrence of a repeating event: cancel it, move it, or rename it. */
  async setOccurrence(args: { id?: unknown; date?: unknown; status?: unknown; newDate?: unknown; title?: unknown }) {
    const event = await this.owned<EventRow>('CalendarEvent', args.id, 'Event');
    const date = optDate(args.date);
    assert(date && event.rrule, 400, 'Not a repeating event occurrence');
    await this.db.run("DELETE FROM RecurrenceException WHERE userId = ? AND entityType = 'event' AND entityId = ? AND date = ?", this.user.id, event.id, date);
    await this.db.run(
      "INSERT INTO RecurrenceException (id, userId, entityType, entityId, date, status, newDate, title, createdAt) VALUES (?, ?, 'event', ?, ?, ?, ?, ?, ?)",
      uuid(), this.user.id, event.id, date, args.status === 'cancelled' ? 'cancelled' : null, optDate(args.newDate) ?? null,
      typeof args.title === 'string' && args.title.trim() ? args.title.trim() : null, nowIso(),
    );
    return { success: true };
  }

  async remove(args: { id?: unknown }) {
    const event = await this.owned<EventRow>('CalendarEvent', args.id, 'Event');
    await this.db.batch([
      { sql: 'DELETE FROM CalendarEvent WHERE id = ?', params: [event.id] },
      { sql: "DELETE FROM RecurrenceException WHERE userId = ? AND entityType = 'event' AND entityId = ?", params: [this.user.id, event.id] },
    ]);
    return { success: true };
  }
}
