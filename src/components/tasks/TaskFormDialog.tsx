'use client'

import { useState } from 'react'
import { CalendarDays, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, addDays } from 'date-fns'
import type { Priority, Task } from '@/lib/store'
import { RecurrencePicker } from '@/components/recurrence/RecurrencePicker'
import { configToRRuleString, rruleStringToConfig, describeRecurrence, type RecurrenceConfig } from '@/lib/recurrence'

export interface TaskFormData {
  title: string
  dueDate: string | null
  priority: Priority
  rrule?: string | null
  dtstart?: string | null
}

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  task?: Task | null
  defaultDueDate?: string | null
  /** When editing a recurring series, hide the date/postpone fields. */
  lockDate?: boolean
  onSubmit: (data: TaskFormData) => void
}

const POSTPONE_OPTIONS = [
  { label: '+1 day', days: 1 },
  { label: '+3 days', days: 3 },
  { label: '+1 week', days: 7 },
  { label: '+1 month', days: 30 },
]

function toDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date()
  const d = new Date(dateStr + 'T12:00:00')
  return isNaN(d.getTime()) ? new Date() : d
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function TaskFormDialog({ open, onOpenChange, mode, task, defaultDueDate, lockDate, onSubmit }: TaskFormDialogProps) {
  // State is initialized from props and the parent remounts this component via
  // a `key` whenever the dialog target changes, so no effect is needed.
  const [title, setTitle] = useState(task?.title ?? '')
  const [dueDate, setDueDate] = useState<Date | undefined>(() => {
    if (mode === 'edit') {
      // For a recurring series the date field is hidden; base defaults on dtstart.
      if (task?.isRecurring && task?.dtstart) return toDate(task.dtstart)
      return task?.dueDate ? toDate(task.dueDate) : undefined
    }
    return defaultDueDate ? toDate(defaultDueDate) : new Date()
  })
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [recurrence, setRecurrence] = useState<RecurrenceConfig | null>(() =>
    task?.rrule ? rruleStringToConfig(task.rrule) : null,
  )

  const handleSubmit = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    const due = dueDate ? toDateStr(dueDate) : null
    let rrule: string | null = null
    let dtstart: string | null = null
    if (recurrence) {
      const start = due ?? toDateStr(new Date())
      rrule = configToRRuleString(recurrence, start)
      dtstart = start
    }
    onSubmit({ title: trimmed, dueDate: due, priority, rrule, dtstart })
    onOpenChange(false)
  }

  const applyPostpone = (days: number) => {
    const base = dueDate ?? new Date()
    setDueDate(addDays(base, days))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {mode === 'edit' ? 'Edit Task' : 'Add New Task'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-on-surface-variant">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="rounded-2xl bg-input border-border"
              autoFocus
            />
          </div>
          {!lockDate && (
            <div className="flex flex-col gap-2">
              <label className="text-sm text-on-surface-variant">Due Date</label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-2xl bg-input border-border justify-start text-left font-normal"
                  >
                    <CalendarDays className="mr-2 size-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border rounded-2xl">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date)
                      setCalendarOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm text-on-surface-variant">Repeat</label>
            <RecurrencePicker
              value={recurrence}
              onChange={setRecurrence}
              startDate={dueDate ?? new Date()}
            />
            {recurrence && (
              <p className="text-xs text-primary font-medium">{describeRecurrence(recurrence)}</p>
            )}
          </div>

          {mode === 'edit' && !lockDate && (
            <div className="flex flex-col gap-2">
              <label className="text-sm text-on-surface-variant flex items-center gap-1.5">
                <Clock className="size-3.5" /> Postpone
              </label>              <div className="flex flex-wrap gap-2">
                {POSTPONE_OPTIONS.map((opt) => (
                  <Badge
                    key={opt.days}
                    variant="outline"
                    className="rounded-xl px-3 py-1.5 cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                    onClick={() => applyPostpone(opt.days)}
                  >
                    {opt.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm text-on-surface-variant">Priority</label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger className="rounded-2xl bg-input border-border w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border rounded-2xl">
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" className="rounded-2xl">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {mode === 'edit' ? 'Save Changes' : 'Add Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
