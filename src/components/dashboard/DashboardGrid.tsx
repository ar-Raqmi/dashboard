'use client'

import React, { useCallback, useMemo, useRef, useMemo as useMemoReact } from 'react'
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout'
import { CheckCircle, CalendarDays, StickyNote, BookOpen, Flag, Folder, FileText, Image as ImageIcon, Music, Film, Pencil, Check, Plus, Settings2, Trash2, ChevronUp, ChevronDown, MoonStar, ClipboardList, Copy, CheckCheck, Star, Clock, Loader2, ExternalLink } from 'lucide-react'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useAppStore, MAX_GRID_W, MAX_GRID_H } from '@/lib/store'
import { WidgetCard } from './WidgetCard'
import type { WidgetType, Layout, ActivePage, FileItem, ClockConfig, Task } from '@/lib/store'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

// Widget icon mapping
const widgetIcons: Record<WidgetType, React.ReactNode> = {
  tasks: <CheckCircle className="w-4 h-4" />,
  calendar: <CalendarDays className="w-4 h-4" />,
  notes: <StickyNote className="w-4 h-4" />,
  verse: <BookOpen className="w-4 h-4" />,
  goals: <Flag className="w-4 h-4" />,
  clock: <MoonStar className="w-4 h-4" />,
  files: <Folder className="w-4 h-4" />,
  clipboard: <ClipboardList className="w-4 h-4" />,
}

