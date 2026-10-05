import type { HijriDate } from './types';

const MONTHS = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani',
  'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah',
];

export const hijriDate = (day: number, month: number, year: number): HijriDate => ({ day, month: MONTHS[month - 1] ?? `Month ${month}`, year });
