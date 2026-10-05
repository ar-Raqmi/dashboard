import { GoalsView } from './GoalsView';

export function GoalsPage({ notify }: { notify: (message: string) => void }) {
  return <GoalsView notify={notify}/>;
}
