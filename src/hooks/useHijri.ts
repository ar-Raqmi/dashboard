'use client'

import { useEffect, useState } from 'react'
import { toHijri } from 'hijri-converter'
import { useAppStore } from '@/lib/store'

const MONTHS = ['Muharram', 'Safar', "Rabi al-Awwal", "Rabi al-Thani", 'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah']

export interface HijriLabel {
  day: number
  month: string
  year: number
  text: string
}

/**
 * Today's Hijri date, honouring the settings (visibility, provider, manual offset).
 * Remote providers supply their own date through the store; the calculated one is derived here.
 */
export function useHijri(): HijriLabel | null {
  const visible = useAppStore((s) => s.hijriVisible)
  const offset = useAppStore((s) => s.hijriOffset)
  const provider = useAppStore((s) => s.hijriProvider)
  const remote = useAppStore((s) => s.hijriDate)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted || !visible) return null

  if (remote && provider !== 'calculated') {
    return { day: remote.day, month: remote.month, year: remote.year, text: `${remote.day} ${remote.month} ${remote.year} AH` }
  }
  try {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    const h = toHijri(d.getFullYear(), d.getMonth() + 1, d.getDate())
    const month = MONTHS[h.hm - 1]
    return { day: h.hd, month, year: h.hy, text: `${h.hd} ${month} ${h.hy} AH` }
  } catch {
    return null
  }
}
