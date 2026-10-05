import type { GoalView, TaskView } from './types';

/** A repeating task's own date is its occurrence; one-off tasks use their due date. */
export const taskDate = (t: TaskView) => (t.isRecurring ? t.occurrenceDate ?? t.dueDate : t.dueDate);
/** Open and actionable now. A repeating task's occurrence only counts once its own day has started. */
export const isActionable = (t: TaskView, today: string) => {
  if (t.status === 'completed') return false;
  const date = taskDate(t);
  return !t.isRecurring || !date || date <= today;
};

const GOAL_COLORS = ['var(--aqua)', 'var(--yellow)', 'var(--purple)', 'var(--blue)', 'var(--orange)', 'var(--green)', 'var(--red)'];

/** A project is complete at 100%. The server derives progress from milestones (or the manual slider when it has none), so no NaN and no drift reach the client. */
export const isGoalComplete = (goal: Pick<GoalView, 'progress'>) => goal.progress >= 100;

/** Goals double as projects; each gets a stable palette colour from its position. */
export function goalColor(goals: GoalView[], id: string | null | undefined) {
  const index = goals.findIndex(g => g.id === id);
  return index < 0 ? 'var(--subtle)' : GOAL_COLORS[index % GOAL_COLORS.length];
}
