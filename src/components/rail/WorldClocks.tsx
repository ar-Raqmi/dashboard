'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'

function zoneAbbr(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(date).find((p) => p.type === 'timeZoneName')?.value ?? ''
  } catch {
    return ''
  }
}

/** Live clocks for the zones saved in Settings. `limit` caps rows in the narrow rail. */
export default function WorldClocks({ limit }: { limit?: number }) {
  const clocks = useAppStore((s) => s.clocks)
  const showSeconds = useAppStore((s) => s.showSeconds)
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const rows = limit ? clocks.slice(0, limit) : clocks
  if (!rows.length) return null

  return (
    <section className="world-clocks">
      <div className="section-heading">
        <h2>World clock</h2>
        <span className="live-label"><i className="tiny-dot" />LIVE</span>
      </div>
      {rows.map((c) => (
        <div key={c.id}>
          <span>{c.label}<small>{now ? zoneAbbr(now, c.timezone) : ''}</small></span>
          <time suppressHydrationWarning>
            {now ? now.toLocaleTimeString('en-US', { timeZone: c.timezone, hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}
            {showSeconds && <small>{now ? now.toLocaleTimeString('en-US', { timeZone: c.timezone, second: '2-digit' }) : ''}</small>}
          </time>
        </div>
      ))}
    </section>
  )
}
