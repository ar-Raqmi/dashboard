import { useEffect, useRef, useState } from 'react';
import { AvatarContent } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/features/auth/auth';
import { formatTime, longDay, todayKey } from '@/lib/date';
import { initialsOf } from '@/lib/text';
import { useStore, type EventView, type Theme } from '@/store';
import type { Page } from './pages';

interface TopbarProps {
  pageTitle: string;
  collapsed: boolean;
  theme: Theme;
  onOpenNav: () => void;
  onExpand: () => void;
  onSearch: () => void;
  onToggleTheme: () => void;
  onNavigate: (page: Page) => void;
  onOpenEvent: (event: EventView) => void;
  onExport: () => void;
  onScreenshot: () => Promise<void>;
  onHelp: () => void;
  onError: (err: unknown) => void;
}

export function Topbar(props: TopbarProps) {
  const { pageTitle, collapsed, theme, onOpenNav, onExpand, onSearch, onToggleTheme, onNavigate, onOpenEvent, onExport, onScreenshot, onHelp, onError } = props;
  const { user, logout } = useAuth();
  const { tasks, events, settings, preferences } = useStore();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [screenshotBusy, setScreenshotBusy] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = () => { setNotificationsOpen(false); setProfileOpen(false); };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    const onMouseDown = (e: MouseEvent) => { if (!toolbarRef.current?.contains(e.target as Node)) close(); };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    return () => { document.removeEventListener('keydown', onKeyDown); document.removeEventListener('mousedown', onMouseDown); };
  }, []);

  const today = todayKey();
  const overdue = tasks.filter(t => t.status !== 'completed' && t.dueDate && t.dueDate < today).length;
  const todaysEvents = events.filter(e => e.date === today);
  const nextEvent = events.find(e => e.date >= today);
  const notificationsRead = !!preferences.notificationsReadAt && preferences.notificationsReadAt.slice(0, 10) >= today;
  const hasNotifications = overdue > 0 || todaysEvents.length > 0;
  const profileName = settings?.profileName || user?.username || '';
  const profilePicture = settings?.profilePicture || '';
  const themeLabel = theme === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance';

  const closeMenus = () => { setNotificationsOpen(false); setProfileOpen(false); };
  const pick = (action: () => void) => () => { closeMenus(); action(); };
  const takeScreenshot = async () => {
    if (screenshotBusy) return;
    setScreenshotBusy(true);
    closeMenus();
    try { await onScreenshot(); } finally { setScreenshotBusy(false); }
  };

  return <header className="topbar">
    <div className="breadcrumb">
      <button className="icon-button mobile-menu-button" aria-label="Open navigation" onClick={onOpenNav}><Icon name="collapse" size={19}/></button>
      {collapsed && <button className="icon-button desktop-expand" onClick={onExpand} aria-label="Expand sidebar"><Icon name="collapse" size={17}/></button>}
      <span>Workspace</span><span className="breadcrumb-slash">/</span><span className="breadcrumb-current">{pageTitle}</span>
    </div>
    <div className="toolbar-right" ref={toolbarRef}>
      <button className="search-trigger" onClick={onSearch} aria-label="Search workspace"><Icon name="search" size={15}/><span>Search anything...</span><kbd>&#8984; K</kbd></button>
      <button className="icon-button theme-toggle" title={themeLabel} aria-label={themeLabel} onClick={onToggleTheme}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17}/></button>
      <span className="toolbar-divider"/>
      <button className={`icon-button notification-trigger ${hasNotifications && !notificationsRead ? 'unread' : ''}`} title="Notifications" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}><Icon name="bell" size={18}/></button>
      <button className="avatar top-avatar" aria-label="Open account menu" aria-expanded={profileOpen} onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }} style={profilePicture ? { overflow: 'hidden', padding: 0 } : undefined}><AvatarContent src={profilePicture} fallback={initialsOf(profileName)}/></button>
      {notificationsOpen && <div className="popover notifications-popover">
        <div className="popover-title"><h3>Notifications</h3><button className="text-button" onClick={() => void useStore.getState().updatePreferences({ notificationsReadAt: new Date().toISOString() }).catch(onError)}>{notificationsRead ? 'All read' : 'Mark all read'}</button></div>
        <button className="notification-item" onClick={pick(() => onNavigate('Tasks'))}><span className={`notification-icon ${overdue ? 'danger' : ''}`}><Icon name="clock" size={17}/></span><span><strong>{overdue ? `${overdue} task${overdue === 1 ? ' needs' : 's need'} your attention` : 'You are all caught up'}</strong><small>{overdue ? 'These tasks are past their due date.' : 'No overdue tasks in your workspace.'}</small><time>Tasks</time></span></button>
        {nextEvent && <button className="notification-item" onClick={pick(() => onOpenEvent(nextEvent))}><span className="notification-icon"><Icon name="calendar" size={17}/></span><span><strong>{nextEvent.date === today ? `${nextEvent.title} is today` : `${nextEvent.title} is coming up`}</strong><small>{longDay(nextEvent.date)}{nextEvent.startTime ? ` at ${formatTime(nextEvent.startTime)}` : ''}</small><time>Calendar</time></span></button>}
        <div className="popover-bottom">{todaysEvents.length ? `${todaysEvents.length} event${todaysEvents.length === 1 ? '' : 's'} today` : 'No events today'}</div>
      </div>}
      {profileOpen && <div className="popover profile-popover">
        <div className="profile-menu-heading"><strong>{profileName}</strong><small>@{user?.username}</small></div>
        <button onClick={pick(() => onNavigate('Settings'))}><Icon name="settings" size={15}/>Settings</button>
        <button onClick={pick(onExport)}><Icon name="download" size={15}/>Export workspace</button>
        <button onClick={() => void takeScreenshot()} disabled={screenshotBusy}><Icon name="file" size={15}/>{screenshotBusy ? 'Preparing screenshot...' : 'Save screenshot'}</button>
        <button onClick={pick(onHelp)}><Icon name="help" size={15}/>Keyboard shortcuts</button>
        <button onClick={() => void logout()}><Icon name="logout" size={15}/>Sign out</button>
      </div>}
    </div>
  </header>;
}
