import type { EventView } from '../store';
import { CalendarView } from './CalendarView';

export function CalendarPage({ onEvent }: { onEvent: (event: EventView) => void }) {
  return <CalendarView onEvent={onEvent}/>;
}
