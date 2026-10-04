'use client'

import Icon from '@/components/ui/Icon'
import PriorityMark from '@/components/ui/PriorityMark'
import { useAppStore, type Priority, type Task } from '@/lib/store'
import { useUi } from '@/lib/ui'
import { deleteTaskFlow, postponeTask, toggleTask } from '@/lib/task-actions'
import { describeRecurrence, rruleStringToConfig } from '@/lib/recurrence'
import { dueLabel, relativeTime, todayStr } from '@/lib/dates'
import { notify } from '@/lib/toast'

/** Right-rail inspector for the selected task. Only fields that exist in the database appear. */
export default function TaskDetail({ task }: { task: Task }) {
  const selectTask = useUi((s) => s.selectTask)
  const setTaskEditor = useUi((s) => s.setTaskEditor)
  const updateTask = useAppStore((s) => s.updateTask)
  const applyOverride = useAppStore((s) => s.applyTaskOccurrenceOverride)

  const done = task.status === 'completed'
  const recurring = Boolean(task.isRecurring)
  const repeatConfig = task.rrule ? rruleStringToConfig(task.rrule) : null
  const repeats = repeatConfig ? describeRecurrence(repeatConfig) : null
  const overdue = !done && task.dueDate !== null && task.dueDate < todayStr()

  const setPriority = (priority: Priority) => {
    if (recurring && task.recurrenceTemplateId && task.occurrenceDate) {
      // Priority belongs to the series; the occurrence override only carries status/date.
      updateTask(task.recurrenceTemplateId, { priority })
    } else {
      updateTask(task.id, { priority })
    }
  }

  const setDue = (value: string) => {
    if (!value) return
    if (recurring && task.recurrenceTemplateId && task.occurrenceDate) {
      applyOverride(task.recurrenceTemplateId, task.occurrenceDate, { newDate: value })
    } else {
      updateTask(task.id, { dueDate: value })
    }
    notify(`Moved to ${dueLabel(value)}`)
  }

  const remove = async () => {
    if (await deleteTaskFlow(task)) selectTask(null)
  }

  return (
    <section className="task-detail">
      <div className="detail-overline">
        <span>{recurring ? 'REPEATING TASK' : 'TASK'}</span>
        <button className="icon-button compact" onClick={() => selectTask(null)} title="Close task details" aria-label="Close task details">
          <Icon name="close" size={16} />
        </button>
      </div>
      <h2 className={done ? 'is-done' : ''}>{task.title}</h2>

      <button className={`button detail-complete ${done ? 'completed' : ''}`} onClick={() => toggleTask(task)}>
        <Icon name="check" size={15} />
        {done ? 'Completed' : 'Mark complete'}
      </button>

      <div className="detail-fields">
        <label>
          <span>Status</span>
          <div className="static-field">{overdue ? 'Overdue' : done ? 'Completed' : 'Pending'}</div>
        </label>
        <label>
          <span>Priority</span>
          <select value={task.priority} onChange={(e) => setPriority(e.target.value as Priority)} aria-label="Task priority">
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label>
          <span>{recurring ? 'This occurrence' : 'Due date'}</span>
          <input type="date" aria-label="Task due date" value={task.dueDate ?? ''} onChange={(e) => setDue(e.target.value)} />
        </label>
        <label>
          <span>Repeats</span>
          <div className="static-field">{repeats ?? 'Does not repeat'}</div>
        </label>
      </div>

      <div className="detail-actions">
        <button className="small-button" onClick={() => postponeTask(task, 1)} disabled={done}>
          <Icon name="right" size={13} />Postpone 1 day
        </button>
        <button className="small-button" onClick={() => setTaskEditor(task)}>
          <Icon name="pen" size={13} />{recurring ? 'Edit series' : 'Edit'}
        </button>
      </div>

      <div className="detail-activity">
        <h3>Activity</h3>
        <div>
          <span className="avatar mini-avatar"><Icon name="plus" size={11} /></span>
          <p>
            Created {relativeTime(task.createdAt)}
            <small>{done ? 'Marked complete' : task.dueDate ? `Due ${dueLabel(task.dueDate)}` : 'No due date'} · <PriorityMark priority={task.priority} /></small>
          </p>
        </div>
      </div>

      <button className="text-button danger-button" onClick={remove}>
        <Icon name="trash" size={14} />{recurring ? 'Delete…' : 'Delete task'}
      </button>
    </section>
  )
}
