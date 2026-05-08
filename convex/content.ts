import { query } from "./_generated/server";

// Seeded random based on date for consistent daily content
function getDailyIndex(max: number): number {
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

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
  // ... (keeping it short for the demo, can add more)
];

const hadiths = [
  {
    arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    translation: 'Actions are judged by intentions, and everyone will be rewarded according to what they intended.',
    narrator: 'Umar ibn al-Khattab',
    source: 'Sahih al-Bukhari 1',
    grade: 'Sahih',
  },
  // ... (keeping it short)
];

export const getDailyVerse = query({
  handler: async () => {
    const index = getDailyIndex(fallbackVerses.length) % fallbackVerses.length
    return fallbackVerses[index]
  },
})

export const getDailyHadith = query({
  handler: async () => {
    const index = (getDailyIndex(hadiths.length) + 42) % hadiths.length
    return hadiths[index]
  },
})
