import { GoalsView } from './GoalsView';

export function GoalsPage({ onOpenProject, notify }: { onOpenProject: (goalId: string) => void; notify: (message: string) => void }) {
  return <GoalsView onOpenProject={onOpenProject} notify={notify}/>;
}
