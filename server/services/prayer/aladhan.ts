import { EdgeCache } from '../../cache';
import { dateIn, toDmy } from '../../dates';
import { hijriDate } from './hijri';
import type { HijriDate, HijriSource, PrayerSite, PrayerSource } from './types';

const API = 'https://api.aladhan.com/v1';
const SOURCE = 'Aladhan';
const TWELVE_HOURS = 12 * 3600;
const THIRTY_DAYS = 30 * 86_400;

export type Place =
  | { kind: 'city'; city: string; country: string }
  | { kind: 'coords'; latitude: number; longitude: number; name: string };

export interface Calculation {
  /** Aladhan method id, e.g. 3 = Muslim World League, 17 = JAKIM. */
  method: number;
  /** 0 = Shafi'i/Maliki/Hanbali, 1 = Hanafi (affects Asr). */
  school: number;
}

interface AladhanDay {
  timings: Record<string, string>;
  date: { hijri: { day: string; year: string; month: { number: number } } };
  meta: { timezone: string };
}

const hhmm = (raw: string) => raw.trim().replace(/\s*\(.*\)$/, '').slice(0, 5);

export class AladhanClient {
  constructor(private readonly cache = new EdgeCache()) {}

  async timings(date: string, place: Place, calc: Calculation): Promise<AladhanDay> {
    const query = place.kind === 'city'
      ? `timingsByCity/${toDmy(date)}?city=${encodeURIComponent(place.city)}&country=${encodeURIComponent(place.country)}`
      : `timings/${toDmy(date)}?latitude=${place.latitude}&longitude=${place.longitude}`;
    const url = `${API}/${query}&method=${calc.method}&school=${calc.school}`;
    return (await this.cache.get<{ data: AladhanDay }>(url, TWELVE_HOURS, SOURCE)).data;
  }

  async hijri(date: string, calendarMethod: string): Promise<HijriDate> {
    const url = `${API}/gToH/${toDmy(date)}?calendarMethod=${encodeURIComponent(calendarMethod)}`;
    const { data } = await this.cache.get<{ data: { hijri: AladhanDay['date']['hijri'] } }>(url, THIRTY_DAYS, SOURCE);
    return hijriDate(Number(data.hijri.day), data.hijri.month.number, Number(data.hijri.year));
  }
}

export class AladhanPrayerSource implements PrayerSource {
  constructor(private readonly place: Place, private readonly calc: Calculation, private readonly client = new AladhanClient()) {}

  async site(hint: string): Promise<PrayerSite> {
    let day = await this.client.timings(hint, this.place, this.calc);
    // The caller's date can be a day off when the place is in another time zone: ask again for the place's own today.
    const local = dateIn(day.meta.timezone);
    if (local !== hint) day = await this.client.timings(local, this.place, this.calc);
    const t = day.timings;
    return {
      date: local,
      source: SOURCE,
      location: this.place.kind === 'city' ? `${this.place.city}, ${this.place.country}` : this.place.name,
      timezone: day.meta.timezone,
      times: { fajr: hhmm(t.Fajr), syuruk: hhmm(t.Sunrise), dhuhr: hhmm(t.Dhuhr), asr: hhmm(t.Asr), maghrib: hhmm(t.Maghrib), isha: hhmm(t.Isha) },
    };
  }
}

/** Calendar methods Aladhan offers; each is an official or published convention. */
export const ALADHAN_CALENDARS = {
  UAQ: 'Umm al-Qura (Saudi Arabia)',
  HJCoSA: 'Hijri Calendar Council of Saudi Arabia',
  DIYANET: 'Diyanet (Turkey)',
  MATHEMATICAL: 'Astronomical calculation',
} as const;

export class AladhanHijriSource implements HijriSource {
  readonly label: string;

  constructor(private readonly calendarMethod: keyof typeof ALADHAN_CALENDARS, private readonly client = new AladhanClient()) {
    this.label = ALADHAN_CALENDARS[calendarMethod];
  }

  dates(gregorian: string[]): Promise<HijriDate[]> {
    return Promise.all(gregorian.map(date => this.client.hijri(date, this.calendarMethod)));
  }
}
