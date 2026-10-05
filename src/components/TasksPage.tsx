import type { TaskView } from '../store';
import { TaskTable } from './TaskTable';

export function TasksPage({ selectedTaskId, onSelectTask, onAddTask, notify }: { selectedTaskId?: string; onSelectTask: (task: TaskView) => void; onAddTask: () => void; notify: (message: string) => void }) {
  return <TaskTable onSelect={onSelectTask} onAdd={onAddTask} full selectedId={selectedTaskId} onViewAll={() => undefined} onNotice={notify}/>;
}
