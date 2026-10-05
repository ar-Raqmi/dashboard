export interface PrayerTimes {
  fajr: string;
  syuruk: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface HijriDate {
  day: number;
  month: string;
  year: number;
}

/** One day's times at one place, as a provider reports them. */
export interface PrayerSite {
  /** The calendar date at the place itself, which can differ from the caller's date when travelling. */
  date: string;
  times: PrayerTimes;
  location: string;
  timezone: string;
  source: string;
}

export interface PrayerSource {
  /** Times for the place's current day; `hint` is the caller's date, used as the starting guess. */
  site(hint: string): Promise<PrayerSite>;
}

export interface HijriSource {
  readonly label: string;
  /** The Hijri date for each Gregorian date, in order. */
  dates(gregorian: string[]): Promise<HijriDate[]>;
}

export interface PrayerDay extends Omit<PrayerSite, 'date'> {
  date: string;
  hijri: { today: HijriDate; tomorrow: HijriDate; source: string } | null;
  hijriError?: string;
}
