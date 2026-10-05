import { assert, bool, HttpError, toSql, type Row, uuid } from '../db';
import { BaseService, oneOf, str } from './base';

export const DEFAULT_BRAND = 'raqmi';
const MAX_BRAND_LENGTH = 24;
const LARGE = 400_000;

/** How one settings column is decoded from a row and validated on the way in. `write` returns undefined to leave the column alone. */
interface Field<T> {
  default: T;
  read(raw: unknown): T;
  write(value: unknown): T | undefined;
}

const text = (def = '', max = 200): Field<string> => ({
  default: def,
  read: raw => (typeof raw === 'string' ? raw : def),
  write: value => str(value, max),
});
const flag = (def: boolean): Field<boolean> => ({ default: def, read: bool, write: value => !!value });
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const integer = (def: number, min: number, max: number): Field<number> => ({
  default: def,
  read: raw => Number(raw ?? def),
  write: value => clamp(Math.round(Number(value) || 0), min, max),
});
const choice = <T extends string>(def: T, options: readonly T[]): Field<T> => ({
  default: def,
  read: raw => (options.includes(raw as T) ? (raw as T) : def),
  write: value => oneOf(value, options),
});
const numericChoice = (def: number, options: readonly number[]): Field<number> => ({
  default: def,
  read: raw => (options.includes(Number(raw)) ? Number(raw) : def),
  write: value => {
    assert(options.includes(Number(value)), 400, `Expected one of: ${options.join(', ')}`);
    return Number(value);
  },
});
const coordinate = (limit: number): Field<number | null> => ({
  default: null,
  read: raw => (raw === null || raw === undefined ? null : Number(raw)),
  write: value => {
    if (value === null || value === '') return null;
    const n = Number(value);
    assert(Number.isFinite(n) && Math.abs(n) <= limit, 400, `Coordinates must be within ±${limit}`);
    return n;
  },
});
const brand: Field<string> = {
  default: DEFAULT_BRAND,
  read: raw => (typeof raw === 'string' && raw ? raw : DEFAULT_BRAND),
  write: value => str(value, MAX_BRAND_LENGTH)?.trim() || DEFAULT_BRAND,
};
/** 'auto' (follow the device) or an IANA zone this runtime knows. */
const timezone: Field<string> = {
  default: 'auto',
  read: raw => (typeof raw === 'string' && raw ? raw : 'auto'),
  write: value => {
    const zone = typeof value === 'string' ? value.trim() : '';
    if (zone === 'auto') return zone;
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: zone });
      return zone;
    } catch {
      throw new HttpError(400, 'Unknown time zone');
    }
  },
};
/** A profile or logo image: an uploaded file of ours, or an https link. Anything else (data:, javascript:) is refused. */
const imageSource: Field<string> = {
  default: '',
  read: raw => (typeof raw === 'string' ? raw : ''),
  write: value => {
    const src = typeof value === 'string' ? value.trim() : '';
    if (!src || /^\/api\/files\/[\w-]+\/content(\?.*)?$/.test(src)) return src;
    try {
      assert(new URL(src).protocol === 'https:' && src.length <= 2000, 400, 'Use an https link');
      return src;
    } catch (err) {
      throw err instanceof HttpError ? err : new HttpError(400, 'That is not a valid image link');
    }
  },
};
/** 'auto' or a pattern built from d, m, y (and e for the weekday) with / - . , and spaces, e.g. dd/mm/yyyy. */
const dateFormat: Field<string> = {
  default: 'auto',
  read: raw => (typeof raw === 'string' && raw ? raw : 'auto'),
  write: value => {
    const pattern = typeof value === 'string' ? value.trim() : '';
    if (pattern === 'auto') return pattern;
    assert(/^[dmyeDMYE/\-., ]{3,30}$/.test(pattern) && /d/i.test(pattern) && /m/i.test(pattern) && /y/i.test(pattern), 400, 'A date format needs a day, month and year, such as dd/mm/yyyy');
    return pattern;
  },
};
const jakimZone: Field<string> = {
  default: 'SGR01',
  read: raw => (typeof raw === 'string' && /^[A-Z]{3}\d{2}$/.test(raw) ? raw : 'SGR01'),
  write: value => {
    const zone = String(value ?? '').trim().toUpperCase();
    assert(/^[A-Z]{3}\d{2}$/.test(zone), 400, 'JAKIM zones look like SGR01 or WLY01');
    return zone;
  },
};

