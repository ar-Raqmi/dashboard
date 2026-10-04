import { useNoteWrap } from '../hooks/useNoteWrap';
import { goalColor, isGoalComplete, useStore, type EventView, type NoteView, type TaskView } from '../store';
import { shortDate } from '../utils/date';
import { MiniAuthenticator } from './AuthenticatorView';
import { ClipboardCard } from './ClipboardCard';
import { Icon } from './Icon';
import { Markdown } from './Markdown';
import { MiniCalendar } from './MiniCalendar';
import { TaskTable } from './TaskTable';
import { OverviewVerse } from './Verse';

/** Visible unless the user switched the widget off in Settings. */
export const useWidgetVisible = () => {
  const widgets = useStore(s => s.widgets);
  return (type: string) => widgets.find(w => w.type === type)?.visible ?? true;
};

export function OverviewPage({ selectedTaskId, onSelectTask, onAddTask, onOpenNote, onEvent, onOpenDay, onOpenAuthenticator, onAddAccount, navigate, notify }: {
  selectedTaskId?: string;
  onSelectTask: (task: TaskView) => void; onAddTask: () => void; onOpenNote: (note: NoteView) => void;
  onEvent: (event: EventView) => void; onOpenDay: (date: string) => void;
  onOpenAuthenticator: () => void; onAddAccount: () => void;
  navigate: (page: 'Tasks' | 'Goals' | 'Notes') => void; notify: (message: string) => void;
}) {
  const goals = useStore(s => s.goals), notes = useStore(s => s.notes);
  const visible = useWidgetVisible();
  const [wrap80] = useNoteWrap();

  return <>
    {(visible('verse') || visible('clipboard') || visible('twoFactor')) && <section className="overview-anchors" aria-label="Daily anchors">
      {visible('verse') && <div className="metric anchor-verse"><OverviewVerse/></div>}
      {visible('clipboard') && <div className="metric anchor-clipboard"><ClipboardCard notify={notify}/></div>}
      {visible('twoFactor') && <div className="metric anchor-codes"><MiniAuthenticator notify={notify} onOpen={onOpenAuthenticator} onAdd={onAddAccount}/></div>}
    </section>}
    <MiniCalendar onEvent={onEvent} onOpenDay={onOpenDay}/>
    {visible('tasks') && <TaskTable onSelect={onSelectTask} onAdd={onAddTask} projectFilter={null} selectedId={selectedTaskId} onViewAll={() => navigate('Tasks')} onNotice={notify}/>}
    {(visible('goals') || visible('notes')) && <div className="bottom-split">
      {visible('goals') && <section className="goals-summary"><div className="section-heading"><h2>Projects in motion</h2><button className="icon-button compact" title="View projects" aria-label="View projects" onClick={() => navigate('Goals')}><Icon name="upRight" size={15}/></button></div>{goals.filter(g => !isGoalComplete(g)).map(goal => <button className="goal-summary-item" key={goal.id} onClick={() => navigate('Goals')} title={goal.milestones.length ? `${goal.milestones.filter(m => m.completed).length} of ${goal.milestones.length} milestones complete` : `${goal.progress}% complete`}><span><strong><i style={{ background: goalColor(goals, goal.id) }}/>{goal.title}</strong><small>{goal.progress}%</small></span><span className="goal-progress-track"><span style={{ width: `${goal.progress}%`, background: goalColor(goals, goal.id) }}/></span></button>)}{!goals.some(g => !isGoalComplete(g)) && <p className="muted-note">{goals.length ? 'No ongoing projects.' : 'Create a project to see it move here.'}</p>}</section>}
      {visible('notes') && <section className="pinned-notes"><div className="section-heading"><h2>Pinned notes</h2><button className="icon-button compact" title="View all notes" aria-label="View all notes" onClick={() => navigate('Notes')}><Icon name="upRight" size={15}/></button></div>{notes.filter(n => n.pinned).slice(0, 3).map(note => <button key={note.id} className="pinned-note" onClick={() => onOpenNote(note)} title={note.title}><span className="pinned-note-icon" style={{ color: note.color }}><Icon name="notes" size={14}/></span><span className="pinned-note-body"><span className="pinned-note-title">{note.title}</span><Markdown source={note.content} empty="Empty note" className={`pinned-note-preview ${wrap80 ? 'wrap-80' : ''}`} inert/></span><small>{shortDate(note.updatedAt)}</small></button>)}{!notes.some(n => n.pinned) && <p className="muted-note">Pin a note to keep it close.</p>}</section>}
    </div>}
  </>;
}
