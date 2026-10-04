import { useState, type FormEvent } from 'react';
import { goalColor, useStore, type GoalView } from '../store';
import { cn } from '../utils/cn';
import { Icon } from './Icon';
import { ConfirmModal, Modal } from './Modal';

export function GoalsView({ onOpenProject, notify }: { onOpenProject: (goalId: string) => void; notify: (message: string) => void }) {
  const goals = useStore(s => s.goals), tasks = useStore(s => s.tasks);
  const toggleMilestone = useStore(s => s.toggleMilestone), mutate = useStore(s => s.mutate);
  const [deleting, setDeleting] = useState<GoalView | null>(null), [renaming, setRenaming] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const fail = (err: unknown) => notify((err as Error).message);

  if (!goals.length) return <div className="goals-view"><div className="empty-state"><Icon name="flag" size={36}/><h3>Small steps start here</h3><p>Create a project with a few milestones, then file tasks under it.</p></div></div>;

  function addMilestone(e: FormEvent, goal: GoalView) {
    e.preventDefault();
    const label = drafts[goal.id]?.trim();
    if (!label) return;
    setDrafts(d => ({ ...d, [goal.id]: '' }));
    void mutate('goals:addMilestone', { goalId: goal.id, label }, ['goals']).catch(fail);
  }

  function move(goal: GoalView, delta: number) {
    const ids = goals.map(g => g.id), from = ids.indexOf(goal.id), to = from + delta;
    if (to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    void mutate('goals:reorder', { ids }, ['goals']).catch(fail);
  }

  return <div className="goals-view">{goals.map((goal, index) => {
    const color = goalColor(goals, goal.id), done = goal.milestones.filter(m => m.completed).length, total = goal.milestones.length;
    const openTasks = tasks.filter(t => t.goalId === goal.id && t.status !== 'completed').length;
    return <section key={goal.id} className="goal-detail">
      <div className="goal-detail-heading"><div>
        <div className="goal-project-label"><i style={{ background: color }}/><span>PROJECT</span>
          <span className="ml-auto flex gap-1"><button className="icon-button compact" title="Move up" aria-label={`Move ${goal.title} up`} disabled={index === 0} onClick={() => move(goal, -1)}><span className="inline-flex rotate-180"><Icon name="down" size={13}/></span></button><button className="icon-button compact" title="Move down" aria-label={`Move ${goal.title} down`} disabled={index === goals.length - 1} onClick={() => move(goal, 1)}><Icon name="down" size={13}/></button><button className="icon-button compact" title="Rename project" aria-label={`Rename ${goal.title}`} onClick={() => setRenaming(goal.id)}><Icon name="pen" size={13}/></button><button className="icon-button compact danger-button" title="Delete project" aria-label={`Delete ${goal.title}`} onClick={() => setDeleting(goal)}><Icon name="trash" size={13}/></button></span>
        </div>
        {renaming === goal.id
          ? <input className="note-title-input" aria-label="Project name" autoFocus defaultValue={goal.title} maxLength={200} onBlur={e => { setRenaming(null); const v = e.target.value.trim(); if (v && v !== goal.title) void mutate('goals:update', { id: goal.id, title: v }, ['goals']).catch(fail); }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setRenaming(null); }}/>
          : <h2>{goal.title}</h2>}
        <p><button className="text-button" onClick={() => onOpenProject(goal.id)}>{openTasks ? `${openTasks} open task${openTasks === 1 ? '' : 's'}` : 'No open tasks'}<Icon name="arrow" size={12}/></button></p>
      </div><span className="goal-big-percentage">{goal.progress}<small>%</small></span></div>
      <div className="goal-progress-track" role="progressbar" aria-valuenow={goal.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${goal.title} progress`} title={total ? `${done} of ${total} milestones completed` : `${goal.progress}% complete`}><span style={{ width: `${goal.progress}%`, background: color }}/></div>
      <div className="goal-progress-meta"><span>{total ? `${done} of ${total} milestones complete` : 'No milestones yet. Set progress manually or add one below.'}</span><span>{goal.progress >= 100 ? 'Complete' : goal.progress > 0 ? 'In motion' : 'Not started'}</span></div>
      {!total && <input type="range" min={0} max={100} step={5} defaultValue={goal.progress} aria-label={`${goal.title} progress`} className="mt-3 w-full" onPointerUp={e => void mutate('goals:update', { id: goal.id, progress: Number(e.currentTarget.value) }, ['goals']).catch(fail)} onKeyUp={e => void mutate('goals:update', { id: goal.id, progress: Number(e.currentTarget.value) }, ['goals']).catch(fail)}/>}
      <div className="milestone-list">{goal.milestones.map(m => <div key={m.id} className="group flex items-center">
        <button className={cn('flex flex-1 items-center gap-[9px] px-1 py-2.5 text-left text-xs text-[var(--subtle)] hover:text-[var(--fg)]', m.completed && 'text-[var(--muted)] line-through')} aria-pressed={m.completed} onClick={() => void toggleMilestone(goal.id, m.id).catch(fail)}><span className={`task-checkbox ${m.completed ? 'checked' : ''}`}>{m.completed && <Icon name="check" size={11}/>}</span>{m.label}</button>
        <button className="icon-button compact opacity-0 group-hover:opacity-100 focus:opacity-100" title="Remove milestone" aria-label={`Remove ${m.label}`} onClick={() => void mutate('goals:removeMilestone', { id: m.id }, ['goals']).catch(fail)}><Icon name="close" size={13}/></button>
      </div>)}</div>
      <form className="inline-search mt-3" onSubmit={e => addMilestone(e, goal)}><Icon name="plus" size={14}/><input aria-label={`Add a milestone to ${goal.title}`} placeholder="Add a milestone..." maxLength={300} value={drafts[goal.id] || ''} onChange={e => setDrafts(d => ({ ...d, [goal.id]: e.target.value }))}/></form>
    </section>;
  })}
    {deleting && <ConfirmModal title="Delete this project?" message={`"${deleting.title}" and its milestones will be removed. Tasks filed under it stay, without a project.`} onClose={() => setDeleting(null)} onConfirm={() => { const goal = deleting; setDeleting(null); void mutate('goals:remove', { id: goal.id }, ['goals', 'tasks']).then(() => notify('Project deleted')).catch(fail); }}/>}
  </div>;
}

export function NewGoalModal({ onClose, onCreated }: { onClose: () => void; onCreated: (message: string) => void }) {
  const mutate = useStore(s => s.mutate);
  const [title, setTitle] = useState(''), [milestones, setMilestones] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await mutate('goals:create', { title: title.trim(), milestones: milestones.split('\n').map(s => s.trim()).filter(Boolean) }, ['goals']);
      onCreated('Project created');
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }
  return <Modal title="Create a project" onClose={onClose}><form onSubmit={submit}><div className="form-body">
    <label className="form-label">Project name<input autoFocus required maxLength={200} placeholder="What are you working toward?" value={title} onChange={e => setTitle(e.target.value)}/></label>
    <label className="form-label">Milestones <span>(one per line, optional)</span><textarea rows={5} placeholder={'First step\nSecond step'} value={milestones} onChange={e => setMilestones(e.target.value)}/></label>
    {error && <p className="form-error" role="alert">{error}</p>}
  </div><div className="modal-footer"><span>File tasks under it later</span><div><button type="button" className="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit" disabled={busy}><Icon name="plus" size={15}/>{busy ? 'Creating...' : 'Create project'}</button></div></div></form></Modal>;
}
