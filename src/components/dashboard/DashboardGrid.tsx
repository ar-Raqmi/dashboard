'use client'

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { ResponsiveGridLayout } from 'react-grid-layout'
import { CheckCircle, CalendarDays, StickyNote, BookOpen, Flag, Clock } from 'lucide-react'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useAppStore } from '@/lib/store'
import { WidgetCard } from './WidgetCard'
import type { WidgetType, Layout } from '@/lib/store'

// Widget icon mapping
const widgetIcons: Record<WidgetType, React.ReactNode> = {
  tasks: <CheckCircle className="w-4 h-4" />,
  calendar: <CalendarDays className="w-4 h-4" />,
  notes: <StickyNote className="w-4 h-4" />,
  verse: <BookOpen className="w-4 h-4" />,
  goals: <Flag className="w-4 h-4" />,
  clock: <Clock className="w-4 h-4" />,
}

// Widget title mapping
const widgetTitles: Record<WidgetType, string> = {
  tasks: 'Daily Tasks',
  calendar: 'Calendar',
  notes: 'Quick Notes',
  verse: 'Daily Verse',
  goals: 'Goals',
  clock: 'GMT Clock',
}

// ===== Widget Content Components =====

function DailyTasksContent() {
  const tasks = useAppStore((s) => s.tasks)
  const toggleTaskStatus = useAppStore((s) => s.toggleTaskStatus)
  return (
    <div className="space-y-2">
      {tasks.slice(0, 5).map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-[oklch(0.22_0.02_142)]/30 transition-colors cursor-pointer"
          onClick={() => toggleTaskStatus(task.id)}
        >
          <div
            className={
              task.status === 'completed'
                ? 'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 border-[oklch(0.72_0.19_142)] bg-[oklch(0.72_0.19_142)]'
                : 'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 border-[oklch(0.38_0.01_155)] hover:border-[oklch(0.72_0.19_142)] transition-colors'
            }
          >
            {task.status === 'completed' && (
              <svg className="w-3 h-3 text-[oklch(0.13_0.005_155)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span
            className={
              task.status === 'completed'
                ? 'text-sm truncate line-through text-[oklch(0.5_0.01_155)]'
                : 'text-sm truncate text-[oklch(0.96_0.005_155)]'
            }
          >
            {task.title}
          </span>
        </div>
      ))}
    </div>
  )
}

