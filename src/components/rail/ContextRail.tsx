'use client'

import PrayerTimes from '@/components/rail/PrayerTimes'
import UpcomingEvents from '@/components/rail/UpcomingEvents'
import DailyVerse from '@/components/rail/DailyVerse'
import WorldClocks from '@/components/rail/WorldClocks'
import TaskDetail from '@/components/rail/TaskDetail'
import Icon from '@/components/ui/Icon'
import { useWidgetVisible } from '@/hooks/useWidgetVisible'
import { useHijri } from '@/hooks/useHijri'
import { useAppStore, type ActivePage } from '@/lib/store'
import { useUi } from '@/lib/ui'
import { useEffect, useState } from 'react'

function RailDate() {
  const hijri = useHijri()
  const [today, setToday] = useState<Date | null>(null)
  useEffect(() => {
    setToday(new Date())
    const id = setInterval(() => setToday(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="rail-date">
      <span className="eyebrow">TODAY</span>
      <strong suppressHydrationWarning>{today ? today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ' '}</strong>
      {hijri && <small>{hijri.text}</small>}
    </section>
  )
}

/** Pages whose main column already shows these widgets in full. */
const OWNS_PRAYER: ActivePage[] = ['spiritual']
const OWNS_VERSE: ActivePage[] = ['spiritual']
const HIDE_EVENTS: ActivePage[] = ['calendar']

export default function ContextRail() {
  const page = useAppStore((s) => s.activePage)
  const tasks = useAppStore((s) => s.tasks)
  const selectedTaskId = useUi((s) => s.selectedTaskId)
  const showPrayer = useWidgetVisible('prayerTimes')
  const showCalendar = useWidgetVisible('calendar')
  const showVerse = useWidgetVisible('verse')
  const showClock = useWidgetVisible('clock')

  const selected = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : undefined
  if (selected) {
    return (
      <aside className="context-rail" aria-label="Task details">
        <TaskDetail task={selected} />
      </aside>
    )
  }

  return (
    <aside className="context-rail" aria-label="Today at a glance">
      <RailDate />
      {showPrayer && !OWNS_PRAYER.includes(page) && <PrayerTimes />}
      {showCalendar && !HIDE_EVENTS.includes(page) && <UpcomingEvents limit={3} />}
      {showClock && page !== 'spiritual' && <WorldClocks limit={3} />}
      {showVerse && !OWNS_VERSE.includes(page) && <DailyVerse />}
      <p className="rail-footnote"><Icon name="check" size={11} />Synced with your account</p>
    </aside>
  )
}
