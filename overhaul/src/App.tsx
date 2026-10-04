import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { LoginScreen, useAuth } from './auth';
import { AuthenticatorPage } from './components/AuthenticatorPage';
import { CalendarPage } from './components/CalendarPage';
import { EventDetailModal } from './components/CalendarView';
import { EventList } from './components/EventList';
import { FilesPage } from './components/FilesPage';
import { ReportModal, type Metric, type Range, type Theme } from './components/FocusChart';
import { GoalsPage } from './components/GoalsPage';
import { NewGoalModal } from './components/GoalsView';
import { BrandMark, Icon, type IconName } from './components/Icon';
import { ConfirmModal, Modal } from './components/Modal';
import { NewTaskModal } from './components/NewTaskModal';
import { NoteModal } from './components/NoteModal';
import { NotesPage } from './components/NotesPage';
import { OverviewPage, useWidgetVisible } from './components/OverviewPage';
import { hijriLabel, PrayerTimes } from './components/PrayerTimes';
import { SettingsPage } from './components/SettingsPage';
import { SpiritualPage } from './components/SpiritualPage';
import { TaskDetail } from './components/TaskDetail';
import { TasksPage } from './components/TasksPage';
import { Verse } from './components/Verse';
import { goalColor, useStore, type EventView, type NoteView, type TaskView } from './store';
import { downloadFile, formatTime, parseDateKey, todayKey } from './utils/date';

type Page = 'Overview' | 'Tasks' | 'Calendar' | 'Notes' | 'Files' | 'Spiritual' | 'Goals' | 'Authenticator' | 'Settings';

const navItems: { name: Page; icon: IconName }[] = [{ name: 'Overview', icon: 'overview' }, { name: 'Tasks', icon: 'tasks' }, { name: 'Calendar', icon: 'calendar' }, { name: 'Notes', icon: 'notes' }, { name: 'Files', icon: 'files' }];
const personalItems: { name: Page; icon: IconName }[] = [{ name: 'Spiritual', icon: 'book' }, { name: 'Authenticator', icon: 'shield' }];
const projectIcons: IconName[] = ['target', 'bolt', 'book'];
const pageDescriptions: Record<Page, string> = { Overview: 'A little clarity for the day ahead.', Tasks: 'Your priorities, all in one place.', Calendar: 'Your commitments, with room to breathe.', Notes: 'A place for the thoughts worth keeping.', Files: 'The documents behind your work.', Spiritual: 'Stay grounded in your daily rhythm.', Goals: 'Small steps. Meaningful progress.', Authenticator: 'A quiet place for your one-time codes.', Settings: 'Make the workspace your own.' };

const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '·';

/** Shows the uploaded image when set (and loadable), otherwise the fallback content. */
function AvatarContent({ src, fallback }: { src?: string; fallback: ReactNode }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  if (!src || broken) return <>{fallback}</>;
  return <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} onError={() => setBroken(true)}/>;
}

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem('raqmi-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch { return 'dark'; }
}

export default function App() {
  const { status } = useAuth();
  if (status === 'checking') return <div className="modal-backdrop" style={{ background: 'var(--bg-dim)', backdropFilter: 'none' }}><span className="brand"><BrandMark/></span></div>;
  if (status === 'signed-out') return <LoginScreen/>;
  return <Workspace/>;
}

