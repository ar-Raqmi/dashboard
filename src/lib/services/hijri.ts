import { toHijri } from 'hijri-converter'

export interface HijriDate {
  day: number
  month: string
  monthAr: string
  year: number
}

const ISLAMIC_MONTHS_EN = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
]

const ISLAMIC_MONTHS_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الثانية', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
]

// ==========================================
// OOP Design Pattern: Strategy Pattern for Hijri Calendars
// ==========================================

export interface HijriProvider {
  key: string
  name: string
  getHijriDate(date: Date, calendarType?: string): Promise<HijriDate | null>
}

// Base class providing common fetching functionality and math-based fallback
export abstract class BaseHijriProvider implements HijriProvider {
  abstract key: string
  abstract name: string
  abstract getHijriDate(date: Date, calendarType?: string): Promise<HijriDate | null>

  protected getMathCalculatedDate(date: Date, offsetDays = 0): HijriDate | null {
    try {
      const adjustedDate = new Date(date.getTime())
      if (offsetDays !== 0) {
        adjustedDate.setDate(adjustedDate.getDate() + offsetDays)
      }
      const conversion = toHijri(
        adjustedDate.getFullYear(),
        adjustedDate.getMonth() + 1,
        adjustedDate.getDate()
      )
      return {
        day: conversion.hd,
        month: ISLAMIC_MONTHS_EN[conversion.hm - 1],
        monthAr: ISLAMIC_MONTHS_AR[conversion.hm - 1],
        year: conversion.hy,
      }
    } catch (err) {
      console.error('Math calculation error:', err)
      return null
    }
  }
}

// 1. Local calculated math-based provider (Default)
export class CalculatedHijriProvider extends BaseHijriProvider {
  key = 'calculated'
  name = 'Calculated (Standard Math)'

  async getHijriDate(date: Date, offset = '0'): Promise<HijriDate | null> {
    const parsedOffset = parseInt(offset, 10) || 0
    return this.getMathCalculatedDate(date, parsedOffset)
  }
}

// 2. Global Aladhan API provider
export class AladhanHijriProvider extends BaseHijriProvider {
  key = 'aladhan'
  name = 'Aladhan API (Saudi / Global Methods)'

  async getHijriDate(date: Date, calendarType = 'UmmAlQura'): Promise<HijriDate | null> {
    try {
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()

      // Connect to Aladhan gToH (Gregorian to Hijri) endpoint
      const url = `https://api.aladhan.com/v1/gToH/${day}-${month}-${year}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Aladhan API returned status ${response.status}`)
      }

      const res = await response.json()
      if (res.code !== 200 || !res.data?.hijri) {
        throw new Error('Invalid response structure from Aladhan')
      }

      const h = res.data.hijri
      return {
        day: parseInt(h.day, 10),
        month: h.month.en,
        monthAr: h.month.ar,
        year: parseInt(h.year, 10),
      }
    } catch (err) {
      console.warn('Aladhan API request failed. Falling back to local calculation.', err)
      return this.getMathCalculatedDate(date, 0)
    }
  }
}

// 3. JAKIM API provider (Malaysia e-Solat)
export class JakimHijriProvider extends BaseHijriProvider {
  key = 'jakim'
  name = 'JAKIM (Malaysia e-Solat)'

  async getHijriDate(date: Date, zone = 'SGR01'): Promise<HijriDate | null> {
    try {
      const url = `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=today&zone=${zone}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`JAKIM official API returned status ${response.status}`)
      }

      const res = await response.json()
      if (!res.prayerTime || res.prayerTime.length === 0 || !res.prayerTime[0].hijri) {
        throw new Error('Invalid response format from JAKIM official API')
      }

      // String format is "YYYY-MM-DD" e.g. "1447-12-30"
      const hijriStr = res.prayerTime[0].hijri
      const parts = hijriStr.split('-')
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10)
        const monthIndex = parseInt(parts[1], 10) - 1
        const day = parseInt(parts[2], 10)

        return {
          day,
          month: ISLAMIC_MONTHS_EN[monthIndex] || 'Muharram',
          monthAr: ISLAMIC_MONTHS_AR[monthIndex] || 'محرم',
          year,
        }
      }
      throw new Error('Unexpected date formatting in official JAKIM API response')
    } catch (err) {
      console.warn('JAKIM API request failed. Falling back to local calculation.', err)
      return this.getMathCalculatedDate(date, 0)
    }
  }
}

// ==========================================
// Factory Pattern to fetch calendar Strategy
// ==========================================

export class HijriCalendarFactory {
  private static providers: Record<string, HijriProvider> = {
    calculated: new CalculatedHijriProvider(),
    aladhan: new AladhanHijriProvider(),
    jakim: new JakimHijriProvider(),
  }

  static getProvider(key: string): HijriProvider {
    return this.providers[key] || this.providers.calculated
  }

  static getSupportedProviders() {
    return Object.values(this.providers).map(p => ({
      key: p.key,
      name: p.name,
    }))
  }
}
