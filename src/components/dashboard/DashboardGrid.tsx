'use client'

import React, { useCallback, useMemo, useRef } from 'react'
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout'
import { CheckCircle, CalendarDays, StickyNote, BookOpen, Flag, Clock, Folder, FileText, Image as ImageIcon, Music, Film, Pencil, Check } from 'lucide-react'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useAppStore, MAX_GRID_W, MAX_GRID_H } from '@/lib/store'
import { WidgetCard } from './WidgetCard'
import type { WidgetType, Layout, ActivePage, FileItem } from '@/lib/store'

// Widget icon mapping
const widgetIcons: Record<WidgetType, React.ReactNode> = {
  tasks: <CheckCircle className="w-4 h-4" />,
  calendar: <CalendarDays className="w-4 h-4" />,
  notes: <StickyNote className="w-4 h-4" />,
  verse: <BookOpen className="w-4 h-4" />,
  goals: <Flag className="w-4 h-4" />,
  clock: <Clock className="w-4 h-4" />,
  files: <Folder className="w-4 h-4" />,
}

// Widget title mapping
const widgetTitles: Record<WidgetType, string> = {
  tasks: 'Daily Tasks',
  calendar: 'Calendar',
  notes: 'Quick Notes',
  verse: 'Daily Verse',
  goals: 'Goals',
  clock: 'Clock',
  files: 'Files',
}

// Widget navigation mapping
const widgetPageMap: Record<WidgetType, ActivePage> = {
  tasks: 'tasks',
  calendar: 'calendar',
  notes: 'notes',
  verse: 'spiritual',
  goals: 'goals',
  clock: 'dashboard',
  files: 'files',
}

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Helper: robustly parse a date string (handles 'yyyy-MM-dd', 'yyyy-M-d', or ISO strings)
// Returns a Date at noon in local timezone for reliable comparison
function parseEventDate(dateStr: string): Date {
  const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
  const parts = datePart.split('-')
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number)
    if (y && m && d) return new Date(y, m - 1, d, 12, 0, 0)
  }
  return new Date(dateStr)
}

// Helper to get file icon based on category
function getFileIcon(category: FileItem['category']) {
  switch (category) {
    case 'folder': return <Folder className="w-4 h-4 text-primary" />
    case 'pdf': return <FileText className="w-4 h-4 text-red-500" />
    case 'doc': return <FileText className="w-4 h-4 text-blue-500" />
    case 'image': return <ImageIcon className="w-4 h-4 text-green-500" />
    case 'audio': return <Music className="w-4 h-4 text-purple-500" />
    case 'video': return <Film className="w-4 h-4 text-orange-500" />
    default: return <FileText className="w-4 h-4 text-muted-foreground" />
  }
}

// ===== Widget Content Components (all receive w/h for size-adaptive rendering) =====

function DailyTasksContent({ h }: { w: number; h: number }) {
  const tasks = useAppStore((s) => s.tasks)
  const toggleTaskStatus = useAppStore((s) => s.toggleTaskStatus)
  const maxTasks = Math.min(tasks.length, h >= 4 ? 10 : h >= 3 ? 7 : h >= 2 ? 5 : 4)
  return (
    <div className="space-y-1.5">
      {tasks.slice(0, maxTasks).map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent transition-colors cursor-pointer"
          onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task.id) }}
        >
          <div
            className={
              task.status === 'completed'
                ? 'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 border-primary bg-primary'
                : 'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 border-outline hover:border-primary transition-colors'
            }
          >
            {task.status === 'completed' && (
              <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span
            className={
              task.status === 'completed'
                ? 'text-sm truncate line-through text-muted-foreground'
                : 'text-sm truncate text-foreground'
            }
          >
            {task.title}
          </span>
        </div>
      ))}
    </div>
  )
}

