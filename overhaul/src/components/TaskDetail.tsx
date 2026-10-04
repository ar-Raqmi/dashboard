import { useState } from 'react';
import { useStore, type Priority, type TaskStatus, type TaskView } from '../store';
import { shortDate } from '../utils/date';
import { initialsOf } from '../utils/text';
import { Icon } from './Icon';
import { repeatLabel } from './NewTaskModal';

export const statusLabel = (s: TaskStatus) => (s === 'completed' ? 'Completed' : s === 'in_progress' ? 'In progress' : 'To do');

export function TaskDetail({ task, onClose, onDelete, onNotice }: { task: TaskView; onClose: () => void; onDelete: (task: TaskView) => void; onNotice: (message: string) => void }) {
  const updateTask = useStore(s => s.updateTask), toggleTask = useStore(s => s.toggleTask), mutate = useStore(s => s.mutate);
  const profileName = useStore(s => s.settings?.profileName || '');
  const [editingTitle, setEditingTitle] = useState(false);
  const fail = (err: unknown) => onNotice((err as Error).message);
  const update = (patch: Parameters<typeof updateTask>[1]) => void updateTask(task.id, patch).catch(fail);
  const done = task.status === 'completed';
  const initials = initialsOf(profileName);

  return <section className="task-detail"><div className="detail-overline"><span>{task.isRecurring ? 'REPEATING TASK' : 'TASK'}</span><button className="icon-button compact" onClick={onClose} title="Close task details" aria-label="Close task details"><Icon name="close" size={16}/></button></div>
    {editingTitle
      ? <input className="note-title-input" aria-label="Task name" autoFocus defaultValue={task.title} maxLength={300} onBlur={e => { setEditingTitle(false); const v = e.target.value.trim(); if (v && v !== task.title) update({ title: v }); }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditingTitle(false); }}/>
      : <h2 onDoubleClick={() => setEditingTitle(true)} title="Double-click to rename">{task.title}</h2>}
    <button className={`button detail-complete ${done ? 'completed' : ''}`} onClick={() => void toggleTask(task).then(() => task.isRecurring && onNotice('Occurrence completed. Next one scheduled.')).catch(fail)}><Icon name="check" size={15}/>{done ? 'Completed' : task.isRecurring ? 'Complete this occurrence' : 'Mark complete'}</button>
    <div className="detail-fields">
      <label><span>Status</span><select value={task.status} disabled={task.isRecurring} onChange={e => update({ status: e.target.value as TaskStatus })}><option value="pending">To do</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></label>
      <label><span>Priority</span><select value={task.priority} onChange={e => update({ priority: e.target.value as Priority })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
      <label><span>{task.isRecurring ? 'Next date' : 'Due date'}</span><input aria-label="Task due date" type="date" value={task.dueDate || ''} disabled={task.isRecurring} onChange={e => update({ dueDate: e.target.value || null })}/></label>
    </div>
    {task.rrule && <div className="detail-fields"><label><span>Repeat</span><span className="flex items-center justify-between gap-2"><span>{repeatLabel(task.rrule)}</span><button className="text-button" onClick={() => void mutate('tasks:update', { id: task.id, clearRecurrence: true }, ['tasks']).then(() => onNotice('Task no longer repeats')).catch(fail)}>Stop repeating</button></span></label></div>}
    <label className="description-label">Description<textarea key={task.id} defaultValue={task.description} onBlur={e => { if (e.target.value !== task.description) update({ description: e.target.value }); }} placeholder="Add a little context..." rows={4}/></label>
    <div className="detail-activity"><h3>Activity</h3><div><span className="avatar mini-avatar">{initials}</span><p>Added to your workspace<small>Created {shortDate(task.createdAt)}{task.isRecurring ? ` · ${repeatLabel(task.rrule)}` : ''}</small></p></div></div>
    <button className="text-button danger-button" onClick={() => onDelete(task)}><Icon name="trash" size={14}/>Delete task</button></section>;
}