// Widget title mapping
const widgetTitles: Record<WidgetType, string> = {
  tasks: 'Daily Tasks',
  calendar: 'Calendar',
  notes: 'Quick Notes',
  verse: 'Daily Verse',
  goals: 'Goals',
  clock: 'World Clock',
  files: 'Files',
  clipboard: 'Clipboard',
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
  clipboard: 'dashboard',
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
function getFileIcon(category: string | undefined) {
  const cn = "w-4 h-4"
  switch (category) {
    case 'folder': return <Folder className={`${cn} text-amber-400`} />
    case 'image': return <ImageIcon className={`${cn} text-emerald-400`} />
    case 'audio': return <Music className={`${cn} text-purple-400`} />
    case 'pdf': return <FileText className={`${cn} text-red-400`} />
    case 'doc': return <FileText className={`${cn} text-blue-400`} />
    case 'video': return <Film className={`${cn} text-pink-400`} />
    default: return <FileText className={`${cn} text-slate-400`} />
  }
}

// ===== Widget Content Components (all receive w/h for size-adaptive rendering) =====

function DailyTasksContent({ h }: { w: number; h: number }) {
  const tasks = useAppStore((s) => s.tasks)
  const toggleTaskStatus = useAppStore((s) => s.toggleTaskStatus)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Categorize & sort tasks (client-only to avoid hydration mismatch)
  const { overdueTasks, todayTasks, upcomingTasks } = React.useMemo(() => {
    if (!mounted) return { overdueTasks: [] as Task[], todayTasks: [] as Task[], upcomingTasks: [] as Task[] }

    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const overdue: Task[] = []
    const todayList: Task[] = []
    const upcoming: Task[] = []

    // Sort all tasks by dueDate ascending (nulls last), then by priority (high first)
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
    const sorted = [...tasks].sort((a, b) => {
      // Completed tasks go to the bottom
      if (a.status !== b.status) return a.status === 'completed' ? 1 : -1
      // Sort by due date
      if (a.dueDate && b.dueDate) {
        const cmp = a.dueDate.localeCompare(b.dueDate)
        if (cmp !== 0) return cmp
      } else if (a.dueDate) {
        return -1
      } else if (b.dueDate) {
        return 1
      }
      // Same date → sort by priority
      return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
    })

    for (const task of sorted) {
      if (!task.dueDate) {
        upcoming.push(task)
      } else if (task.dueDate < todayStr && task.status !== 'completed') {
        overdue.push(task)
      } else if (task.dueDate === todayStr) {
        todayList.push(task)
      } else {
        upcoming.push(task)
      }
    }

    return { overdueTasks: overdue, todayTasks: todayList, upcomingTasks: upcoming }
  }, [tasks, mounted])

  // Pre-mount placeholder
  if (!mounted) {
    return (
      <div className="space-y-2">
        <div className="h-4 w-16 rounded bg-muted animate-pulse" />
        <div className="h-8 w-full rounded-xl bg-muted/50 animate-pulse" />
        <div className="h-8 w-full rounded-xl bg-muted/50 animate-pulse" />
      </div>
    )
  }

  // Sectioned mode
  const hasOverdue = overdueTasks.length > 0
  const hasToday = todayTasks.length > 0
  const hasUpcoming = upcomingTasks.length > 0

  return (
    <div className="flex flex-col gap-3">
      {/* Overdue */}
      {hasOverdue && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="size-2 rounded-full bg-destructive" />
            <span className="text-[0.65rem] font-semibold text-destructive uppercase tracking-wider">Overdue</span>
            <span className="text-[0.6rem] text-destructive/70 tabular-nums">{overdueTasks.length}</span>
          </div>
          <div className="space-y-1">
            {overdueTasks.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={toggleTaskStatus} isOverdue />
            ))}
          </div>
        </div>
      )}

      {/* Today */}
      {hasToday && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[0.65rem] font-semibold text-primary uppercase tracking-wider">Today</span>
          </div>
          <div className="space-y-1">
            {todayTasks.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={toggleTaskStatus} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {hasUpcoming && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <CalendarDays className="size-2.5 text-muted-foreground" />
            <span className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</span>
          </div>
          <div className="space-y-1">
            {upcomingTasks.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={toggleTaskStatus} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasOverdue && !hasToday && !hasUpcoming && (
        <p className="text-sm text-muted-foreground text-center py-2">No tasks</p>
      )}
    </div>
  )
}

// ===== Task Row Sub-component =====
function TaskRow({ task, onToggle, compact, isOverdue }: {
  task: Task
  onToggle: (id: string) => void
  compact?: boolean
  isOverdue?: boolean
}) {
  const formatDueDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isCompleted = task.status === 'completed'

  return (
    <div
      className={`flex flex-col gap-1.5 p-2 rounded-xl hover:bg-accent transition-colors cursor-pointer ${
        isOverdue && !isCompleted ? 'bg-destructive/5 hover:bg-destructive/10' : ''
      }`}
      onClick={(e) => { e.stopPropagation(); onToggle(task.id) }}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
            isCompleted
              ? 'border-primary bg-primary'
              : isOverdue
                ? 'border-destructive hover:border-destructive/80 transition-colors'
                : 'border-outline hover:border-primary transition-colors'
          )}
        >
          {isCompleted && (
            <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span
          className={cn(
            "text-sm font-medium flex-1 min-w-0",
            isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
          )}
        >
          {task.title}
        </span>
      </div>
      
      {(task.dueDate || isOverdue) && !compact && (
        <div className="flex flex-wrap items-center gap-1.5 ml-[26px]">
          {isOverdue && !isCompleted && (
            <span className="text-[0.55rem] font-bold uppercase tracking-wider text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-md shrink-0">
              Overdue
            </span>
          )}
          {task.dueDate && (
            <span className={cn(
              "text-[0.6rem] font-medium shrink-0 tabular-nums px-1.5 py-0.5 rounded-md border",
              isOverdue && !isCompleted
                ? 'border-destructive/30 text-destructive bg-destructive/5'
                : isCompleted
                  ? 'border-border text-muted-foreground line-through'
                  : 'border-border text-muted-foreground bg-muted/30'
            )}>
              {formatDueDate(task.dueDate)}
            </span>
          )}
        </div>
      )}
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
  const setActivePage = useAppStore((s) => s.setActivePage)
  const setHighlightedNote = useAppStore((s) => s.setHighlightedNote)

  // Sort by createdAt desc (latest first) - pinned notes first, then by date
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      // Pinned notes always come first
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      // Then sort by createdAt descending (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [notes])

  const maxNotes = Math.min(sortedNotes.length, h >= 5 ? 10 : h >= 4 ? 8 : h >= 3 ? 5 : h >= 2 ? 4 : 3)
  const showContent = h >= 3
  const useGrid = w >= 2 && h >= 2

  const handleNoteClick = (id: string) => {
    setHighlightedNote(id)
    setActivePage('notes')
  }

  if (useGrid) {
    // Grid layout for wider/taller cards
    const cols = w >= 3 ? 3 : 2
    return (
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {sortedNotes.slice(0, maxNotes).map((note) => (
          <button
            key={note.id}
            onClick={() => handleNoteClick(note.id)}
            className="p-2.5 rounded-xl border border-border hover:bg-accent/50 transition-all text-left group relative"
            style={{ borderLeftColor: note.color, borderLeftWidth: '3px' }}
          >
            {note.pinned && (
              <div className="absolute top-1.5 right-1.5">
                <Star className="size-3 text-primary fill-primary" />
              </div>
            )}
            <div className="flex items-center justify-between gap-1 mb-1">
              <p className="text-sm font-bold text-foreground line-clamp-1 flex-1 group-hover:text-primary transition-colors arabic-text pr-4" dir="auto">{note.title}</p>
              <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
            {showContent && (
              <p className="text-xs text-muted-foreground line-clamp-2 arabic-text" dir="auto">{note.content}</p>
            )}
          </button>
        ))}
      </div>
    )
  }

  // List layout for narrow cards
  return (
    <div className="space-y-1.5">
      {sortedNotes.slice(0, maxNotes).map((note) => (
        <button
          key={note.id}
          onClick={() => handleNoteClick(note.id)}
          className="w-full p-2.5 rounded-xl border border-border hover:bg-accent/50 transition-all text-left group relative"
          style={{ borderLeftColor: note.color, borderLeftWidth: '3px' }}
        >
          {note.pinned && (
            <div className="absolute top-1.5 right-1.5">
              <Star className="size-3 text-primary fill-primary" />
            </div>
          )}
          <div className="flex items-center justify-between gap-1">
            <p className="text-sm font-bold text-foreground line-clamp-1 flex-1 group-hover:text-primary transition-colors arabic-text pr-4" dir="auto">{note.title}</p>
            <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
          {showContent && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 arabic-text" dir="auto">{note.content}</p>
          )}
        </button>
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
        <p className="arabic-text text-lg leading-relaxed text-primary text-right" dir="rtl">
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
  const { goals, setActivePage, setHighlightedGoal } = useAppStore()

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [goals])

  const handleGoalClick = (id: string) => {
    setHighlightedGoal(id)
    setActivePage('goals')
  }

  return (
    <div className="space-y-4 pr-1">
      {sortedGoals.map((goal) => (
        <div
          key={goal.id}
          onClick={() => handleGoalClick(goal.id)}
          className="p-3 rounded-2xl bg-muted/30 border border-border/50 hover:bg-accent/50 hover:border-primary/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground truncate flex-1 mr-2 group-hover:text-primary transition-colors">{goal.title}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-primary font-bold">{goal.progress}%</span>
              <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
          {/* Milestones */}
          <div className="flex flex-col gap-1.5 pl-1">
            {goal.milestones.map((ms) => (
              <div key={ms.id} className="flex items-start gap-2">
                <div className={`w-2 h-2 mt-1 rounded-full shrink-0 ${ms.completed ? 'bg-primary' : 'bg-muted border border-border'}`} />
                <span className={`text-[11px] leading-tight ${ms.completed ? 'text-muted-foreground line-through' : 'text-foreground/80'}`}>
                  {ms.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {sortedGoals.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">No goals yet</p>
      )}
    </div>
  )
}

function FilesContent() {
  const { setPreviewFile } = useAppStore()
  const files = useAppStore((s) => s.files)
  
  const recentFiles = useMemo(() => {
    if (!files) return []
    return [...files]
      .filter(f => f.type === 'file')
      .sort((a, b) => {
        const timeA = typeof a.updatedAt === 'number' ? a.updatedAt : new Date(a.updatedAt).getTime()
        const timeB = typeof b.updatedAt === 'number' ? b.updatedAt : new Date(b.updatedAt).getTime()
        return timeB - timeA
      })
      .slice(0, 6)
  }, [files])

  if (!files) {
    return (
      <div className="flex flex-col items-center justify-center py-10 opacity-50">
        <Loader2 className="size-6 animate-spin mb-2" />
        <p className="text-xs">Loading files...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="space-y-1">
        {recentFiles.map((file) => (
          <button
            key={file._id}
            onClick={() => setPreviewFile({
              id: file._id,
              name: file.name,
              type: file.type as any,
              category: (file.category || 'other') as any,
              parentId: file.parentId || null,
              size: file.size || 0,
              createdAt: typeof file.createdAt === 'number' ? new Date(file.createdAt).toISOString() : file.createdAt,
              updatedAt: typeof file.updatedAt === 'number' ? new Date(file.updatedAt).toISOString() : file.updatedAt,
              storageId: file.storageId
            })}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-accent/50 transition-colors group"
          >
            <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
              {getFileIcon(file.category)}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm text-foreground truncate font-medium">{file.name}</p>
              <p className="text-[10px] text-muted-foreground">{formatFileSize(file.size || 0)} • {new Date(file.updatedAt).toLocaleDateString()}</p>
            </div>
          </button>
        ))}
        {recentFiles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 opacity-50">
            <Folder className="size-8 mb-2 text-muted-foreground" />
            <p className="text-xs font-medium">No recent uploads</p>
          </div>
        )}
      </div>
    </div>
  )
}


// ===== Clipboard Content — Simple sticky note with copy =====
function ClipboardContent() {
  const clipboardText = useAppStore((s) => s.clipboardText)
  const setClipboardText = useAppStore((s) => s.setClipboardText)
  const [localText, setLocalText] = React.useState(clipboardText)
  const [copied, setCopied] = React.useState(false)

  // Keep local text in sync with store only when not focused to avoid overwriting user typing
  const isFocused = React.useRef(false)
  React.useEffect(() => {
    if (!isFocused.current) {
      setLocalText(clipboardText)
    }
  }, [clipboardText])

  const handleSave = () => {
    if (localText !== clipboardText) {
      setClipboardText(localText)
    }
  }

  const handleCopy = async () => {
    const textToCopy = isFocused.current ? localText : clipboardText
    if (!textToCopy.trim()) return
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = textToCopy
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <textarea
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        onFocus={() => { isFocused.current = true }}
        onBlur={() => {
          isFocused.current = false
          handleSave()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            handleSave()
          }
        }}
        placeholder="Paste or type anything here..."
        className="flex-1 min-h-[60px] resize-none text-sm bg-transparent placeholder:text-muted-foreground/50 focus:outline-none leading-relaxed"
      />
      <button
        onClick={handleCopy}
        disabled={!(isFocused.current ? localText : clipboardText).trim()}
        className={`shrink-0 h-8 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
          copied
            ? 'bg-primary/15 text-primary'
            : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30'
        }`}
      >
        {copied ? (
          <>
            <CheckCheck className="size-3.5" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="size-3.5" />
            Copy
          </>
        )}
      </button>
    </div>
  )
}

// ===== Timezone UTC offset helper =====
function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    })
    const parts = formatter.formatToParts(now)
    const tzPart = parts.find(p => p.type === 'timeZoneName')
    if (tzPart?.value) return tzPart.value
    // Fallback: compute offset manually
    const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC' })
    const tzStr = now.toLocaleString('en-US', { timeZone: timezone })
    const utcDate = new Date(utcStr)
    const tzDate = new Date(tzStr)
    const diffMin = Math.round((tzDate.getTime() - utcDate.getTime()) / 60000)
    const sign = diffMin >= 0 ? '+' : '-'
    const absMin = Math.abs(diffMin)
    const hrs = Math.floor(absMin / 60)
    const mins = absMin % 60
    return `UTC${sign}${hrs}${mins > 0 ? `:${String(mins).padStart(2, '0')}` : ''}`
  } catch {
    return timezone
  }
}

// ===== Popular timezone presets for the Add Clock dialog =====
const POPULAR_TIMEZONES = [
  { label: 'Kuala Lumpur', timezone: 'Asia/Kuala_Lumpur', value: 'Asia/Kuala_Lumpur|KL' },
  { label: 'Makkah', timezone: 'Asia/Riyadh', value: 'Asia/Riyadh|Makkah' },
  { label: 'Dubai', timezone: 'Asia/Dubai', value: 'Asia/Dubai|DXB' },
  { label: 'London', timezone: 'Europe/London', value: 'Europe/London|LDN' },
  { label: 'New York', timezone: 'America/New_York', value: 'America/New_York|NYC' },
  { label: 'Tokyo', timezone: 'Asia/Tokyo', value: 'Asia/Tokyo|TYO' },
  { label: 'Jakarta', timezone: 'Asia/Jakarta', value: 'Asia/Jakarta|JKT' },
  { label: 'Istanbul', timezone: 'Europe/Istanbul', value: 'Europe/Istanbul|IST' },
  { label: 'Cairo', timezone: 'Africa/Cairo', value: 'Africa/Cairo|CAI' },
  { label: 'Sydney', timezone: 'Australia/Sydney', value: 'Australia/Sydney|SYD' },
  { label: 'Singapore', timezone: 'Asia/Singapore', value: 'Asia/Singapore|SIN' },
  { label: 'Jeddah', timezone: 'Asia/Riyadh', value: 'Asia/Riyadh|JED' },
  { label: 'Medina', timezone: 'Asia/Riyadh', value: 'Asia/Riyadh|MED' },
  { label: 'Karachi', timezone: 'Asia/Karachi', value: 'Asia/Karachi|KHI' },
  { label: 'Dhaka', timezone: 'Asia/Dhaka', value: 'Asia/Dhaka|DAC' },
  { label: 'Los Angeles', timezone: 'America/Los_Angeles', value: 'America/Los_Angeles|LAX' },
  { label: 'Paris', timezone: 'Europe/Paris', value: 'Europe/Paris|PAR' },
  { label: 'Berlin', timezone: 'Europe/Berlin', value: 'Europe/Berlin|BER' },
]

// ===== Hijri Date helper using Intl.DateTimeFormat =====
function getHijriDate(offset: number): { day: number; month: string; year: number; monthAr: string } | null {
  try {
    const now = new Date()
    now.setDate(now.getDate() + offset)

    const hijriFmt = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const hijriFmtAr = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const parts = hijriFmt.formatToParts(now)
    const arParts = hijriFmtAr.formatToParts(now)

    const day = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10)
    const month = parts.find(p => p.type === 'month')?.value || ''
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10)
    const monthAr = arParts.find(p => p.type === 'month')?.value || ''

    return { day, month, year, monthAr }
  } catch {
    return null
  }
}

// ===== Single Clock Display =====
function ClockDisplay({ clock, isPrimary, showSeconds }: { clock: ClockConfig; isPrimary: boolean; showSeconds: boolean }) {
  const [timeStr, setTimeStr] = React.useState('')
  const [dateStr, setDateStr] = React.useState('')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setMounted(true)
    })
    const update = () => {
      const now = new Date()
      try {
        const timeFmt = new Intl.DateTimeFormat('en-US', {
          timeZone: clock.timezone,
          hour: 'numeric',
          minute: '2-digit',
          ...(showSeconds ? { second: '2-digit' } : {}),
          hour12: true,
        })
        const dateFmt = new Intl.DateTimeFormat('en-US', {
          timeZone: clock.timezone,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
        setTimeStr(timeFmt.format(now))
        setDateStr(dateFmt.format(now))
      } catch {
        setTimeStr(now.toLocaleTimeString('en-US', { hour12: true, ...(showSeconds ? { second: '2-digit' } : {}) }))
        setDateStr(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }))
      }
    }
    update()
    const interval = setInterval(update, 1000)
    return () => {
      clearInterval(interval)
      cancelAnimationFrame(rafId)
    }
  }, [clock.timezone, showSeconds])

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center">
        <p className={`${isPrimary ? 'text-3xl' : 'text-lg'} font-bold text-primary/50 tabular-nums tracking-wider`}>
          --:--
        </p>
      </div>
    )
  }

  if (isPrimary) {
    return (
      <div className="flex flex-col items-center justify-center">
        <p className="text-3xl font-bold text-primary tabular-nums tracking-wider leading-none">
          {timeStr}
        </p>
        <p className="text-[0.65rem] text-outline mt-1.5">{clock.label}</p>
      </div>
    )
  }

  // Secondary clock — compact row
  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-muted/50">
      <p className="text-sm font-bold text-primary tabular-nums leading-none">{timeStr}</p>
      <span className="flex-1" />
      <span className="text-[0.65rem] text-muted-foreground">{clock.label}</span>
    </div>
  )
}

