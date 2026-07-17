import { RRule, rrulestr } from 'rrule'

// ===== Types =====
export type RecurrenceFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
export type WeekdayCode = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU'
export type RecurrenceEntityType = 'task' | 'event'

export interface RecurrenceConfig {
  freq: RecurrenceFreq
  interval?: number
  byday?: WeekdayCode[]
  bysetpos?: number[]
  bymonthday?: number[]
  bymonth?: number[]
  count?: number
  until?: string
}

export const WEEKDAY_CODES: WeekdayCode[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
export const WEEKDAY_NAMES: Record<WeekdayCode, string> = {
  MO: 'Monday', TU: 'Tuesday', WE: 'Wednesday', TH: 'Thursday', FR: 'Friday', SA: 'Saturday', SU: 'Sunday',
}
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// ===== Date helpers =====
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Default read-expansion window: 90 days back (history) to 365 days ahead. */
export function getDefaultRecurrenceWindow(): { windowStart: Date; windowEnd: Date } {
  const now = new Date()
  const windowStart = new Date(now)
  windowStart.setDate(windowStart.getDate() - 90)
  const windowEnd = new Date(now)
  windowEnd.setDate(windowEnd.getDate() + 365)
  return { windowStart, windowEnd }
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

// ===== RRULE string (de)serialization =====
export function configToRRuleString(config: RecurrenceConfig, dtstart: string): string {
  const parts = [`FREQ=${config.freq}`]
  if (config.interval && config.interval > 1) parts.push(`INTERVAL=${config.interval}`)
  if (config.byday?.length) parts.push(`BYDAY=${config.byday.join(',')}`)
  if (config.bymonthday?.length) parts.push(`BYMONTHDAY=${config.bymonthday.join(',')}`)
  if (config.bymonth?.length) parts.push(`BYMONTH=${config.bymonth.join(',')}`)
  if (config.bysetpos?.length) parts.push(`BYSETPOS=${config.bysetpos.join(',')}`)
  if (config.count) parts.push(`COUNT=${config.count}`)
  if (config.until) parts.push(`UNTIL=${config.until.replace(/-/g, '')}T235959Z`)
  return parts.join(';')
}

const WEEKDAY_INDEX: Record<string, number> = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5, SU: 6 }
const INDEX_TO_CODE = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as WeekdayCode[]

export function rruleStringToConfig(rruleStr: string): RecurrenceConfig | null {
  if (!rruleStr) return null
  try {
    const opts = rrulestr(`RRULE:${rruleStr}`).origOptions as any
    const config: RecurrenceConfig = { freq: freqFromValue(opts.freq) }
    if (opts.interval && opts.interval > 1) config.interval = opts.interval
    if (Array.isArray(opts.byweekday) && opts.byweekday.length) {
      config.byday = opts.byweekday.map((w: any) => INDEX_TO_CODE[w.weekday ?? WEEKDAY_INDEX[String(w)] ?? 0])
    } else if (opts.byweekday != null) {
      const w = opts.byweekday
      config.byday = [INDEX_TO_CODE[w.weekday ?? WEEKDAY_INDEX[String(w)] ?? 0]]
    }
    if (Array.isArray(opts.bymonthday) && opts.bymonthday.length) config.bymonthday = opts.bymonthday as number[]
    else if (typeof opts.bymonthday === 'number') config.bymonthday = [opts.bymonthday]
    if (Array.isArray(opts.bymonth) && opts.bymonth.length) config.bymonth = opts.bymonth as number[]
    else if (typeof opts.bymonth === 'number') config.bymonth = [opts.bymonth]
    if (Array.isArray(opts.bysetpos) && opts.bysetpos.length) config.bysetpos = opts.bysetpos as number[]
    else if (typeof opts.bysetpos === 'number') config.bysetpos = [opts.bysetpos]
    if (opts.count) config.count = opts.count
    if (opts.until) config.until = toDateStr(new Date(opts.until))
    return config
  } catch {
    return null
  }
}

function freqFromValue(v: any): RecurrenceFreq {
  switch (Number(v)) {
    case RRule.YEARLY: return 'YEARLY'
    case RRule.MONTHLY: return 'MONTHLY'
    case RRule.WEEKLY: return 'WEEKLY'
    default: return 'DAILY'
  }
}

// ===== Human description =====
export function describeRecurrence(config: RecurrenceConfig): string {
  const interval = config.interval && config.interval > 1 ? config.interval : 1
  switch (config.freq) {
    case 'DAILY':
      return interval === 1 ? 'Daily' : `Every ${interval} days`
    case 'WEEKLY': {
      if (config.byday?.length === 1) return `Every ${WEEKDAY_NAMES[config.byday[0]]}`
      return interval === 1 ? 'Weekly' : `Every ${interval} weeks`
    }
    case 'MONTHLY': {
      if (config.bymonthday?.length) return `Every ${ordinal(config.bymonthday[0])} of the month`
      if (config.byday?.length && config.bysetpos?.length) {
        const pos = config.bysetpos[0]
        const label = pos === 1 ? 'first' : pos === 2 ? 'second' : pos === 3 ? 'third' : pos === 4 ? 'fourth' : pos === -1 ? 'last' : `${ordinal(pos)}`
        return `Every ${label} ${WEEKDAY_NAMES[config.byday[0]]} of the month`
      }
      return interval === 1 ? 'Monthly' : `Every ${interval} months`
    }
    case 'YEARLY': {
      if (config.bymonth?.length && config.bymonthday?.length) {
        return `Every ${MONTH_NAMES[config.bymonth[0] - 1]} ${config.bymonthday[0]}`
      }
      return interval === 1 ? 'Yearly' : `Every ${interval} years`
    }
  }
}

// ===== OOP wrapper =====
export class RecurrenceRule {
  constructor(
    public readonly config: RecurrenceConfig,
    public readonly dtstart: string,
  ) {}

  static fromString(rruleStr: string | null, dtstart: string | null): RecurrenceRule | null {
    if (!rruleStr || !dtstart) return null
    const config = rruleStringToConfig(rruleStr)
    if (!config) return null
    return new RecurrenceRule(config, dtstart)
  }

  toString(): string {
    return configToRRuleString(this.config, this.dtstart)
  }

  get label(): string {
    return describeRecurrence(this.config)
  }

  /** Returns yyyy-MM-dd occurrence dates within [windowStart, windowEnd]. */
  expand(windowStart: Date, windowEnd: Date): string[] {
    const rule = rrulestr(`DTSTART:${this.dtstart.replace(/-/g, '')}T120000\nRRULE:${this.toString()}`)
    const start = new Date(windowStart)
    start.setHours(0, 0, 0, 0)
    const end = new Date(windowEnd)
    end.setHours(23, 59, 59, 999)
    return rule
      .between(start, end, true)
      .map((d) => toDateStr(d))
      .filter((d, i, arr) => arr.indexOf(d) === i)
  }
}

// ===== Expansion used by the services (pure) =====
export interface ExceptionOverride {
  status?: string | null
  newDate?: string | null
  title?: string | null
}

export interface ExceptionRow {
  entityId: string
  date: string
  status?: string | null
  newDate?: string | null
  title?: string | null
}

export function buildExceptionMap(rows: ExceptionRow[]): Record<string, ExceptionOverride> {
  const map: Record<string, ExceptionOverride> = {}
  for (const r of rows) {
    map[`${r.entityId}::${r.date}`] = {
      status: r.status ?? undefined,
      newDate: r.newDate ?? undefined,
      title: r.title ?? undefined,
    }
  }
  return map
}

export interface ExpandableTemplate {
  id: string
  dtstart?: string | null
  rrule?: string | null
  [key: string]: any
}

export interface ExpandOptions {
  /** Which field carries the occurrence date on the template (tasks: dueDate, events: date). */
  dateField: 'dueDate' | 'date'
  windowStart: Date
  windowEnd: Date
  /** exceptions keyed by `${entityId}::${originalOccurrenceDate}` */
  exceptions: Record<string, ExceptionOverride>
  /** default status for a freshly generated virtual instance (tasks: 'pending'). */
  defaultStatus?: string
}

/**
 * Turns a flat list of template rows into a flat list of concrete instances:
 * - non-recurring rows pass through unchanged (tagged isRecurring:false)
 * - recurring rows are expanded into virtual instances within the window,
 *   merged with per-occurrence exceptions (cancel / postpone / status / title).
 */
export function expandRecurring<T extends ExpandableTemplate>(templates: T[], opts: ExpandOptions): T[] {
  const out: T[] = []
  for (const tpl of templates) {
    const rule = RecurrenceRule.fromString(tpl.rrule ?? null, tpl.dtstart ?? null)
    if (!rule) {
      out.push({ ...tpl, isRecurring: false })
      continue
    }

    const dates = rule.expand(opts.windowStart, opts.windowEnd)
    for (const occDate of dates) {
      const ex = opts.exceptions[`${tpl.id}::${occDate}`]
      if (ex?.status === 'cancelled') continue

      const effectiveDate = ex?.newDate ?? occDate
      out.push({
        ...tpl,
        id: `${tpl.id}__${occDate}`,
        recurrenceTemplateId: tpl.id,
        occurrenceDate: occDate,
        [opts.dateField]: effectiveDate,
        status: ex?.status ?? opts.defaultStatus ?? tpl.status,
        title: ex?.title ?? tpl.title,
        isRecurring: true,
      } as T)
    }
  }
  return out
}
