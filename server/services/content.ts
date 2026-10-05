import { EdgeCache } from '../cache';
import { BaseService, optDate } from './base';

/** Stable per-day pick, so everyone sees the same verse / hadith all day. */
function daySeed(date: string, modulo: number) {
  let h = 2166136261;
  for (const ch of date) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (Math.abs(h) % modulo) + 1;
}

export class ContentService extends BaseService {
  private readonly cache = new EdgeCache();

  async verse(args: { date?: unknown }) {
    const date = optDate(args.date) || new Date().toISOString().slice(0, 10);
    const ayah = daySeed(`verse:${date}`, 6236);
    type Ayah = { text: string; numberInSurah: number; surah: { number: number; englishName: string } };
    const data = await this.cache.get<{ data: Ayah[] }>(`https://api.alquran.cloud/v1/ayah/${ayah}/editions/quran-uthmani,en.sahih`, 86400 * 30, 'The Quran API');
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
          this.cache.get<Book>(`${base}/eng-bukhari/${n}.json`, 86400 * 30, 'The Hadith API'),
          this.cache.get<Book>(`${base}/ara-bukhari/${n}.json`, 86400 * 30, 'The Hadith API').catch(() => null),
        ]);
        const text = en.hadiths[0]?.text?.trim();
        if (!text) continue;
        return { translation: text, arabic: ar?.hadiths[0]?.text?.trim() || null, source: `Sahih al-Bukhari ${n}`, url: `https://sunnah.com/bukhari:${n}` };
      } catch { /* try the next pick */ }
    }
    return null;
  }
}
