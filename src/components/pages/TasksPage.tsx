'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckCircle2, Trash2, ListTodo, CalendarDays } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { Priority, TaskStatus } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'

type FilterType = 'all' | 'pending' | 'completed'

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  high: { label: 'High', className: 'priority-high' },
  medium: { label: 'Medium', className: 'priority-medium' },
  low: { label: 'Low', className: 'priority-low' },
}

export default function TasksPage() {
  const { tasks, addTask, toggleTaskStatus, deleteTask } = useAppStore()
  const [filter, setFilter] = useState<FilterType>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [priority, setPriority] = useState<Priority>('medium')
  const [calendarOpen, setCalendarOpen] = useState(false)

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'pending') return task.status === 'pending'
    if (filter === 'completed') return task.status === 'completed'
    return true
  })

  const handleAddTask = () => {
    if (!title.trim()) return
    addTask({
      title: title.trim(),
      dueDate: dueDate ? dueDate.toISOString().split('T')[0] : null,
      priority,
      status: 'pending',
    })
    setTitle('')
    setDueDate(undefined)
    setPriority('medium')
    setDialogOpen(false)
  }

  const filterCounts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
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
          <div className="p-2 rounded-2xl bg-primary/15">
            <ListTodo className="size-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Daily Tasks</h1>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="size-4 mr-1" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Task</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-on-surface-variant">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title..."
                  className="rounded-2xl bg-input border-border"
                />
              </div>
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
                onClick={handleAddTask}
                className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Add Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2"
      >
        {(['all', 'pending', 'completed'] as FilterType[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter(f)}
            className={`rounded-2xl capitalize ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'text-on-surface-variant'
            }`}
          >
            {f} ({filterCounts[f]})
          </Button>
        ))}
      </motion.div>

      {/* Task List */}
      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 gap-4"
            >
              <div className="p-4 rounded-3xl bg-muted">
                <CheckCircle2 className="size-12 text-on-surface-variant" />
              </div>
              <p className="text-muted-foreground text-center">
                {filter === 'all'
                  ? 'No tasks yet. Add your first task!'
                  : filter === 'pending'
                  ? 'All tasks completed! 🎉'
                  : 'No completed tasks yet.'}
              </p>
            </motion.div>
          ) : (
            filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="flex items-center gap-3 p-4 rounded-3xl bg-card border border-border hover:border-outline transition-colors group"
              >
                <Checkbox
                  checked={task.status === 'completed'}
                  onCheckedChange={() => toggleTaskStatus(task.id)}
                  className="size-5 rounded-lg data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span
                  className={`flex-1 text-sm ${
                    task.status === 'completed'
                      ? 'line-through text-outline'
                      : 'text-foreground'
                  }`}
                >
                  {task.title}
                </span>
                <div className="flex items-center gap-2">
                  {task.dueDate && (
                    <Badge
                      variant="outline"
                      className="rounded-xl text-[0.65rem] border-border text-on-surface-variant"
                    >
                      {format(new Date(task.dueDate), 'MMM d')}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={`rounded-xl text-[0.65rem] border ${priorityConfig[task.priority].className}`}
                  >
                    {priorityConfig[task.priority].label}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteTask(task.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
