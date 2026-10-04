import { useAppStore, type Task } from '@/lib/store'
import { addDays, todayStr } from '@/lib/dates'
import { askRecurringDelete, confirmAction } from '@/lib/ui'
import { notify } from '@/lib/toast'
import { describeRecurrence, rruleStringToConfig } from '@/lib/recurrence'

const isOccurrence = (t: Task): t is Task & { recurrenceTemplateId: string; occurrenceDate: string } =>
  Boolean(t.isRecurring && t.recurrenceTemplateId && t.occurrenceDate)

/** Complete/reopen. Recurring rows are per-occurrence exceptions; plain rows toggle in place. */
export function toggleTask(task: Task) {
  const { applyTaskOccurrenceOverride, toggleTaskStatus } = useAppStore.getState()
  if (isOccurrence(task)) {
    applyTaskOccurrenceOverride(task.recurrenceTemplateId, task.occurrenceDate, {
      status: task.status === 'completed' ? 'pending' : 'completed',
    })
  } else {
    toggleTaskStatus(task.id)
  }
}

/** Move the due date forward. For a repeating task only this occurrence moves. */
export function postponeTask(task: Task, days = 1) {
  const { applyTaskOccurrenceOverride, updateTask } = useAppStore.getState()
  const next = addDays(task.dueDate ?? todayStr(), days)
  if (isOccurrence(task)) {
    applyTaskOccurrenceOverride(task.recurrenceTemplateId, task.occurrenceDate, { newDate: next })
  } else {
    updateTask(task.id, { dueDate: next })
  }
  notify(`Moved to ${next}`)
}

/** Delete with the right confirmation: this-day-or-series for repeats, a plain confirm otherwise. */
export async function deleteTaskFlow(task: Task): Promise<boolean> {
  const { applyTaskOccurrenceOverride, deleteTask } = useAppStore.getState()
  if (isOccurrence(task)) {
    const scope = await askRecurringDelete('task', task.occurrenceDate)
    if (!scope) return false
    if (scope === 'this') applyTaskOccurrenceOverride(task.recurrenceTemplateId, task.occurrenceDate, { cancelled: true })
    else deleteTask(task.recurrenceTemplateId)
    notify(scope === 'this' ? 'Occurrence removed' : 'Series deleted')
    return true
  }
  const ok = await confirmAction({
    title: 'Delete this task?',
    body: `“${task.title}” will be removed. This cannot be undone.`,
    confirmLabel: 'Delete task',
    danger: true,
  })
  if (!ok) return false
  deleteTask(task.id)
  notify('Task deleted')
  return true
}

export const PRIORITY_ORDER: Record<Task['priority'], number> = { high: 0, medium: 1, low: 2 }
export const PRIORITY_LABEL: Record<Task['priority'], string> = { high: 'High', medium: 'Medium', low: 'Low' }

export type TaskTab = 'open' | 'today' | 'upcoming' | 'repeating' | 'completed'

/** Partition used by every task surface so counts always agree. */
export function taskBuckets(tasks: Task[], today = todayStr()) {
  const open = tasks.filter((t) => t.status !== 'completed')
  const overdue = open.filter((t) => t.dueDate && t.dueDate < today)
  const dueToday = open.filter((t) => t.dueDate === today)
  const upcoming = open.filter((t) => !t.dueDate || t.dueDate > today)
  return {
    open,
    overdue,
    dueToday,
    upcoming,
    repeating: tasks.filter((t) => t.isRecurring),
    completed: tasks.filter((t) => t.status === 'completed'),
  }
}

export function tasksForTab(tasks: Task[], tab: TaskTab, today = todayStr()): Task[] {
  const b = taskBuckets(tasks, today)
  switch (tab) {
    case 'open': return b.open
    // Overdue work stays visible under Today so nothing silently disappears.
    case 'today': return [...b.overdue, ...b.dueToday]
    // Future repeats live under "Repeating" to keep Upcoming readable.
    case 'upcoming': return b.upcoming.filter((t) => !t.isRecurring)
    case 'repeating': return b.repeating
    case 'completed': return b.completed
  }
}

/** Human text for a repeating task's rule ("Every Monday"), or null when it does not repeat. */
export function repeatLabel(task: Task): string | null {
  const config = task.rrule ? rruleStringToConfig(task.rrule) : null
  return config ? describeRecurrence(config) : null
}
