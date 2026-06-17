// ==========================================
// Prayer Times Service
// Strategy Pattern + Factory (mirrors hijri.ts)
// ==========================================

export interface PrayerTimes {
  imsak?: string
  fajr: string
  syuruk?: string
  sunrise?: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
}

export interface PrayerTimeProvider {
  key: string
  name: string
  getPrayerTimes(date: Date, zoneOrCity?: string, country?: string): Promise<PrayerTimes | null>
}

// ==========================================
// 1. JAKIM e-Solat Provider (Malaysia)
// ==========================================

export class JakimPrayerProvider implements PrayerTimeProvider {
  key = 'jakim'
  name = 'JAKIM (Malaysia e-Solat)'

  async getPrayerTimes(date: Date, zoneOrCity = 'SGR01', _country?: string): Promise<PrayerTimes | null> {
    try {
      const url = `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=today&zone=${zoneOrCity}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`JAKIM API returned status ${response.status}`)
      }

      const res = await response.json()
      if (!res.prayerTime || res.prayerTime.length === 0) {
        throw new Error('Invalid response format from JAKIM API')
      }

      const pt = res.prayerTime[0]
      return {
        imsak: this.cleanTime(pt.imsak),
        fajr: this.cleanTime(pt.fajr),
        syuruk: this.cleanTime(pt.syuruk),
        sunrise: this.cleanTime(pt.syuruk),
        dhuhr: this.cleanTime(pt.dhuhr),
        asr: this.cleanTime(pt.asr),
        maghrib: this.cleanTime(pt.maghrib),
        isha: this.cleanTime(pt.isha),
      }
    } catch (err) {
      console.warn('JAKIM Prayer API request failed:', err)
      return null
    }
  }

  /** Strip whitespace and ensure HH:MM format */
  private cleanTime(raw: string): string {
    if (!raw) return '00:00'
    return raw.trim().slice(0, 5)
  }
}

// ==========================================
// 2. Aladhan API Provider (Global)
// ==========================================

export class AladhanPrayerProvider implements PrayerTimeProvider {
  key = 'aladhan'
  name = 'Aladhan API (Global)'

  async getPrayerTimes(date: Date, zoneOrCity = 'Kuala Lumpur', country = 'Malaysia'): Promise<PrayerTimes | null> {
    try {
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()

      const cityEncoded = encodeURIComponent(zoneOrCity)
      const countryEncoded = encodeURIComponent(country)

      const url = `https://api.aladhan.com/v1/timingsByCity/${day}-${month}-${year}?city=${cityEncoded}&country=${countryEncoded}&method=3`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Aladhan API returned status ${response.status}`)
      }

      const res = await response.json()
      if (res.code !== 200 || !res.data?.timings) {
        throw new Error('Invalid response structure from Aladhan')
      }

      const t = res.data.timings
      return {
        fajr: this.cleanTime(t.Fajr),
        sunrise: this.cleanTime(t.Sunrise),
        syuruk: this.cleanTime(t.Sunrise),
        dhuhr: this.cleanTime(t.Dhuhr),
        asr: this.cleanTime(t.Asr),
        maghrib: this.cleanTime(t.Maghrib),
        isha: this.cleanTime(t.Isha),
        imsak: this.cleanTime(t.Imsak),
      }
    } catch (err) {
      console.warn('Aladhan Prayer API request failed:', err)
      return null
    }
  }

  /** Strip timezone suffix like " (MYT)" and keep HH:MM */
  private cleanTime(raw: string): string {
    if (!raw) return '00:00'
    return raw.trim().replace(/\s*\(.*\)$/, '').slice(0, 5)
  }
}


// ==========================================
// Factory
// ==========================================

export class PrayerTimeFactory {
  private static providers: Record<string, PrayerTimeProvider> = {
    jakim: new JakimPrayerProvider(),
    aladhan: new AladhanPrayerProvider(),
  }

  static getProvider(key: string): PrayerTimeProvider {
    return this.providers[key] || this.providers.jakim
  }

  static getSupportedProviders() {
    return Object.values(this.providers).map((p) => ({
      key: p.key,
      name: p.name,
    }))
  }
}
