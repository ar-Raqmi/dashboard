import type { Priority } from '@/store';

export const priorityLabel = (p: Priority) => (p === 'high' ? 'High' : p === 'low' ? 'Low' : 'Medium');

export function PriorityMark({ priority }: { priority: Priority }) {
  const label = priorityLabel(priority);
  return <span className={`priority priority-${priority}`} title={`${label} priority`}><span className="priority-bars"><i/><i/><i/></span><span>{label}</span></span>;
}