function CalendarContent({ w, h }: { w: number; h: number }) {
  const events = useAppStore((s) => s.events)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Compute todayStr client-side only to avoid hydration mismatch
  const getTodayStr = () => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  }
  const todayStr = mounted ? getTodayStr() : ''

  // Upcoming events (today + future) — only compute after mount, using robust Date comparison
  const upcomingEvents = useMemo(() => {
    if (!mounted) return []
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    return events
      .filter((e) => {
        const eventDate = parseEventDate(e.date)
        eventDate.setHours(0, 0, 0, 0)
        return eventDate >= todayDate
      })
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [events, mounted])

  // Events today
  const todayEvents = upcomingEvents.filter((e) => e.date === todayStr)
  const futureEvents = upcomingEvents.filter((e) => {
    const eventDate = parseEventDate(e.date)
    eventDate.setHours(0, 0, 0, 0)
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    return eventDate > todayDate
  })

  const maxUpcoming = h >= 4 ? 8 : h >= 3 ? 5 : h >= 2 ? 4 : 3
  const showToday = h >= 2
  const showFuture = h >= 2

  // Pre-mount: show a safe placeholder that won't differ between server/client
  if (!mounted) {
    return (
      <div className="flex flex-col gap-4 h-full">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-primary/50" />
            <span className="text-xs font-semibold text-primary/50 uppercase tracking-wider">Today</span>
          </div>
          <div className="space-y-1.5 pl-4">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="size-3 text-muted-foreground/50" />
            <span className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider">Upcoming</span>
          </div>
          <div className="space-y-1.5 pl-4">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-4 w-28 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Today's events */}
      {showToday && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Today</span>
          </div>
          {todayEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground pl-4">No events today</p>
          ) : (
            <div className="space-y-1.5 pl-4">
              {todayEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-2.5">
                  <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: event.color || '#A5D6A7' }} />
                  <span className="text-sm text-foreground truncate">{event.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming events */}
      {showFuture && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="size-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</span>
          </div>
          {futureEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground pl-4">No upcoming events</p>
          ) : (
            <div className="space-y-1.5 pl-4">
              {futureEvents.slice(0, maxUpcoming).map((event) => (
                <div key={event.id} className="flex items-center gap-2.5">
                  <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: event.color || '#A5D6A7' }} />
                  <span className="text-sm text-foreground truncate flex-1 min-w-0">{event.title}</span>
                  <span className="text-[0.65rem] text-muted-foreground shrink-0">
                    {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Compact mode for 1-row cards */}
      {!showToday && !showFuture && (
        <div className="space-y-1.5">
          {upcomingEvents.slice(0, 3).map((event) => (
            <div key={event.id} className="flex items-center gap-2.5">
              <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: event.color || '#A5D6A7' }} />
              <span className="text-sm text-foreground truncate flex-1 min-w-0">{event.title}</span>
            </div>
          ))}
          {upcomingEvents.length === 0 && (
            <p className="text-xs text-muted-foreground">No events</p>
          )}
        </div>
      )}
    </div>
  )
}

function NotesContent({ w, h }: { w: number; h: number }) {
  const notes = useAppStore((s) => s.notes)
  const maxNotes = Math.min(notes.length, h >= 5 ? 10 : h >= 4 ? 8 : h >= 3 ? 5 : h >= 2 ? 4 : 3)
  const showContent = h >= 3
  const useGrid = w >= 2 && h >= 2

  if (useGrid) {
    // Grid layout for wider/taller cards
    const cols = w >= 3 ? 3 : 2
    return (
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {notes.slice(0, maxNotes).map((note) => (
          <div
            key={note.id}
            className="p-2.5 rounded-xl border border-border hover:bg-accent/50 transition-colors"
            style={{ borderLeftColor: note.color, borderLeftWidth: '3px' }}
          >
            <p className="text-sm font-medium text-foreground line-clamp-1">{note.title}</p>
            {showContent && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{note.content}</p>
            )}
          </div>
        ))}
      </div>
    )
  }

  // List layout for narrow cards
  return (
    <div className="space-y-1.5">
      {notes.slice(0, maxNotes).map((note) => (
        <div
          key={note.id}
          className="p-2.5 rounded-xl border border-border hover:bg-accent/50 transition-colors"
          style={{ borderLeftColor: note.color, borderLeftWidth: '3px' }}
        >
          <p className="text-sm font-medium text-foreground line-clamp-1">{note.title}</p>
          {showContent && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{note.content}</p>
          )}
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
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (verse) {
    return (
      <div className="space-y-3">
        <p className="arabic-text text-lg leading-relaxed text-primary">
          {verse.arabic}
        </p>
        <p className="text-sm text-on-surface-variant italic">{verse.translation}</p>
        <p className="text-xs text-muted-foreground">{verse.reference}</p>
      </div>
    )
  }
  return (
    <div className="text-center py-4">
      <p className="text-sm text-muted-foreground">No verse loaded yet</p>
      <p className="text-xs text-outline mt-1">Visit the Spiritual tab to load a verse</p>
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
            <span className="text-sm text-foreground truncate">{goal.title}</span>
            <span className="text-xs text-primary font-medium ml-2">{goal.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function FilesContent() {
  const files = useAppStore((s) => s.files)
  const rootFiles = files.filter((f) => f.parentId === null).slice(0, 5)
  return (
    <div className="space-y-2">
      {rootFiles.map((file) => (
        <div key={file.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent transition-colors">
          {getFileIcon(file.category)}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground truncate">{file.name}</p>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{formatFileSize(file.size)}</span>
        </div>
      ))}
      {rootFiles.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">No files yet</p>
      )}
    </div>
  )
}

function ClockContent() {
  const timezone = useAppStore((s) => s.timezone)
  const [time, setTime] = React.useState('')
  const [date, setDate] = React.useState('')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
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

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center py-2">
        <p className="text-3xl font-bold text-primary tabular-nums tracking-wider">
          --:--:--
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <p className="text-3xl font-bold text-primary tabular-nums tracking-wider">
        {time}
      </p>
      <p className="text-sm text-muted-foreground mt-1">{date}</p>
      <p className="text-xs text-outline mt-0.5">{timezone}</p>
    </div>
  )
}

// Widget component mapping — components receive size props
interface WidgetContentProps { w: number; h: number }
const widgetComponents: Record<WidgetType, React.ComponentType<WidgetContentProps>> = {
  tasks: DailyTasksContent,
  calendar: CalendarContent,
  notes: NotesContent,
  verse: VerseContent as React.ComponentType<WidgetContentProps>,
  goals: GoalsContent as React.ComponentType<WidgetContentProps>,
  clock: ClockContent as React.ComponentType<WidgetContentProps>,
  files: FilesContent as React.ComponentType<WidgetContentProps>,
}

export function DashboardGrid() {
  const layouts = useAppStore((s) => s.layouts)
  const mobileLayouts = useAppStore((s) => s.mobileLayouts)
  const setLayouts = useAppStore((s) => s.setLayouts)
  const setMobileLayouts = useAppStore((s) => s.setMobileLayouts)
  const updateWidgetSize = useAppStore((s) => s.updateWidgetSize)
  const widgets = useAppStore((s) => s.widgets)
  const setActivePage = useAppStore((s) => s.setActivePage)
  const dashboardEditMode = useAppStore((s) => s.dashboardEditMode)
  const setDashboardEditMode = useAppStore((s) => s.setDashboardEditMode)

  // Stable selector: only re-renders when the set of visible widget types actually changes
  const visibleWidgetTypesKey = useAppStore(
    useCallback((s: { widgets: { type: string; visible: boolean }[] }) => {
      return s.widgets.filter((w) => w.visible).map((w) => w.type).join(',')
    }, [])
  )

  const visibleWidgets = useMemo(
    () => widgets.filter((w) => w.visible),
    [widgets, visibleWidgetTypesKey]
  )

  // Lookup map: widget type → current layout size (desktop)
  const layoutMap = useMemo(() => {
    const map = new Map<string, Layout>()
    for (const l of layouts) {
      map.set(l.i, l)
    }
    return map
  }, [layouts])

  // Use the container width hook from react-grid-layout v2
  const { containerRef, width } = useContainerWidth()

  // Track current breakpoint to save to the correct layout store
  const currentBreakpointRef = useRef<string>('lg')

  // Build responsive layouts: desktop uses `layouts`, mobile uses `mobileLayouts`
  const responsiveLayouts = useMemo(() => {
    const visibleTypes = new Set(visibleWidgets.map((w) => w.type))

    // Apply static when not in edit mode to prevent any dragging; strip static in edit mode
    const applyStatic = (l: Layout): Layout => {
      const { static: _s, ...rest } = l as Layout & { static?: boolean }
      return dashboardEditMode ? rest : { ...rest, static: true }
    }

    // Desktop: 3 columns - use dedicated desktop layouts
    const desktopLayout = layouts
      .filter((l) => visibleTypes.has(l.i))
      .map((l) => ({
        ...l,
        w: Math.min(l.w, MAX_GRID_W),
        h: Math.min(l.h, MAX_GRID_H),
        x: Math.min(l.x, MAX_GRID_W - 1),
      }))
      .map(applyStatic)

    // Mobile: 1 column - use dedicated mobile layouts
    const mobileLayout = mobileLayouts
      .filter((l) => visibleTypes.has(l.i))
      .map((l) => ({
        ...l,
        w: 1,
        h: Math.min(l.h, MAX_GRID_H),
        x: 0,
      }))
      .map(applyStatic)

    return {
      lg: desktopLayout,
      md: desktopLayout,
      sm: mobileLayout,
    }
  }, [layouts, mobileLayouts, visibleWidgets, dashboardEditMode])

  // Strip `static` flag before persisting so it never gets baked into the store
  const stripStatic = (l: Layout): Layout => {
    const { static: _s, ...rest } = l as Layout & { static?: boolean }
    return rest
  }

  // Save desktop layouts when they change (only for lg/md breakpoint)
  const handleDesktopLayoutChange = useCallback(
    (currentLayout: Layout[]) => {
      const visibleTypes = new Set(visibleWidgets.map((w) => w.type))
      const hiddenLayouts = layouts.filter((l) => !visibleTypes.has(l.i))
      setLayouts([...hiddenLayouts, ...currentLayout.map(stripStatic)])
    },
    [layouts, visibleWidgets, setLayouts]
  )

  // Save mobile layouts when they change (only for sm breakpoint)
  const handleMobileLayoutChange = useCallback(
    (currentLayout: Layout[]) => {
      const visibleTypes = new Set(visibleWidgets.map((w) => w.type))
      const hiddenLayouts = mobileLayouts.filter((l) => !visibleTypes.has(l.i))
      setMobileLayouts([...hiddenLayouts, ...currentLayout.map(stripStatic)])
    },
    [mobileLayouts, visibleWidgets, setMobileLayouts]
  )

  // Unified handler that routes to the correct save function based on current breakpoint
  const handleLayoutChange = useCallback(
    (currentLayout: Layout[]) => {
      if (currentBreakpointRef.current === 'sm') {
        handleMobileLayoutChange(currentLayout)
      } else {
        handleDesktopLayoutChange(currentLayout)
      }
    },
    [handleDesktopLayoutChange, handleMobileLayoutChange]
  )

  // Track which breakpoint we're on
  const handleBreakpointChange = useCallback((newBreakpoint: string) => {
    currentBreakpointRef.current = newBreakpoint
  }, [])

  const handleSizeChange = useCallback(
    (widgetId: string, w: number, h: number) => {
      updateWidgetSize(widgetId, w, h)
    },
    [updateWidgetSize]
  )

  return (
    <div ref={containerRef} className="w-full">
      {/* Edit Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
        <button
          onClick={() => setDashboardEditMode(!dashboardEditMode)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
            dashboardEditMode
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          {dashboardEditMode ? (
            <>
              <Check className="size-4" />
              Done
            </>
          ) : (
            <>
              <Pencil className="size-4" />
              Edit Layout
            </>
          )}
        </button>
      </div>

      {/* Grid */}
      <ResponsiveGridLayout
        className="layout"
        layouts={responsiveLayouts}
        breakpoints={{ lg: 768, md: 768, sm: 0 }}
        cols={{ lg: 3, md: 3, sm: 1 }}
        rowHeight={120}
        width={width}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={handleBreakpointChange}
        draggableHandle={dashboardEditMode ? '.widget-drag-handle' : '.no-drag-handle'}
        compactType="vertical"
        margin={[16, 16]}
        containerPadding={[0, 0]}
        isResizable={false}
        isDraggable={dashboardEditMode}
      >
        {visibleWidgets.map((widget) => {
          const WidgetComponent = widgetComponents[widget.type]
          const layout = layoutMap.get(widget.type)
          const w = layout?.w ?? 1
          const h = layout?.h ?? 1
          return (
            <div key={widget.type} className="relative h-full">
              <WidgetCard
                title={widgetTitles[widget.type]}
                icon={widgetIcons[widget.type]}
                widgetId={widget.type}
                currentW={w}
                currentH={h}
                onSizeChange={(nw, nh) => handleSizeChange(widget.type, nw, nh)}
                onNavigate={widget.type !== 'clock' ? () => setActivePage(widgetPageMap[widget.type]) : undefined}
                editMode={dashboardEditMode}
              >
                <WidgetComponent w={w} h={h} />
              </WidgetCard>
            </div>
          )
        })}
      </ResponsiveGridLayout>
    </div>
  )
}
