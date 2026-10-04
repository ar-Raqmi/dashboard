import type { Priority } from '@/lib/store'
import { PRIORITY_LABEL } from '@/lib/task-actions'

export default function PriorityMark({ priority }: { priority: Priority }) {
  return (
    <span className={`priority priority-${priority}`} title={`${PRIORITY_LABEL[priority]} priority`}>
      <span className="priority-bars"><i /><i /><i /></span>
      <span>{PRIORITY_LABEL[priority]}</span>
    </span>
  )
}
