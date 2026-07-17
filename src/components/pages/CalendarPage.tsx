'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Plus, Trash2, CalendarDays, Clock, History, Repeat, Pencil, Search, X } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { format } from 'date-fns'
import { RecurrencePicker } from '@/components/recurrence/RecurrencePicker'
import { DayTimeline } from '@/components/calendar/DayTimeline'
import { configToRRuleString, rruleStringToConfig, describeRecurrence, type RecurrenceConfig } from '@/lib/recurrence'
import type { CalendarEvent } from '@/lib/store'

const EVENT_COLORS = [
  { value: '#A5D6A7', label: 'Green' },
  { value: '#F48FB1', label: 'Pink' },
  { value: '#CE93D8', label: 'Purple' },
  { value: '#80CBC4', label: 'Teal' },
  { value: '#FFD54F', label: 'Amber' },
  { value: '#FF8A65', label: 'Orange' },
  { value: '#90CAF9', label: 'Blue' },
  { value: '#B0BEC5', label: 'Gray' },
]

// Helper: format Date to 'yyyy-MM-dd' in local timezone (avoids UTC shift)
function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Helper: parse 'yyyy-MM-dd' to Date at noon (avoids UTC shift)
function parseLocalDateString(dateStr: string): Date {
  return new Date(dateStr + 'T12:00:00')
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

// Shared compact event row used by the sidebar mini-sections (DRY)
type MiniEvent = { id: string; title: string; date: string; color?: string; isRecurring?: boolean; recurrenceTemplateId?: string; occurrenceDate?: string }

function MiniEventRow({ event, onSelect, onDelete }: { event: MiniEvent; onSelect: (date: string) => void; onDelete?: (event: MiniEvent) => void }) {
  return (
    <div className="group flex items-center gap-2.5 p-2 rounded-xl hover:bg-accent/50 cursor-pointer transition-colors">
      <div
        className="size-2 rounded-full shrink-0"
        style={{ backgroundColor: event.color || EVENT_COLORS[0].value }}
        onClick={() => onSelect(event.date)}
      />
      <span className="text-xs text-foreground truncate flex-1 min-w-0" onClick={() => onSelect(event.date)}>
        {event.title}
      </span>
      <span className="text-[0.65rem] text-muted-foreground shrink-0">
        {format(parseLocalDateString(event.date), 'MMM d')}
      </span>
      {onDelete && (
        <button
          className="size-5 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
          title={event.isRecurring ? 'Cancel this occurrence' : 'Delete event'}
          onClick={(e) => { e.stopPropagation(); onDelete(event) }}
        >
          <Trash2 className="size-3" />
        </button>
      )}
    </div>
  )
}

export default function CalendarPage() {
  const { events, addEvent, updateEvent, deleteEvent, applyEventOccurrenceOverride } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState<Date>(selectedDate)
  const [eventColor, setEventColor] = useState(EVENT_COLORS[0].value)
  const [eventStartTime, setEventStartTime] = useState<string>('')
  const [eventEndTime, setEventEndTime] = useState<string>('')
  const [eventAllDay, setEventAllDay] = useState<boolean>(true)
  const [eventRecurrence, setEventRecurrence] = useState<RecurrenceConfig | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [view, setView] = useState<'calendar' | 'past'>('calendar')
  const [pastQuery, setPastQuery] = useState('')
  const [deleteChoiceEvent, setDeleteChoiceEvent] = useState<CalendarEvent | null>(null)

  useEffect(() => {
    // Schedule mount flag outside the synchronous effect body to avoid cascading renders
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const selectedDateStr = toLocalDateString(selectedDate)

  const eventsForSelectedDate = useMemo(
    () => events.filter((e) => e.date === selectedDateStr),
    [events, selectedDateStr]
  )

  // Group events by date for dot indicators
  const eventDateMap = useMemo(() => {
    const map = new Map<string, { id: string; color: string }[]>()
    events.forEach((e) => {
      if (!map.has(e.date)) map.set(e.date, [])
      map.get(e.date)!.push({ id: e.id, color: e.color || EVENT_COLORS[0].value })
    })
    return map
  }, [events])

  // Today's events — client-only to avoid hydration mismatch
  const todayStr = mounted ? toLocalDateString(new Date()) : ''
  const isViewingToday = selectedDateStr === todayStr

  const todayEvents = useMemo(() => {
    if (!mounted || !todayStr) return []
    // When already viewing today, events show in the main section — don't duplicate
    if (isViewingToday) return []
    return events.filter((e) => e.date === todayStr)
  }, [events, todayStr, isViewingToday, mounted])

  // Upcoming events (strictly AFTER today, excluding selected date) — client-only
  const upcomingEvents = useMemo(() => {
    if (!mounted) return []
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    return events
      .filter((e) => {
        if (e.date === selectedDateStr) return false
        if (e.date === todayStr) return false // today's events go in the Today section
        const eventDate = parseEventDate(e.date)
        eventDate.setHours(0, 0, 0, 0)
        return eventDate > todayDate
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8)
  }, [events, selectedDateStr, todayStr, mounted])

  // All past events (strictly BEFORE today) — client-only, for the Past tab
  const pastEventsAll = useMemo(() => {
    if (!mounted) return []
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    return events
      .filter((e) => {
        const eventDate = parseEventDate(e.date)
        eventDate.setHours(0, 0, 0, 0)
        return eventDate < todayDate
      })
      .sort((a, b) => b.date.localeCompare(a.date)) // most recent first
  }, [events, mounted])

  const filteredPast = useMemo(() => {
    const q = pastQuery.trim().toLowerCase()
    if (!q) return pastEventsAll
    return pastEventsAll.filter((e) => e.title.toLowerCase().includes(q))
  }, [pastEventsAll, pastQuery])

  const pastGrouped = useMemo(() => {
    const groups: { key: string; label: string; items: typeof pastEventsAll }[] = []
    for (const ev of filteredPast) {
      const d = parseEventDate(ev.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      let g = groups.find((x) => x.key === key)
      if (!g) {
        g = { key, label, items: [] }
        groups.push(g)
      }
      g.items.push(ev)
    }
    return groups
  }, [filteredPast])

  // All events for selected month (for the mini month summary)
  const selectedMonthEvents = useMemo(() => {
    const monthPrefix = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`
    return events.filter((e) => e.date.startsWith(monthPrefix))
  }, [events, selectedDate])

  const handleSaveEvent = () => {
    if (!eventTitle.trim()) return
    const dateStr = toLocalDateString(eventDate)
    let rrule: string | null = null
    let dtstart: string | null = null
    if (eventRecurrence) {
      rrule = configToRRuleString(eventRecurrence, dateStr)
      dtstart = dateStr
    }

    const timePayload = eventAllDay
      ? { startTime: null, endTime: null, allDay: true }
      : { startTime: eventStartTime || null, endTime: eventEndTime || null, allDay: false }

    if (editingEvent) {
      const targetId = editingEvent.recurrenceTemplateId ?? editingEvent.id
      const updates: Partial<CalendarEvent> = {
        title: eventTitle.trim(),
        color: eventColor,
        ...timePayload,
        rrule,
        dtstart: rrule ? dtstart : null,
      }
      if (!editingEvent.isRecurring) {
        updates.date = dateStr
      }
      if (!rrule) {
        ;(updates as any).rrule = null
        ;(updates as any).dtstart = null
      }
      updateEvent(targetId, updates)
    } else {
      addEvent({
        title: eventTitle.trim(),
        date: dateStr,
        color: eventColor,
        ...timePayload,
        rrule,
        dtstart,
      })
    }
    resetEventForm()
    setDialogOpen(false)
  }

  const resetEventForm = () => {
    setEventTitle('')
    setEventColor(EVENT_COLORS[0].value)
    setEventStartTime('')
    setEventEndTime('')
    setEventAllDay(true)
    setEventRecurrence(null)
    setEditingEvent(null)
  }

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) resetEventForm()
  }

  const openAddDialog = useCallback(() => {
    setEventDate(selectedDate)
    setEventTitle('')
    setEventColor(EVENT_COLORS[0].value)
    setEventStartTime('')
    setEventEndTime('')
    setEventAllDay(true)
    setEventRecurrence(null)
    setEditingEvent(null)
    setDialogOpen(true)
  }, [selectedDate])

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event)
    setEventTitle(event.title)
    setEventColor(event.color || EVENT_COLORS[0].value)
    setEventDate(event.date ? parseLocalDateString(event.date) : selectedDate)
    setEventStartTime(event.startTime ?? '')
    setEventEndTime(event.endTime ?? '')
    setEventAllDay(event.allDay ?? !event.startTime)
    setEventRecurrence(event.rrule ? rruleStringToConfig(event.rrule) : null)
    setDialogOpen(true)
  }

  const handleDeleteEvent = (event: CalendarEvent) => {
    if (event.isRecurring && event.recurrenceTemplateId && event.occurrenceDate) {
      applyEventOccurrenceOverride(event.recurrenceTemplateId, event.occurrenceDate, { cancelled: true })
    } else {
      deleteEvent(event.id)
    }
  }

  const handleDeleteFromEdit = () => {
    if (!editingEvent) return
    setDeleteChoiceEvent(editingEvent)
    setDialogOpen(false)
  }

  const confirmDeleteOccurrence = () => {
    const ev = deleteChoiceEvent
    if (ev?.isRecurring && ev.recurrenceTemplateId && ev.occurrenceDate) {
      applyEventOccurrenceOverride(ev.recurrenceTemplateId, ev.occurrenceDate, { cancelled: true })
    }
    setDeleteChoiceEvent(null)
  }

  const confirmDeleteEvent = () => {
    const ev = deleteChoiceEvent
    if (ev) deleteEvent(ev.recurrenceTemplateId ?? ev.id)
    setDeleteChoiceEvent(null)
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/15">
            <CalendarDays className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Calendar</h1>
            <p className="text-xs text-muted-foreground">
              {mounted ? `${selectedMonthEvents.length} events this month` : '\u00A0'}
            </p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90" onClick={openAddDialog}>
              <Plus className="size-4 mr-1.5" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground font-medium">Title</label>
                <Input
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Enter event title..."
                  className="rounded-2xl bg-input border-border"
                  autoFocus
                />
              </div>
              {!(editingEvent?.isRecurring) && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-muted-foreground font-medium">Date</label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="rounded-2xl bg-input border-border justify-start text-left font-normal"
                      >
                        <CalendarDays className="mr-2 size-4" />
                        {mounted && eventDate ? format(eventDate, 'EEEE, MMMM d, yyyy') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-border rounded-2xl">
                      <Calendar
                        mode="single"
                        selected={eventDate}
                        onSelect={(date) => {
                          if (date) {
                            setEventDate(date)
                            setCalendarOpen(false)
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              {editingEvent?.isRecurring && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">
                  <Repeat className="size-3.5" />
                  Editing the recurring series
                </div>
              )}
              {!(editingEvent?.isRecurring) && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-muted-foreground font-medium">All day</label>
                    <Switch checked={eventAllDay} onCheckedChange={setEventAllDay} />
                  </div>
                  {!eventAllDay && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={eventStartTime}
                        onChange={(e) => setEventStartTime(e.target.value)}
                        className="flex-1 h-10 rounded-2xl bg-input border border-border px-3 text-sm text-foreground"
                      />
                      <span className="text-muted-foreground text-sm">–</span>
                      <input
                        type="time"
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                        className="flex-1 h-10 rounded-2xl bg-input border border-border px-3 text-sm text-foreground"
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground font-medium">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      className={`size-8 rounded-xl transition-all ${eventColor === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-card scale-110' : 'opacity-60 hover:opacity-100'
                        }`}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setEventColor(c.value)}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground font-medium">Repeat</label>
                <RecurrencePicker
                  value={eventRecurrence}
                  onChange={setEventRecurrence}
                  startDate={eventDate}
                />
                {eventRecurrence && (
                  <p className="text-xs text-primary font-medium">{describeRecurrence(eventRecurrence)}</p>
                )}
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
              {editingEvent && (
                <Button
                  variant="ghost"
                  onClick={handleDeleteFromEdit}
                  className="rounded-2xl text-destructive hover:text-destructive hover:bg-destructive/10 mr-auto"
                >
                  <Trash2 className="size-4 mr-1" />
                  Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <DialogClose asChild>
                  <Button variant="ghost" className="rounded-2xl">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleSaveEvent}
                  disabled={!eventTitle.trim()}
                  className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {editingEvent ? 'Save Changes' : 'Add Event'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Event delete choice (from edit dialog) */}
      <Dialog open={!!deleteChoiceEvent} onOpenChange={(open) => !open && setDeleteChoiceEvent(null)}>
        <DialogContent className="bg-card border-border rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />
              {deleteChoiceEvent?.isRecurring ? 'Delete recurring event' : 'Delete event'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              {deleteChoiceEvent?.isRecurring
                ? 'This event repeats. Choose what to delete.'
                : `Delete "${deleteChoiceEvent?.title}"? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:gap-2">
            {deleteChoiceEvent?.isRecurring && (
              <Button
                onClick={confirmDeleteOccurrence}
                variant="outline"
                className="rounded-2xl w-full justify-start whitespace-normal h-auto py-3 items-start text-left"
              >
                <div className="flex flex-col items-start text-left min-w-0">
                  <span className="font-medium">Delete this day only</span>
                  <span className="text-xs text-muted-foreground font-normal break-words">
                    Skip {deleteChoiceEvent.occurrenceDate} &mdash; the series continues
                  </span>
                </div>
              </Button>
            )}
            <Button
              onClick={confirmDeleteEvent}
              className={`rounded-2xl w-full justify-start whitespace-normal h-auto py-3 items-start text-left ${deleteChoiceEvent?.isRecurring ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}`}
            >
              <div className="flex flex-col items-start text-left min-w-0">
                <span className="font-medium">
                  {deleteChoiceEvent?.isRecurring ? 'Delete the entire series' : 'Delete event'}
                </span>
                <span className="text-xs opacity-80 font-normal break-words">
                  {deleteChoiceEvent?.isRecurring ? 'Remove every occurrence permanently' : 'This cannot be undone'}
                </span>
              </div>
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" className="rounded-2xl w-full">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View toggle */}
      <div className="flex gap-2">
        <Button
          variant={view === 'calendar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('calendar')}
          className={`rounded-2xl ${view === 'calendar' ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <CalendarDays className="size-4 mr-1.5" />
          Calendar
        </Button>
        <Button
          variant={view === 'past' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('past')}
          className={`rounded-2xl ${view === 'past' ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <History className="size-4 mr-1.5" />
          Past Events
        </Button>
      </div>

      {/* Calendar + Events Layout */}
      {view === 'calendar' && (!mounted ? (
        // Pre-mount skeleton to avoid hydration mismatch from Date-dependent rendering
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="rounded-3xl bg-card border border-border p-5 flex-1 min-h-[320px] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="rounded-3xl bg-card border border-border p-5 lg:w-80 min-h-[200px]" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Calendar Card */}
          <div className="rounded-3xl bg-card border border-border p-5 flex-1">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => { if (date) setSelectedDate(date) }}
              className="w-full"
              modifiers={{
                hasEvents: (date) => eventDateMap.has(toLocalDateString(date)),
              }}
              modifiersStyles={{
                hasEvents: { fontWeight: 'bold' },
              }}
              components={{
                DayButton: ({ day, modifiers, ...props }) => {
                  const dateStr = toLocalDateString(day.date)
                  const dayEvents = eventDateMap.get(dateStr)
                  const isSelected = modifiers.selected
                  const isTodayDate = modifiers.today
                  return (
                    <div className="flex flex-col items-center gap-0.5 w-full h-full">
                      <button
                        {...props}
                        className={`flex items-center justify-center w-full aspect-square rounded-full text-sm transition-all ${isSelected
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                          : isTodayDate
                            ? 'bg-primary/15 text-primary font-semibold'
                            : 'hover:bg-accent text-foreground'
                          } ${modifiers.outside ? 'text-outline' : ''}`}
                        onClick={(e) => {
                          props.onClick?.(e)
                          setSelectedDate(day.date)
                        }}
                      >
                        {day.date.getDate()}
                      </button>
                      {dayEvents && dayEvents.length > 0 && (
                        <div className="flex gap-0.5">
                          {dayEvents.slice(0, 3).map((ev, i) => (
                            <div
                              key={i}
                              className="size-1.5 rounded-full"
                              style={{ backgroundColor: isSelected ? 'white' : ev.color }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                },
              }}
            />
          </div>

          {/* Events Sidebar */}
          <div className="rounded-3xl bg-card border border-border p-5 lg:w-80 flex flex-col gap-4 min-h-0">
            {/* Selected Date Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {format(selectedDate, 'MMMM d')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {format(selectedDate, 'EEEE')}
                </p>
              </div>
              <Button
                size="sm"
                className="rounded-xl bg-primary/15 text-primary hover:bg-primary/25 shadow-none"
                onClick={openAddDialog}
              >
                <Plus className="size-3.5 mr-1" />
                Add
              </Button>
            </div>

            {/* Today section (only when not viewing today) */}
            {todayEvents.length > 0 && (
              <>
                <div className="border-t border-border/50" />
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="size-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">Today</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {todayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="group flex items-center gap-2.5 p-2 rounded-xl bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors"
                        onClick={() => setSelectedDate(new Date())}
                      >
                        <div
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: event.color || EVENT_COLORS[0].value }}
                        />
                        <span className="text-xs text-foreground truncate flex-1 min-w-0 font-medium">{event.title}</span>
                        <button
                          className="size-5 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                          title={event.isRecurring ? 'Cancel this occurrence' : 'Delete event'}
                          onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event) }}
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Divider + Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <>
                <div className="border-t border-border/50 mt-1" />
                <div className="mt-1">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Clock className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</span>
                  </div>
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                    {upcomingEvents.map((event) => (
                      <MiniEventRow key={event.id} event={event} onSelect={(date) => setSelectedDate(parseLocalDateString(date))} onDelete={handleDeleteEvent} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

          {/* Day viewer — horizontal timeline for the selected date */}
          <div className="rounded-3xl bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-foreground">{format(selectedDate, 'EEEE, MMMM d')}</h2>
                <p className="text-xs text-muted-foreground">
                  {eventsForSelectedDate.length} {eventsForSelectedDate.length === 1 ? 'event' : 'events'}
                </p>
              </div>
              <Button size="sm" onClick={openAddDialog} className="rounded-xl bg-primary/15 text-primary hover:bg-primary/25 shadow-none">
                <Plus className="size-3.5 mr-1" /> Add
              </Button>
            </div>
            <DayTimeline events={eventsForSelectedDate} onSelect={openEditDialog} />
          </div>
        </div>
      ))}

      {/* Past Events view */}
      {view === 'past' && (
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              value={pastQuery}
              onChange={(e) => setPastQuery(e.target.value)}
              placeholder="Search past events..."
              className="pl-11 pr-10 rounded-2xl bg-card border-border h-11"
            />
            {pastQuery && (
              <button
                onClick={() => setPastQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {filteredPast.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 bg-muted/20 rounded-3xl border border-dashed border-border">
              <History className="size-8 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">
                {pastQuery ? `No past events match "${pastQuery}"` : 'No past events yet'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {pastGrouped.map((group) => (
                <div key={group.key} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <History className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</span>
                    <span className="text-xs text-muted-foreground/70">({group.items.length})</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {group.items.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-muted/60 hover:bg-muted transition-colors cursor-pointer group"
                        onClick={() => { setSelectedDate(parseLocalDateString(event.date)); setView('calendar') }}
                      >
                        <div
                          className="size-3 rounded-full shrink-0"
                          style={{ backgroundColor: event.color || EVENT_COLORS[0].value }}
                        />
                        <span className="flex-1 text-sm text-foreground font-medium truncate">{event.title}</span>
                        {event.isRecurring && <Repeat className="size-3 text-primary shrink-0" />}
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(parseLocalDateString(event.date), 'EEE, MMM d')}
                        </span>
                        <button
                          className="size-7 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event) }}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
