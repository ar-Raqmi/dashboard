import { GoalsView, type ProjectFocus } from './GoalsView';

export function GoalsPage({ focus, onClearFocus, notify }: { focus: ProjectFocus; onClearFocus: () => void; notify: (message: string) => void }) {
  return <GoalsView focus={focus} onClearFocus={onClearFocus} notify={notify}/>;
}
