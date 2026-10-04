import { useMemo } from 'react';
import { goalColor, useStore, type NoteView, type TaskView } from '../store';
import { addDays, shortDate, todayKey } from '../utils/date';
import { activitySeries, dailyCounts, FocusChart, type Metric, type Range, type Theme } from './FocusChart';
import { Icon } from './Icon';
import { Sparkline } from './Sparkline';
import { TaskTable } from './TaskTable';

/** Visible unless the user switched the widget off in Settings. */
export const useWidgetVisible = () => {
  const widgets = useStore(s => s.widgets);
  return (type: string) => widgets.find(w => w.type === type)?.visible ?? true;
};

export function OverviewPage({ theme, reducedMotion, refreshKey, selectedTaskId, onSelectTask, onAddTask, onOpenNote, onReport, navigate, notify }: {
  theme: Theme; reducedMotion: boolean; refreshKey: number; selectedTaskId?: string;
  onSelectTask: (task: TaskView) => void; onAddTask: () => void; onOpenNote: (note: NoteView) => void; onReport: (metric: Metric, range: Range) => void;
  navigate: (page: 'Tasks' | 'Goals' | 'Notes') => void; notify: (message: string) => void;
}) {
  const tasks = useStore(s => s.tasks), completions = useStore(s => s.completions), goals = useStore(s => s.goals), notes = useStore(s => s.notes);
  const visible = useWidgetVisible();
  const today = todayKey(), weekStart = addDays(today, -6);
  const done = useMemo(() => activitySeries('7', dailyCounts('completed', tasks, completions)), [tasks, completions]);
  const created = useMemo(() => activitySeries('7', dailyCounts('created', tasks, completions)), [tasks, completions]);
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const doneCount = sum(done.current), doneDelta = doneCount - sum(done.previous);
  const createdCount = sum(created.current), createdDelta = createdCount - sum(created.previous);
  const dueThisWeek = tasks.filter(t => t.status !== 'completed' && t.dueDate && t.dueDate >= weekStart && t.dueDate <= today).length;
  const totalProgress = Math.round(goals.reduce((s, g) => s + g.progress, 0) / (goals.length || 1));
  const finished = goals.filter(g => g.progress >= 100).length;
  const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

  return <>
    <section className="metrics-row" aria-label="Weekly key metrics">
      <div className="metric primary-metric"><div className="metric-label">Tasks completed<Icon name="tasks" size={14}/></div><div className="metric-number" title={`${doneCount} completed in the last 7 days; ${dueThisWeek} more were due this week and are still open`}>{doneCount}<span>/ {doneCount + dueThisWeek}</span><Sparkline data={done.current} unit="tasks"/></div><div className={`metric-change ${doneDelta === 0 ? 'neutral-change' : ''}`}><Icon name="upRight" size={12}/><strong>{signed(doneDelta)}</strong><span>vs. last week</span></div></div>
      <div className="metric"><div className="metric-label">Tasks created<Icon name="plus" size={14}/></div><div className="metric-number" title={`${createdCount} tasks added in the last 7 days`}>{createdCount}<Sparkline data={created.current} unit="tasks"/></div><div className={`metric-change ${createdDelta === 0 ? 'neutral-change' : ''}`}><Icon name="upRight" size={12}/><strong>{signed(createdDelta)}</strong><span>vs. last week</span></div></div>
      <div className="metric"><div className="metric-label">Goal progress<Icon name="flag" size={14}/></div><div className="metric-number" title={`Average progress across ${goals.length} goals`}>{totalProgress}<span className="percentage-symbol">%</span><svg className="metric-ring" width="38" height="38" viewBox="0 0 38 38" aria-label={`${totalProgress}% complete`}><circle cx="19" cy="19" r="15" fill="none" stroke="var(--bg2)" strokeWidth="3"/><circle cx="19" cy="19" r="15" fill="none" stroke="var(--aqua)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${totalProgress * 0.9425} 94.25`} transform="rotate(-90 19 19)"/></svg></div><div className="metric-change neutral-change"><span className="tiny-dot"/><strong>{goals.length} goal{goals.length === 1 ? '' : 's'}</strong><span>{finished ? `${finished} complete` : 'in motion'}</span></div></div>
    </section>
    <FocusChart refreshKey={refreshKey} reducedMotion={reducedMotion} theme={theme} onReport={onReport}/>
    {visible('tasks') && <TaskTable onSelect={onSelectTask} onAdd={onAddTask} projectFilter={null} selectedId={selectedTaskId} onViewAll={() => navigate('Tasks')} onNotice={notify}/>}
    {(visible('goals') || visible('notes')) && <div className="bottom-split">
      {visible('goals') && <section className="goals-summary"><div className="section-heading"><h2>Goals in motion</h2><button className="icon-button compact" title="View goals" aria-label="View goals" onClick={() => navigate('Goals')}><Icon name="upRight" size={15}/></button></div>{goals.map(goal => <button className="goal-summary-item" key={goal.id} onClick={() => navigate('Goals')} title={goal.milestones.length ? `${goal.milestones.filter(m => m.completed).length} of ${goal.milestones.length} milestones complete` : `${goal.progress}% complete`}><span><strong><i style={{ background: goalColor(goals, goal.id) }}/>{goal.title}</strong><small>{goal.progress}%</small></span><span className="goal-progress-track"><span style={{ width: `${goal.progress}%`, background: goalColor(goals, goal.id) }}/></span></button>)}{!goals.length && <p className="muted-note">Set a goal to see it move here.</p>}</section>}
      {visible('notes') && <section className="pinned-notes"><div className="section-heading"><h2>Pinned notes</h2><button className="icon-button compact" title="View all notes" aria-label="View all notes" onClick={() => navigate('Notes')}><Icon name="upRight" size={15}/></button></div>{notes.filter(n => n.pinned).slice(0, 3).map(note => <button key={note.id} className="pinned-note" onClick={() => onOpenNote(note)} title={note.title}><Icon name="notes" size={14}/><span>{note.title}</span><small>{shortDate(note.updatedAt)}</small></button>)}{!notes.some(n => n.pinned) && <p className="muted-note">Pin a note to keep it close.</p>}</section>}
    </div>}
  </>;
}
