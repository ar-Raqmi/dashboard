'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckCircle2, Trash2, ListTodo, CalendarDays, AlertTriangle, Clock, Pencil, CalendarClock, Repeat } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { Priority, TaskStatus, Task } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog'

type FilterType = 'all' | 'pending' | 'completed'

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  high: { label: 'High', className: 'priority-high' },
  medium: { label: 'Medium', className: 'priority-medium' },
  low: { label: 'Low', className: 'priority-low' },
}

// ===== Categorize tasks into overdue / today / upcoming =====
function categorizeTasks(tasks: Task[]) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const overdue: Task[] = []
  const todayList: Task[] = []
  const upcoming: Task[] = []

  // Sort: pending first, then by dueDate ascending, then priority
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
  const sorted = [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'completed' ? 1 : -1
    if (a.dueDate && b.dueDate) {
      const cmp = a.dueDate.localeCompare(b.dueDate)
      if (cmp !== 0) return cmp
    } else if (a.dueDate) {
      return -1
    } else if (b.dueDate) {
      return 1
    }
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

  return { overdue, today: todayList, upcoming }
}

// ===== Task Card for full page =====
function TaskCard({ task, onToggle, onDelete, onEdit, onPostpone, isHighlighted }: {
  task: Task
  onToggle: (task: Task) => void
  onDelete: (task: Task) => void
  onEdit: (task: Task) => void
  onPostpone: (task: Task) => void
  isHighlighted?: boolean
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isHighlighted])

  const isCompleted = task.status === 'completed'
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const isOverdue = task.dueDate ? task.dueDate < todayStr && !isCompleted : false
  const isToday = task.dueDate === todayStr

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      className={`flex items-start gap-4 p-4 rounded-3xl border transition-all duration-500 group ${
        isHighlighted
          ? 'ring-2 ring-primary ring-offset-2 bg-primary/10 border-primary shadow-lg shadow-primary/20 scale-[1.02]'
          : isOverdue
            ? 'bg-destructive/5 border-destructive/20 hover:border-destructive/40'
            : isToday && !isCompleted
              ? 'bg-card border-primary/20 hover:border-primary/40'
              : 'bg-card border-border hover:border-outline'
      }`}
    >
      <div className="pt-0.5 shrink-0">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => onToggle(task)}
          className={`size-5 rounded-lg ${
            isOverdue
              ? 'data-[state=unchecked]:border-destructive data-[state=unchecked]:hover:border-destructive/80'
              : ''
          } data-[state=checked]:bg-primary data-[state=checked]:border-primary`}
        />
      </div>

      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <span
          className={`text-sm font-semibold leading-relaxed ${
            isCompleted
              ? 'line-through text-outline'
              : 'text-foreground'
          }`}
        >
          {task.title}
        </span>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Overdue indicator */}
          {isOverdue && (
            <Badge className="rounded-xl text-[0.6rem] bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 gap-1 px-2 py-0.5">
              <AlertTriangle className="size-2.5" />
              Overdue
            </Badge>
          )}
          {/* Today indicator */}
          {isToday && !isCompleted && !isOverdue && (
            <Badge className="rounded-xl text-[0.6rem] bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 gap-1 px-2 py-0.5">
              <Clock className="size-2.5" />
              Today
            </Badge>
          )}
          {task.dueDate && (
            <Badge
              variant="outline"
              className={`rounded-xl text-[0.65rem] px-2 py-0.5 ${
                isOverdue
                  ? 'border-destructive/30 text-destructive'
                  : isToday && !isCompleted
                    ? 'border-primary/30 text-primary'
                    : 'border-border text-on-surface-variant'
              }`}
            >
              {format(new Date(task.dueDate + 'T12:00:00'), 'MMM d')}
            </Badge>
          )}
          {task.isRecurring && (
            <Badge className="rounded-xl text-[0.6rem] bg-primary/10 text-primary border border-primary/20 gap-1 px-2 py-0.5">
              <Repeat className="size-2.5" />
              Repeats
            </Badge>
          )}
          <Badge
            variant="outline"
            className={`rounded-xl text-[0.65rem] px-2 py-0.5 border ${priorityConfig[task.priority].className}`}
          >
            {priorityConfig[task.priority].label}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10"
          title="Postpone 1 day"
          onClick={(e) => {
            e.stopPropagation()
            onPostpone(task)
          }}
        >
          <CalendarClock className="size-4" />
        </Button>
        {!task.isRecurring && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10"
            title="Edit task"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(task)
            }}
          >
            <Pencil className="size-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
          title={task.isRecurring ? 'Cancel this occurrence' : 'Delete task'}
          onClick={(e) => {
            e.stopPropagation()
            onDelete(task)
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// ===== Section Header =====
function SectionHeader({ label, icon, count, variant }: {
  label: string
  icon: React.ReactNode
  count: number
  variant: 'overdue' | 'today' | 'upcoming'
}) {
  const colorClass = variant === 'overdue'
    ? 'text-destructive'
    : variant === 'today'
      ? 'text-primary'
      : 'text-muted-foreground'

  return (
    <div className={`flex items-center gap-2 mb-2 ${colorClass}`}>
      {icon}
      <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      {count > 0 && (
        <span className={`text-[0.6rem] tabular-nums ${variant === 'overdue' ? 'text-destructive/70' : 'opacity-60'}`}>
          {count}
        </span>
      )}
    </div>
  )
}

export default function TasksPage() {
  const { tasks, addTask, updateTask, toggleTaskStatus, applyTaskOccurrenceOverride, deleteTask, deleteCompletedTasks, highlightedTaskId, setHighlightedTask } = useAppStore()
  const [filter, setFilter] = useState<FilterType>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)

  const todayStr = useMemo(() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  }, [])

  // Clear highlight after 3 seconds
  useEffect(() => {
    if (highlightedTaskId) {
      const timer = setTimeout(() => setHighlightedTask(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [highlightedTaskId, setHighlightedTask])

  // Filter tasks first
  const filteredTasks = useMemo(() => tasks.filter((task) => {
    if (filter === 'pending') return task.status === 'pending'
    if (filter === 'completed') return task.status === 'completed'
    return true
  }), [tasks, filter])

  // Then categorize
  const { overdue, today: todayTasks, upcoming } = useMemo(
    () => categorizeTasks(filteredTasks),
    [filteredTasks]
  )

  const openCreate = () => {
    setEditingTask(null)
    setDialogOpen(true)
  }

  const openEdit = (task: Task) => {
    setEditingTask(task)
    setDialogOpen(true)
  }

  const handleFormSubmit = (data: { title: string; dueDate: string | null; priority: Priority }) => {
    if (editingTask) {
      updateTask(editingTask.id, data)
    } else {
      addTask({ ...data, status: 'pending' })
    }
    setEditingTask(null)
  }

  const handleQuickPostpone = (task: Task) => {
    const base = task.dueDate ? new Date(task.dueDate + 'T12:00:00') : new Date()
    const next = new Date(base)
    next.setDate(base.getDate() + 1)
    const nextStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
    if (task.isRecurring && task.recurrenceTemplateId && task.occurrenceDate) {
      applyTaskOccurrenceOverride(task.recurrenceTemplateId, task.occurrenceDate, { newDate: nextStr })
    } else {
      updateTask(task.id, { dueDate: nextStr })
    }
  }

  const handleToggle = (task: Task) => {
    if (task.isRecurring && task.recurrenceTemplateId && task.occurrenceDate) {
      applyTaskOccurrenceOverride(task.recurrenceTemplateId, task.occurrenceDate, {
        status: task.status === 'completed' ? 'pending' : 'completed',
      })
    } else {
      toggleTaskStatus(task.id)
    }
  }

  const handleDelete = (task: Task) => {
    if (task.isRecurring && task.recurrenceTemplateId && task.occurrenceDate) {
      applyTaskOccurrenceOverride(task.recurrenceTemplateId, task.occurrenceDate, { cancelled: true })
    } else {
      setDeleteTaskId(task.id)
    }
  }

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) setEditingTask(null)
  }

  const confirmDelete = () => {
    if (deleteTaskId) {
        deleteTask(deleteTaskId)
        setDeleteTaskId(null)
    }
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
          {overdue.length > 0 && (
            <Badge className="rounded-xl text-[0.6rem] bg-destructive/10 text-destructive border-destructive/20">
              {overdue.length} overdue
            </Badge>
          )}
        </div>

        <Button
          onClick={openCreate}
          className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4 mr-1" />
          Add Task
        </Button>
      </motion.div>

      {/* Create / Edit Task Dialog (shared component) */}
      <TaskFormDialog
        key={dialogOpen ? (editingTask?.id ?? 'create') : 'closed'}
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        mode={editingTask ? 'edit' : 'create'}
        task={editingTask}
        defaultDueDate={todayStr}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTaskId} onOpenChange={(open) => !open && setDeleteTaskId(null)}>
        <DialogContent className="bg-card border-border rounded-3xl sm:max-w-sm">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="size-5" />
                    Delete Task
                </DialogTitle>
                <DialogDescription className="text-muted-foreground pt-2">
                    Are you sure you want to delete this task? This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose asChild><Button variant="ghost" className="rounded-2xl">Cancel</Button></DialogClose>
                <Button onClick={confirmDelete} className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Task</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2"
      >
        <div className="flex gap-2">
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
        </div>
        {filterCounts.completed > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={deleteCompletedTasks}
            className="rounded-2xl ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5 mr-1" />
            Clear completed
          </Button>
        )}
      </motion.div>

      {/* Task List — Sectioned */}
      <div className="flex flex-col gap-6">
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
            <>
              {/* Overdue Section */}
              {overdue.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl bg-destructive/5 border border-destructive/15 p-4"
                >
                  <SectionHeader
                    label="Overdue"
                    icon={<AlertTriangle className="size-3.5" />}
                    count={overdue.length}
                    variant="overdue"
                  />
                  <div className="flex flex-col gap-2">
                    {overdue.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        onEdit={openEdit}
                        onPostpone={handleQuickPostpone}
                        isHighlighted={highlightedTaskId === task.id}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Today Section */}
              {todayTasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="rounded-3xl bg-primary/5 border border-primary/15 p-4"
                >
                  <SectionHeader
                    label="Today"
                    icon={<div className="size-2 rounded-full bg-primary animate-pulse" />}
                    count={todayTasks.length}
                    variant="today"
                  />
                  <div className="flex flex-col gap-2">
                    {todayTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        onEdit={openEdit}
                        onPostpone={handleQuickPostpone}
                        isHighlighted={highlightedTaskId === task.id}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Upcoming Section */}
              {upcoming.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-3xl bg-muted/30 border border-border/50 p-4"
                >
                  <SectionHeader
                    label="Upcoming"
                    icon={<CalendarDays className="size-3.5" />}
                    count={upcoming.length}
                    variant="upcoming"
                  />
                  <div className="flex flex-col gap-2">
                    {upcoming.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onToggle={handleToggle}
                          onDelete={handleDelete}
                          onEdit={openEdit}
                          onPostpone={handleQuickPostpone}
                          isHighlighted={highlightedTaskId === task.id}
                        />
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
