import type { EventView } from '../store';
import { CalendarView } from './CalendarView';

export function CalendarPage({ onEvent, initialDate }: { onEvent: (event: EventView) => void; initialDate?: string }) {
  return <CalendarView onEvent={onEvent} initialDate={initialDate}/>;
}
