'use client'

import { useState, useMemo } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, isToday, isAfter, parseISO, startOfDay } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export default function CalendarWidget() {
  const { events, setActivePage } = useAppStore()
  const [month, setMonth] = useState<Date>(new Date())

  // Build a set of dates that have events
  const eventDates = useMemo(() => {
    const map = new Map<string, typeof events>()
    events.forEach((ev) => {
      const key = ev.date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(ev)
    })
    return map
  }, [events])

  // Upcoming events (max 3)
  const today = startOfDay(new Date())
  const upcomingEvents = useMemo(
    () =>
      events
        .filter((ev) => isAfter(parseISO(ev.date), today) || ev.date === format(new Date(), 'yyyy-MM-dd'))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 3),
    [events, today]
  )

  // Custom day render via components
  const DayContent = ({ date }: { date: Date }) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayEvents = eventDates.get(dateStr)
    const todayHighlight = isToday(date)

    return (
      <div className="flex flex-col items-center justify-center w-full h-full relative">
        <span
          className={`text-xs font-medium ${
            todayHighlight
              ? 'ring-2 ring-[oklch(0.72_0.19_142)] text-[oklch(0.72_0.19_142)] w-6 h-6 flex items-center justify-center rounded-full'
              : ''
          }`}
        >
          {date.getDate()}
        </span>
        {dayEvents && dayEvents.length > 0 && (
          <div className="flex gap-0.5 mt-0.5">
            {dayEvents.slice(0, 3).map((ev) => (
              <span
                key={ev.id}
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: ev.color || '#A5D6A7' }}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-2 px-1">
        <button
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
          className="w-7 h-7 rounded-xl bg-[oklch(0.17_0.008_155)] hover:bg-[oklch(0.25_0.01_155)] flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[oklch(0.7_0.01_155)]" />
        </button>
        <span className="text-sm font-semibold text-[oklch(0.9_0.005_155)]">
          {format(month, 'MMMM yyyy')}
        </span>
        <button
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
          className="w-7 h-7 rounded-xl bg-[oklch(0.17_0.008_155)] hover:bg-[oklch(0.25_0.01_155)] flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-[oklch(0.7_0.01_155)]" />
        </button>
      </div>

      {/* DayPicker */}
      <div className="flex justify-center [&_table]:w-full [&_th]:text-[10px] [&_th]:text-[oklch(0.5_0.01_155)] [&_th]:font-medium [&_th]:py-1 [&_td]:p-0 [&_td]:text-center [&_.rdp-day]:w-full [&_.rdp-day]:aspect-square">
        <DayPicker
          month={month}
          onMonthChange={setMonth}
          showOutsideDays={false}
          components={{
            DayContent: ({ date }) => <DayContent date={date} />,
          }}
          classNames={{
            months: 'flex flex-col',
            month: 'flex flex-col w-full',
            weekday: 'text-[10px] text-[oklch(0.5_0.01_155)] font-medium',
            day: 'text-center p-0 w-full aspect-square',
          }}
          formatters={{
            formatWeekdayName: (date) =>
              date.toLocaleDateString('en-US', { weekday: 'narrow' }),
          }}
        />
      </div>

      {/* Upcoming Events */}
      <div className="mt-3 border-t border-[oklch(0.25_0.01_155)] pt-2">
        <h4 className="text-[10px] uppercase tracking-wider text-[oklch(0.5_0.01_155)] mb-1.5 font-semibold">
          Upcoming
        </h4>
        <div className="space-y-1.5 max-h-20 overflow-y-auto scrollbar-thin">
          {upcomingEvents.length === 0 && (
            <p className="text-xs text-[oklch(0.4_0.01_155)]">No upcoming events</p>
          )}
          {upcomingEvents.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-2 text-xs"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: ev.color || '#A5D6A7' }}
              />
              <span className="text-[oklch(0.8_0.005_155)] truncate flex-1">
                {ev.title}
              </span>
              <span className="text-[10px] text-[oklch(0.5_0.01_155)] shrink-0">
                {format(parseISO(ev.date), 'MMM d')}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setActivePage('calendar')}
          className="mt-1.5 text-[10px] text-[oklch(0.72_0.19_142)] hover:underline w-full text-right"
        >
          View All →
        </button>
      </div>
    </div>
  )
}
