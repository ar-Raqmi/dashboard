import { addDays } from '../../dates';
import { BaseService, optDate } from '../base';
import { SettingService, type Settings } from '../settings';
import { AladhanHijriSource, AladhanPrayerSource, type Place } from './aladhan';
import { JakimHijriSource, JakimPrayerSource } from './jakim';
import type { HijriSource, PrayerDay, PrayerSource } from './types';

const COORDINATE_PRECISION = 3;

export class PrayerService extends BaseService {
  /** Today's times at the configured place, with its Hijri date from the configured calendar. */
  async today(args: { date?: unknown }): Promise<PrayerDay> {
    const settings = await new SettingService(this.db, this.env, this.user).get();
    const hint = optDate(args.date) || new Date().toISOString().slice(0, 10);
    const site = await this.prayerSource(settings).site(hint);
    return { ...site, ...(await this.hijri(settings, site.date)) };
  }

  private prayerSource(s: Settings): PrayerSource {
    if (s.prayerProvider === 'jakim') return new JakimPrayerSource(s.jakimZone);
    return new AladhanPrayerSource(this.place(s), { method: s.prayerMethod, school: s.prayerSchool });
  }

  private place(s: Settings): Place {
    if (s.prayerPlace === 'coords' && s.prayerLatitude !== null && s.prayerLongitude !== null) {
      const name = s.prayerPlaceName || `${s.prayerLatitude.toFixed(COORDINATE_PRECISION)}, ${s.prayerLongitude.toFixed(COORDINATE_PRECISION)}`;
      return { kind: 'coords', latitude: s.prayerLatitude, longitude: s.prayerLongitude, name };
    }
    return { kind: 'city', city: s.aladhanCity, country: s.aladhanCountry };
  }

  private hijriSource(s: Settings): HijriSource {
    return s.hijriMethod === 'jakim' ? new JakimHijriSource(s.jakimZone) : new AladhanHijriSource(s.hijriMethod);
  }

  /** The Hijri date is secondary: if its source is down the times still show, with the reason. */
  private async hijri(s: Settings, date: string): Promise<Pick<PrayerDay, 'hijri' | 'hijriError'>> {
    const source = this.hijriSource(s);
    try {
      const [today, tomorrow] = await source.dates([addDays(date, s.hijriOffset), addDays(date, s.hijriOffset + 1)]);
      return { hijri: { today, tomorrow, source: source.label } };
    } catch (err) {
      return { hijri: null, hijriError: (err as Error).message };
    }
  }
}
