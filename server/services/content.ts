import { BaseService, optDate } from './base';
import { SettingService } from './settings';

const HIJRI_MONTHS = ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah'];

/** Fetches JSON through the edge cache so each upstream is hit at most once per key per TTL. */
async function cachedJson<T>(url: string, ttlSeconds: number): Promise<T> {
  const cache = (caches as unknown as { default: Cache }).default;
  const hit = await cache.match(url);
  if (hit) return hit.json() as Promise<T>;
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'raqmi-dashboard' } });
  if (!res.ok) throw new Error(`Upstream ${res.status}`);
  const body = await res.text();
  await cache.put(url, new Response(body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${ttlSeconds}` } }));
  return JSON.parse(body) as T;
}

/** Stable per-day pick, so everyone sees the same verse / hadith all day. */
function daySeed(date: string, modulo: number) {
  let h = 2166136261;
  for (const ch of date) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (Math.abs(h) % modulo) + 1;
}

export interface PrayerDay {
  source: string;
  location: string;
  timezone: string;
  times: { fajr: string; syuruk?: string; dhuhr: string; asr: string; maghrib: string; isha: string };
  hijri: { day: number; month: string; year: number } | null;
}

const hhmm = (raw: string) => (raw || '00:00').trim().replace(/\s*\(.*\)$/, '').slice(0, 5);

export class ContentService extends BaseService {
  async verse(args: { date?: unknown }) {
    const date = optDate(args.date) || new Date().toISOString().slice(0, 10);
    const ayah = daySeed(`verse:${date}`, 6236);
    type Ayah = { text: string; numberInSurah: number; surah: { number: number; englishName: string } };
    const data = await cachedJson<{ data: Ayah[] }>(`https://api.alquran.cloud/v1/ayah/${ayah}/editions/quran-uthmani,en.sahih`, 86400 * 30);
    const [arabic, english] = data.data;
    return {
      arabic: arabic.text,
      translation: english.text,
      reference: `${arabic.surah.englishName}, ${arabic.surah.number}:${arabic.numberInSurah}`,
      url: `https://quran.com/${arabic.surah.number}/${arabic.numberInSurah}`,
    };
  }

  async hadith(args: { date?: unknown }) {
    const date = optDate(args.date) || new Date().toISOString().slice(0, 10);
    type Book = { hadiths: { hadithnumber: number; text: string }[] };
    for (let attempt = 0; attempt < 4; attempt++) {
      const n = daySeed(`hadith:${date}:${attempt}`, 7563);
      try {
        const base = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';
        const [en, ar] = await Promise.all([
          cachedJson<Book>(`${base}/eng-bukhari/${n}.json`, 86400 * 30),
          cachedJson<Book>(`${base}/ara-bukhari/${n}.json`, 86400 * 30).catch(() => null),
        ]);
        const text = en.hadiths[0]?.text?.trim();
        if (!text) continue;
        return { translation: text, arabic: ar?.hadiths[0]?.text?.trim() || null, source: `Sahih al-Bukhari ${n}`, url: `https://sunnah.com/bukhari:${n}` };
      } catch { /* try the next pick */ }
    }
    return null;
  }

  /** Today's prayer times and Hijri date, from the provider configured in settings. */
  async prayer(args: { date?: unknown }): Promise<PrayerDay | null> {
    const date = optDate(args.date) || new Date().toISOString().slice(0, 10);
    const s = await new SettingService(this.db, this.env, this.user).get();
    if (s.hijriProvider === 'aladhan') return this.aladhan(date, s.aladhanCity, s.aladhanCountry);
    const zone = s.hijriProvider === 'jakim' && /^[A-Z]{3}\d{2}$/.test(s.hijriCalendar) ? s.hijriCalendar : 'SGR01';
    return (await this.jakim(zone)) ?? this.aladhan(date, s.aladhanCity, s.aladhanCountry);
  }

  private async jakim(zone: string): Promise<PrayerDay | null> {
    try {
      type Jakim = { prayerTime?: { hijri: string; fajr: string; syuruk: string; dhuhr: string; asr: string; maghrib: string; isha: string }[] };
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date());
      const res = await cachedJson<Jakim>(`https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=today&zone=${zone}&d=${today}`, 6 * 3600);
      const p = res.prayerTime?.[0];
      if (!p) return null;
      const [y, m, d] = p.hijri.split('-').map(Number);
      return {
        source: 'JAKIM e-Solat',
        location: `Zone ${zone}, MY`,
        timezone: 'Asia/Kuala_Lumpur',
        times: { fajr: hhmm(p.fajr), syuruk: hhmm(p.syuruk), dhuhr: hhmm(p.dhuhr), asr: hhmm(p.asr), maghrib: hhmm(p.maghrib), isha: hhmm(p.isha) },
        hijri: y && m && d ? { day: d, month: HIJRI_MONTHS[m - 1], year: y } : null,
      };
    } catch {
      return null;
    }
  }

  private async aladhan(date: string, city: string, country: string): Promise<PrayerDay | null> {
    try {
      const [y, m, d] = date.split('-');
      type Aladhan = { data: { timings: Record<string, string>; date: { hijri: { day: string; year: string; month: { number: number } } }; meta: { timezone: string } } };
      const res = await cachedJson<Aladhan>(`https://api.aladhan.com/v1/timingsByCity/${d}-${m}-${y}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=3`, 6 * 3600);
      const t = res.data.timings, h = res.data.date.hijri;
      return {
        source: 'Aladhan',
        location: `${city}, ${country}`,
        timezone: res.data.meta.timezone,
        times: { fajr: hhmm(t.Fajr), syuruk: hhmm(t.Sunrise), dhuhr: hhmm(t.Dhuhr), asr: hhmm(t.Asr), maghrib: hhmm(t.Maghrib), isha: hhmm(t.Isha) },
        hijri: { day: Number(h.day), month: HIJRI_MONTHS[h.month.number - 1], year: Number(h.year) },
      };
    } catch {
      return null;
    }
  }
}
