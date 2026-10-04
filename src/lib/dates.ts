const pad = (n: number) => String(n).padStart(2, '0')

export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Local calendar date as YYYY-MM-DD (never UTC, so "today" matches the user's wall clock). */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const todayStr = () => toDateStr(new Date())

/** Parse YYYY-MM-DD at local noon so DST shifts can't change the day. */
export function parseDateStr(s: string): Date {
  return new Date(`${s}T12:00:00`)
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDateStr(dateStr)
  d.setDate(d.getDate() + days)
  return toDateStr(d)
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseDateStr(to).getTime() - parseDateStr(from).getTime()) / 86_400_000)
}

/** "Today", "Tomorrow", "Yesterday", "Oct 5", or "Oct 5, 2027" for another year. */
export function dueLabel(due: string | null | undefined, today = todayStr()): string {
  if (!due) return 'No date'
  const diff = daysBetween(today, due)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  const d = parseDateStr(due)
  const base = `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`
  return d.getFullYear() === parseDateStr(today).getFullYear() ? base : `${base}, ${d.getFullYear()}`
}

/** "13:05" -> "1:05 PM". Returns '' for empty input. */
export function formatTime(hhmm: string | null | undefined): string {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm
  const meridiem = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${pad(m)} ${meridiem}`
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function formatLongDate(dateStr: string): string {
  return parseDateStr(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

/** "5m ago", "3h ago", "Oct 5" - for updatedAt style stamps. */
export function relativeTime(iso: string | Date | null | undefined, now = new Date()): string {
  if (!iso) return ''
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return ''
  const mins = Math.floor((now.getTime() - d.getTime()) / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}${d.getFullYear() === now.getFullYear() ? '' : `, ${d.getFullYear()}`}`
}

export function initials(name: string | null | undefined): string {
  const words = (name ?? '').replace(/[^\p{L}\p{N}\s-]/gu, ' ').split(/[\s-]+/).filter(Boolean)
  if (!words.length) return 'U'
  return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const v = bytes / 1024 ** i
  return `${v >= 10 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`
}
