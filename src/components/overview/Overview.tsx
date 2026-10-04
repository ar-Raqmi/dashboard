'use client'

import { useMemo } from 'react'
import Icon from '@/components/ui/Icon'
import TaskTable from '@/components/tasks/TaskTable'
import ClipboardCard from '@/components/overview/ClipboardCard'
import RecentFiles from '@/components/overview/RecentFiles'
import { useNavigate } from '@/hooks/useNavigate'
import { useAppStore } from '@/lib/store'
import { useUi } from '@/lib/ui'

export default function Overview() {
  const navigate = useNavigate()
  const tasks = useAppStore((s) => s.tasks)
  const goals = useAppStore((s) => s.goals)
  const notes = useAppStore((s) => s.notes)
  const setNoteEditor = useUi((s) => s.setNoteEditor)

  const openCount = useMemo(() => tasks.filter((t) => t.status !== 'completed').length, [tasks])
  const completedCount = useMemo(() => tasks.filter((t) => t.status === 'completed').length, [tasks])
  const goalProgress = useMemo(() => {
    if (!goals.length) return 0
    return Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
  }, [goals])

  const topGoals = useMemo(
    () => [...goals].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).slice(0, 4),
    [goals],
  )

  const pinned = useMemo(() => notes.filter((n) => n.pinned).slice(0, 3), [notes])

  return (
    <>
      <section className="metrics-row" aria-label="Key metrics">
        <div className="metric primary-metric">
          <div className="metric-label">
            Open tasks
            <Icon name="tasks" size={14} />
          </div>
          <div className="metric-number">
            {openCount}
            <span>/ {openCount + completedCount}</span>
          </div>
          <div className="metric-change">
            {openCount === 0 ? (
              <>
                <span className="tiny-dot" />
                <strong>All done</strong>
              </>
            ) : (
              <>
                <Icon name="check" size={12} />
                <strong>{completedCount}</strong>
                <span>completed</span>
              </>
            )}
          </div>
        </div>

        <div className="metric">
          <div className="metric-label">
            Completed
            <Icon name="check" size={14} />
          </div>
          <div className="metric-number">
            {completedCount}
          </div>
          <div className="metric-change neutral-change">
            <span className="tiny-dot" />
            <strong>{tasks.length}</strong>
            <span>total tasks</span>
          </div>
        </div>

        <div className="metric">
          <div className="metric-label">
            Goal progress
            <Icon name="flag" size={14} />
          </div>
          <div className="metric-number">
            {goalProgress}
            <span className="percentage-symbol">%</span>
          </div>
          <div className="metric-change neutral-change">
            <span className="tiny-dot" />
            <strong>{goals.length}</strong>
            <span>{goals.length === 1 ? 'goal' : 'goals'}</span>
          </div>
        </div>
      </section>

      <TaskTable onViewAll={() => navigate('tasks')} />

      <div className="bottom-split">
        <section className="goals-summary">
          <div className="section-heading">
            <h2>Goals in motion</h2>
            <button className="icon-button compact" title="View goals" aria-label="View goals" onClick={() => navigate('goals')}>
              <Icon name="upRight" size={15} />
            </button>
          </div>
          {topGoals.length === 0 && <p className="muted-note">Set your first goal from the Goals page.</p>}
          {topGoals.map((goal, i) => (
            <button
              className="goal-summary-item"
              key={goal.id}
              onClick={() => navigate('goals')}
              title={`${Math.round(goal.progress)}% complete`}
            >
              <span>
                <strong>
                  <i style={{ background: ['var(--aqua)', 'var(--blue)', 'var(--purple)', 'var(--orange)'][i % 4] }} />
                  {goal.title}
                </strong>
                <small>{Math.round(goal.progress)}%</small>
              </span>
              <span className="goal-progress-track">
                <span style={{ width: `${goal.progress}%` }} />
              </span>
            </button>
          ))}
        </section>

        <section className="pinned-notes">
          <div className="section-heading">
            <h2>Pinned notes</h2>
            <button className="icon-button compact" title="View all notes" aria-label="View all notes" onClick={() => navigate('notes')}>
              <Icon name="upRight" size={15} />
            </button>
          </div>
          {pinned.length === 0 && <p className="muted-note">Pin a note to keep it close.</p>}
          {pinned.map((note) => (
            <button
              key={note.id}
              className="pinned-note"
              onClick={() => setNoteEditor(note)}
              title={note.title}
            >
              <Icon name="notes" size={14} />
              <span>{note.title}</span>
              <small>Pinned note</small>
            </button>
          ))}
        </section>
      </div>

      <RecentFiles limit={4} />
      <ClipboardCard />
    </>
  )
}