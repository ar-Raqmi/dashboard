import { useRef, useState } from 'react';
import { ConfirmModal } from '@/components/Modal';
import { Icon } from '@/components/Icon';
import { AuthenticatorPage } from '@/features/authenticator/AuthenticatorPage';
import { CalendarPage } from '@/features/calendar/CalendarPage';
import { EventDetailModal } from '@/features/calendar/CalendarView';
import { FilesPage } from '@/features/files/FilesPage';
import { GoalsPage } from '@/features/goals/GoalsPage';
import { NewGoalModal } from '@/features/goals/GoalsView';
import { NoteModal } from '@/features/notes/NoteModal';
import { NotesPage } from '@/features/notes/NotesPage';
import { OverviewPage } from '@/features/overview/OverviewPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { SpiritualPage } from '@/features/spiritual/SpiritualPage';
import { NewTaskModal } from '@/features/tasks/NewTaskModal';
import { TasksPage } from '@/features/tasks/TasksPage';
import { downloadScreenshot, exportWorkspace } from '@/lib/workspaceExport';
import { useStore, type EventView, type NoteView, type TaskView } from '@/store';
import { Footer } from './Footer';
import { ContextRail } from './ContextRail';
import { HelpModal } from './HelpModal';
import { PageHeading } from './PageHeading';
import { pageLabel, type Page } from './pages';
import { SearchPalette } from './SearchPalette';
import { Sidebar } from './Sidebar';
import { THEME_COLORS, useTheme } from './useTheme';
import { Toast } from './Toast';
import { Topbar } from './Topbar';
import { useDocumentChrome } from './useDocumentChrome';
import { useGlobalShortcuts } from './useGlobalShortcuts';
import { useToast } from './useToast';
import { useWorkspaceSync } from './useWorkspaceSync';

type DeleteTarget = { type: 'task'; item: TaskView } | { type: 'note'; item: NoteView };

