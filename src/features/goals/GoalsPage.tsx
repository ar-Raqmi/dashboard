import { GoalsView } from '@/features/goals/GoalsView';

export function GoalsPage({ notify }: { notify: (message: string) => void }) {
  return <GoalsView notify={notify}/>;
}
