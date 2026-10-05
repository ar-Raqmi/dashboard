import { useState } from 'react';
import { Icon, type IconName } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { shortDay, todayKey } from '@/lib/date';
import { useStore, type EventView, type NoteView } from '@/store';
import { pageLabel, personalNav, settingsNav, workspaceNav, type Page } from './pages';

interface SearchPaletteProps {
  onClose: () => void;
  onNavigate: (page: Page) => void;
  onSelectTask: (id: string) => void;
  onOpenNote: (note: NoteView) => void;
  onOpenEvent: (event: EventView) => void;
}

interface Result { id: string; title: string; kind: string; icon: IconName; action: () => void }

const MAX_RESULTS = 9;
const MAX_EVENTS = 50;

export function SearchPalette({ onClose, onNavigate, onSelectTask, onOpenNote, onOpenEvent }: SearchPaletteProps) {
  const { tasks, notes, goals, events } = useStore();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const today = todayKey();

  const all: Result[] = [
    ...tasks.map(t => ({ id: `task:${t.id}`, title: t.title, kind: 'Task', icon: 'tasks' as const, action: () => { onNavigate('Tasks'); onSelectTask(t.id); } })),
    ...notes.map(n => ({ id: `note:${n.id}`, title: n.title, kind: 'Note', icon: 'notes' as const, action: () => onOpenNote(n) })),
    ...goals.map(g => ({ id: `goal:${g.id}`, title: g.title, kind: `Project / ${g.progress}%`, icon: 'flag' as const, action: () => onNavigate('Goals') })),
    ...events.filter(e => e.date >= today).slice(0, MAX_EVENTS).map(e => ({
      id: `event:${e.id}:${e.date}`, title: e.title, icon: 'calendar' as const, action: () => onOpenEvent(e),
      kind: `Event / ${shortDay(e.date)}`,
    })),
    ...[...workspaceNav, ...personalNav, settingsNav].map(n => ({ id: n.name, title: pageLabel(n.name), kind: 'Navigate', icon: n.icon, action: () => onNavigate(n.name) })),
  ];
  const needle = query.toLowerCase();
  const results = all.filter(item => !query || `${item.title} ${item.kind}`.toLowerCase().includes(needle)).slice(0, MAX_RESULTS);

  const open = (result: Result) => { result.action(); onClose(); };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndex(i => Math.max(0, Math.min(i + 1, results.length - 1))); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIndex(i => Math.max(i - 1, 0)); }
    // preventDefault: closing restores focus to the nav button that opened it, and the same Enter would then click it.
    if (e.key === 'Enter' && results[index]) { e.preventDefault(); open(results[index]); }
  };

  return <Modal title="Search workspace" onClose={onClose} className="search-modal" keyboard>
    <div className="command-input">
      <Icon name="search" size={20}/>
      <input autoFocus aria-label="Search tasks, notes, projects, events, and pages" placeholder="Find a task, note, or page..." value={query} onChange={e => { setQuery(e.target.value); setIndex(0); }} onKeyDown={onKeyDown}/>
      <button className="search-close-button" onClick={onClose} aria-label="Close search"><kbd>Esc</kbd></button>
    </div>
    <div className="command-results">
      <span className="menu-label">{query ? `${results.length} RESULTS` : 'QUICK ACCESS'}</span>
      {results.map((result, i) => <button key={result.id} className={`command-result ${i === index ? 'selected' : ''}`} onMouseEnter={() => setIndex(i)} onClick={() => open(result)}>
        <Icon name={result.icon} size={17}/><span><strong>{result.title}</strong><small>{result.kind}</small></span><Icon name="right" size={14}/>
      </button>)}
      {!results.length && <div className="empty-state compact-empty"><p>No matches for “{query}”.</p></div>}
    </div>
    <div className="command-footer"><span><kbd>&uarr;</kbd><kbd>&darr;</kbd> to navigate</span><span><kbd>Enter</kbd> to open</span><span>Searches your loaded workspace</span></div>
  </Modal>;
}