export function Workspace() {
  const store = useStore();
  const { tasks, preferences } = store;
  const { message, notify, fail, dismiss } = useToast();
  const { theme, setTheme } = useTheme();
  const { refreshing, refresh } = useWorkspaceSync(notify);

  const [page, setPage] = useState<Page>('Overview');
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState<string | null>(null);
  const [newTask, setNewTask] = useState(false), [newGoal, setNewGoal] = useState(false), [addingAccount, setAddingAccount] = useState(false);
  const [noteEditor, setNoteEditor] = useState<NoteView | 'new' | null>(null);
  const [eventDetail, setEventDetail] = useState<EventView | null>(null);
  const [help, setHelp] = useState(false), [searchOpen, setSearchOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<DeleteTarget | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const uploadTrigger = useRef<(() => void) | null>(null);

  const collapsed = !!preferences.sidebarCollapsed;
  const activeTask = tasks.find(t => t.id === selectedTask);
  useDocumentChrome(pageLabel(page));
  useGlobalShortcuts({
    onSearch: () => setSearchOpen(open => !open),
    onNewTask: () => setNewTask(true),
    onNewNote: () => setNoteEditor('new'),
    onEscape: () => setMobileNav(false),
  });

  function navigate(next: Page) {
    setPage(next); setCalendarDate(null); setSelectedTask(null); setMobileNav(false);
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }
  const setCollapsed = (value: boolean) => void store.updatePreferences({ sidebarCollapsed: value }).catch(fail);

  async function saveScreenshot() {
    notify('Preparing your screenshot...');
    try {
      await downloadScreenshot({ background: THEME_COLORS[theme], name: `raqmi-${page.toLowerCase()}-screenshot.png` });
      notify('Screenshot downloaded');
    } catch { notify('Screenshot export is unavailable here. Use your browser screenshot tool instead.'); }
  }

  function confirmRemoval() {
    const target = confirmDelete;
    if (!target) return;
    setConfirmDelete(null);
    if (target.type === 'task') {
      setSelectedTask(null);
      void store.mutate('tasks:remove', { id: target.item.id }, ['tasks']).then(() => notify('Task deleted')).catch(fail);
    } else {
      setNoteEditor(null);
      void store.mutate('notes:remove', { id: target.item.id }, ['notes']).then(() => notify('Note deleted')).catch(fail);
    }
  }

  const primaryAction = page === 'Settings' ? null : (() => {
    const [label, icon, onClick] =
      page === 'Notes' ? ['New note', 'plus', () => setNoteEditor('new')] as const
      : page === 'Files' ? ['Add files', 'upload', () => uploadTrigger.current?.()] as const
      : page === 'Goals' ? ['New project', 'plus', () => setNewGoal(true)] as const
      : page === 'Authenticator' ? ['Add account', 'plus', () => setAddingAccount(true)] as const
      : ['New task', 'plus', () => setNewTask(true)] as const;
    return <button className="button primary" onClick={onClick}><Icon name={icon} size={15}/>{label}</button>;
  })();

  return <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''} ${mobileNav ? 'mobile-nav-open' : ''} ${preferences.compact ? 'compact-density' : ''}`}>
    <a href="#main-content" className="skip-link">Skip to content</a>
    {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)}/>}
    <Sidebar page={page} collapsed={collapsed} onNavigate={navigate} onToggleCollapsed={() => setCollapsed(!collapsed)} onQuickCapture={() => setNoteEditor('new')} onExported={() => notify('Workspace exported')}/>
    <div className="workspace-shell">
      <Topbar
        pageTitle={pageLabel(page)} collapsed={collapsed} theme={theme} onError={fail}
        onOpenNav={() => setMobileNav(true)} onExpand={() => setCollapsed(false)} onSearch={() => setSearchOpen(true)}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} onNavigate={navigate} onOpenEvent={setEventDetail}
        onExport={() => { exportWorkspace(); notify('Workspace exported'); }} onScreenshot={saveScreenshot} onHelp={() => setHelp(true)}
      />
      <main className="main-content" id="main-content" ref={mainRef}>
        <div className="page-content">
          <PageHeading page={page} refreshing={refreshing} onRefresh={() => void refresh()} action={primaryAction}/>
          {store.status === 'error' && <div className="security-notice"><Icon name="info" size={19}/><p><strong>Could not load your workspace.</strong> {store.error} <button className="text-button" style={{ display: 'inline-flex' }} onClick={() => void refresh()}>Try again</button></p></div>}
          <div className={`content-grid ${activeTask ? 'has-task-detail' : ''}`}>
            <div className="primary-content" key={page}>
              {store.status === 'loading' ? <div className="chart-canvas is-loading" aria-label="Loading your workspace"><div className="chart-skeleton"><div/><div/><div/><div/></div></div> : <>
                {page === 'Overview' && <OverviewPage selectedTaskId={selectedTask || undefined} onSelectTask={t => setSelectedTask(t.id)} onAddTask={() => setNewTask(true)} onOpenNote={setNoteEditor} onEvent={setEventDetail} onOpenDay={date => { navigate('Calendar'); setCalendarDate(date); }} onOpenAuthenticator={() => navigate('Authenticator')} onAddAccount={() => { navigate('Authenticator'); setAddingAccount(true); }} navigate={navigate} notify={notify}/>}
                {page === 'Tasks' && <TasksPage selectedTaskId={selectedTask || undefined} onSelectTask={t => setSelectedTask(t.id)} onAddTask={() => setNewTask(true)} notify={notify}/>}
                {page === 'Calendar' && <CalendarPage key={calendarDate || 'today'} onEvent={setEventDetail} initialDate={calendarDate || undefined}/>}
                {page === 'Notes' && <NotesPage onOpenNote={setNoteEditor}/>}
                {page === 'Goals' && <GoalsPage notify={notify}/>}
                {page === 'Spiritual' && <SpiritualPage onManageClocks={() => navigate('Settings')}/>}
                {page === 'Files' && <FilesPage notify={notify} uploadTrigger={uploadTrigger}/>}
                {page === 'Authenticator' && <AuthenticatorPage notify={notify} adding={addingAccount} setAdding={setAddingAccount}/>}
                {page === 'Settings' && <SettingsPage theme={theme} setTheme={setTheme} notify={notify}/>}
              </>}
            </div>
            <ContextRail page={page} activeTask={activeTask} onCloseTask={() => setSelectedTask(null)} onDeleteTask={task => setConfirmDelete({ type: 'task', item: task })} onOpenEvent={setEventDetail} onOpenCalendar={() => navigate('Calendar')} notify={notify}/>
          </div>
          <Footer/>
        </div>
      </main>
    </div>

    {newTask && <NewTaskModal onClose={() => setNewTask(false)} onCreated={m => { setNewTask(false); notify(m); }}/>}
    {newGoal && <NewGoalModal onClose={() => setNewGoal(false)} onCreated={m => { setNewGoal(false); notify(m); }}/>}
    {noteEditor && <NoteModal key={noteEditor === 'new' ? 'new' : noteEditor.id} note={noteEditor === 'new' ? null : noteEditor} onClose={() => setNoteEditor(null)} notify={notify} onSaved={() => { setNoteEditor(null); notify('Note saved'); }} onDelete={note => setConfirmDelete({ type: 'note', item: note })}/>}
    {eventDetail && <EventDetailModal event={eventDetail} onClose={() => setEventDetail(null)} notify={notify}/>}
    {help && <HelpModal onClose={() => setHelp(false)}/>}
    {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} onNavigate={navigate} onSelectTask={setSelectedTask} onOpenNote={setNoteEditor} onOpenEvent={setEventDetail}/>}
    {confirmDelete && <ConfirmModal title={`Delete this ${confirmDelete.type}?`} message={`"${confirmDelete.item.title}" will be permanently removed. This action cannot be undone.`} cancelLabel={`Keep ${confirmDelete.type}`} onClose={() => setConfirmDelete(null)} onConfirm={confirmRemoval}/>}
    <Toast message={message} onDismiss={dismiss}/>
  </div>;
}
