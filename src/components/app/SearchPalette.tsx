'use client'

import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Icon, { type IconName } from '@/components/ui/Icon'
import { PERSONAL_NAV, SETTINGS_NAV, WORKSPACE_NAV } from '@/components/app/nav'
import { useNavigate } from '@/hooks/useNavigate'
import { useAppStore } from '@/lib/store'
import { useUi } from '@/lib/ui'
import { useTheme } from '@/lib/theme'
import { dueLabel, parseDateStr } from '@/lib/dates'

interface Result {
  id: string
  title: string
  kind: string
  icon: IconName
  run: () => void
}

const MAX_RESULTS = 12

const matches = (haystack: string, query: string) => haystack.toLowerCase().includes(query)

function SearchBody({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { toggle: toggleTheme, theme } = useTheme()
  const tasks = useAppStore((s) => s.tasks)
  const notes = useAppStore((s) => s.notes)
  const events = useAppStore((s) => s.events)
  const goals = useAppStore((s) => s.goals)
  const files = useAppStore((s) => s.files)
  const setHighlightedGoal = useAppStore((s) => s.setHighlightedGoal)
  const setHighlightedNote = useAppStore((s) => s.setHighlightedNote)
  const { selectTask, setNoteEditor, setCalendarFocus, setFileSearch, setTaskEditor } = useUi.getState()

  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase()

    const pages: Result[] = [...WORKSPACE_NAV, ...PERSONAL_NAV, SETTINGS_NAV].map((n) => ({
      id: `page:${n.page}`,
      title: n.label,
      kind: 'Go to page',
      icon: n.icon,
      run: () => navigate(n.page),
    }))
    const actions: Result[] = [
      { id: 'act:task', title: 'Create a task', kind: 'Action', icon: 'plus', run: () => setTaskEditor('new') },
      { id: 'act:note', title: 'Capture a note', kind: 'Action', icon: 'pen', run: () => setNoteEditor('new') },
      { id: 'act:theme', title: theme === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance', kind: 'Action', icon: theme === 'dark' ? 'sun' : 'moon', run: toggleTheme },
    ]
    if (!q) return [...pages.slice(0, 5), ...actions]

    const found: Result[] = []
    for (const t of tasks) {
      if (matches(t.title, q)) {
        found.push({ id: `task:${t.id}`, title: t.title, kind: `Task · ${dueLabel(t.dueDate)}`, icon: 'tasks', run: () => { navigate('tasks'); selectTask(t.id) } })
      }
    }
    for (const n of notes) {
      if (matches(`${n.title} ${n.content}`, q)) {
        found.push({ id: `note:${n.id}`, title: n.title, kind: 'Note', icon: 'notes', run: () => { setHighlightedNote(n.id); setNoteEditor(n) } })
      }
    }
    const seenEvents = new Set<string>()
    for (const e of events) {
      const key = `${e.recurrenceTemplateId ?? e.id}`
      if (matches(e.title, q) && !seenEvents.has(key)) {
        seenEvents.add(key)
        found.push({ id: `event:${e.id}:${e.date}`, title: e.title, kind: `Event · ${parseDateStr(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, icon: 'calendar', run: () => { setCalendarFocus(e.date); navigate('calendar') } })
      }
    }
    for (const g of goals) {
      const milestone = g.milestones.find((m) => matches(m.label, q))
      if (matches(g.title, q) || milestone) {
        found.push({ id: `goal:${g.id}`, title: g.title, kind: milestone && !matches(g.title, q) ? `Goal · ${milestone.label}` : 'Goal', icon: 'flag', run: () => { setHighlightedGoal(g.id); navigate('goals') } })
      }
    }
    for (const f of files) {
      if (matches(f.name, q)) {
        found.push({ id: `file:${f.id}`, title: f.name, kind: f.type === 'folder' ? 'Folder' : 'File', icon: f.type === 'folder' ? 'files' : 'file', run: () => { setFileSearch(f.name); navigate('files') } })
      }
    }
    const rest = [...pages, ...actions].filter((r) => matches(r.title, q))
    // Titles that start with the query rank above substring hits.
    return [...found, ...rest]
      .sort((a, b) => Number(b.title.toLowerCase().startsWith(q)) - Number(a.title.toLowerCase().startsWith(q)))
      .slice(0, MAX_RESULTS)
  }, [query, tasks, notes, events, goals, files, theme, navigate, toggleTheme, selectTask, setNoteEditor, setCalendarFocus, setFileSearch, setTaskEditor, setHighlightedGoal, setHighlightedNote])

  useEffect(() => setIndex(0), [query])

  const open = (r: Result | undefined) => {
    if (!r) return
    onClose()
    r.run()
  }

  return (
    <>
      <div className="command-input">
        <Icon name="search" size={20} />
        <input
          autoFocus
          aria-label="Search tasks, notes, events, goals, files and pages"
          placeholder="Find a task, note, event, goal, file or page..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setIndex((i) => Math.min(i + 1, results.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setIndex((i) => Math.max(i - 1, 0))
            } else if (e.key === 'Enter') {
              open(results[index])
            }
          }}
        />
        <button className="search-close-button" onClick={onClose} aria-label="Close search"><kbd>Esc</kbd></button>
      </div>
      <div className="command-results">
        <span className="menu-label">{query ? `${results.length} RESULTS` : 'QUICK ACCESS'}</span>
        {results.map((r, i) => (
          <button key={r.id} className={`command-result ${i === index ? 'selected' : ''}`} onMouseEnter={() => setIndex(i)} onClick={() => open(r)}>
            <Icon name={r.icon} size={17} />
            <span><strong>{r.title}</strong><small>{r.kind}</small></span>
            <Icon name="right" size={14} />
          </button>
        ))}
        {results.length === 0 && <div className="empty-state compact-empty"><p>No matches for &ldquo;{query}&rdquo;.</p></div>}
      </div>
      <div className="command-footer">
        <span><kbd>&uarr;</kbd><kbd>&darr;</kbd> to navigate</span>
        <span><kbd>Enter</kbd> to open</span>
        <span>{tasks.length + notes.length + events.length + goals.length + files.length} items indexed</span>
      </div>
    </>
  )
}

export default function SearchPalette() {
  const open = useUi((s) => s.searchOpen)
  const setOpen = useUi((s) => s.setSearchOpen)
  if (!open) return null
  return (
    <Modal title="Search" onClose={() => setOpen(false)} className="search-modal">
      <SearchBody onClose={() => setOpen(false)} />
    </Modal>
  )
}
