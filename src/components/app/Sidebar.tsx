'use client'

import { useMemo } from 'react'
import Icon from '@/components/ui/Icon'
import ProfileAvatar from '@/components/ui/ProfileAvatar'
import { PERSONAL_NAV, WORKSPACE_NAV, accentAt } from '@/components/app/nav'
import { useNavigate } from '@/hooks/useNavigate'
import { useAppStore } from '@/lib/store'
import { useUi } from '@/lib/ui'
import { taskBuckets } from '@/lib/task-actions'

function BrandMark({ logo }: { logo: string }) {
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="brand-logo" src={logo} width={28} height={28} alt="" />
  }
  return (
    <svg width="28" height="31" viewBox="0 0 28 31" fill="none" aria-hidden="true">
      <path d="M5 25.5 22 5M8.5 21.3C5 10.5 11.5 3.2 25 2c-.2 13-7.5 21-16.5 19.3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m12.5 16.5-.8-6M16.3 12.2l5.3-.5M6.5 27H20" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const page = useAppStore((s) => s.activePage)
  const tasks = useAppStore((s) => s.tasks)
  const goals = useAppStore((s) => s.goals)
  const appTitle = useAppStore((s) => s.appTitle)
  const appLogo = useAppStore((s) => s.appLogo)
  const profileName = useAppStore((s) => s.profileName)
  const profilePicture = useAppStore((s) => s.profilePicture)
  const setHighlightedGoal = useAppStore((s) => s.setHighlightedGoal)
  const collapsed = useUi((s) => s.collapsed)
  const setCollapsed = useUi((s) => s.setCollapsed)
  const setNoteEditor = useUi((s) => s.setNoteEditor)
  const setHelpOpen = useUi((s) => s.setHelpOpen)

  const openTasks = useMemo(() => taskBuckets(tasks).open.length, [tasks])
  const topGoals = useMemo(() => [...goals].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).slice(0, 3), [goals])

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="brand-row">
        <button className="brand" onClick={() => navigate('dashboard')} aria-label="Go to overview">
          <BrandMark logo={appLogo} />
          <span>raqmi<span className="brand-period">.</span></span>
        </button>
        <button
          className="collapse-button icon-button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={`${collapsed ? 'Expand' : 'Collapse'} sidebar (Ctrl+B)`}
          onClick={() => setCollapsed(!collapsed)}
        >
          <Icon name="collapse" size={17} />
        </button>
      </div>

      <div className="sidebar-scroll">
        <div className="nav-section-label">WORKSPACE</div>
        <nav className="main-nav">
          {WORKSPACE_NAV.map((item) => (
            <button key={item.page} className={`nav-item ${page === item.page ? 'active' : ''}`} onClick={() => navigate(item.page)} title={item.label} aria-current={page === item.page ? 'page' : undefined}>
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {item.page === 'tasks' && openTasks > 0 && <small>{openTasks}</small>}
            </button>
          ))}
        </nav>

        {topGoals.length > 0 && (
          <>
            <div className="nav-section-label project-section-label">
              <span>GOALS</span>
              <button className="icon-button compact" title="All goals" aria-label="All goals" onClick={() => navigate('goals')}>
                <Icon name="right" size={13} />
              </button>
            </div>
            <nav className="project-nav">
              {topGoals.map((goal, i) => (
                <button
                  key={goal.id}
                  className="nav-item project-nav-item"
                  title={goal.title}
                  onClick={() => {
                    setHighlightedGoal(goal.id)
                    navigate('goals')
                  }}
                >
                  <span className="project-symbol" style={{ color: accentAt(i) }}><Icon name="target" size={15} /></span>
                  <span>{goal.title}</span>
                  <small>{Math.round(goal.progress)}%</small>
                </button>
              ))}
            </nav>
          </>
        )}

        <div className="nav-section-label personal-section-label">PERSONAL</div>
        <nav>
          {PERSONAL_NAV.map((item) => (
            <button key={item.page} className={`nav-item ${page === item.page ? 'active' : ''}`} title={item.label} onClick={() => navigate(item.page)} aria-current={page === item.page ? 'page' : undefined}>
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <button className="quick-capture" title="Quick capture (Q)" onClick={() => setNoteEditor('new')}>
          <Icon name="plus" size={16} /><span>Quick capture</span><kbd>Q</kbd>
        </button>
        <button className={`nav-item ${page === 'settings' ? 'active' : ''}`} title="Settings" onClick={() => navigate('settings')}>
          <Icon name="settings" size={17} /><span>Settings</span>
        </button>
        <button className="nav-item" title="Help & shortcuts" onClick={() => setHelpOpen(true)}>
          <Icon name="help" size={17} /><span>Help &amp; shortcuts</span>
        </button>
        <div className="sidebar-profile">
          <ProfileAvatar className="profile-avatar" name={appTitle} src={profilePicture} />
          <div>
            <strong>{appTitle}</strong>
            <span>{profileName}</span>
          </div>
          <button className="icon-button compact" title="Account settings" aria-label="Account settings" onClick={() => navigate('settings')}>
            <Icon name="more" size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
