'use client'

import { CalendarClock } from 'lucide-react'
import type { CalendarEvent } from '@/lib/store'

const HOUR_PX = 44
const START_HOUR = 6
const END_HOUR = 24

function parseHM(t?: string | null): number | null {
  if (!t) return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(t)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

function fmtHM(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

interface Block {
  event: CalendarEvent
  start: number
  end: number
  col: number
  cols: number
}

/** Greedy overlap layout: overlapping timed events sit side-by-side. */
function layoutBlocks(timed: CalendarEvent[]): Block[] {
  const withTimes = timed
    .map((event) => {
      const s = parseHM(event.startTime) ?? START_HOUR * 60
      let e = parseHM(event.endTime) ?? s + 60
      if (e <= s) e = s + 30
      return { event, start: s, end: e, col: 0, cols: 1 }
    })
    .sort((a, b) => a.start - b.start)

  const colEnds: number[] = []
  for (const it of withTimes) {
    let c = colEnds.findIndex((end) => end <= it.start)
    if (c === -1) {
      c = colEnds.length
      colEnds.push(it.end)
    } else {
      colEnds[c] = it.end
    }
    it.col = c
  }
  for (const it of withTimes) {
    let maxCol = it.col
    for (const other of withTimes) {
      if (other === it) continue
      if (other.start < it.end && it.start < other.end) maxCol = Math.max(maxCol, other.col)
    }
    it.cols = maxCol + 1
  }
  return withTimes
}

interface DayTimelineProps {
  events: CalendarEvent[]
  onSelect?: (event: CalendarEvent) => void
}

export function DayTimeline({ events, onSelect }: DayTimelineProps) {
  const allDay = events.filter((e) => e.allDay || !e.startTime)
  const timed = events.filter((e) => !e.allDay && e.startTime)
  const blocks = layoutBlocks(timed)

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
        <div className="p-3 rounded-2xl bg-muted">
          <CalendarClock className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Nothing scheduled</p>
        <p className="text-xs text-outline">Tap + to add an event</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* All-day chips (kept out of the timeline) */}
      {allDay.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allDay.map((e) => (
            <button
              key={e.id}
              onClick={() => onSelect?.(e)}
              className="flex items-center gap-1.5 pl-2 pr-3 py-1 rounded-full bg-muted text-xs font-medium hover:bg-muted/70 transition-colors"
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: e.color || '#A5D6A7' }} />
              <span className="truncate max-w-[12rem]">{e.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Hourly timeline */}
      {blocks.length > 0 && (
        <div className="relative overflow-hidden" style={{ height: (END_HOUR - START_HOUR) * HOUR_PX }}>
          {/* hour grid */}
          {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i).map((h) => (
            <div key={h} className="absolute left-0 right-0 flex items-center" style={{ top: (h - START_HOUR) * HOUR_PX }}>
              <span className="w-12 shrink-0 text-[0.6rem] text-muted-foreground/70 tabular-nums pr-2 text-right">
                {h % 12 === 0 ? 12 : h % 12} {h < 12 ? 'AM' : 'PM'}
              </span>
              <div className="flex-1 border-t border-border/40" />
            </div>
          ))}

          {/* event blocks */}
          {blocks.map((b) => {
            const startClamp = Math.max(b.start, START_HOUR * 60)
            const endClamp = Math.min(b.end, END_HOUR * 60)
            const top = ((startClamp - START_HOUR * 60) / 60) * HOUR_PX
            const height = Math.max(((endClamp - startClamp) / 60) * HOUR_PX, 18)
            const widthPct = 100 / b.cols
            const leftPct = b.col * widthPct
            return (
              <button
                key={b.event.id}
                onClick={() => onSelect?.(b.event)}
                className="absolute rounded-lg p-1.5 text-left overflow-hidden hover:brightness-110 transition-all"
                style={{
                  top: top + 2,
                  height: height - 4,
                  width: `calc(${widthPct}% - 4px)`,
                  left: `calc(48px + ${leftPct}% )`,
                  backgroundColor: (b.event.color || '#A5D6A7') + '33',
                  borderLeft: `3px solid ${b.event.color || '#A5D6A7'}`,
                }}
              >
                <p className="text-[0.7rem] font-semibold text-foreground truncate leading-tight">{b.event.title}</p>
                {height > 34 && (
                  <p className="text-[0.6rem] text-muted-foreground tabular-nums leading-tight">
                    {fmtHM(b.start)} – {fmtHM(b.end)}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
