import { NextResponse } from 'next/server'

// Seeded random based on date for consistent daily hadith
function getDailyIndex(max: number): number {
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  // Offset by 42 to get a different index than verse
  return Math.abs(hash + 42) % max
}

const hadiths = [
  {
    arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    translation: 'Actions are judged by intentions, and everyone will be rewarded according to what they intended.',
    narrator: 'Umar ibn al-Khattab',
    source: 'Sahih al-Bukhari 1',
    grade: 'Sahih',
  },
  {
    arabic: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
    translation: 'Whoever believes in Allah and the Last Day, let him speak good or remain silent.',
    narrator: 'Abu Hurairah',
    source: 'Sahih al-Bukhari 6018',
    grade: 'Sahih',
  },
  {
    arabic: 'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    translation: 'None of you truly believes until he loves for his brother what he loves for himself.',
    narrator: 'Anas ibn Malik',
    source: 'Sahih al-Bukhari 13',
    grade: 'Sahih',
  },
  {
    arabic: 'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ',
    translation: 'The Muslim is the one from whose tongue and hand other Muslims are safe.',
    narrator: 'Abdullah ibn Amr',
    source: 'Sahih al-Bukhari 10',
    grade: 'Sahih',
  },
  {
    arabic: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ',
    translation: 'Whoever travels a path seeking knowledge, Allah will make easy for him a path to Paradise.',
    narrator: 'Abu Hurairah',
    source: 'Sahih Muslim 2699',
    grade: 'Sahih',
  },
  {
    arabic: 'الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ',
    translation: 'A good word is charity.',
    narrator: 'Abu Hurairah',
    source: 'Sahih al-Bukhari 2989',
    grade: 'Sahih',
  },
  {
    arabic: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ',
    translation: 'Your smiling in the face of your brother is charity.',
    narrator: 'Abu Dharr',
    source: 'Jami at-Tirmidhi 1956',
    grade: 'Hasan',
  },
  {
    arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    translation: 'The best of you are those who learn the Quran and teach it.',
    narrator: 'Uthman ibn Affan',
    source: 'Sahih al-Bukhari 5027',
    grade: 'Sahih',
  },
  {
    arabic: 'الدُّعَاءُ هُوَ الْعِبَادَةُ',
    translation: 'Supplication (dua) is worship.',
    narrator: 'An-Nu\'man ibn Bashir',
    source: 'Jami at-Tirmidhi 3247',
    grade: 'Hasan',
  },
  {
    arabic: 'إِنَّ اللَّهَ لَا يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ',
    translation: 'Allah does not look at your appearance or your wealth, but He looks at your hearts and your actions.',
    narrator: 'Abu Hurairah',
    source: 'Sahih Muslim 2564',
    grade: 'Sahih',
  },
  {
    arabic: 'اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ',
    translation: 'Fear Allah wherever you are, and follow up a bad deed with a good one and it will wipe it out, and behave towards people with good character.',
    narrator: 'Abu Dharr',
    source: 'Jami at-Tirmidhi 1987',
    grade: 'Hasan Sahih',
  },
  {
    arabic: 'الطُّهُورُ شَطْرُ الْإِيمَانِ وَالْحَمْدُ لِلَّهِ تَمْلَأُ الْمِيزَانَ',
    translation: 'Purity is half of faith, and Alhamdulillah fills the scale.',
    narrator: 'Abu Malik al-Ash\'ari',
    source: 'Sahih Muslim 223',
    grade: 'Sahih',
  },
  {
    arabic: 'إِنَّمَا بُعِثْتُ لِأُتَمِّمَ صَالِحَ الْأَخْلَاقِ',
    translation: 'I was only sent to perfect good character.',
    narrator: 'Abu Hurairah',
    source: 'Musnad Ahmad 8595',
    grade: 'Hasan',
  },
  {
    arabic: 'مَنْ صَلَّى عَلَيَّ صَلَاةً وَاحِدَةً صَلَّى اللَّهُ عَلَيْهِ عَشْرًا',
    translation: 'Whoever sends blessings upon me once, Allah will send blessings upon him tenfold.',
    narrator: 'Abdullah ibn Amr',
    source: 'Sahih Muslim 384',
    grade: 'Sahih',
  },
  {
    arabic: 'أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ',
    translation: 'The most beloved of deeds to Allah are those that are most consistent, even if they are small.',
    narrator: 'Aisha',
    source: 'Sahih al-Bukhari 6464',
    grade: 'Sahih',
  },
  {
    arabic: 'إِذَا مَاتَ الْإِنْسَانُ انْقَطَعَ عَمَلُهُ إِلَّا مِنْ ثَلَاثَةٍ صَدَقَةٍ جَارِيَةٍ أَوْ عِلْمٍ يُنْتَفَعُ بِهِ أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ',
    translation: 'When a person dies, all their deeds end except three: a continuing charity, beneficial knowledge, or a righteous child who prays for them.',
    narrator: 'Abu Hurairah',
    source: 'Sahih Muslim 1631',
    grade: 'Sahih',
  },
  {
    arabic: 'الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ وَفِي كُلٍّ خَيْرٌ',
    translation: 'The strong believer is better and more beloved to Allah than the weak believer, while there is good in both.',
    narrator: 'Abu Hurairah',
    source: 'Sahih Muslim 2664',
    grade: 'Sahih',
  },
  {
    arabic: 'لَا تَغْضَبْ',
    translation: 'Do not get angry.',
    narrator: 'Abu Hurairah',
    source: 'Sahih al-Bukhari 6116',
    grade: 'Sahih',
  },
  {
    arabic: 'مَنْ لَمْ يَشْكُرِ النَّاسَ لَمْ يَشْكُرِ اللَّهَ',
    translation: 'Whoever is not grateful to people is not grateful to Allah.',
    narrator: 'Abu Hurairah',
    source: 'Jami at-Tirmidhi 1954',
    grade: 'Sahih',
  },
  {
    arabic: 'كَلِمَتَانِ خَفِيفَتَانِ عَلَى اللِّسَانِ ثَقِيلَتَانِ فِي الْمِيزَانِ حَبِيبَتَانِ إِلَى الرَّحْمَنِ سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ',
    translation: 'Two words that are light on the tongue, heavy on the scale, and beloved to the Most Merciful: SubhanAllahi wa biHamdihi, SubhanAllahil Atheem (Glory be to Allah and His praise, Glory be to Allah the Supreme).',
    narrator: 'Abu Hurairah',
    source: 'Sahih al-Bukhari 6682',
    grade: 'Sahih',
  },
]

export async function GET() {
  const index = getDailyIndex(hadiths.length)
  return NextResponse.json(hadiths[index], {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    },
  })
}