// ===== Clock Settings Popover =====
function ClockSettingsPopover() {
  const clocks = useAppStore((s) => s.clocks)
  const addClock = useAppStore((s) => s.addClock)
  const removeClock = useAppStore((s) => s.removeClock)
  const hijriVisible = useAppStore((s) => s.hijriVisible)
  const setHijriVisible = useAppStore((s) => s.setHijriVisible)
  const hijriOffset = useAppStore((s) => s.hijriOffset)
  const setHijriOffset = useAppStore((s) => s.setHijriOffset)
  const showSeconds = useAppStore((s) => s.showSeconds)
  const setShowSeconds = useAppStore((s) => s.setShowSeconds)
  const [selectedValue, setSelectedValue] = React.useState(POPULAR_TIMEZONES[0].value)
  const [newTz, setNewTz] = React.useState(POPULAR_TIMEZONES[0].timezone)
  const [newLabel, setNewLabel] = React.useState(POPULAR_TIMEZONES[0].label)

  const handleTzSelect = (val: string) => {
    setSelectedValue(val)
    const preset = POPULAR_TIMEZONES.find(t => t.value === val)
    if (preset) {
      setNewTz(preset.timezone)
      setNewLabel(preset.label)
    }
  }

  const handleAdd = () => {
    if (clocks.length >= 5) return
    addClock({ label: newLabel, timezone: newTz })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="shrink-0 p-2 sm:p-1.5 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-primary no-drag"
          aria-label="Clock settings"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Settings2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="rounded-2xl p-4 w-72 bg-card border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          {/* Add timezone */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Add Clock</p>
            <div className="flex gap-2">
              <Select value={selectedValue} onValueChange={handleTzSelect}>
                <SelectTrigger className="flex-1 h-8 text-xs rounded-xl bg-input border-border">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-card border-border">
                  {POPULAR_TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value} className="text-xs">
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={handleAdd}
                disabled={clocks.length >= 5}
                className="shrink-0 size-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            {clocks.length >= 5 && (
              <p className="text-[0.6rem] text-muted-foreground mt-1">Maximum 5 clocks</p>
            )}
          </div>

          {/* Current clocks */}
          {clocks.length > 1 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Clocks</p>
              <div className="space-y-1">
                {clocks.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-muted/50">
                    <span className="text-xs text-foreground flex-1 truncate">{c.label}</span>
                    <span className="text-[0.6rem] text-muted-foreground tabular-nums">{getTimezoneOffset(c.timezone)}</span>
                    {i > 0 && (
                      <button
                        onClick={() => removeClock(c.id)}
                        className="size-5 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show Seconds toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">Show Seconds</span>
            </div>
            <Switch checked={showSeconds} onCheckedChange={setShowSeconds} className="data-[state=checked]:bg-primary" />
          </div>

          {/* Hijri toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MoonStar className="size-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">Hijri Date</span>
            </div>
            <Switch checked={hijriVisible} onCheckedChange={setHijriVisible} className="data-[state=checked]:bg-primary" />
          </div>

          {/* Hijri offset */}
          {hijriVisible && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[0.65rem] text-muted-foreground">Hilal Adjustment</span>
                <span className="text-xs font-semibold text-primary tabular-nums">
                  {hijriOffset > 0 ? '+' : ''}{hijriOffset} day{Math.abs(hijriOffset) !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHijriOffset(hijriOffset - 1)}
                  disabled={hijriOffset <= -2}
                  className="size-7 rounded-lg bg-muted flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-30"
                >
                  <ChevronDown className="size-3.5" />
                </button>
                <Slider
                  value={[hijriOffset]}
                  onValueChange={([v]) => setHijriOffset(v)}
                  min={-2}
                  max={2}
                  step={1}
                  className="flex-1"
                />
                <button
                  onClick={() => setHijriOffset(hijriOffset + 1)}
                  disabled={hijriOffset >= 2}
                  className="size-7 rounded-lg bg-muted flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-30"
                >
                  <ChevronUp className="size-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ClockContent({ w, h }: { w: number; h: number }) {
  const clocks = useAppStore((s) => s.clocks)
  const showSeconds = useAppStore((s) => s.showSeconds)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const primary = clocks[0]
  const secondary = clocks.slice(1)

  // Size-adaptive: 1×1 = primary only, 2×2+ = full with secondary clocks
  const showSecondary = secondary.length > 0 && (h >= 2 || w >= 2)

  // Pre-mount placeholder
  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center py-2">
        <p className="text-3xl font-bold text-primary/50 tabular-nums tracking-wider">
          --:--
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Primary Clock */}
      {primary && <ClockDisplay clock={primary} isPrimary showSeconds={showSeconds} />}

      {/* Secondary Clocks */}
      {showSecondary && secondary.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          {secondary.slice(0, h >= 3 ? 4 : 2).map((clock) => (
            <ClockDisplay key={clock.id} clock={clock} isPrimary={false} showSeconds={showSeconds} />
          ))}
        </div>
      )}
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
  clipboard: ClipboardContent as unknown as React.ComponentType<WidgetContentProps>,
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
  const dashboardEditSubMode = useAppStore((s) => s.dashboardEditSubMode)
  const setDashboardEditSubMode = useAppStore((s) => s.setDashboardEditSubMode)
  
  // 1. Initialize core hooks and refs
  const isMobile = useIsMobile()
  const { containerRef, width } = useContainerWidth()
  const currentBreakpointRef = useRef<string>('lg')

  // 2. Stable selectors and memos
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

  // 2. Movement logic for mobile
  const handleMoveWidget = useCallback(
    (widgetId: string, direction: 'up' | 'down') => {
      // 1. Get visible vs hidden types
      const visibleTypes = new Set(visibleWidgets.map((w) => w.type))
      
      // 2. Separate visible and hidden layouts
      const visibleLayouts = mobileLayouts
        .filter((l) => visibleTypes.has(l.i as any))
        .sort((a, b) => a.y - b.y)
      const hiddenLayouts = mobileLayouts.filter((l) => !visibleTypes.has(l.i as any))

      // 3. Find index in visible list
      const index = visibleLayouts.findIndex((l) => l.i === widgetId)
      if (index === -1) return

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= visibleLayouts.length) return

      // 4. Swap positions in the visible array
      const [movedItem] = visibleLayouts.splice(index, 1)
      visibleLayouts.splice(targetIndex, 0, movedItem)

      // 5. Recalculate ALL y values for visible layouts to ensure no gaps
      let nextY = 0
      const recalculatedVisible = visibleLayouts.map((l) => {
        const newItem = { ...l, y: nextY }
        nextY += l.h
        return newItem
      })

      // 6. Save combined layouts back to store
      setMobileLayouts([...recalculatedVisible, ...hiddenLayouts])
    },
    [mobileLayouts, visibleWidgets, setMobileLayouts]
  )

  // 3. Responsive layouts memo
  const responsiveLayouts = useMemo(() => {
    const visibleTypes = new Set(visibleWidgets.map((w) => w.type))

    // Apply static when not in edit mode OR when on mobile (we use buttons for move, popover for resize)
    const applyStatic = (l: Layout): Layout => {
      const { static: _s, ...rest } = l as Layout & { static?: boolean }
      const isInteractionDisabled = !dashboardEditMode || isMobile
      return isInteractionDisabled ? { ...rest, static: true } : rest
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
  }, [layouts, mobileLayouts, visibleWidgets, dashboardEditMode, isMobile, dashboardEditSubMode])

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
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-3 shrink-0">
          <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
          
          {/* Sub-mode Toggle (Mobile Only) */}
          {dashboardEditMode && isMobile && (
            <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border/50">
              <button
                onClick={() => setDashboardEditSubMode('move')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                  dashboardEditSubMode === 'move' 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Move
              </button>
              <button
                onClick={() => setDashboardEditSubMode('resize')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                  dashboardEditSubMode === 'resize' 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Resize
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setDashboardEditMode(!dashboardEditMode)}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium transition-all',
            dashboardEditMode
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
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
        key={`grid-${dashboardEditMode}-${dashboardEditSubMode}-${isMobile}`}
        className="layout"
        layouts={responsiveLayouts}
        breakpoints={{ lg: 768, md: 768, sm: 0 }}
        cols={{ lg: 3, md: 3, sm: 1 }}
        rowHeight={120}
        width={width}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={handleBreakpointChange}
        draggableHandle={dashboardEditMode && !isMobile && dashboardEditSubMode === 'move' ? '.widget-drag-handle' : '.non-existent-handle'}
        draggableCancel=".no-drag"
        compactType="vertical"
        margin={[16, 16]}
        containerPadding={[0, 0]}
        isResizable={false}
        isDraggable={dashboardEditMode && !isMobile && dashboardEditSubMode === 'move'}
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
                onMoveUp={() => handleMoveWidget(widget.type, 'up')}
                onMoveDown={() => handleMoveWidget(widget.type, 'down')}
                onNavigate={widget.type !== 'clock' ? () => setActivePage(widgetPageMap[widget.type]) : undefined}
                editMode={dashboardEditMode}
                editSubMode={dashboardEditSubMode}
                isMobile={isMobile}
                headerAction={widget.type === 'clock' ? <ClockSettingsPopover /> : undefined}
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
