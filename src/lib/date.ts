import { timeZone } from '@/lib/timezone';

/** Date helpers. All app dates are `YYYY-MM-DD` strings; "today" is read in the active time zone. */

const pad = (n: number) => String(n).padStart(2, '0');

export const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => timeZone.dateKey();
export const parseDateKey = (key: string) => new Date(`${key}T12:00:00`);

export function addDays(key: string, days: number) {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function dueLabel(due: string | null, today = todayKey()) {
  if (!due) return 'No date';
  if (due === today) return 'Today';
  if (due === addDays(today, 1)) return 'Tomorrow';
  if (due === addDays(today, -1)) return 'Yesterday';
  const d = parseDateKey(due);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) });
}

/** "Oct 4" for recent dates, used for note timestamps. */
export function shortDate(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso), now = new Date();
  if (toDateKey(d) === toDateKey(now)) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) });
}

/** "14:30" -> "2:30 PM". */
export function formatTime(hhmm: string | null) {
  if (!hhmm) return 'All day';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}

export function minutesBetween(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number), [eh, em] = end.split(':').map(Number);
  const diff = eh * 60 + em - (sh * 60 + sm);
  return diff > 0 ? diff : null;
}

export function downloadFile(content: string | Blob, name: string, type = 'text/plain') {
  const url = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const input = document.createElement('textarea');
    input.value = text;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand('copy');
    input.remove();
    if (!copied) throw new Error('Clipboard is not available in this browser.');
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024, i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
}
