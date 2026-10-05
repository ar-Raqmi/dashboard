import { EdgeCache } from '../../cache';
import { addDays, dateIn } from '../../dates';
import { HttpError } from '../../db';
import { hijriDate } from './hijri';
import type { HijriDate, HijriSource, PrayerSite, PrayerSource } from './types';

const ENDPOINT = 'https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat';
const SOURCE = 'JAKIM e-Solat';
const SIX_HOURS = 6 * 3600;
/** Every JAKIM zone lies in Malaysia, which keeps one time zone year-round. */
export const MALAYSIA_TIMEZONE = 'Asia/Kuala_Lumpur';

interface JakimRow { hijri: string; fajr: string; syuruk: string; dhuhr: string; asr: string; maghrib: string; isha: string }

/** The official Malaysian timetable. Its Hijri dates follow the national moon sighting. */
export class JakimClient {
  constructor(private readonly cache = new EdgeCache()) {}

  /** One row per day of the inclusive Gregorian range. */
  async range(zone: string, from: string, to: string): Promise<JakimRow[]> {
    const body = `datestart=${from}&dateend=${to}`;
    const res = await this.cache.json<{ prayerTime?: JakimRow[] }>(
      `https://jakim.cache.invalid/${zone}/${from}/${to}`,
      SIX_HOURS,
      () => fetch(`${ENDPOINT}&period=duration&zone=${zone}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }),
      SOURCE,
    );
    const rows = res.prayerTime ?? [];
    const days = (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1;
    if (rows.length !== days) throw new HttpError(502, `${SOURCE} returned no timetable for zone ${zone}. Check the zone in Settings.`);
    return rows;
  }
}

const hhmm = (raw: string) => raw.trim().slice(0, 5);

export class JakimPrayerSource implements PrayerSource {
  constructor(private readonly zone: string, private readonly client = new JakimClient()) {}

  async site(): Promise<PrayerSite> {
    const date = dateIn(MALAYSIA_TIMEZONE);
    const [row] = await this.client.range(this.zone, date, date);
    return {
      date,
      source: SOURCE,
      location: `Zone ${this.zone}, Malaysia`,
      timezone: MALAYSIA_TIMEZONE,
      times: { fajr: hhmm(row.fajr), syuruk: hhmm(row.syuruk), dhuhr: hhmm(row.dhuhr), asr: hhmm(row.asr), maghrib: hhmm(row.maghrib), isha: hhmm(row.isha) },
    };
  }
}

export class JakimHijriSource implements HijriSource {
  readonly label = 'JAKIM (Malaysia, moon sighting)';

  constructor(private readonly zone: string, private readonly client = new JakimClient()) {}

  async dates(gregorian: string[]): Promise<HijriDate[]> {
    const from = gregorian[0];
    const to = gregorian[gregorian.length - 1];
    if (addDays(from, gregorian.length - 1) !== to) throw new Error('JAKIM dates must be consecutive');
    const rows = await this.client.range(this.zone, from, to);
    return rows.map(row => {
      const [year, month, day] = row.hijri.split('-').map(Number);
      return hijriDate(day, month, year);
    });
  }
}
