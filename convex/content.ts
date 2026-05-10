import { action } from "./_generated/server";

export const getDailyVerseAction = action({
  handler: async () => {
    // Random verse selection instead of sequential day-based
    const ayahId = Math.floor(Math.random() * 6236) + 1;

    try {
      const response = await fetch(`https://api.alquran.cloud/v1/ayah/${ayahId}/editions/quran-uthmani,en.sahih`);
      const data = await response.json();
      return {
        arabic: data.data[0].text,
        translation: data.data[1].text,
        reference: `${data.data[0].surah.englishName} ${data.data[0].numberInSurah}`,
      };
    } catch {
      return null;
    }
  },
});

export const getDailyHadithAction = action({
  handler: async () => {
    // Random hadith selection instead of sequential day-based
    const hadithId = Math.floor(Math.random() * 7000) + 1;

    try {
      const response = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-bukhari/${hadithId}.json`);
      const data = await response.json();
      
      // Correcting data path: data.hadiths is the array
      const hadith = data.hadiths[0];
      return {
        arabic: "Sahih al-Bukhari", // Displaying source as header
        translation: hadith.text,   // Text is combined in this API
        narrator: "Narrated in Sahih Bukhari",
        source: `Hadith ${hadithId}`,
        grade: "Sahih",
      };
    } catch (e) {
      console.error("Hadith fetch error:", e);
      return null;
    }
  },
});
