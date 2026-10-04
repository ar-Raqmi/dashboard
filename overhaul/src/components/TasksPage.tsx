import type { TaskView } from '../store';
import { TaskTable } from './TaskTable';

export function TasksPage({ projectFilter, selectedTaskId, onSelectTask, onAddTask, notify }: { projectFilter: string | null; selectedTaskId?: string; onSelectTask: (task: TaskView) => void; onAddTask: () => void; notify: (message: string) => void }) {
  return <TaskTable onSelect={onSelectTask} onAdd={onAddTask} full projectFilter={projectFilter} selectedId={selectedTaskId} onViewAll={() => undefined} onNotice={notify}/>;
}
