'use client'

import { CalendarClock } from 'lucide-react'
import type { CalendarEvent } from '@/lib/store'

const HOUR_W = 70
const START_HOUR = 6
const END_HOUR = 24
const LABEL_H = 22
const LANE_H = 42

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
  lane: number
}

/** Greedy lane assignment: overlapping events stack into separate rows. */
function layoutLanes(timed: CalendarEvent[]): { blocks: Block[]; lanes: number } {
  const withTimes = timed
    .map((event) => {
      const s = parseHM(event.startTime) ?? START_HOUR * 60
      let e = parseHM(event.endTime) ?? s + 60
      if (e <= s) e = s + 30
      return { event, start: s, end: e, lane: 0 }
    })
    .sort((a, b) => a.start - b.start)

  const laneEnds: number[] = []
  for (const it of withTimes) {
    let lane = laneEnds.findIndex((end) => end <= it.start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(it.end)
    } else {
      laneEnds[lane] = it.end
    }
    it.lane = lane
  }
  return { blocks: withTimes, lanes: Math.max(1, laneEnds.length) }
}

interface DayTimelineProps {
  events: CalendarEvent[]
  onSelect?: (event: CalendarEvent) => void
}

export function DayTimeline({ events, onSelect }: DayTimelineProps) {
  const allDay = events.filter((e) => e.allDay || !e.startTime)
  const timed = events.filter((e) => !e.allDay && e.startTime)
  const { blocks, lanes } = layoutLanes(timed)

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
        <div className="p-3 rounded-2xl bg-muted">
          <CalendarClock className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Nothing scheduled</p>
        <p className="text-xs text-outline">Tap + to add an event</p>
      </div>
    )
  }

  const totalWidth = (END_HOUR - START_HOUR) * HOUR_W
  const innerHeight = LABEL_H + lanes * LANE_H

  const clampStart = (min: number) => Math.max(min, START_HOUR * 60)
  const clampEnd = (min: number) => Math.min(min, END_HOUR * 60)

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
              <span className="truncate max-w-[14rem]">{e.title}</span>
            </button>
          ))}
        </div>
      )}

      {blocks.length === 0 ? (
        <p className="text-xs text-muted-foreground px-1 py-2">Only all-day events on this date.</p>
      ) : (
        <div className="overflow-x-auto scrollbar-thin -mx-1 px-1">
          <div className="relative" style={{ width: totalWidth, height: innerHeight, minWidth: '100%' }}>
            {/* hour grid + labels */}
            {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i).map((h) => (
              <div
                key={h}
                className="absolute top-0 bottom-0 border-l border-border/40"
                style={{ left: (h - START_HOUR) * HOUR_W }}
              >
                <span className="absolute -top-0.5 -translate-x-1/2 text-[0.6rem] text-muted-foreground/70 tabular-nums bg-card px-1">
                  {h % 12 === 0 ? 12 : h % 12} {h < 12 ? 'AM' : 'PM'}
                </span>
              </div>
            ))}

            {/* event blocks */}
            {blocks.map((b) => {
              const left = ((clampStart(b.start) - START_HOUR * 60) / 60) * HOUR_W
              const width = Math.max(((clampEnd(b.end) - clampStart(b.start)) / 60) * HOUR_W - 4, 30)
              const top = LABEL_H + b.lane * LANE_H
              return (
                <button
                  key={b.event.id}
                  onClick={() => onSelect?.(b.event)}
                  className="absolute rounded-lg p-1.5 text-left overflow-hidden hover:brightness-110 transition-all"
                  style={{
                    top: top + 2,
                    height: LANE_H - 6,
                    left: left + 2,
                    width,
                    backgroundColor: (b.event.color || '#A5D6A7') + '33',
                    borderLeft: `3px solid ${b.event.color || '#A5D6A7'}`,
                  }}
                >
                  <p className="text-[0.7rem] font-semibold text-foreground truncate leading-tight">{b.event.title}</p>
                  <p className="text-[0.6rem] text-muted-foreground tabular-nums leading-tight truncate">
                    {fmtHM(b.start)} – {fmtHM(b.end)}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
