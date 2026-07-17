'use client'

import { useMemo } from 'react'
import { CalendarDays, Clock, CalendarClock } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { format, parseISO, isAfter, startOfDay } from 'date-fns'

function fmtTime(e: { allDay?: boolean; startTime?: string | null; endTime?: string | null }): string {
  if (e.allDay || !e.startTime) return 'All day'
  const start = parseISO(`2000-01-01T${e.startTime}:00`)
  const end = e.endTime ? parseISO(`2000-01-01T${e.endTime}:00`) : null
  return end ? `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}` : format(start, 'h:mm a')
}

export default function CalendarWidget() {
  const { events, setActivePage } = useAppStore()
  const today = startOfDay(new Date())
  const todayStr = format(today, 'yyyy-MM-dd')

  const todayEvents = useMemo(
    () =>
      events
        .filter((e) => e.date === todayStr)
        .sort((a, b) => {
          const ad = a.allDay || !a.startTime ? 1 : 0
          const bd = b.allDay || !b.startTime ? 1 : 0
          if (ad !== bd) return ad - bd
          return (a.startTime ?? '').localeCompare(b.startTime ?? '')
        }),
    [events, todayStr],
  )

  const upcoming = useMemo(
    () =>
      events
        .filter((e) => isAfter(parseISO(e.date), today) && e.date !== todayStr)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 4),
    [events, today],
  )

  const hasNothing = todayEvents.length === 0 && upcoming.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-[oklch(0.72_0.19_142)]" />
          <span className="text-[10px] uppercase tracking-wider text-[oklch(0.5_0.01_155)] font-semibold">
            Calendar
          </span>
        </div>
        <span className="text-[10px] text-[oklch(0.5_0.01_155)] font-medium">
          {format(today, 'EEE, MMM d')}
        </span>
      </div>

      {hasNothing ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-70">
          <CalendarClock className="size-7 text-[oklch(0.35_0.01_155)]" />
          <p className="text-[10px] uppercase tracking-widest text-[oklch(0.5_0.01_155)]">No events</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 space-y-3">
          {/* Today */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="size-1.5 rounded-full bg-[oklch(0.72_0.19_142)] animate-pulse" />
              <span className="text-[10px] uppercase tracking-wider text-[oklch(0.72_0.19_142)] font-semibold">Today</span>
            </div>
            {todayEvents.length === 0 ? (
              <p className="text-[10px] text-[oklch(0.45_0.01_155)] px-1">Nothing scheduled today</p>
            ) : (
              <div className="flex flex-col gap-1">
                {todayEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-[oklch(0.2_0.01_155)] transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ev.color || '#A5D6A7' }} />
                    <span className="text-[11px] text-[oklch(0.9_0.005_155)] font-medium truncate flex-1">{ev.title}</span>
                    <span className="text-[9px] text-[oklch(0.55_0.01_155)] shrink-0 tabular-nums">{fmtTime(ev)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3 h-3 text-[oklch(0.5_0.01_155)]" />
                <span className="text-[10px] uppercase tracking-wider text-[oklch(0.5_0.01_155)] font-semibold">Upcoming</span>
              </div>
              <div className="flex flex-col gap-1">
                {upcoming.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-[oklch(0.2_0.01_155)] transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ev.color || '#A5D6A7' }} />
                    <span className="text-[11px] text-[oklch(0.85_0.005_155)] truncate flex-1">{ev.title}</span>
                    <span className="text-[9px] text-[oklch(0.5_0.01_155)] shrink-0 tabular-nums">
                      {format(parseISO(ev.date), 'MMM d')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setActivePage('calendar')}
        className="mt-2 text-[10px] text-[oklch(0.72_0.19_142)] hover:underline text-center font-medium"
      >
        Open Calendar →
      </button>
    </div>
  )
}
