'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Plus, Trash2, CalendarDays, Clock } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'

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

export default function CalendarPage() {
  const { events, addEvent, deleteEvent } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState<Date>(selectedDate)
  const [eventColor, setEventColor] = useState(EVENT_COLORS[0].value)
  const [calendarOpen, setCalendarOpen] = useState(false)

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

  // All events for selected month (for the mini month summary)
  const selectedMonthEvents = useMemo(() => {
    const monthPrefix = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`
    return events.filter((e) => e.date.startsWith(monthPrefix))
  }, [events, selectedDate])

  const handleAddEvent = () => {
    if (!eventTitle.trim()) return
    addEvent({
      title: eventTitle.trim(),
      date: toLocalDateString(eventDate),
      color: eventColor,
    })
    setEventTitle('')
    setEventColor(EVENT_COLORS[0].value)
    setDialogOpen(false)
  }

  const openAddDialog = useCallback(() => {
    setEventDate(selectedDate)
    setEventTitle('')
    setEventColor(EVENT_COLORS[0].value)
    setDialogOpen(true)
  }, [selectedDate])

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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90" onClick={openAddDialog}>
              <Plus className="size-4 mr-1.5" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Event</DialogTitle>
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
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground font-medium">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      className={`size-8 rounded-xl transition-all ${
                        eventColor === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-card scale-110' : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setEventColor(c.value)}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost" className="rounded-2xl">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleAddEvent}
                disabled={!eventTitle.trim()}
                className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Add Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar + Events Layout */}
      {!mounted ? (
        // Pre-mount skeleton to avoid hydration mismatch from Date-dependent rendering
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="rounded-3xl bg-card border border-border p-5 flex-1 min-h-[320px] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="rounded-3xl bg-card border border-border p-5 lg:w-80 min-h-[200px]" />
        </div>
      ) : (
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
                      className={`flex items-center justify-center w-full aspect-square rounded-full text-sm transition-all ${
                        isSelected
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
                {format(selectedDate, 'd')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {format(selectedDate, 'EEEE, MMMM yyyy')}
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

          {/* Events for selected date */}
          <ScrollArea className="flex-1 min-h-0 max-h-[40vh] lg:max-h-none">
            <div className="flex flex-col gap-2 pr-2">
              {eventsForSelectedDate.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="p-3 rounded-2xl bg-muted">
                    <CalendarDays className="size-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">No events</p>
                    <p className="text-xs text-outline mt-0.5">Tap + to add one</p>
                  </div>
                </div>
              ) : (
                eventsForSelectedDate.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-muted/80 group hover:bg-muted transition-colors"
                  >
                    <div
                      className="size-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: event.color || EVENT_COLORS[0].value }}
                    />
                    <span className="flex-1 text-sm text-foreground font-medium">{event.title}</span>
                    <button
                      className="size-7 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteEvent(event.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

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
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors"
                      onClick={() => setSelectedDate(new Date())}
                    >
                      <div
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: event.color || EVENT_COLORS[0].value }}
                      />
                      <span className="text-xs text-foreground truncate flex-1 min-w-0 font-medium">{event.title}</span>
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
                    <div
                      key={event.id}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedDate(parseLocalDateString(event.date))}
                    >
                      <div
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: event.color || EVENT_COLORS[0].value }}
                      />
                      <span className="text-xs text-foreground truncate flex-1 min-w-0">{event.title}</span>
                      <span className="text-[0.65rem] text-muted-foreground shrink-0">
                        {format(parseLocalDateString(event.date), 'MMM d')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      )}
    </div>
  )
}
