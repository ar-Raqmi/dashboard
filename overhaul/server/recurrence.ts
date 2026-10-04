import { rrulestr } from 'rrule';

/** Per-occurrence override stored in the shared `RecurrenceException` table. */
export interface ExceptionOverride {
  status?: string | null;
  newDate?: string | null;
  title?: string | null;
}
export type ExceptionMap = Record<string, ExceptionOverride>;

export const toDateStr = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateStr(d);
};

/** Read-expansion window: 90 days of history to 365 days ahead of `today`. */
export const recurrenceWindow = (today: string) => ({ start: addDays(today, -90), end: addDays(today, 365) });

/** Occurrence dates (yyyy-MM-dd) of an RRULE between two inclusive dates. */
export function expandDates(rrule: string, dtstart: string, start: string, end: string): string[] {
  try {
    const rule = rrulestr(`DTSTART:${dtstart.replace(/-/g, '')}T120000Z\nRRULE:${rrule}`);
    return [...new Set(rule.between(new Date(`${start}T00:00:00Z`), new Date(`${end}T23:59:59Z`), true).map(toDateStr))];
  } catch {
    return [];
  }
}

/**
 * A recurring task is shown as one row: its next occurrence (from today) that has not
 * been completed or skipped.
 */
export function nextTaskOccurrence(rrule: string, dtstart: string, id: string, today: string, exceptions: ExceptionMap): string | null {
  const { end } = recurrenceWindow(today);
  const dates = expandDates(rrule, dtstart, today > dtstart ? today : dtstart, end);
  for (const date of dates) {
    const status = exceptions[`${id}::${date}`]?.status;
    if (status !== 'completed' && status !== 'cancelled') return date;
  }
  return null;
}

/** Expands recurring calendar events into concrete instances, applying overrides. */
export function expandEvent<T extends { id: string; date: string; title: string; rrule: string | null; dtstart: string | null }>(
  event: T,
  today: string,
  exceptions: ExceptionMap,
) {
  if (!event.rrule || !event.dtstart) return [{ ...event, isRecurring: false, occurrenceDate: null as string | null }];
  const { start, end } = recurrenceWindow(today);
  return expandDates(event.rrule, event.dtstart, start, end).flatMap(date => {
    const ex = exceptions[`${event.id}::${date}`];
    if (ex?.status === 'cancelled') return [];
    return [{ ...event, date: ex?.newDate || date, title: ex?.title || event.title, isRecurring: true, occurrenceDate: date as string | null }];
  });
}