function CalendarContent() {
  const events = useAppStore((s) => s.events)
  return (
    <div className="space-y-2">
      {events.slice(0, 4).map((event) => (
        <div key={event.id} className="flex items-center gap-3 p-2 rounded-xl">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: event.color || '#A5D6A7' }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[oklch(0.96_0.005_155)] truncate">{event.title}</p>
            <p className="text-xs text-[oklch(0.65_0.01_155)]">{event.date}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function NotesContent() {
  const notes = useAppStore((s) => s.notes)
  return (
    <div className="space-y-2">
      {notes.slice(0, 3).map((note) => (
        <div
          key={note.id}
          className="p-3 rounded-xl border border-[oklch(0.28_0.01_155)]/50"
          style={{ borderLeftColor: note.color, borderLeftWidth: '3px' }}
        >
          <p className="text-sm font-medium text-[oklch(0.96_0.005_155)]">{note.title}</p>
          <p className="text-xs text-[oklch(0.65_0.01_155)] mt-1 line-clamp-2">{note.content}</p>
        </div>
      ))}
    </div>
  )
}

function VerseContent() {
  const verse = useAppStore((s) => s.verse)
  const verseLoading = useAppStore((s) => s.verseLoading)
  if (verseLoading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="w-6 h-6 border-2 border-[oklch(0.72_0.19_142)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (verse) {
    return (
      <div className="space-y-3">
        <p className="arabic-text text-lg leading-relaxed text-[oklch(0.72_0.19_142)]">
          {verse.arabic}
        </p>
        <p className="text-sm text-[oklch(0.75_0.01_155)] italic">{verse.translation}</p>
        <p className="text-xs text-[oklch(0.65_0.01_155)]">{verse.reference}</p>
      </div>
    )
  }
  return (
    <div className="text-center py-4">
      <p className="text-sm text-[oklch(0.65_0.01_155)]">No verse loaded yet</p>
      <p className="text-xs text-[oklch(0.5_0.01_155)] mt-1">Visit the Spiritual tab to load a verse</p>
    </div>
  )
}

function GoalsContent() {
  const goals = useAppStore((s) => s.goals)
  return (
    <div className="space-y-3">
      {goals.slice(0, 3).map((goal) => (
        <div key={goal.id} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[oklch(0.96_0.005_155)] truncate">{goal.title}</span>
            <span className="text-xs text-[oklch(0.72_0.19_142)] font-medium ml-2">{goal.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-[oklch(0.22_0.008_155)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[oklch(0.72_0.19_142)] rounded-full transition-all duration-500"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function ClockContent() {
  const timezone = useAppStore((s) => s.timezone)
  const [time, setTime] = React.useState('')
  const [date, setDate] = React.useState('')

  React.useEffect(() => {
    const update = () => {
      const now = new Date()
      try {
        setTime(now.toLocaleTimeString('en-US', { timeZone: timezone, hour12: true }))
        setDate(now.toLocaleDateString('en-US', { timeZone: timezone, weekday: 'short', month: 'short', day: 'numeric' }))
      } catch {
        setTime(now.toLocaleTimeString('en-US', { hour12: true }))
        setDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }))
      }
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [timezone])

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <p className="text-3xl font-bold text-[oklch(0.72_0.19_142)] tabular-nums tracking-wider">
        {time}
      </p>
      <p className="text-sm text-[oklch(0.65_0.01_155)] mt-1">{date}</p>
      <p className="text-xs text-[oklch(0.5_0.01_155)] mt-0.5">{timezone}</p>
    </div>
  )
}

// Widget component mapping
const widgetComponents: Record<WidgetType, React.ComponentType> = {
  tasks: DailyTasksContent,
  calendar: CalendarContent,
  notes: NotesContent,
  verse: VerseContent,
  goals: GoalsContent,
  clock: ClockContent,
}

export function DashboardGrid() {
  const layouts = useAppStore((s) => s.layouts)
  const setLayouts = useAppStore((s) => s.setLayouts)
  const visibleWidgets = useAppStore((s) => s.widgets.filter((w) => w.visible))

  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(1200)

  // Measure container width
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth)
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    return () => observer.disconnect()
  }, [])

  // Build responsive layouts from the single layout array
  const responsiveLayouts = useMemo(() => {
    const currentLayout = layouts.filter((l) =>
      visibleWidgets.some((w) => w.type === l.i)
    )
    return {
      lg: currentLayout,
      md: currentLayout.map((l) => ({ ...l, w: Math.min(l.w, 5), x: Math.min(l.x, 5) })),
      sm: currentLayout.map((l) => ({ ...l, w: Math.min(l.w, 3), x: Math.min(l.x, 3) })),
      xs: currentLayout.map((l) => ({ ...l, w: Math.min(l.w, 2), x: Math.min(l.x, 2) })),
    }
  }, [layouts, visibleWidgets])

  const handleLayoutChange = useCallback(
    (currentLayout: Layout[]) => {
      // Merge with existing layouts to preserve hidden widget layouts
      const hiddenLayouts = layouts.filter(
        (l) => !visibleWidgets.some((w) => w.type === l.i)
      )
      setLayouts([...hiddenLayouts, ...currentLayout])
    },
    [layouts, visibleWidgets, setLayouts]
  )

  return (
    <div ref={containerRef} className="w-full">
      <ResponsiveGridLayout
        className="layout"
        layouts={responsiveLayouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
        rowHeight={80}
        width={width}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-drag-handle"
        compactType="vertical"
        margin={[16, 16]}
        containerPadding={[0, 0]}
        isResizable={true}
        isDraggable={true}
      >
        {visibleWidgets.map((widget) => {
          const WidgetComponent = widgetComponents[widget.type]
          return (
            <div key={widget.type}>
              <WidgetCard
                title={widgetTitles[widget.type]}
                icon={widgetIcons[widget.type]}
              >
                <WidgetComponent />
              </WidgetCard>
            </div>
          )
        })}
      </ResponsiveGridLayout>
    </div>
  )
}