/** Aladhan method ids that exist (6 was never assigned; 99 is custom angles, which the app does not collect). */
const PRAYER_METHODS = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23] as const;

const FIELDS = {
  profileName: text(),
  profilePicture: imageSource,
  appTitle: text('Dashboard'),
  brandName: brand,
  timezone,
  appLogo: imageSource,
  brandIcon: choice('raqmi', ['raqmi', 'feather', 'leaf', 'moon', 'compass', 'book', 'bolt', 'star', 'custom', 'none'] as const),
  dateFormat,
  iconBackgroundColor: text('#A7C080'),
  clipboardText: text('', 100_000),
  showSeconds: flag(true),

  backgroundType: text('default'),
  backgroundColor: text('#A7C080'),
  backgroundGradient: text('forest-dew'),
  backgroundImage: text('', LARGE),
  backgroundOpacity: integer(30, 0, 100),

  prayerProvider: choice('jakim', ['jakim', 'aladhan'] as const),
  jakimZone,
  prayerPlace: choice('city', ['city', 'coords'] as const),
  aladhanCity: text('Kuala Lumpur', 100),
  aladhanCountry: text('Malaysia', 100),
  prayerLatitude: coordinate(90),
  prayerLongitude: coordinate(180),
  prayerPlaceName: text('', 100),
  prayerMethod: numericChoice(3, PRAYER_METHODS),
  prayerSchool: numericChoice(0, [0, 1]),

  hijriVisible: flag(true),
  hijriMethod: choice('jakim', ['jakim', 'UAQ', 'HJCoSA', 'DIYANET', 'MATHEMATICAL'] as const),
  hijriRollover: choice('midnight', ['midnight', 'maghrib'] as const),
  hijriOffset: integer(0, -3, 3),
};

type Fields = typeof FIELDS;
export type Settings = { -readonly [K in keyof Fields]: Fields[K]['default'] };
const KEYS = Object.keys(FIELDS) as (keyof Settings)[];
const field = (key: string) => (FIELDS as Record<string, Field<unknown>>)[key];

export class SettingService extends BaseService {
  async get(): Promise<Settings> {
    let row = await this.db.first<Row>('SELECT * FROM UserSettings WHERE userId = ?', this.user.id);
    if (!row) {
      const seed = { ...this.defaults(), profileName: this.user.username };
      await this.db.run(
        `INSERT INTO UserSettings (id, userId, ${KEYS.map(k => `"${k}"`).join(', ')}) VALUES (?, ?, ${KEYS.map(() => '?').join(', ')})`,
        uuid(), this.user.id, ...KEYS.map(k => toSql(seed[k])),
      );
      row = await this.db.first<Row>('SELECT * FROM UserSettings WHERE userId = ?', this.user.id);
    }
    return Object.fromEntries(KEYS.map(k => [k, field(k).read(row?.[k])])) as Settings;
  }

  async update(args: Record<string, unknown>) {
    await this.get();
    const patch: Record<string, unknown> = {};
    for (const key of KEYS) if (args[key] !== undefined) patch[key] = field(key).write(args[key]);
    const row = await this.db.first<{ id: string }>('SELECT id FROM UserSettings WHERE userId = ?', this.user.id);
    if (row) await this.db.update('UserSettings', row.id, patch);
    return this.get();
  }

  private defaults() {
    return Object.fromEntries(KEYS.map(k => [k, FIELDS[k].default])) as Settings;
  }
}
