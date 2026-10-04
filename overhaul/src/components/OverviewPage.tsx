import { goalColor, useStore, type NoteView, type TaskView } from '../store';
import { shortDate } from '../utils/date';
import { MiniAuthenticator } from './AuthenticatorView';
import { FocusChart, type Metric, type Range, type Theme } from './FocusChart';
import { Icon } from './Icon';
import { TaskTable } from './TaskTable';
import { OverviewVerse } from './Verse';

/** Visible unless the user switched the widget off in Settings. */
export const useWidgetVisible = () => {
  const widgets = useStore(s => s.widgets);
  return (type: string) => widgets.find(w => w.type === type)?.visible ?? true;
};

export function OverviewPage({ theme, reducedMotion, refreshKey, selectedTaskId, onSelectTask, onAddTask, onOpenNote, onReport, onOpenAuthenticator, onAddAccount, navigate, notify }: {
  theme: Theme; reducedMotion: boolean; refreshKey: number; selectedTaskId?: string;
  onSelectTask: (task: TaskView) => void; onAddTask: () => void; onOpenNote: (note: NoteView) => void; onReport: (metric: Metric, range: Range) => void;
  onOpenAuthenticator: () => void; onAddAccount: () => void;
  navigate: (page: 'Tasks' | 'Goals' | 'Notes') => void; notify: (message: string) => void;
}) {
  const goals = useStore(s => s.goals), notes = useStore(s => s.notes);
  const visible = useWidgetVisible();

  return <>
    {(visible('verse') || visible('twoFactor')) && <section className="overview-anchors" aria-label="Daily anchors">
      {visible('verse') && <div className="metric"><OverviewVerse/></div>}
      {visible('twoFactor') && <div className="metric"><MiniAuthenticator notify={notify} onOpen={onOpenAuthenticator} onAdd={onAddAccount}/></div>}
    </section>}
    <FocusChart refreshKey={refreshKey} reducedMotion={reducedMotion} theme={theme} onReport={onReport}/>
    {visible('tasks') && <TaskTable onSelect={onSelectTask} onAdd={onAddTask} projectFilter={null} selectedId={selectedTaskId} onViewAll={() => navigate('Tasks')} onNotice={notify}/>}
    {(visible('goals') || visible('notes')) && <div className="bottom-split">
      {visible('goals') && <section className="goals-summary"><div className="section-heading"><h2>Goals in motion</h2><button className="icon-button compact" title="View goals" aria-label="View goals" onClick={() => navigate('Goals')}><Icon name="upRight" size={15}/></button></div>{goals.map(goal => <button className="goal-summary-item" key={goal.id} onClick={() => navigate('Goals')} title={goal.milestones.length ? `${goal.milestones.filter(m => m.completed).length} of ${goal.milestones.length} milestones complete` : `${goal.progress}% complete`}><span><strong><i style={{ background: goalColor(goals, goal.id) }}/>{goal.title}</strong><small>{goal.progress}%</small></span><span className="goal-progress-track"><span style={{ width: `${goal.progress}%`, background: goalColor(goals, goal.id) }}/></span></button>)}{!goals.length && <p className="muted-note">Set a goal to see it move here.</p>}</section>}
      {visible('notes') && <section className="pinned-notes"><div className="section-heading"><h2>Pinned notes</h2><button className="icon-button compact" title="View all notes" aria-label="View all notes" onClick={() => navigate('Notes')}><Icon name="upRight" size={15}/></button></div>{notes.filter(n => n.pinned).slice(0, 3).map(note => <button key={note.id} className="pinned-note" onClick={() => onOpenNote(note)} title={note.title}><Icon name="notes" size={14}/><span>{note.title}</span><small>{shortDate(note.updatedAt)}</small></button>)}{!notes.some(n => n.pinned) && <p className="muted-note">Pin a note to keep it close.</p>}</section>}
    </div>}
  </>;
}