function Workspace() {
  const { user, logout } = useAuth();
  const store = useStore();
  const { tasks, notes, goals, events, settings, preferences, prayer, saving } = store;
  const widgetVisible = useWidgetVisible();

  const [page, setPage] = useState<Page>('Overview'), [mobileNav, setMobileNav] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null), [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [newTask, setNewTask] = useState(false), [newGoal, setNewGoal] = useState(false), [addingAccount, setAddingAccount] = useState(false);
  const [noteEditor, setNoteEditor] = useState<NoteView | 'new' | null>(null), [eventDetail, setEventDetail] = useState<EventView | null>(null);
  const [report, setReport] = useState<{ metric: Metric; range: Range } | null>(null), [help, setHelp] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0), [refreshing, setRefreshing] = useState(false), [toast, setToast] = useState('');
  const [searchOpen, setSearchOpen] = useState(false), [search, setSearch] = useState(''), [searchIndex, setSearchIndex] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false), [profileOpen, setProfileOpen] = useState(false), [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [screenshotBusy, setScreenshotBusy] = useState(false), [theme, setThemeState] = useState<Theme>(readTheme);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'task'; item: TaskView } | { type: 'note'; item: NoteView } | null>(null);
  const mainRef = useRef<HTMLElement>(null), toolbarRef = useRef<HTMLDivElement>(null), workspaceRef = useRef<HTMLDivElement>(null);
  const uploadTrigger = useRef<(() => void) | null>(null), toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const collapsed = !!preferences.sidebarCollapsed, compact = !!preferences.compact;
  const reducedMotion = preferences.reducedMotion ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const today = todayKey();
  const activeTask = tasks.find(t => t.id === selectedTask);
  const openTasks = tasks.filter(t => t.status !== 'completed').length;
  const overdue = tasks.filter(t => t.status !== 'completed' && t.dueDate && t.dueDate < today).length;
  const todaysEvents = events.filter(e => e.date === today);
  const nextEvent = events.find(e => e.date >= today);
  const notificationsRead = !!preferences.notificationsReadAt && preferences.notificationsReadAt.slice(0, 10) >= today;
  const hasNotifications = overdue > 0 || todaysEvents.length > 0;
  const profileName = settings?.profileName || user?.username || '';
  const initials = initialsOf(profileName);
  const profilePicture = settings?.profilePicture || '', appLogo = settings?.appLogo || '';
  const logoStyle = appLogo ? { background: settings?.iconBackgroundColor, overflow: 'hidden' } : undefined;
  const hijri = hijriLabel(prayer, settings);
  const pageTitle = projectFilter ? goals.find(g => g.id === projectFilter)?.title || 'Project' : page;

  const notify = useCallback((message: string) => { setToast(message); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 3500); }, []);
  const fail = (err: unknown) => notify((err as Error).message);
  function navigate(next: Page, project: string | null = null) { setPage(next); setProjectFilter(project); setSelectedTask(null); setMobileNav(false); setWorkspaceOpen(false); mainRef.current?.scrollTo({ top: 0, behavior: 'instant' }); }
  const setCollapsed = (v: boolean) => void store.updatePreferences({ sidebarCollapsed: v }).catch(fail);
  function setTheme(next: Theme) { setThemeState(next); void store.updatePreferences({ theme: next }).catch(() => undefined); }

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      await Promise.all([useStore.getState().load(), useStore.getState().loadDaily()]);
      if (!quiet) { setRefreshKey(k => k + 1); notify('Workspace refreshed'); }
    } catch (err) {
      if (!quiet) notify((err as Error).message);
    } finally {
      if (!quiet) setRefreshing(false);
    }
  }, [notify]);

  function exportWorkspace() {
    downloadFile(JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), tasks, goals, notes, events, clocks: store.clocks }, null, 2), 'raqmi-workspace.json', 'application/json');
    notify('Workspace exported');
  }

  async function saveScreenshot() {
    if (screenshotBusy) return;
    setScreenshotBusy(true); setProfileOpen(false); setNotificationsOpen(false);
    notify('Preparing your screenshot...');
    try {
      const { getFontEmbedCSS, toPng } = await import('html-to-image');
      await new Promise(resolve => setTimeout(resolve, 750));
      await document.fonts.ready;
      const node = document.querySelector<HTMLElement>('.app-shell');
      if (!node) throw new Error('Workspace not found');
      let fontEmbedCSS = '';
      try { fontEmbedCSS = await getFontEmbedCSS(node, { preferredFontFormat: 'woff2' }); } catch { /* System typefaces provide a screenshot fallback. */ }
      const dataUrl = await toPng(node, {
        backgroundColor: theme === 'light' ? '#EFEBD4' : '#232A2E', pixelRatio: 2, fontEmbedCSS,
        filter: element => !(element instanceof Element) || !element.matches('.popover, .toast, .modal-backdrop, .mobile-scrim, .visually-hidden, .skip-link'),
      });
      const link = document.createElement('a'); link.href = dataUrl; link.download = `raqmi-${page.toLowerCase()}-screenshot.png`;
      document.body.appendChild(link); link.click(); link.remove();
      notify('Screenshot downloaded');
    } catch { notify('Screenshot export is unavailable here. Use your browser screenshot tool instead.'); }
    finally { setScreenshotBusy(false); }
  }

  // Initial load, plus a quiet resync when the tab regains focus after a while (also catches a new day).
  useEffect(() => { void useStore.getState().load().catch(() => undefined); void useStore.getState().loadDaily(); }, []);
  useEffect(() => {
    const onFocus = () => { const last = useStore.getState().lastSyncedAt; if (!last || Date.now() - last > 60000) void refresh(true); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);
  // A theme saved to the account wins over this device's last choice.
  useEffect(() => { if (preferences.theme && preferences.theme !== theme) setThemeState(preferences.theme); }, [preferences.theme]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { document.documentElement.classList.toggle('reduce-motion', reducedMotion); }, [reducedMotion]);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#EFEBD4' : '#232A2E');
    try { localStorage.setItem('raqmi-theme', theme); } catch { /* Preference remains for this session. */ }
  }, [theme]);
  useEffect(() => { document.title = `${pageTitle} - ${settings?.appTitle && settings.appTitle !== 'Dashboard' ? settings.appTitle : 'Raqmi'}`; }, [pageTitle, settings?.appTitle]);
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (!link) return;
    const original = link.dataset.defaultHref ??= link.href;
    link.href = appLogo || original;
  }, [appLogo]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isTyping = /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName), hasDialog = !!document.querySelector('[role="dialog"]');
      const plainKey = !e.metaKey && !e.ctrlKey && !e.altKey;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && !document.querySelector('.modal:not(.search-modal)')) { e.preventDefault(); setSearchOpen(v => !v); setSearch(''); setSearchIndex(0); }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b' && !hasDialog) { e.preventDefault(); const s = useStore.getState(); void s.updatePreferences({ sidebarCollapsed: !s.preferences.sidebarCollapsed }).catch(() => undefined); }
      else if (e.key === 'Escape') { setNotificationsOpen(false); setProfileOpen(false); setWorkspaceOpen(false); setMobileNav(false); }
      else if (e.key.toLowerCase() === 'n' && plainKey && !isTyping && !hasDialog) { e.preventDefault(); setNewTask(true); }
      else if (e.key.toLowerCase() === 'q' && plainKey && !isTyping && !hasDialog) { e.preventDefault(); setNoteEditor('new'); }
      else if (e.key === '/' && plainKey && !isTyping && !hasDialog) { e.preventDefault(); setSearchOpen(true); setSearch(''); setSearchIndex(0); }
    };
    const outside = (e: MouseEvent) => { if (!toolbarRef.current?.contains(e.target as Node)) { setNotificationsOpen(false); setProfileOpen(false); } if (!workspaceRef.current?.contains(e.target as Node)) setWorkspaceOpen(false); };
    document.addEventListener('keydown', handler); document.addEventListener('mousedown', outside);
    return () => { document.removeEventListener('keydown', handler); document.removeEventListener('mousedown', outside); };
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const searchResults = [
    ...tasks.map(t => ({ id: `task:${t.id}`, title: t.title, kind: `Task / ${goals.find(g => g.id === t.goalId)?.title || 'No project'}`, icon: 'tasks' as IconName, action: () => { navigate('Tasks'); setSelectedTask(t.id); } })),
    ...notes.map(n => ({ id: `note:${n.id}`, title: n.title, kind: 'Note', icon: 'notes' as IconName, action: () => setNoteEditor(n) })),
    ...goals.map(g => ({ id: `goal:${g.id}`, title: g.title, kind: `Goal / ${g.progress}%`, icon: 'flag' as IconName, action: () => navigate('Goals') })),
    ...events.filter(e => e.date >= today).slice(0, 50).map(e => ({ id: `event:${e.id}:${e.date}`, title: e.title, kind: `Event / ${parseDateKey(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, icon: 'calendar' as IconName, action: () => setEventDetail(e) })),
    ...[...navItems, ...personalItems, { name: 'Goals' as Page, icon: 'flag' as IconName }, { name: 'Settings' as Page, icon: 'settings' as IconName }].map(n => ({ id: n.name, title: n.name, kind: 'Navigate', icon: n.icon, action: () => navigate(n.name) })),
  ].filter(item => !search || `${item.title} ${item.kind}`.toLowerCase().includes(search.toLowerCase())).slice(0, 9);

  const primaryAction = page === 'Notes' ? <button className="button primary" onClick={() => setNoteEditor('new')}><Icon name="plus" size={15}/>New note</button>
    : page === 'Files' ? <button className="button primary" onClick={() => uploadTrigger.current?.()}><Icon name="upload" size={15}/>Add files</button>
    : page === 'Goals' ? <button className="button primary" onClick={() => setNewGoal(true)}><Icon name="plus" size={15}/>New goal</button>
    : page === 'Authenticator' ? <button className="button primary" onClick={() => setAddingAccount(true)}><Icon name="plus" size={15}/>Add account</button>
    : page === 'Settings' ? null
    : <button className="button primary" onClick={() => setNewTask(true)}><Icon name="plus" size={15}/>New task</button>;

  const syncLabel = saving > 0 ? 'Saving...' : store.status === 'error' ? 'Offline' : store.status === 'loading' ? 'Loading...' : 'Synced';

  return <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''} ${mobileNav ? 'mobile-nav-open' : ''} ${compact ? 'compact-density' : ''}`}>
    <a href="#main-content" className="skip-link">Skip to content</a>
    {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)}/>}
    <aside className="sidebar" aria-label="Main navigation">
      <div className="brand-row"><button className="brand" onClick={() => navigate('Overview')} aria-label="Raqmi overview"><BrandMark/><span>raqmi<span className="brand-period">.</span></span></button><button className="collapse-button icon-button" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={`${collapsed ? 'Expand' : 'Collapse'} sidebar (Ctrl+B)`} onClick={() => setCollapsed(!collapsed)}><Icon name="collapse" size={17}/></button></div>
      <div className="workspace-switcher-wrap" ref={workspaceRef}>
        <button className="workspace-switcher" onClick={() => setWorkspaceOpen(!workspaceOpen)} title={settings?.appTitle || 'Personal workspace'} aria-expanded={workspaceOpen}><span className="workspace-avatar" style={logoStyle}><AvatarContent src={appLogo} fallback={initials}/></span><span className="workspace-text"><strong>{settings?.appTitle && settings.appTitle !== 'Dashboard' ? settings.appTitle : 'Personal workspace'}</strong><small>A space for your every day</small></span><Icon name="down" size={13}/></button>
        {workspaceOpen && <div className="popover workspace-menu"><span className="menu-label">YOUR WORKSPACE</span><div className="workspace-menu-current"><span className="workspace-avatar" style={logoStyle}><AvatarContent src={appLogo} fallback={initials}/></span><span>{settings?.appTitle && settings.appTitle !== 'Dashboard' ? settings.appTitle : 'Personal workspace'}<small>Signed in as {user?.username}</small></span><Icon name="check" size={14}/></div><button onClick={() => navigate('Settings')}><Icon name="settings" size={15}/>Workspace settings</button><button onClick={() => { exportWorkspace(); setWorkspaceOpen(false); }}><Icon name="download" size={15}/>Export workspace</button></div>}
      </div>
      <div className="sidebar-scroll">
        <div className="nav-section-label">WORKSPACE</div>
        <nav className="main-nav">{navItems.map(item => <button key={item.name} className={`nav-item ${page === item.name && !projectFilter ? 'active' : ''}`} onClick={() => navigate(item.name)} title={item.name} aria-current={page === item.name && !projectFilter ? 'page' : undefined}><Icon name={item.icon} size={18}/><span>{item.name}</span>{item.name === 'Tasks' && <small>{openTasks}</small>}</button>)}</nav>
        <div className="nav-section-label project-section-label"><span>PROJECTS</span><button className="icon-button compact" title="Create a goal or project" aria-label="Create a goal or project" onClick={() => { navigate('Goals'); setNewGoal(true); }}><Icon name="plus" size={13}/></button></div>
        <nav className="project-nav">{goals.slice(0, 5).map((goal, i) => <button className={`nav-item project-nav-item ${projectFilter === goal.id ? 'active' : ''}`} key={goal.id} onClick={() => navigate('Tasks', goal.id)} title={goal.title}><span className="project-symbol" style={{ color: goalColor(goals, goal.id) }}><Icon name={projectIcons[i % projectIcons.length]} size={15}/></span><span>{goal.title}</span><small>{tasks.filter(t => t.goalId === goal.id && t.status !== 'completed').length}</small></button>)}{!goals.length && <button className="nav-item project-nav-item" onClick={() => { navigate('Goals'); setNewGoal(true); }}><span className="project-symbol"><Icon name="plus" size={15}/></span><span>Add a project</span></button>}</nav>
        <div className="nav-section-label personal-section-label">PERSONAL</div>
        <nav>{personalItems.map(item => <button key={item.name} className={`nav-item ${page === item.name ? 'active' : ''}`} title={item.name} onClick={() => navigate(item.name)} aria-current={page === item.name ? 'page' : undefined}><Icon name={item.icon} size={18}/><span>{item.name}</span></button>)}</nav>
      </div>
      <div className="sidebar-bottom"><button className="quick-capture" title="Quick capture (Q)" onClick={() => setNoteEditor('new')}><Icon name="plus" size={16}/><span>Quick capture</span><kbd>Q</kbd></button><button className={`nav-item ${page === 'Settings' ? 'active' : ''}`} title="Settings" onClick={() => navigate('Settings')}><Icon name="settings" size={17}/><span>Settings</span></button><button className="nav-item" title="Help & shortcuts" onClick={() => setHelp(true)}><Icon name="help" size={17}/><span>Help & shortcuts</span><Icon name="upRight" size={13}/></button><div className="sidebar-profile"><span className="avatar profile-avatar" style={profilePicture ? { overflow: 'hidden' } : undefined}><AvatarContent src={profilePicture} fallback={initials}/></span><div><strong>{profileName}</strong><span>@{user?.username}</span></div><button className="icon-button compact" title="Account settings" aria-label="Account settings" onClick={() => navigate('Settings')}><Icon name="more" size={15}/></button></div></div>
    </aside>
    <div className="workspace-shell">
      <header className="topbar">
        <div className="breadcrumb"><button className="icon-button mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Icon name="collapse" size={19}/></button>{collapsed && <button className="icon-button desktop-expand" onClick={() => setCollapsed(false)} aria-label="Expand sidebar"><Icon name="collapse" size={17}/></button>}<span>Workspace</span><span className="breadcrumb-slash">/</span><span className="breadcrumb-current">{pageTitle}</span></div>
        <div className="toolbar-right" ref={toolbarRef}>
          <button className="search-trigger" onClick={() => { setSearchOpen(true); setSearch(''); setSearchIndex(0); }} aria-label="Search workspace"><Icon name="search" size={15}/><span>Search anything...</span><kbd>&#8984; K</kbd></button><button className="icon-button theme-toggle" title={theme === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance'} aria-label={theme === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17}/></button><span className="toolbar-divider"/>
          <button className={`icon-button notification-trigger ${hasNotifications && !notificationsRead ? 'unread' : ''}`} title="Notifications" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}><Icon name="bell" size={18}/></button><button className="avatar top-avatar" aria-label="Open account menu" aria-expanded={profileOpen} onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }} style={profilePicture ? { overflow: 'hidden', padding: 0 } : undefined}><AvatarContent src={profilePicture} fallback={initials}/></button>
          {notificationsOpen && <div className="popover notifications-popover"><div className="popover-title"><h3>Notifications</h3><button className="text-button" onClick={() => void store.updatePreferences({ notificationsReadAt: new Date().toISOString() }).catch(fail)}>{notificationsRead ? 'All read' : 'Mark all read'}</button></div>
            <button className="notification-item" onClick={() => { navigate('Tasks'); setNotificationsOpen(false); }}><span className={`notification-icon ${overdue ? 'danger' : ''}`}><Icon name="clock" size={17}/></span><span><strong>{overdue ? `${overdue} task${overdue === 1 ? ' needs' : 's need'} your attention` : 'You are all caught up'}</strong><small>{overdue ? 'These tasks are past their due date.' : 'No overdue tasks in your workspace.'}</small><time>Tasks</time></span></button>
            {nextEvent && <button className="notification-item" onClick={() => { setEventDetail(nextEvent); setNotificationsOpen(false); }}><span className="notification-icon"><Icon name="calendar" size={17}/></span><span><strong>{nextEvent.date === today ? `${nextEvent.title} is today` : `${nextEvent.title} is coming up`}</strong><small>{parseDateKey(nextEvent.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}{nextEvent.startTime ? ` at ${formatTime(nextEvent.startTime)}` : ''}</small><time>Calendar</time></span></button>}
            <div className="popover-bottom">{todaysEvents.length ? `${todaysEvents.length} event${todaysEvents.length === 1 ? '' : 's'} today` : 'No events today'}</div></div>}
          {profileOpen && <div className="popover profile-popover">
            <div className="profile-menu-heading"><strong>{profileName}</strong><small>@{user?.username}</small></div>
            <button onClick={() => { navigate('Settings'); setProfileOpen(false); }}><Icon name="settings" size={15}/>Settings</button>
            <button onClick={() => { exportWorkspace(); setProfileOpen(false); }}><Icon name="download" size={15}/>Export workspace</button>
            <button onClick={() => void saveScreenshot()} disabled={screenshotBusy}><Icon name="file" size={15}/>{screenshotBusy ? 'Preparing screenshot...' : 'Save screenshot'}</button>
            <button onClick={() => { setHelp(true); setProfileOpen(false); }}><Icon name="help" size={15}/>Keyboard shortcuts</button>
            <button onClick={() => void logout()}><Icon name="logout" size={15}/>Sign out</button>
          </div>}
        </div>
      </header>
      <main className="main-content" id="main-content" ref={mainRef}>
        <div className="page-content">
          <div className="page-heading"><div><div className="page-title-row"><h1>{pageTitle}</h1><button className="sample-label" title="Sync status. Click to refresh." onClick={() => void refresh()}><span className={`tiny-dot ${store.status === 'error' ? 'warning-dot' : ''}`}/>{syncLabel}</button></div><p>{projectFilter ? `Keep your ${pageTitle} work moving forward.` : pageDescriptions[page]}</p></div><div className="page-heading-actions"><span className="sample-date"><Icon name="calendar" size={14}/>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span><button className={`icon-button refresh-button ${refreshing ? 'refreshing' : ''}`} title="Refresh workspace" aria-label="Refresh workspace" onClick={() => void refresh()} disabled={refreshing}><Icon name="refresh" size={15}/></button>{primaryAction}</div></div>
          {store.status === 'error' && <div className="security-notice"><Icon name="info" size={19}/><p><strong>Could not load your workspace.</strong> {store.error} <button className="text-button" style={{ display: 'inline-flex' }} onClick={() => void refresh()}>Try again</button></p></div>}
          <div className={`content-grid ${activeTask ? 'has-task-detail' : ''}`}>
            <div className="primary-content" key={page + (projectFilter || '')}>
              {store.status === 'loading' ? <div className="chart-canvas is-loading" aria-label="Loading your workspace"><div className="chart-skeleton"><div/><div/><div/><div/></div></div> : <>
                {page === 'Overview' && <OverviewPage theme={theme} reducedMotion={reducedMotion} refreshKey={refreshKey} selectedTaskId={selectedTask || undefined} onSelectTask={t => setSelectedTask(t.id)} onAddTask={() => setNewTask(true)} onOpenNote={setNoteEditor} onReport={(metric, range) => setReport({ metric, range })} onOpenAuthenticator={() => navigate('Authenticator')} onAddAccount={() => { navigate('Authenticator'); setAddingAccount(true); }} navigate={p => navigate(p)} notify={notify}/>}
                {page === 'Tasks' && <TasksPage projectFilter={projectFilter} selectedTaskId={selectedTask || undefined} onSelectTask={t => setSelectedTask(t.id)} onAddTask={() => setNewTask(true)} notify={notify}/>}
                {page === 'Calendar' && <CalendarPage onEvent={setEventDetail}/>}
                {page === 'Notes' && <NotesPage onOpenNote={setNoteEditor}/>}
                {page === 'Goals' && <GoalsPage onOpenProject={id => navigate('Tasks', id)} notify={notify}/>}
                {page === 'Spiritual' && <SpiritualPage onManageClocks={() => navigate('Settings')}/>}
                {page === 'Files' && <FilesPage notify={notify} uploadTrigger={uploadTrigger}/>}
                {page === 'Authenticator' && <AuthenticatorPage notify={notify} adding={addingAccount} setAdding={setAddingAccount}/>}
                {page === 'Settings' && <SettingsPage theme={theme} setTheme={setTheme} notify={notify}/>}
              </>}
            </div>
            <aside className={`context-rail ${activeTask ? 'detail-rail' : ''}`} aria-label={activeTask ? 'Task details' : 'Daily context'}>{activeTask
              ? <TaskDetail task={activeTask} onClose={() => setSelectedTask(null)} onDelete={task => setConfirmDelete({ type: 'task', item: task })} onNotice={notify}/>
              : <><div className="rail-date"><span><Icon name="sun" size={15}/>A {new Date().toLocaleDateString('en-US', { weekday: 'long' })} in {new Date().toLocaleDateString('en-US', { month: 'long' })}</span>{hijri && <small>{hijri}</small>}</div>
                {page !== 'Spiritual' && widgetVisible('prayerTimes') && <PrayerTimes/>}
                {widgetVisible('calendar') && <EventList onEvent={setEventDetail} onCalendar={() => navigate('Calendar')}/>}
                {page !== 'Spiritual' && page !== 'Overview' && widgetVisible('verse') && <Verse/>}
                <div className="rail-bottom-note"><span className="tiny-dot"/>A little progress, every day.</div></>}</aside>
          </div>
          <footer className="workspace-footer"><span><i className={`tiny-dot ${store.status === 'error' ? 'warning-dot' : ''}`}/>{saving > 0 ? 'Saving changes...' : store.status === 'error' ? 'Not connected to the server' : 'All changes saved'}</span><span>Made for a more intentional day<span className="footer-divider">/</span><span className="footer-brand">raqmi.</span></span></footer>
        </div>
      </main>
    </div>

    {newTask && <NewTaskModal onClose={() => setNewTask(false)} defaultGoalId={projectFilter} onCreated={message => { setNewTask(false); notify(message); }}/>}
    {newGoal && <NewGoalModal onClose={() => setNewGoal(false)} onCreated={message => { setNewGoal(false); notify(message); }}/>}
    {noteEditor && <NoteModal key={noteEditor === 'new' ? 'new' : noteEditor.id} note={noteEditor === 'new' ? null : noteEditor} onClose={() => setNoteEditor(null)} notify={notify} onSaved={() => { setNoteEditor(null); notify('Note saved'); }} onDelete={note => setConfirmDelete({ type: 'note', item: note })}/>}
    {eventDetail && <EventDetailModal event={eventDetail} onClose={() => setEventDetail(null)} notify={notify}/>}
    {report && <ReportModal metric={report.metric} range={report.range} onClose={() => setReport(null)} notify={notify}/>}
    {help && <Modal title="A calmer place to get things done" onClose={() => setHelp(false)}><div className="form-body"><p className="help-intro">Raqmi keeps your tasks, goals, notes, calendar, files, and one-time codes in one calm place. Everything is saved to your account as you go.</p><h3 className="help-heading">A few helpful shortcuts</h3><div className="shortcut-list"><div><span>Search your workspace</span><kbd>Ctrl / &#8984; K</kbd></div><div><span>Collapse or expand navigation</span><kbd>Ctrl / &#8984; B</kbd></div><div><span>Create a new task</span><kbd>N</kbd></div><div><span>Capture a note</span><kbd>Q</kbd></div><div><span>Search from anywhere</span><kbd>/</kbd></div><div><span>Close a dialog</span><kbd>Esc</kbd></div><div><span>Inspect a focused chart</span><kbd>&larr; &rarr;</kbd></div></div><p className="help-storage">Prayer times come from {prayer?.source || 'your configured provider'}; always consult your local mosque for verified times.</p></div><div className="modal-footer"><span>Everforest &middot; Inter &middot; JetBrains Mono</span><button className="button primary" onClick={() => setHelp(false)}>Back to work</button></div></Modal>}
    {searchOpen && <Modal title="Search workspace" onClose={() => setSearchOpen(false)} className="search-modal"><div className="command-input"><Icon name="search" size={20}/><input autoFocus aria-label="Search tasks, notes, goals, events, and pages" placeholder="Find a task, note, or page..." value={search} onChange={e => { setSearch(e.target.value); setSearchIndex(0); }} onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); setSearchIndex(i => Math.max(0, Math.min(i + 1, searchResults.length - 1))); } if (e.key === 'ArrowUp') { e.preventDefault(); setSearchIndex(i => Math.max(i - 1, 0)); } if (e.key === 'Enter' && searchResults[searchIndex]) { searchResults[searchIndex].action(); setSearchOpen(false); } }}/><button className="search-close-button" onClick={() => setSearchOpen(false)} aria-label="Close search"><kbd>Esc</kbd></button></div><div className="command-results"><span className="menu-label">{search ? `${searchResults.length} RESULTS` : 'QUICK ACCESS'}</span>{searchResults.map((result, index) => <button key={result.id} className={`command-result ${index === searchIndex ? 'selected' : ''}`} onMouseEnter={() => setSearchIndex(index)} onClick={() => { result.action(); setSearchOpen(false); }}><Icon name={result.icon} size={17}/><span><strong>{result.title}</strong><small>{result.kind}</small></span><Icon name="right" size={14}/></button>)}{!searchResults.length && <div className="empty-state compact-empty"><p>No matches for &ldquo;{search}&rdquo;.</p></div>}</div><div className="command-footer"><span><kbd>&uarr;</kbd><kbd>&darr;</kbd> to navigate</span><span><kbd>Enter</kbd> to open</span><span>Searches your loaded workspace</span></div></Modal>}
    {confirmDelete && <ConfirmModal title={`Delete this ${confirmDelete.type}?`} message={`"${confirmDelete.item.title}" will be permanently removed. This action cannot be undone.`} cancelLabel={`Keep ${confirmDelete.type}`} onClose={() => setConfirmDelete(null)} onConfirm={() => {
      const target = confirmDelete;
      setConfirmDelete(null);
      if (target.type === 'task') { setSelectedTask(null); void store.mutate('tasks:remove', { id: target.item.id }, ['tasks']).then(() => notify('Task deleted')).catch(fail); }
      else { setNoteEditor(null); void store.mutate('notes:remove', { id: target.item.id }, ['notes']).then(() => notify('Note deleted')).catch(fail); }
    }}/>}
    <div className={`toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">{toast && <><Icon name="check" size={16}/><span>{toast}</span><button className="icon-button compact" aria-label="Dismiss notification" onClick={() => setToast('')}><Icon name="close" size={13}/></button></>}</div>
  </div>;
}
