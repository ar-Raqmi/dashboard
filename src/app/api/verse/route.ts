import { NextResponse } from 'next/server'

// Seeded random based on date for consistent daily verse
function getDailyIndex(max: number): number {
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash) % max
}

// Fallback verses with Al-Hilali & Khan translation
const fallbackVerses = [
  {
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    translation: 'In the Name of Allah, the Most Gracious, the Most Merciful.',
    surah: 'Al-Fatihah',
    ayah: 1,
    surahNumber: 1,
    reference: 'Quran 1:1 (Al-Hilali & Khan)',
  },
  {
    arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ',
    translation: 'Allah! None has the right to be worshipped but He, the Ever Living, the One Who sustains and protects all that exists. Neither slumber nor sleep overtakes Him.',
    surah: 'Al-Baqarah',
    ayah: 255,
    surahNumber: 2,
    reference: 'Quran 2:255 (Al-Hilali & Khan)',
  },
  {
    arabic: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    translation: 'And whosoever puts his trust in Allah, then He will suffice him.',
    surah: 'At-Talaq',
    ayah: 3,
    surahNumber: 65,
    reference: 'Quran 65:3 (Al-Hilali & Khan)',
  },
  {
    arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation: 'So verily, with the hardship, there is relief.',
    surah: 'Ash-Sharh',
    ayah: 5,
    surahNumber: 94,
    reference: 'Quran 94:5 (Al-Hilali & Khan)',
  },
  {
    arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    translation: 'Certainly, Allah is with the patient.',
    surah: 'Al-Baqarah',
    ayah: 153,
    surahNumber: 2,
    reference: 'Quran 2:153 (Al-Hilali & Khan)',
  },
  {
    arabic: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ',
    translation: 'And your Lord is going to give you, and you will be satisfied.',
    surah: 'Ad-Duha',
    ayah: 5,
    surahNumber: 93,
    reference: 'Quran 93:5 (Al-Hilali & Khan)',
  },
  {
    arabic: 'رَبِّ زِدْنِي عِلْمًا',
    translation: 'My Lord! Increase me in knowledge.',
    surah: 'Ta-Ha',
    ayah: 114,
    surahNumber: 20,
    reference: 'Quran 20:114 (Al-Hilali & Khan)',
  },
  {
    arabic: 'وَقُل رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
    translation: 'And lower unto them the wing of submission and humility through mercy, and say: "My Lord! Bestow on them Your Mercy as they did bring me up when I was young."',
    surah: 'Al-Isra',
    ayah: 24,
    surahNumber: 17,
    reference: 'Quran 17:24 (Al-Hilali & Khan)',
  },
  {
    arabic: 'وَمَنْ أَحْسَنُ قَوْلًا مِّمَّن دَعَا إِلَى اللَّهِ وَعَمِلَ صَالِحًا وَقَالَ إِنَّنِي مِنَ الْمُسْلِمِينَ',
    translation: 'And who is better in speech than he who invites to Allah, and does righteous deeds, and says: "I am one of the Muslims."',
    surah: 'Fussilat',
    ayah: 33,
    surahNumber: 41,
    reference: 'Quran 41:33 (Al-Hilali & Khan)',
  },
  {
    arabic: 'إِنَّ مَعِيَ رَبِّي سَيَهْدِينِ',
    translation: 'Certainly, my Lord is with me, He will guide me.',
    surah: 'Ash-Shu\'ara',
    ayah: 62,
    surahNumber: 26,
    reference: 'Quran 26:62 (Al-Hilali & Khan)',
  },
]

export async function GET() {
  try {
    // Try to fetch from alquran.cloud API with Al-Hilali & Khan translation
    const ayahNumber = getDailyIndex(6236) + 1

    const [arabicRes, translationRes] = await Promise.all([
      fetch(`https://api.alquran.cloud/v1/ayah/${ayahNumber}`, {
        next: { revalidate: 86400 },
      }),
      fetch(`https://api.alquran.cloud/v1/ayah/${ayahNumber}/en.hilali`, {
        next: { revalidate: 86400 },
      }),
    ])

    if (arabicRes.ok && translationRes.ok) {
      const arabicData = await arabicRes.json()
      const translationData = await translationRes.json()

      if (arabicData.code === 200 && translationData.code === 200) {
        const arabic = arabicData.data
        const translation = translationData.data

        return NextResponse.json({
          arabic: arabic.text,
          translation: translation.text,
          surah: arabic.surah.englishName,
          ayah: arabic.numberInSurah,
          surahNumber: arabic.surah.number,
          reference: `${arabic.surah.englishName} ${arabic.surah.number}:${arabic.numberInSurah} (Al-Hilali & Khan)`,
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
          },
        })
      }
    }

    throw new Error('API fetch failed')
  } catch {
    // Fallback to curated verses
    const index = getDailyIndex(fallbackVerses.length)
    return NextResponse.json(fallbackVerses[index], {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      },
    })
  }
}
