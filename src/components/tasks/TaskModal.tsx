'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Icon from '@/components/ui/Icon'
import RecurrenceField from '@/components/ui/RecurrenceField'
import { useAppStore, type Priority, type Task } from '@/lib/store'
import { useUi } from '@/lib/ui'
import { notify } from '@/lib/toast'
import { addDays, parseDateStr, todayStr } from '@/lib/dates'
import { configToRRuleString, rruleStringToConfig, type RecurrenceConfig } from '@/lib/recurrence'

const POSTPONE = [
  { label: '+1 day', days: 1 },
  { label: '+3 days', days: 3 },
  { label: '+1 week', days: 7 },
  { label: '+1 month', days: 30 },
]

function TaskForm({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const addTask = useAppStore((s) => s.addTask)
  const updateTask = useAppStore((s) => s.updateTask)

  const editing = task !== null
  // A repeating series is edited by its start date, so the per-day date field stays hidden.
  const lockDate = Boolean(task?.isRecurring)
  const [title, setTitle] = useState(task?.title ?? '')
  const [due, setDue] = useState<string>(() => (lockDate ? task?.dtstart : task?.dueDate) ?? (editing ? '' : todayStr()))
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [recurrence, setRecurrence] = useState<RecurrenceConfig | null>(() => (task?.rrule ? rruleStringToConfig(task.rrule) : null))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    const dueDate = due || null
    const start = dueDate ?? todayStr()
    const data = {
      title: trimmed,
      dueDate,
      priority,
      rrule: recurrence ? configToRRuleString(recurrence, start) : null,
      dtstart: recurrence ? start : null,
    }
    if (editing && task) {
      updateTask(task.id, data)
      notify(task.isRecurring ? 'Series updated' : 'Task updated')
    } else {
      addTask({ ...data, status: 'pending' })
      notify('Task created')
    }
    onClose()
  }

  return (
    <form onSubmit={submit}>
      <div className="form-body">
        <label className="form-label">
          Task name
          <input autoFocus required maxLength={160} placeholder="What needs to get done?" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <div className="form-grid">
          <label className="form-label">
            Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          {lockDate ? (
            <div className="form-label">
              Starts
              <div className="static-field">{due ? parseDateStr(due).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
            </div>
          ) : (
            <label className="form-label">
              Due date
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </label>
          )}
        </div>

        <div className="form-label">
          Repeat
          <RecurrenceField value={recurrence} onChange={setRecurrence} startDate={parseDateStr(due || todayStr())} />
        </div>

        {editing && !lockDate && (
          <div className="form-label">
            Postpone
            <div className="chip-group">
              {POSTPONE.map((p) => (
                <button key={p.days} type="button" className="chip wide" onClick={() => setDue(addDays(due || todayStr(), p.days))}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="modal-footer">
        <span>{lockDate ? 'Editing the whole series' : 'Synced to your account'}</span>
        <div>
          <button type="button" className="button" onClick={onClose}>Cancel</button>
          <button className="button primary" type="submit" disabled={!title.trim()}>
            <Icon name={editing ? 'check' : 'plus'} size={15} />
            {editing ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </div>
    </form>
  )
}

export default function TaskModal() {
  const editor = useUi((s) => s.taskEditor)
  const setEditor = useUi((s) => s.setTaskEditor)
  if (!editor) return null
  const task = editor === 'new' ? null : editor
  return (
    <Modal title={task ? (task.isRecurring ? 'Edit repeating task' : 'Edit task') : 'Create a task'} onClose={() => setEditor(null)}>
      <TaskForm key={task?.id ?? 'new'} task={task} onClose={() => setEditor(null)} />
    </Modal>
  )
}
