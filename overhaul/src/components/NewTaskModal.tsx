import { useState, type FormEvent } from 'react';
import { useStore, type Priority } from '../store';
import { todayKey } from '../utils/date';
import { Icon } from './Icon';
import { Modal } from './Modal';

/** Repeat presets shared by tasks and events; values are RRULE bodies. */
export const REPEAT_OPTIONS = [
  ['', 'Does not repeat'],
  ['FREQ=DAILY', 'Every day'],
  ['FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', 'Every weekday'],
  ['FREQ=WEEKLY', 'Every week'],
  ['FREQ=MONTHLY', 'Every month'],
  ['FREQ=YEARLY', 'Every year'],
] as const;

export function repeatLabel(rrule: string | null) {
  if (!rrule) return 'Does not repeat';
  return REPEAT_OPTIONS.find(([value]) => value && rrule.startsWith(value) && (value.includes('BYDAY') || !rrule.includes('BYDAY')))?.[1] ?? 'Custom repeat';
}

export function NewTaskModal({ onClose, onCreated, defaultGoalId }: { onClose: () => void; onCreated: (message: string) => void; defaultGoalId: string | null }) {
  const goals = useStore(s => s.goals), mutate = useStore(s => s.mutate);
  const [title, setTitle] = useState(''), [goalId, setGoalId] = useState(defaultGoalId || ''), [due, setDue] = useState(todayKey());
  const [priority, setPriority] = useState<Priority>('medium'), [description, setDescription] = useState(''), [rrule, setRrule] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await mutate('tasks:create', { title: title.trim(), description, goalId: goalId || null, dueDate: due || null, priority, rrule: rrule || null, dtstart: rrule ? due || todayKey() : undefined }, ['tasks']);
      onCreated('Task created');
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return <Modal title="Create a task" onClose={onClose}><form onSubmit={submit}><div className="form-body">
    <label className="form-label">Task name<input autoFocus required maxLength={300} placeholder="What needs to get done?" value={title} onChange={e => setTitle(e.target.value)}/></label>
    <label className="form-label">Description <span>(optional)</span><textarea placeholder="Add context, links, or a next step..." rows={3} value={description} onChange={e => setDescription(e.target.value)}/></label>
    <div className="form-grid"><label className="form-label">Project<select value={goalId} onChange={e => setGoalId(e.target.value)}><option value="">No project</option>{goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}</select></label><label className="form-label">Priority<select value={priority} onChange={e => setPriority(e.target.value as Priority)}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label></div>
    <div className="form-grid"><label className="form-label">{rrule ? 'Starts on' : 'Due date'}<input type="date" required={!!rrule} value={due} onChange={e => setDue(e.target.value)}/></label><label className="form-label">Repeat<select value={rrule} onChange={e => setRrule(e.target.value)}>{REPEAT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    {error && <p className="form-error" role="alert">{error}</p>}
  </div><div className="modal-footer"><span>Saved to your workspace</span><div><button type="button" className="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit" disabled={busy}><Icon name="plus" size={15}/>{busy ? 'Creating...' : 'Create task'}</button></div></div></form></Modal>;
}
