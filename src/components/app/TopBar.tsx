'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Icon, { type IconName } from '@/components/ui/Icon'
import ProfileAvatar from '@/components/ui/ProfileAvatar'
import { PAGE_LABEL } from '@/components/app/nav'
import { selectUpcomingEvents, eventTimeLabel } from '@/components/rail/UpcomingEvents'
import { useNavigate } from '@/hooks/useNavigate'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/lib/theme'
import { useAppStore } from '@/lib/store'
import { useUi } from '@/lib/ui'
import { taskBuckets } from '@/lib/task-actions'
import { daysBetween, dueLabel, todayStr } from '@/lib/dates'

interface Notification {
  id: string
  icon: IconName
  tone: 'danger' | 'normal'
  title: string
  detail: string
  page: 'tasks' | 'calendar'
  date?: string
}

const SEEN_KEY = 'raqmi-notifications-seen'

/** Alerts come straight from live data: overdue and due-today tasks, and the next event within 2 days. */
function useNotifications(): Notification[] {
  const tasks = useAppStore((s) => s.tasks)
  const events = useAppStore((s) => s.events)
  return useMemo(() => {
    const today = todayStr()
    const b = taskBuckets(tasks, today)
    const list: Notification[] = []
    if (b.overdue.length) {
      list.push({ id: `overdue:${b.overdue.map((t) => t.id).sort().join(',')}`, icon: 'clock', tone: 'danger', page: 'tasks', title: `${b.overdue.length} overdue ${b.overdue.length === 1 ? 'task' : 'tasks'}`, detail: b.overdue.slice(0, 2).map((t) => t.title).join(', ') })
    }
    if (b.dueToday.length) {
      list.push({ id: `today:${b.dueToday.map((t) => t.id).sort().join(',')}`, icon: 'tasks', tone: 'normal', page: 'tasks', title: `${b.dueToday.length} due today`, detail: b.dueToday.slice(0, 2).map((t) => t.title).join(', ') })
    }
    const next = selectUpcomingEvents(events, 1, today)[0]
    if (next && daysBetween(today, next.date) <= 2) {
      list.push({ id: `event:${next.id}:${next.date}`, icon: 'calendar', tone: 'normal', page: 'calendar', date: next.date, title: next.title, detail: `${dueLabel(next.date, today)} · ${eventTimeLabel(next)}` })
    }
    return list
  }, [tasks, events])
}

function useOutsideClose(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])
  return ref
}

export default function TopBar() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { theme, toggle } = useTheme()
  const page = useAppStore((s) => s.activePage)
  const appTitle = useAppStore((s) => s.appTitle)
  const profileName = useAppStore((s) => s.profileName)
  const profilePicture = useAppStore((s) => s.profilePicture)
  const collapsed = useUi((s) => s.collapsed)
  const setCollapsed = useUi((s) => s.setCollapsed)
  const setMobileNav = useUi((s) => s.setMobileNav)
  const setSearchOpen = useUi((s) => s.setSearchOpen)
  const setCalendarFocus = useUi((s) => s.setCalendarFocus)

  const notifications = useNotifications()
  const signature = notifications.map((n) => n.id).join('|')
  const [seen, setSeen] = useState<string | null>(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const toolbarRef = useOutsideClose(notifOpen || profileOpen, () => {
    setNotifOpen(false)
    setProfileOpen(false)
  })

  useEffect(() => {
    try {
      setSeen(localStorage.getItem(SEEN_KEY))
    } catch {
      setSeen(null)
    }
  }, [])

  const unread = notifications.length > 0 && seen !== signature
  const markRead = () => {
    setSeen(signature)
    try {
      localStorage.setItem(SEEN_KEY, signature)
    } catch {
      /* Read state is a convenience only. */
    }
  }

  const openNotification = (n: Notification) => {
    if (n.date) setCalendarFocus(n.date)
    navigate(n.page)
    setNotifOpen(false)
  }

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <button className="icon-button mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileNav(true)}>
          <Icon name="collapse" size={19} />
        </button>
        {collapsed && (
          <button className="icon-button desktop-expand" onClick={() => setCollapsed(false)} aria-label="Expand sidebar">
            <Icon name="collapse" size={17} />
          </button>
        )}
        <span>{appTitle}</span>
        <span className="breadcrumb-slash">/</span>
        <span className="breadcrumb-current">{PAGE_LABEL[page]}</span>
      </div>

      <div className="toolbar-right" ref={toolbarRef}>
        <button className="search-trigger" onClick={() => setSearchOpen(true)} aria-label="Search">
          <Icon name="search" size={15} />
          <span>Search anything...</span>
          <kbd>&#8984; K</kbd>
        </button>
        <button
          className="icon-button theme-toggle"
          title={theme === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance'}
          aria-label={theme === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance'}
          onClick={toggle}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
        </button>
        <span className="toolbar-divider" />
        <button
          className={`icon-button notification-trigger ${unread ? 'unread' : ''}`}
          title="Notifications"
          aria-label={unread ? 'Notifications, unread' : 'Notifications'}
          aria-expanded={notifOpen}
          onClick={() => {
            setNotifOpen(!notifOpen)
            setProfileOpen(false)
          }}
        >
          <Icon name="bell" size={18} />
        </button>
        <button
          className="avatar-button"
          aria-label="Open account menu"
          aria-expanded={profileOpen}
          onClick={() => {
            setProfileOpen(!profileOpen)
            setNotifOpen(false)
          }}
        >
          <ProfileAvatar className="top-avatar" name={appTitle} src={profilePicture} />
        </button>

        {notifOpen && (
          <div className="popover notifications-popover">
            <div className="popover-title">
              <h3>Notifications</h3>
              <button className="text-button" onClick={markRead}>{unread ? 'Mark all read' : 'All read'}</button>
            </div>
            {notifications.length === 0 && (
              <div className="empty-state compact-empty"><p>You&apos;re all caught up. Nothing overdue or due today.</p></div>
            )}
            {notifications.map((n) => (
              <button key={n.id} className="notification-item" onClick={() => openNotification(n)}>
                <span className={`notification-icon ${n.tone === 'danger' ? 'danger' : ''}`}><Icon name={n.icon} size={17} /></span>
                <span>
                  <strong>{n.title}</strong>
                  <small>{n.detail}</small>
                </span>
              </button>
            ))}
          </div>
        )}

        {profileOpen && (
          <div className="popover profile-popover">
            <div className="profile-menu-heading">
              <strong>{appTitle}</strong>
              <small>{profileName}</small>
            </div>
            <button onClick={() => { navigate('settings'); setProfileOpen(false) }}><Icon name="settings" size={15} />Settings</button>
            <button onClick={() => { toggle(); setProfileOpen(false) }}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />{theme === 'dark' ? 'Light appearance' : 'Dark appearance'}
            </button>
            <button className="danger-item" onClick={() => void logout()}><Icon name="logout" size={15} />Sign out</button>
          </div>
        )}
      </div>
    </header>
  )
}
