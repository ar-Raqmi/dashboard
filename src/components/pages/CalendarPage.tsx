'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, CalendarDays, X } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { format, isSameDay, parseISO } from 'date-fns'

const EVENT_COLORS = [
  '#A5D6A7',
  '#F48FB1',
  '#CE93D8',
  '#80CBC4',
  '#FFD54F',
  '#FF8A65',
  '#90CAF9',
  '#B0BEC5',
]

export default function CalendarPage() {
  const { events, addEvent, deleteEvent } = useAppStore()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState<Date>(selectedDate)
  const [eventColor, setEventColor] = useState(EVENT_COLORS[0])
  const [calendarOpen, setCalendarOpen] = useState(false)

  const eventsForSelectedDate = useMemo(
    () =>
      events.filter((e) => isSameDay(parseISO(e.date), selectedDate)),
    [events, selectedDate]
  )

  // Group events by date for dot indicators
  const eventDateMap = useMemo(() => {
    const map = new Map<string, Set<string>>()
    events.forEach((e) => {
      if (!map.has(e.date)) map.set(e.date, new Set())
      map.get(e.date)!.add(e.color || EVENT_COLORS[0])
    })
    return map
  }, [events])

  const handleAddEvent = () => {
    if (!eventTitle.trim()) return
    addEvent({
      title: eventTitle.trim(),
      date: eventDate.toISOString().split('T')[0],
      color: eventColor,
    })
    setEventTitle('')
    setEventColor(EVENT_COLORS[0])
    setDialogOpen(false)
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-[oklch(0.72_0.19_142_/_0.15)]">
            <CalendarDays className="size-6 text-[oklch(0.72_0.19_142)]" />
          </div>
          <h1 className="text-2xl font-bold">Calendar</h1>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl bg-[oklch(0.72_0.19_142)] text-[oklch(0.13_0.005_155)] hover:bg-[oklch(0.65_0.19_142)]">
              <Plus className="size-4 mr-1" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[oklch(0.17_0.008_155)] border-[oklch(0.28_0.01_155)] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-[oklch(0.96_0.005_155)]">Add New Event</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-[oklch(0.75_0.01_155)]">Title</label>
                <Input
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Enter event title..."
                  className="rounded-2xl bg-[oklch(0.24_0.01_155)] border-[oklch(0.28_0.01_155)]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-[oklch(0.75_0.01_155)]">Date</label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-2xl bg-[oklch(0.24_0.01_155)] border-[oklch(0.28_0.01_155)] justify-start text-left font-normal"
                    >
                      <CalendarDays className="mr-2 size-4" />
                      {eventDate ? format(eventDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[oklch(0.17_0.008_155)] border-[oklch(0.28_0.01_155)] rounded-2xl">
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
                <label className="text-sm text-[oklch(0.75_0.01_155)]">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {EVENT_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`size-8 rounded-xl transition-all ${
                        eventColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[oklch(0.17_0.008_155)] scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setEventColor(color)}
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
                className="rounded-2xl bg-[oklch(0.72_0.19_142)] text-[oklch(0.13_0.005_155)] hover:bg-[oklch(0.65_0.19_142)]"
              >
                Add Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Calendar + Events Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl bg-[oklch(0.17_0.008_155)] border border-[oklch(0.28_0.01_155)] p-4 flex-1"
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => { if (date) handleDayClick(date) }}
            className="w-full"
            modifiers={{
              hasEvents: (date) => eventDateMap.has(format(date, 'yyyy-MM-dd')),
            }}
            modifiersStyles={{
              hasEvents: { fontWeight: 'bold' },
            }}
            components={{
              DayButton: ({ day, modifiers, ...props }) => {
                const dateStr = format(day.date, 'yyyy-MM-dd')
                const colors = eventDateMap.get(dateStr)
                return (
                  <div className="flex flex-col items-center gap-0.5 w-full">
                    <button
                      {...props}
                      className={`flex items-center justify-center size-8 rounded-lg text-sm transition-colors ${
                        modifiers.selected
                          ? 'bg-[oklch(0.72_0.19_142)] text-[oklch(0.13_0.005_155)]'
                          : modifiers.today
                          ? 'bg-[oklch(0.22_0.02_142)] text-[oklch(0.72_0.19_142)]'
                          : 'hover:bg-[oklch(0.22_0.008_155)] text-[oklch(0.96_0.005_155)]'
                      } ${modifiers.outside ? 'text-[oklch(0.5_0.01_155)]' : ''}`}
                      onClick={(e) => {
                        props.onClick?.(e)
                        handleDayClick(day.date)
                      }}
                    >
                      {day.date.getDate()}
                    </button>
                    {colors && colors.size > 0 && (
                      <div className="flex gap-0.5">
                        {Array.from(colors).slice(0, 3).map((c, i) => (
                          <div
                            key={i}
                            className="size-1.5 rounded-full"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              },
            }}
          />
        </motion.div>

        {/* Events Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl bg-[oklch(0.17_0.008_155)] border border-[oklch(0.28_0.01_155)] p-4 lg:w-80 flex flex-col gap-3"
        >
          <h2 className="text-lg font-semibold text-[oklch(0.96_0.005_155)]">
            {format(selectedDate, 'MMMM d, yyyy')}
          </h2>

          <AnimatePresence mode="popLayout">
            {eventsForSelectedDate.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-8 gap-2"
              >
                <CalendarDays className="size-8 text-[oklch(0.5_0.01_155)]" />
                <p className="text-sm text-[oklch(0.65_0.01_155)]">No events for this day</p>
              </motion.div>
            ) : (
              eventsForSelectedDate.map((event) => (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-[oklch(0.22_0.008_155)] group"
                >
                  <div
                    className="size-3 rounded-full shrink-0"
                    style={{ backgroundColor: event.color || EVENT_COLORS[0] }}
                  />
                  <span className="flex-1 text-sm text-[oklch(0.96_0.005_155)]">{event.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-[oklch(0.65_0.2_25)] hover:text-[oklch(0.7_0.2_25)] hover:bg-[oklch(0.65_0.2_25_/_0.1)]"
                    onClick={() => deleteEvent(event.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
