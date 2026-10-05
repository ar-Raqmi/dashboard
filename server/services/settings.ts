import { bool, HttpError, type Row, uuid } from '../db';
import { BaseService, str } from './base';

export const DEFAULT_BRAND = 'raqmi';
const MAX_BRAND_LENGTH = 24;

const DEFAULTS = {
  profileName: '', profilePicture: '', appTitle: 'Dashboard', brandName: DEFAULT_BRAND, timezone: 'auto', appLogo: '', iconBackgroundColor: '#A7C080',
  hijriVisible: true, hijriOffset: 0, hijriProvider: 'calculated', hijriCalendar: 'UmmAlQura', showSeconds: true, clipboardText: '',
  backgroundType: 'default', backgroundColor: '#A7C080', backgroundGradient: 'forest-dew', backgroundImage: '', backgroundOpacity: 30,
  aladhanCity: 'Kuala Lumpur', aladhanCountry: 'Malaysia',
};
type Settings = typeof DEFAULTS;

const TEXT_FIELDS = ['profileName', 'profilePicture', 'appTitle', 'brandName', 'timezone', 'appLogo', 'iconBackgroundColor', 'hijriProvider', 'hijriCalendar', 'clipboardText',
  'backgroundType', 'backgroundColor', 'backgroundGradient', 'backgroundImage', 'aladhanCity', 'aladhanCountry'] as const;
const BOOL_FIELDS = ['hijriVisible', 'showSeconds'] as const;

/** 'auto' (follow the device) or an IANA zone this runtime knows. */
function validTimeZone(value: unknown) {
  const zone = typeof value === 'string' ? value.trim() : '';
  if (zone === 'auto') return zone;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return zone;
  } catch {
    throw new HttpError(400, 'Unknown time zone');
  }
}

export class SettingService extends BaseService {
  async get(): Promise<Settings> {
    let row = await this.db.first<Row>('SELECT * FROM UserSettings WHERE userId = ?', this.user.id);
    if (!row) {
      const seed = { ...DEFAULTS, profileName: this.user.username };
      const keys = Object.keys(seed) as (keyof Settings)[];
      await this.db.run(
        `INSERT INTO UserSettings (id, userId, ${keys.map(k => `"${k}"`).join(', ')}) VALUES (?, ?, ${keys.map(() => '?').join(', ')})`,
        uuid(), this.user.id, ...keys.map(k => (typeof seed[k] === 'boolean' ? (seed[k] ? 1 : 0) : seed[k])),
      );
      row = await this.db.first<Row>('SELECT * FROM UserSettings WHERE userId = ?', this.user.id);
    }
    const out = { ...DEFAULTS };
    for (const k of TEXT_FIELDS) out[k] = (row?.[k] as string | null) ?? DEFAULTS[k];
    for (const k of BOOL_FIELDS) out[k] = bool(row?.[k]);
    out.hijriOffset = Number(row?.hijriOffset ?? 0);
    out.backgroundOpacity = Number(row?.backgroundOpacity ?? 30);
    return out;
  }

  async update(args: Record<string, unknown>) {
    await this.get();
    const patch: Record<string, unknown> = {};
    for (const k of TEXT_FIELDS) if (args[k] !== undefined) patch[k] = str(args[k], k === 'clipboardText' ? 100000 : k.endsWith('Image') || k.endsWith('Picture') || k.endsWith('Logo') ? 400000 : 200) ?? '';
    if (args.brandName !== undefined) patch.brandName = str(args.brandName, MAX_BRAND_LENGTH)?.trim() || DEFAULT_BRAND;
    if (args.timezone !== undefined) patch.timezone = validTimeZone(args.timezone);
    for (const k of BOOL_FIELDS) if (args[k] !== undefined) patch[k] = !!args[k];
    if (args.hijriOffset !== undefined) patch.hijriOffset = Math.max(-3, Math.min(3, Math.round(Number(args.hijriOffset) || 0)));
    if (args.backgroundOpacity !== undefined) patch.backgroundOpacity = Math.max(0, Math.min(100, Math.round(Number(args.backgroundOpacity) || 0)));
    const row = await this.db.first<{ id: string }>('SELECT id FROM UserSettings WHERE userId = ?', this.user.id);
    if (row) await this.db.update('UserSettings', row.id, patch);
    return this.get();
  }
}
