import { useStore, type EventView } from '../store';
import { formatTime, parseDateKey, todayKey } from '../utils/date';
import { Icon } from './Icon';

export function EventList({ onEvent, onCalendar }: { onEvent: (event: EventView) => void; onCalendar: () => void }) {
  const events = useStore(s => s.events);
  const today = todayKey();
  const upcoming = events.filter(e => e.date >= today).slice(0, 3);
  return <section className="upcoming-section"><div className="rail-section-heading"><h2>Coming up</h2><button className="icon-button compact" title="Open calendar" aria-label="Open calendar" onClick={onCalendar}><Icon name="calendar" size={16}/></button></div>
    <div className="event-list">{upcoming.map(event => {
      const d = parseDateKey(event.date);
      return <button className="event-item" key={`${event.id}:${event.date}`} onClick={() => onEvent(event)} title={`${event.title}, ${event.date}, ${formatTime(event.startTime)}`}><span className="event-date"><span>{String(d.getDate()).padStart(2, '0')}</span><small>{d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</small></span><span className="event-copy"><strong>{event.title}</strong><small>{event.date === today ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' })}<span className="middle-dot">&middot;</span>{formatTime(event.startTime)}{event.isRecurring && <><span className="middle-dot">&middot;</span>Repeats</>}</small></span><Icon name="right" size={13} className="event-arrow"/></button>;
    })}{!upcoming.length && <p className="muted-note">Nothing scheduled. A little room to breathe.</p>}</div>
    <button className="text-button calendar-link" onClick={onCalendar}>View calendar<Icon name="arrow" size={13}/></button></section>;
}
