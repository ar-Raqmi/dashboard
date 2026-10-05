import { useState } from 'react';
import { useStore, type EventView } from '../store';
import { addDays, formatTime, parseDateKey, toDateKey, todayKey } from '../utils/date';
import { Icon } from './Icon';
import { repeatLabel } from './NewTaskModal';

const AGENDA_LIMIT = 4;

/** Month at a glance for the overview: events and due tasks per day, with the chosen day's agenda alongside. */
export function MiniCalendar({ onEvent, onOpenDay }: { onEvent: (event: EventView) => void; onOpenDay: (date: string) => void }) {
  const events = useStore(s => s.events), tasks = useStore(s => s.tasks);
  const today = todayKey(), now = parseDateKey(today);
  const [month, setMonth] = useState(now.getMonth()), [year, setYear] = useState(now.getFullYear()), [selected, setSelected] = useState(today);
  const firstKey = toDateKey(new Date(year, month, 1, 12)), lead = (parseDateKey(firstKey).getDay() + 6) % 7, days = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((lead + days) / 7) * 7 }, (_, i) => addDays(firstKey, i - lead));
  const label = parseDateKey(firstKey).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthPrefix = firstKey.slice(0, 7);
  const eventsOn = (date: string) => events.filter(e => e.date === date);
  const dueOn = (date: string) => tasks.filter(t => t.status !== 'completed' && t.dueDate === date);
  const monthEvents = events.filter(e => e.date.startsWith(monthPrefix)).length;
  const dayEvents = eventsOn(selected), dayTasks = dueOn(selected);

  function changeMonth(delta: number) { const d = new Date(year, month + delta, 1, 12); setMonth(d.getMonth()); setYear(d.getFullYear()); const key = toDateKey(d); setSelected(key.slice(0, 7) === today.slice(0, 7) ? today : key); }
  function goToday() { setMonth(now.getMonth()); setYear(now.getFullYear()); setSelected(today); }

  return <section className="focus-panel mini-calendar" aria-label="Month at a glance">
    <div className="panel-heading"><div><h2>{label}</h2><p>{monthEvents ? `${monthEvents} event${monthEvents === 1 ? '' : 's'} this month` : 'Nothing scheduled this month'}</p></div><div className="section-actions"><button className="small-button" onClick={goToday}>Today</button><button className="icon-button" onClick={() => changeMonth(-1)} aria-label="Previous month"><Icon name="left" size={16}/></button><button className="icon-button" onClick={() => changeMonth(1)} aria-label="Next month"><Icon name="right" size={16}/></button></div></div>
    <div className="mini-calendar-body">
      <div className="mini-calendar-grid">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span className="calendar-weekday" key={i}>{d}</span>)}{cells.map(date => {
        const found = eventsOn(date).length, due = dueOn(date).length, outside = !date.startsWith(monthPrefix);
        return <button key={date} className={`mini-day ${outside ? 'outside' : ''} ${date === today ? 'today' : ''} ${date === selected ? 'selected' : ''}`} onClick={() => setSelected(date)} onDoubleClick={() => onOpenDay(date)} aria-pressed={date === selected} aria-label={`${parseDateKey(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}${found ? `, ${found} event${found === 1 ? '' : 's'}` : ''}${due ? `, ${due} task${due === 1 ? '' : 's'} due` : ''}`}><span>{parseDateKey(date).getDate()}</span><span className="mini-day-marks">{found > 0 && <i className="event-mark"/>}{due > 0 && <i className="task-mark"/>}</span></button>;
      })}</div>
      <div className="day-agenda mini-agenda">
        <div className="mini-agenda-heading"><h3>{selected === today ? 'Today' : parseDateKey(selected).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3><button className="text-button" onClick={() => onOpenDay(selected)}>Open in calendar<Icon name="right" size={13}/></button></div>
        {dayEvents.slice(0, AGENDA_LIMIT).map(e => <button className="agenda-event" key={`${e.id}:${e.date}`} onClick={() => onEvent(e)}><time>{formatTime(e.startTime)}</time><span><strong>{e.title}</strong><small>{e.isRecurring ? repeatLabel(e.rrule) : e.endTime ? `Until ${formatTime(e.endTime)}` : e.allDay ? 'All day' : ''}</small></span><Icon name="right" size={16}/></button>)}
        {dayEvents.length > AGENDA_LIMIT && <button className="text-button mini-agenda-more" onClick={() => onOpenDay(selected)}>{dayEvents.length - AGENDA_LIMIT} more in calendar<Icon name="right" size={13}/></button>}
        {!dayEvents.length && <p>No events scheduled.</p>}
        {dayTasks.length > 0 && <p className="mini-agenda-tasks"><i className="task-mark"/>{dayTasks.length} task{dayTasks.length === 1 ? '' : 's'} due: {dayTasks.map(t => t.title).join(', ')}</p>}
      </div>
    </div>
    <div className="mini-calendar-legend"><span><i className="event-mark"/>Events</span><span><i className="task-mark"/>Tasks due</span><span className="mini-calendar-hint">Double-click a day to open it in the calendar</span></div>
  </section>;
}
