'use client'

import { useMemo } from 'react'
import Icon from '@/components/ui/Icon'
import { useAppStore, type CalendarEvent } from '@/lib/store'
import { useUi } from '@/lib/ui'
import { formatTime, MONTHS_SHORT, parseDateStr, todayStr } from '@/lib/dates'

export function eventTimeLabel(e: CalendarEvent): string {
  if (e.allDay || !e.startTime) return 'All day'
  const start = formatTime(e.startTime)
  return e.endTime ? `${start} – ${formatTime(e.endTime)}` : start
}

/** Events from today onward, soonest first; timed events sort by start, all-day first within a day. */
export function selectUpcomingEvents(events: CalendarEvent[], limit?: number, today = todayStr()): CalendarEvent[] {
  const list = events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime ?? '').localeCompare(b.startTime ?? ''))
  return limit ? list.slice(0, limit) : list
}

export default function UpcomingEvents({ limit = 4 }: { limit?: number }) {
  const events = useAppStore((s) => s.events)
  const setActivePage = useAppStore((s) => s.setActivePage)
  const setCalendarFocus = useUi((s) => s.setCalendarFocus)
  const upcoming = useMemo(() => selectUpcomingEvents(events, limit), [events, limit])

  const open = (date?: string) => {
    setCalendarFocus(date ?? null)
    setActivePage('calendar')
  }

  return (
    <section className="upcoming-section">
      <div className="rail-section-heading">
        <h2>Coming up</h2>
        <button className="icon-button compact" title="Open calendar" aria-label="Open calendar" onClick={() => open()}>
          <Icon name="calendar" size={16} />
        </button>
      </div>
      {upcoming.length === 0 ? (
        <p className="rail-empty-note">Nothing scheduled. Add an event from the calendar.</p>
      ) : (
        <div className="event-list">
          {upcoming.map((e) => {
            const d = parseDateStr(e.date)
            return (
              <button className="event-item" key={`${e.id}-${e.date}`} onClick={() => open(e.date)} title={`${e.title}, ${e.date}`}>
                <span className="event-date" style={e.color ? { boxShadow: `inset 3px 0 0 ${e.color}` } : undefined}>
                  <span>{String(d.getDate()).padStart(2, '0')}</span>
                  <small>{MONTHS_SHORT[d.getMonth()].toUpperCase()}</small>
                </span>
                <span className="event-copy">
                  <strong>{e.title}</strong>
                  <small>{eventTimeLabel(e)}{e.isRecurring && <><span className="middle-dot">&middot;</span>Repeats</>}</small>
                </span>
                <Icon name="right" size={13} className="event-arrow" />
              </button>
            )
          })}
        </div>
      )}
      <button className="text-button calendar-link" onClick={() => open()}>
        View calendar<Icon name="arrow" size={13} />
      </button>
    </section>
  )
}
