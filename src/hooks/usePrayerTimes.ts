'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { timeToMinutes, toDateStr } from '@/lib/dates'
import type { PrayerTimes } from '@/lib/services/prayer'

export const PRAYERS = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'dhuhr', label: 'Dhuhr' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isha' },
] as const

export type PrayerKey = (typeof PRAYERS)[number]['key']

export interface PrayerRow {
  key: PrayerKey
  label: string
  time24: string
  clock: string
  meridiem: string
  state: 'passed' | 'next' | 'upcoming'
}

export function to12h(time24: string): { clock: string; meridiem: string } {
  const [h, m] = time24.split(':').map(Number)
  return { clock: `${h % 12 || 12}:${String(m).padStart(2, '0')}`, meridiem: h >= 12 ? 'PM' : 'AM' }
}

const cache = new Map<string, PrayerTimes>()

function formatCountdown(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

/**
 * Today's prayer times from the provider chosen in settings (JAKIM zone or Aladhan city),
 * with the next prayer and a countdown. After Isha the next prayer is tomorrow's Fajr.
 */
export function usePrayerTimes() {
  const hijriProvider = useAppStore((s) => s.hijriProvider)
  const hijriCalendar = useAppStore((s) => s.hijriCalendar)
  const aladhanCity = useAppStore((s) => s.aladhanCity)
  const aladhanCountry = useAppStore((s) => s.aladhanCountry)

  const [times, setTimes] = useState<PrayerTimes | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [now, setNow] = useState(() => new Date())
  const [attempt, setAttempt] = useState(0)

  // 'calculated' (no remote provider chosen) falls back to JAKIM's default zone, as before.
  const source = useMemo(() => {
    if (hijriProvider === 'aladhan') {
      return { key: 'aladhan', zoneOrCity: aladhanCity || 'Kuala Lumpur', country: aladhanCountry || 'Malaysia', label: `${aladhanCity || 'Kuala Lumpur'}, ${aladhanCountry || 'Malaysia'}` }
    }
    const zone = hijriProvider === 'jakim' && hijriCalendar ? hijriCalendar : 'SGR01'
    return { key: 'jakim', zoneOrCity: zone, country: 'Malaysia', label: `JAKIM zone ${zone}` }
  }, [hijriProvider, hijriCalendar, aladhanCity, aladhanCountry])

  const dayKey = toDateStr(now)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    const cacheKey = `${source.key}|${source.zoneOrCity}|${source.country}|${dayKey}`
    const hit = cache.get(cacheKey)
    if (hit) {
      setTimes(hit)
      setStatus('ready')
      return
    }
    setStatus('loading')
    ;(async () => {
      try {
        const { PrayerTimeFactory } = await import('@/lib/services/prayer')
        const result = await PrayerTimeFactory.getProvider(source.key).getPrayerTimes(new Date(), source.zoneOrCity, source.country)
        if (cancelled) return
        if (result) {
          cache.set(cacheKey, result)
          setTimes(result)
          setStatus('ready')
        } else {
          setStatus('error')
        }
      } catch {
        if (!cancelled) setStatus('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [source, dayKey, attempt])

  const retry = useCallback(() => setAttempt((a) => a + 1), [])

  const derived = useMemo(() => {
    if (!times) return null
    const nowMin = now.getHours() * 60 + now.getMinutes()
    const minutes = PRAYERS.map((p) => timeToMinutes(times[p.key]))
    let nextIndex = minutes.findIndex((m) => nowMin < m)
    const tomorrow = nextIndex === -1
    if (tomorrow) nextIndex = 0
    const rows: PrayerRow[] = PRAYERS.map((p, i) => ({
      key: p.key,
      label: p.label,
      time24: times[p.key],
      ...to12h(times[p.key]),
      state: !tomorrow && i === nextIndex ? 'next' : nowMin >= minutes[i] ? 'passed' : 'upcoming',
    }))
    const wait = tomorrow ? minutes[0] + 1440 - nowMin : minutes[nextIndex] - nowMin
    return {
      rows,
      next: { ...rows[nextIndex], tomorrow, countdown: formatCountdown(wait) },
      passedCount: rows.filter((r) => r.state === 'passed').length,
    }
  }, [times, now])

  const zone = useMemo(() => {
    const part = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(now).find((p) => p.type === 'timeZoneName')
    return part?.value ?? ''
  }, [now])

  return { status, retry, locationLabel: source.label, zone, ...derived }
}
