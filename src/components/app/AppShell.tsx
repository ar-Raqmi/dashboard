'use client'

import { useEffect, type ReactNode } from 'react'
import Sidebar from '@/components/app/Sidebar'
import TopBar from '@/components/app/TopBar'
import SearchPalette from '@/components/app/SearchPalette'
import HelpModal from '@/components/app/HelpModal'
import DialogHost from '@/components/app/DialogHost'
import ContextRail from '@/components/rail/ContextRail'
import TaskModal from '@/components/tasks/TaskModal'
import NoteModal from '@/components/notes/NoteModal'
import Icon, { type IconName } from '@/components/ui/Icon'
import { PAGE_DESCRIPTION } from '@/components/app/page-meta'
import { useDailyContent } from '@/hooks/useDailyContent'
import { triggerGlobalSync } from '@/hooks/useApi'
import { useAppStore, type ActivePage } from '@/lib/store'
import { loadDisplayPreferences, useUi, type UiCommandName } from '@/lib/ui'
import { PAGE_LABEL } from '@/components/app/nav'
import { useState } from 'react'

type HeaderAction = { label: string; icon: IconName } & ({ command: UiCommandName } | { task: true } | { note: true })

const HEADER_ACTION: Partial<Record<ActivePage, HeaderAction>> = {
  dashboard: { label: 'New task', icon: 'plus', task: true },
  tasks: { label: 'New task', icon: 'plus', task: true },
  calendar: { label: 'New event', icon: 'plus', command: 'newEvent' },
  notes: { label: 'New note', icon: 'plus', note: true },
  files: { label: 'Upload files', icon: 'upload', command: 'upload' },
  goals: { label: 'New goal', icon: 'plus', command: 'newGoal' },
  twoFactor: { label: 'Add account', icon: 'plus', command: 'newAccount' },
}

const isTyping = (el: EventTarget | null) => {
  const node = el as HTMLElement | null
  return Boolean(node && (/^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName) || node.isContentEditable))
}

/** Frame for every signed-in page: sidebar, top bar, heading, content + context rail, global dialogs. */
export default function AppShell({ children }: { children: ReactNode }) {
  const page = useAppStore((s) => s.activePage)
  const collapsed = useUi((s) => s.collapsed)
  const mobileNav = useUi((s) => s.mobileNav)
  const compact = useUi((s) => s.compact)
  const reduceMotion = useUi((s) => s.reduceMotion)
  const selectedTaskId = useUi((s) => s.selectedTaskId)
  const hasSelection = useAppStore((s) => (selectedTaskId ? s.tasks.some((t) => t.id === selectedTaskId) : false))
  const [refreshing, setRefreshing] = useState(false)
  const [today, setToday] = useState<string>('')

  useDailyContent()

  useEffect(() => {
    useUi.setState(loadDisplayPreferences())
    setToday(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion)
  }, [reduceMotion])

  useEffect(() => {
    document.title = `${PAGE_LABEL[page]} - ${useAppStore.getState().appTitle}`
  }, [page])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ui = useUi.getState()
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        ui.setSearchOpen(true)
        return
      }
      if (mod && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        ui.setCollapsed(!ui.collapsed)
        return
      }
      if (mod || e.altKey || isTyping(e.target) || document.querySelector('[role="dialog"]')) return
      if (e.key === 'n') {
        e.preventDefault()
        ui.setTaskEditor('new')
      } else if (e.key === 'q') {
        e.preventDefault()
        ui.setNoteEditor('new')
      } else if (e.key === '/') {
        e.preventDefault()
        ui.setSearchOpen(true)
      } else if (e.key === 'Escape') {
        ui.setMobileNav(false)
        ui.selectTask(null)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const action = HEADER_ACTION[page]
  const runAction = () => {
    if (!action) return
    const ui = useUi.getState()
    if ('task' in action) ui.setTaskEditor('new')
    else if ('note' in action) ui.setNoteEditor('new')
    else ui.runCommand(action.command)
  }

  const refresh = () => {
    setRefreshing(true)
    triggerGlobalSync()
    window.setTimeout(() => setRefreshing(false), 900)
  }

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''} ${mobileNav ? 'mobile-nav-open' : ''} ${compact ? 'compact-density' : ''}`}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => useUi.getState().setMobileNav(false)} />}
      <Sidebar />
      <div className="workspace-shell">
        <TopBar />
        <main className="main-content" id="main-content">
          <div className="page-content">
            <div className="page-heading">
              <div>
                <div className="page-title-row"><h1>{PAGE_LABEL[page]}</h1></div>
                <p>{PAGE_DESCRIPTION[page]}</p>
              </div>
              <div className="page-heading-actions">
                <span className="sample-date"><Icon name="calendar" size={14} />{today}</span>
                <button className={`icon-button refresh-button ${refreshing ? 'refreshing' : ''}`} title="Refresh from your account" aria-label="Refresh" onClick={refresh} disabled={refreshing}>
                  <Icon name="refresh" size={15} />
                </button>
                {action && (
                  <button className="button primary" onClick={runAction}>
                    <Icon name={action.icon} size={15} />{action.label}
                  </button>
                )}
              </div>
            </div>
            <div className={`content-grid ${hasSelection ? 'has-task-detail' : ''}`}>
              <div className="primary-content" key={page}>{children}</div>
              <ContextRail />
            </div>
            <footer className="workspace-footer">
              <span><i className="tiny-dot" />Synced with your account</span>
              <span>Made for a more intentional day<span className="footer-divider">/</span><span className="footer-brand">raqmi.</span></span>
            </footer>
          </div>
        </main>
      </div>
      <SearchPalette />
      <HelpModal />
      <TaskModal />
      <NoteModal />
      <DialogHost />
    </div>
  )
}
