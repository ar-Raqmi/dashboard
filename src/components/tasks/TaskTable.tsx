'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '@/components/ui/Icon'
import PriorityMark from '@/components/ui/PriorityMark'
import { useAppStore, type Priority, type Task } from '@/lib/store'
import { useUi, confirmAction } from '@/lib/ui'
import { PRIORITY_ORDER, repeatLabel, taskBuckets, tasksForTab, toggleTask, type TaskTab } from '@/lib/task-actions'
import { downloadFile } from '@/lib/clipboard'
import { dueLabel, todayStr } from '@/lib/dates'
import { notify } from '@/lib/toast'

type SortKey = 'title' | 'repeats' | 'due' | 'priority'
type PriorityFilter = 'all' | Priority

const TABS: { id: TaskTab; label: string }[] = [
  { id: 'open', label: 'All tasks' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'repeating', label: 'Repeating' },
  { id: 'completed', label: 'Completed' },
]

const csvCell = (value: string) => `"${(/^[=+@\-\t\r]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`

function compare(a: Task, b: Task, key: SortKey): number {
  switch (key) {
    case 'title': return a.title.localeCompare(b.title)
    case 'repeats': return (repeatLabel(a) ?? '~').localeCompare(repeatLabel(b) ?? '~')
    case 'priority': return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    case 'due': return (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31')
  }
}

interface TaskTableProps {
  /** Compact Overview variant: first rows only, with a "View all" link. */
  full?: boolean
  onViewAll?: () => void
}

export default function TaskTable({ full = false, onViewAll }: TaskTableProps) {
  const tasks = useAppStore((s) => s.tasks)
  const deleteCompletedTasks = useAppStore((s) => s.deleteCompletedTasks)
  const selectedId = useUi((s) => s.selectedTaskId)
  const selectTask = useUi((s) => s.selectTask)
  const setTaskEditor = useUi((s) => s.setTaskEditor)
  const highlightedTaskId = useAppStore((s) => s.highlightedTaskId)
  const setHighlightedTask = useAppStore((s) => s.setHighlightedTask)

  const [tab, setTab] = useState<TaskTab>('open')
  const [priority, setPriority] = useState<PriorityFilter>('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'due', desc: false })
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!filterRef.current?.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  // Arriving from search/notifications: show the task regardless of the active tab.
  useEffect(() => {
    if (!highlightedTaskId) return
    selectTask(highlightedTaskId)
    setTab('open')
    setHighlightedTask(null)
  }, [highlightedTaskId, selectTask, setHighlightedTask])

  const today = todayStr()
  const buckets = useMemo(() => taskBuckets(tasks, today), [tasks, today])
  const counts: Record<TaskTab, number> = {
    open: buckets.open.length,
    today: buckets.overdue.length + buckets.dueToday.length,
    upcoming: tasksForTab(tasks, 'upcoming', today).length,
    repeating: buckets.repeating.length,
    completed: buckets.completed.length,
  }

  const sorted = useMemo(() => {
    const list = tasksForTab(tasks, tab, today).filter((t) => priority === 'all' || t.priority === priority)
    return [...list].sort((a, b) => (sort.desc ? -1 : 1) * compare(a, b, sort.key))
  }, [tasks, tab, priority, sort, today])
  const visible = full ? sorted : sorted.slice(0, 6)

  const changeSort = (key: SortKey) => setSort({ key, desc: sort.key === key ? !sort.desc : false })

  const completeVisible = () => {
    const open = visible.filter((t) => t.status !== 'completed')
    open.forEach(toggleTask)
    if (open.length) notify(`${open.length} ${open.length === 1 ? 'task' : 'tasks'} marked complete`)
  }

  const clearCompleted = async () => {
    const ok = await confirmAction({
      title: 'Clear completed tasks?',
      body: `${buckets.completed.length} completed ${buckets.completed.length === 1 ? 'task' : 'tasks'} will be removed permanently.`,
      confirmLabel: 'Clear completed',
      danger: true,
    })
    if (!ok) return
    deleteCompletedTasks()
    notify('Completed tasks cleared')
  }

  const exportCsv = () => {
    const rows = sorted.map((t) => [t.title, repeatLabel(t) ?? '', t.dueDate ?? '', t.priority, t.status].map(csvCell).join(','))
    downloadFile(['Task,Repeats,Due date,Priority,Status', ...rows].join('\n'), 'tasks.csv', 'text/csv')
    notify('Task export downloaded')
  }

  const columns: [SortKey, string][] = [['title', 'Task'], ['repeats', 'Repeats'], ['due', 'Due date'], ['priority', 'Priority']]

  return (
    <section className={`task-section ${full ? 'full-table' : ''}`} aria-label="Your tasks">
      <div className="section-heading">
        <div className="heading-with-count">
          <h2>Your tasks</h2>
          <span className="count-label">{counts.open}</span>
          {buckets.overdue.length > 0 && <span className="overdue-count"><span className="tiny-dot" />{buckets.overdue.length} overdue</span>}
        </div>
        <div className="section-actions">
          <div className="popover-anchor" ref={filterRef}>
            <button className={`small-button ${priority !== 'all' ? 'is-filtered' : ''}`} onClick={() => setFilterOpen(!filterOpen)} aria-expanded={filterOpen}>
              <Icon name="filter" size={15} />Filter{priority !== 'all' && <span className="filter-number">1</span>}
            </button>
            {filterOpen && (
              <div className="popover filter-menu">
                <span className="menu-label">PRIORITY</span>
                {(['all', 'high', 'medium', 'low'] as const).map((p) => (
                  <button key={p} className={p === priority ? 'selected' : ''} onClick={() => { setPriority(p); setFilterOpen(false) }}>
                    {p === 'all' ? 'All priorities' : p[0].toUpperCase() + p.slice(1)}
                    {p === priority && <Icon name="check" size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="icon-button compact" title="Add a task" aria-label="Add a task" onClick={() => setTaskEditor('new')}><Icon name="plus" size={17} /></button>
        </div>
      </div>

      <div className="task-tabs" role="tablist" aria-label="Task state">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}<span>{counts[t.id]}</span>
          </button>
        ))}
      </div>

      <div className="table-scroll">
        <table className="task-table">
          <thead>
            <tr>
              <th className="check-column">
                <button className="table-check" aria-label="Complete all visible tasks" title="Complete all visible tasks" onClick={completeVisible}><span /></button>
              </th>
              {columns.map(([key, label]) => (
                <th key={key} aria-sort={sort.key === key ? (sort.desc ? 'descending' : 'ascending') : 'none'}>
                  <button onClick={() => changeSort(key)}>
                    {label}
                    {sort.key === key ? <Icon name="down" size={11} className={sort.desc ? 'rotate' : ''} /> : <Icon name="sort" size={11} className="sort-hint" />}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((task) => {
              const done = task.status === 'completed'
              const overdue = !done && task.dueDate !== null && task.dueDate < today
              const repeats = repeatLabel(task)
              return (
                <tr key={task.id} className={`${selectedId === task.id ? 'selected-row' : ''} ${done ? 'completed-row' : ''}`} onClick={() => selectTask(task.id)}>
                  <td className="check-column">
                    <button
                      className={`task-checkbox ${done ? 'checked' : ''}`}
                      title={done ? 'Mark incomplete' : 'Mark complete'}
                      aria-label={`${done ? 'Reopen' : 'Complete'} ${task.title}`}
                      aria-pressed={done}
                      onClick={(e) => { e.stopPropagation(); toggleTask(task) }}
                    >
                      {done && <Icon name="check" size={11} />}
                    </button>
                  </td>
                  <td className="task-name">
                    <button onClick={(e) => { e.stopPropagation(); selectTask(task.id) }} title={task.title}>{task.title}</button>
                  </td>
                  <td>
                    {repeats ? <span className="repeat-chip"><Icon name="repeat" size={12} />{repeats}</span> : <span className="muted-cell">—</span>}
                  </td>
                  <td>
                    <span className={`due-date ${overdue ? 'overdue' : ''} ${task.dueDate === today ? 'due-today' : ''}`} title={task.dueDate ? `Due ${task.dueDate}` : 'No due date'}>
                      {dueLabel(task.dueDate, today)}
                    </span>
                  </td>
                  <td><PriorityMark priority={task.priority} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {visible.length === 0 && (
        <div className="empty-state compact-empty">
          <Icon name="tasks" size={26} />
          <h3>{tab === 'completed' ? 'A fresh start' : 'All clear here'}</h3>
          <p>{tab === 'completed' ? 'Complete a task to see it here.' : 'No tasks match this view.'}</p>
          {priority !== 'all' && <button className="text-button" onClick={() => setPriority('all')}>Clear filter</button>}
        </div>
      )}

      <div className="table-footer">
        <span>{visible.length ? `${visible.length} of ${sorted.length} tasks` : 'No tasks'}</span>
        {!full ? (
          <button className="text-button" onClick={onViewAll}>View all tasks<Icon name="arrow" size={13} /></button>
        ) : (
          <span className="footer-actions">
            {tab === 'completed' && buckets.completed.length > 0 && (
              <button className="text-button danger-button" onClick={clearCompleted}><Icon name="trash" size={13} />Clear completed</button>
            )}
            <button className="text-button" onClick={exportCsv} disabled={!sorted.length}><Icon name="download" size={13} />Export CSV</button>
          </span>
        )}
      </div>
    </section>
  )
}
