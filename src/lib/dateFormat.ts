/**
 * User-chosen date style. A pattern is built from d, m, y (and e for the weekday), case-insensitive,
 * with any of / - . , and spaces in between:
 *   dd/mm/yyyy -> 06/10/2026     d mmm yy -> 6 Oct 26     eee, dd.mm.yyyy -> Tue, 06.10.2026
 * 'auto' keeps the app's readable default ("Oct 6").
 */
export const AUTO_DATE_FORMAT = 'auto';

const TOKEN = /(d{1,2}|m{1,4}|y{4}|y{2}|e{3,4})/gi;
const pad = (n: number) => String(n).padStart(2, '0');
const names = (options: Intl.DateTimeFormatOptions, count: number, start: (i: number) => Date) =>
  Array.from({ length: count }, (_, i) => new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(start(i)));
const MONTHS_LONG = names({ month: 'long' }, 12, i => new Date(Date.UTC(2021, i, 15)));
const MONTHS_SHORT = names({ month: 'short' }, 12, i => new Date(Date.UTC(2021, i, 15)));
const DAYS_LONG = names({ weekday: 'long' }, 7, i => new Date(Date.UTC(2021, 0, 3 + i)));
const DAYS_SHORT = names({ weekday: 'short' }, 7, i => new Date(Date.UTC(2021, 0, 3 + i)));

class DateFormatService {
  private pattern = AUTO_DATE_FORMAT;

  select(pattern: string | null | undefined) {
    this.pattern = pattern || AUTO_DATE_FORMAT;
  }

  get setting() { return this.pattern; }
  get isAuto() { return this.pattern === AUTO_DATE_FORMAT; }

  /** A YYYY-MM-DD key rendered in the chosen pattern (or `pattern` when given). */
  format(key: string, pattern = this.pattern) {
    const [y, m, d] = key.split('-').map(Number);
    const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    return pattern.replace(TOKEN, token => {
      switch (token.toLowerCase()) {
        case 'd': return String(d);
        case 'dd': return pad(d);
        case 'm': return String(m);
        case 'mm': return pad(m);
        case 'mmm': return MONTHS_SHORT[m - 1];
        case 'mmmm': return MONTHS_LONG[m - 1];
        case 'yy': return pad(y % 100);
        case 'yyyy': return String(y);
        case 'eee': return DAYS_SHORT[weekday];
        case 'eeee': return DAYS_LONG[weekday];
        default: return token;
      }
    });
  }

  /** Text typed in the chosen pattern back to a YYYY-MM-DD key, or null if it is not a real date. */
  parse(text: string, pattern = this.pattern): string | null {
    const order: string[] = [];
    const source = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(TOKEN, token => {
      const kind = token.toLowerCase();
      if (kind[0] === 'e') return '[A-Za-z]+';
      order.push(kind);
      return kind[0] === 'm' && kind.length > 2 ? '([A-Za-z]+)' : kind === 'yyyy' ? '(\\d{4})' : '(\\d{1,2})';
    }).replace(/ +/g, '\\s*');
    const match = new RegExp(`^\\s*${source}\\s*$`).exec(text);
    if (!match) return null;

    let year = 0, month = 0, day = 0;
    order.forEach((kind, i) => {
      const value = match[i + 1];
      if (kind[0] === 'd') day = Number(value);
      else if (kind[0] === 'y') year = kind === 'yy' ? 2000 + Number(value) : Number(value);
      else if (kind.length > 2) month = MONTHS_SHORT.findIndex((s, j) => [s, MONTHS_LONG[j]].some(n => n.toLowerCase().startsWith(value.toLowerCase().slice(0, 3)))) + 1;
      else month = Number(value);
    });
    const real = new Date(Date.UTC(year, month - 1, day));
    const valid = month >= 1 && real.getUTCFullYear() === year && real.getUTCMonth() === month - 1 && real.getUTCDate() === day;
    return valid ? `${year}-${pad(month)}-${pad(day)}` : null;
  }
}

export const dateFormat = new DateFormatService();

export const DATE_FORMAT_PRESETS = [
  { id: AUTO_DATE_FORMAT, label: 'Automatic' },
  { id: 'dd/mm/yyyy', label: 'Day / month / year' },
  { id: 'mm/dd/yyyy', label: 'Month / day / year' },
  { id: 'yyyy-mm-dd', label: 'Year-month-day (ISO)' },
  { id: 'dd mmm yyyy', label: 'Day month name year' },
  { id: 'dd.mm.yyyy', label: 'Day.month.year' },
];
