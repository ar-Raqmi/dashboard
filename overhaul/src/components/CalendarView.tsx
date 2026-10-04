import { useState, type FormEvent } from 'react';
import { useStore, type EventView } from '../store';
import { downloadFile, formatTime, minutesBetween, parseDateKey, todayKey } from '../utils/date';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { REPEAT_OPTIONS, repeatLabel } from './NewTaskModal';

const EVENT_COLORS = ['#A7C080', '#7FBBB3', '#DBBC7F', '#E69875', '#E67E80', '#D699B6', '#83C092'];
const pad = (n: number) => String(n).padStart(2, '0');

export function CalendarView({ onEvent, initialDate }: { onEvent: (event: EventView) => void; initialDate?: string }) {
  const events = useStore(s => s.events);
  const today = todayKey(), now = parseDateKey(today), start = parseDateKey(initialDate || today);
  const [month, setMonth] = useState(start.getMonth()), [year, setYear] = useState(start.getFullYear()), [selectedDay, setSelectedDay] = useState(start.getDate());
  const [creating, setCreating] = useState(false);
  const first = (new Date(year, month, 1).getDay() + 6) % 7, days = new Date(year, month + 1, 0).getDate();
  const label = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const dateOf = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
  const selectedDate = dateOf(selectedDay), dayEvents = events.filter(e => e.date === selectedDate);
  function changeMonth(delta: number) { const d = new Date(year, month + delta, 1); setMonth(d.getMonth()); setYear(d.getFullYear()); setSelectedDay(1); }
  function goToday() { setMonth(now.getMonth()); setYear(now.getFullYear()); setSelectedDay(now.getDate()); }

  return <section className="calendar-view"><div className="section-heading"><h2>{label}</h2><div className="section-actions"><button className="small-button" onClick={() => setCreating(true)}><Icon name="plus" size={14}/>Add event</button><button className="small-button" onClick={goToday}>Today</button><button className="icon-button" onClick={() => changeMonth(-1)} aria-label="Previous month"><Icon name="left" size={16}/></button><button className="icon-button" onClick={() => changeMonth(1)} aria-label="Next month"><Icon name="right" size={16}/></button></div></div>
    <div className="calendar-grid">{['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => <span className="calendar-weekday" key={d}>{d}</span>)}{Array.from({ length: Math.ceil((first + days) / 7) * 7 }, (_, i) => {
      const day = i - first + 1, date = dateOf(day), found = events.filter(e => e.date === date);
      return day > 0 && day <= days ? <button key={i} className={`calendar-day ${day === selectedDay ? 'selected' : ''} ${date === today ? 'today' : ''}`} onClick={() => setSelectedDay(day)} onDoubleClick={() => { setSelectedDay(day); setCreating(true); }} aria-label={`${label} ${day}${found.length ? `, ${found.length} event${found.length === 1 ? '' : 's'}` : ''}`}><span>{day}</span>{found.map(e => <small key={`${e.id}:${e.date}`}><i style={e.color ? { background: e.color } : undefined}/>{e.title}</small>)}</button> : <div key={i} className="calendar-day blank"/>;
    })}</div>
    <div className="day-agenda"><h3>{parseDateKey(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>{dayEvents.length ? dayEvents.map(e => <button className="agenda-event" key={`${e.id}:${e.date}`} onClick={() => onEvent(e)}><time>{formatTime(e.startTime)}</time><span><strong>{e.title}</strong><small>{e.isRecurring ? repeatLabel(e.rrule) : e.endTime ? `Until ${formatTime(e.endTime)}` : e.allDay ? 'All day' : ''}</small></span><Icon name="right" size={16}/></button>) : <p>No events scheduled. A little room to breathe.</p>}</div>
    <p className="view-footnote">Double-click a day to add an event. Repeating events are shown up to a year ahead.</p>
    {creating && <EventModal event={null} defaultDate={selectedDate} onClose={() => setCreating(false)}/>}
  </section>;
}

export function EventModal({ event, defaultDate, onClose, onSaved }: { event: EventView | null; defaultDate?: string; onClose: () => void; onSaved?: () => void }) {
  const mutate = useStore(s => s.mutate);
  // Editing a repeating event edits the series, anchored at its first date.
  const [title, setTitle] = useState(event?.title || ''), [date, setDate] = useState(event ? event.dtstart || event.date : defaultDate || todayKey());
  const [allDay, setAllDay] = useState(event ? event.allDay : false), [startTime, setStartTime] = useState(event?.startTime || '09:00'), [endTime, setEndTime] = useState(event?.endTime || '10:00');
  const [rrule, setRrule] = useState(event?.rrule || ''), [color, setColor] = useState(event?.color || EVENT_COLORS[0]);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const presets: readonly (readonly [string, string])[] = rrule && !REPEAT_OPTIONS.some(([v]) => v === rrule) ? [...REPEAT_OPTIONS, [rrule, 'Custom repeat']] : REPEAT_OPTIONS;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (!allDay && endTime && endTime <= startTime) { setError('The end time must be after the start time.'); return; }
    setBusy(true);
    try {
      const args = { title: title.trim(), date, allDay, startTime: allDay ? null : startTime, endTime: allDay ? null : endTime || null, rrule: rrule || null, color };
      await mutate(event ? 'events:update' : 'events:create', event ? { id: event.id, ...args } : args, ['events']);
      onSaved?.();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return <Modal title={event ? 'Edit event' : 'New event'} onClose={onClose}><form onSubmit={submit}><div className="form-body">
    <label className="form-label">Title<input autoFocus required maxLength={300} placeholder="What's happening?" value={title} onChange={e => setTitle(e.target.value)}/></label>
    <div className="form-grid"><label className="form-label">{rrule ? 'Starts on' : 'Date'}<input type="date" required value={date} onChange={e => setDate(e.target.value)}/></label><label className="form-label">Repeat<select value={rrule} onChange={e => setRrule(e.target.value)}>{presets.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    <div className="setting-row"><span><strong>All day</strong><small>No specific start or end time.</small></span><button type="button" className={`toggle-switch ${allDay ? 'on' : ''}`} role="switch" aria-checked={allDay} aria-label="All day" onClick={() => setAllDay(!allDay)}><span/></button></div>
    {!allDay && <div className="form-grid"><label className="form-label">Starts<input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)}/></label><label className="form-label">Ends<input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}/></label></div>}
    <div className="form-label">Colour<span className="mt-2 flex gap-2" role="radiogroup" aria-label="Event colour">{EVENT_COLORS.map(c => <button type="button" key={c} role="radio" aria-checked={color === c} aria-label={`Colour ${c}`} onClick={() => setColor(c)} style={{ width: 18, height: 18, borderRadius: 99, background: c, outline: color === c ? '2px solid var(--fg)' : 'none', outlineOffset: 2 }}/>)}</span></div>
    {event?.isRecurring && <p className="view-footnote">Changes apply to every occurrence of this event.</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </div><div className="modal-footer"><span>Saved to your calendar</span><div><button type="button" className="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit" disabled={busy}>{busy ? 'Saving...' : event ? 'Save changes' : 'Add event'}</button></div></div></form></Modal>;
}

function downloadIcs(event: EventView) {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const day = event.date.replace(/-/g, '');
  const escape = (s: string) => s.replace(/[\\;,]/g, m => `\\${m}`).replace(/\n/g, '\\n');
  const timing = event.allDay || !event.startTime
    ? `DTSTART;VALUE=DATE:${day}`
    : `DTSTART:${day}T${event.startTime.replace(':', '')}00${event.endTime ? `\r\nDTEND:${day}T${event.endTime.replace(':', '')}00` : ''}`;
  downloadFile(`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Raqmi//Workspace//EN\r\nBEGIN:VEVENT\r\nUID:${event.id}-${day}@raqmi\r\nDTSTAMP:${stamp(new Date())}\r\n${timing}\r\nSUMMARY:${escape(event.title)}\r\nEND:VEVENT\r\nEND:VCALENDAR`, `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'event'}.ics`, 'text/calendar');
}

export function EventDetailModal({ event, onClose, notify }: { event: EventView; onClose: () => void; notify: (message: string) => void }) {
  const mutate = useStore(s => s.mutate);
  const [editing, setEditing] = useState(false), [confirming, setConfirming] = useState(false);
  const duration = minutesBetween(event.startTime, event.endTime);
  const fail = (err: unknown) => notify((err as Error).message);
  const remove = (scope: 'one' | 'all') => void (scope === 'one'
    ? mutate('events:setOccurrenceException', { id: event.id, date: event.occurrenceDate, status: 'cancelled' }, ['events'])
    : mutate('events:remove', { id: event.id }, ['events'])
  ).then(() => { notify(scope === 'one' ? 'Occurrence removed' : 'Event deleted'); onClose(); }).catch(fail);

  if (editing) return <EventModal event={event} onClose={() => setEditing(false)} onSaved={() => { notify('Event updated'); onClose(); }}/>;
  return <Modal title="Event details" onClose={onClose}><div className="event-modal-body">
    <span className="sample-detail" style={event.color ? { color: event.color } : undefined}>{event.isRecurring ? repeatLabel(event.rrule).toUpperCase() : 'CALENDAR EVENT'}</span>
    <h3>{event.title}</h3>
    <div className="event-meta"><span><Icon name="calendar" size={16}/>{parseDateKey(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span><span><Icon name="clock" size={16}/>{event.allDay || !event.startTime ? 'All day' : `${formatTime(event.startTime)}${event.endTime ? ` – ${formatTime(event.endTime)}` : ''}${duration ? ` · ${duration} minutes` : ''}`}</span></div>
    {confirming && <div className="settings-data-actions">{event.isRecurring && <button className="button" onClick={() => remove('one')}>Only this occurrence</button>}<button className="button danger-action" onClick={() => remove('all')}>{event.isRecurring ? 'Every occurrence' : 'Delete event'}</button><button className="button" onClick={() => setConfirming(false)}>Cancel</button></div>}
  </div><div className="modal-footer"><span className="flex gap-2"><button className="icon-button" title="Edit event" aria-label="Edit event" onClick={() => setEditing(true)}><Icon name="pen" size={15}/></button><button className="icon-button danger-button" title="Delete event" aria-label="Delete event" onClick={() => setConfirming(true)}><Icon name="trash" size={15}/></button></span><button className="button primary" onClick={() => { downloadIcs(event); notify('Calendar file downloaded'); }}><Icon name="download" size={14}/>Add to calendar</button></div></Modal>;
}
