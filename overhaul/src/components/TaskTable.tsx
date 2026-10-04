import { useEffect, useRef, useState } from 'react';
import { goalColor, isActionable, taskDate, useStore, type Priority, type TaskView } from '../store';
import { downloadFile, dueLabel, todayKey } from '../utils/date';
import { Icon } from './Icon';
import { PriorityMark } from './PriorityMark';
import { statusLabel } from './TaskDetail';

type Tab = 'all' | 'today' | 'upcoming' | 'completed';
type SortKey = 'title' | 'project' | 'due' | 'priority';
const PRIORITY_ORDER: Priority[] = ['high', 'medium', 'low'];

export function TaskTable({ onSelect, onAdd, full = false, projectFilter, onViewAll, selectedId, onNotice }: { onSelect: (task: TaskView) => void; onAdd: () => void; full?: boolean; projectFilter: string | null; onViewAll: () => void; selectedId?: string; onNotice: (message: string) => void }) {
  const tasks = useStore(s => s.tasks), goals = useStore(s => s.goals), toggleTask = useStore(s => s.toggleTask), mutate = useStore(s => s.mutate);
  const [tab, setTab] = useState<Tab>('all'), [filterOpen, setFilterOpen] = useState(false), [priority, setPriority] = useState<Priority | 'all'>('all');
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'due', desc: false });
  const filterRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (e: MouseEvent) => { if (!filterRef.current?.contains(e.target as Node)) setFilterOpen(false); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, []);

  const today = todayKey();
  const projectName = (t: TaskView) => goals.find(g => g.id === t.goalId)?.title || 'No project';
  const open = (t: TaskView) => t.status !== 'completed';
  const base = projectFilter ? tasks.filter(t => t.goalId === projectFilter) : tasks;
  // Future occurrences of a repeating task stay out of All/Today until their day arrives; Upcoming still lists them.
  const inTab = (t: TaskView, which: Tab) => { const date = taskDate(t); return which === 'all' ? isActionable(t, today) : which === 'today' ? isActionable(t, today) && !!date && date <= today : which === 'upcoming' ? open(t) && !!date && date > today : !open(t); };
  const counts = { all: base.filter(t => inTab(t, 'all')).length, today: base.filter(t => inTab(t, 'today')).length, upcoming: base.filter(t => inTab(t, 'upcoming')).length, completed: base.filter(t => inTab(t, 'completed')).length };
  const filtered = base.filter(t => inTab(t, tab) && (priority === 'all' || t.priority === priority));
  const value = (t: TaskView, key: SortKey) => key === 'title' ? t.title : key === 'project' ? projectName(t) : key === 'due' ? t.dueDate || '9999' : String(PRIORITY_ORDER.indexOf(t.priority));
  const sorted = [...filtered].sort((a, b) => { const c = value(a, sort.key).localeCompare(value(b, sort.key)); return sort.desc ? -c : c; });
  const visible = full ? sorted : sorted.slice(0, 6), overdue = base.filter(t => open(t) && t.dueDate && t.dueDate < today).length;
  const changeSort = (key: SortKey) => setSort({ key, desc: sort.key === key ? !sort.desc : false });
  const fail = (err: unknown) => onNotice((err as Error).message);

  function completeVisible() {
    const incomplete = visible.filter(open);
    if (!incomplete.length) return;
    void Promise.all(incomplete.map(t => toggleTask(t))).then(() => onNotice('Visible tasks marked complete')).catch(fail);
  }
  function exportCsv() {
    const cell = (v: string) => `"${(/^[=+@\-\t\r]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;
    const csv = ['Task,Project,Due date,Priority,Status,Description', ...sorted.map(t => [t.title, projectName(t), t.dueDate || '', t.priority, statusLabel(t.status), t.description].map(cell).join(','))].join('\n');
    downloadFile(csv, 'raqmi-tasks.csv', 'text/csv');
    onNotice('Task export downloaded');
  }

  return <section className={`task-section ${full ? 'full-table' : ''}`} aria-label="Your tasks">
    <div className="section-heading">
      <div className="heading-with-count"><h2>{projectFilter ? goals.find(g => g.id === projectFilter)?.title || 'Project' : 'Your tasks'}</h2><span className="count-label">{counts.all}</span>{overdue > 0 && <span className="overdue-count"><span className="tiny-dot"/>{overdue} overdue</span>}</div>
      <div className="section-actions"><div className="popover-anchor" ref={filterRef}><button className={`small-button ${priority !== 'all' ? 'is-filtered' : ''}`} onClick={() => setFilterOpen(!filterOpen)} aria-expanded={filterOpen}><Icon name="filter" size={15}/>Filter{priority !== 'all' && <span className="filter-number">1</span>}</button>{filterOpen && <div className="popover filter-menu"><span className="menu-label">PRIORITY</span>{(['all', ...PRIORITY_ORDER] as const).map(p => <button key={p} className={p === priority ? 'selected' : ''} onClick={() => { setPriority(p); setFilterOpen(false); }}>{p === 'all' ? 'All priorities' : p[0].toUpperCase() + p.slice(1)}{p === priority && <Icon name="check" size={14}/>}</button>)}</div>}</div><button className="icon-button compact" title="Add a task" aria-label="Add a task" onClick={onAdd}><Icon name="plus" size={17}/></button></div>
    </div>
    <div className="task-tabs" role="tablist" aria-label="Task state">{([['all', 'All tasks'], ['today', 'Today'], ['upcoming', 'Upcoming'], ['completed', 'Completed']] as const).map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}<span>{counts[id]}</span></button>)}</div>
    <div className="table-scroll"><table className="task-table">
      <thead><tr><th className="check-column"><button className="table-check" aria-label="Complete all visible tasks" title="Complete all visible tasks" onClick={completeVisible}><span/></button></th>{([['title', 'Task'], ['project', 'Project'], ['due', 'Due date'], ['priority', 'Priority']] as const).map(([key, label]) => <th key={key} aria-sort={sort.key === key ? (sort.desc ? 'descending' : 'ascending') : 'none'}><button onClick={() => changeSort(key)}>{label}{sort.key === key ? <Icon name="down" size={11} className={sort.desc ? 'rotate' : ''}/> : <Icon name="sort" size={11} className="sort-hint"/>}</button></th>)}</tr></thead>
      <tbody>{visible.map(task => <tr key={task.id} className={`${selectedId === task.id ? 'selected-row' : ''} ${task.status === 'completed' ? 'completed-row' : ''}`} onClick={() => onSelect(task)}>
        <td className="check-column"><button className={`task-checkbox ${task.status === 'completed' ? 'checked' : ''} ${task.status === 'in_progress' ? 'in-progress' : ''}`} title={task.status === 'completed' ? 'Mark incomplete' : task.isRecurring ? 'Complete this occurrence' : 'Mark complete'} aria-label={`${task.status === 'completed' ? 'Reopen' : 'Complete'} ${task.title}`} aria-pressed={task.status === 'completed'} onClick={e => { e.stopPropagation(); void toggleTask(task).catch(fail); }}>{task.status === 'completed' && <Icon name="check" size={11}/>}</button></td>
        <td className="task-name"><button onClick={e => { e.stopPropagation(); onSelect(task); }} title={task.isRecurring ? `${task.title} (repeats)` : task.title}>{task.title}{task.isRecurring && <Icon name="refresh" size={11} className="sort-hint"/>}</button></td>
        <td><span className="project-name"><i style={{ background: goalColor(goals, task.goalId) }}/>{projectName(task)}</span></td>
        <td><span className={`due-date ${task.dueDate && task.dueDate < today && open(task) ? 'overdue' : ''} ${task.dueDate === today ? 'due-today' : ''}`} title={task.dueDate ? `Due ${task.dueDate}` : 'No due date'}>{dueLabel(task.dueDate, today)}</span></td>
        <td><PriorityMark priority={task.priority}/></td>
      </tr>)}</tbody>
    </table></div>
    {visible.length === 0 && <div className="empty-state compact-empty"><Icon name="tasks" size={26}/><h3>{tab === 'completed' ? 'A fresh start' : 'All clear here'}</h3><p>{tab === 'completed' ? 'Complete a task to see it here.' : 'No tasks match this view.'}</p>{priority !== 'all' && <button className="text-button" onClick={() => setPriority('all')}>Clear filter</button>}</div>}
    <div className="table-footer"><span>{visible.length ? `${visible.length} of ${sorted.length} tasks` : 'No tasks'}</span>{!full ? <button className="text-button" onClick={onViewAll}>View all tasks<Icon name="arrow" size={13}/></button> : <span className="flex items-center gap-4">{tab === 'completed' && counts.completed > 0 && <button className="text-button danger-button" onClick={() => void mutate<{ removed: number }>('tasks:deleteCompleted', {}, ['tasks']).then(r => onNotice(`${r.removed} completed task${r.removed === 1 ? '' : 's'} cleared`)).catch(fail)}><Icon name="trash" size={13}/>Clear completed</button>}<button className="text-button" onClick={exportCsv}><Icon name="download" size={13}/>Export CSV</button></span>}</div>
  </section>;
}
