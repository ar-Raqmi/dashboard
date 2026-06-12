import { BaseService } from './base'

export class ContentService extends BaseService {
  async getDailyVerseAction() {
    const ayahId = Math.floor(Math.random() * 6236) + 1
    try {
      const response = await fetch(
        `https://api.alquran.cloud/v1/ayah/${ayahId}/editions/quran-uthmani,en.sahih`
      )
      const data = await response.json()
      return {
        arabic: data.data[0].text,
        translation: data.data[1].text,
        reference: `${data.data[0].surah.englishName} ${data.data[0].numberInSurah}`,
      }
    } catch (err) {
      return null
    }
  }

  async getDailyHadithAction() {
    const hadithId = Math.floor(Math.random() * 7000) + 1
    try {
      const response = await fetch(
        `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-bukhari/${hadithId}.json`
      )
      const data = await response.json()
      const hadith = data.hadiths[0]
      return {
        arabic: 'Sahih al-Bukhari',
        translation: hadith.text,
        narrator: 'Narrated in Sahih Bukhari',
        source: `Hadith ${hadithId}`,
        grade: 'Sahih',
      }
    } catch (err) {
      console.error('Hadith fetch error:', err)
      return null
    }
  }
}
