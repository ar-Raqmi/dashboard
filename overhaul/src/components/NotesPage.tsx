import { useState } from 'react';
import { useStore, type NoteView } from '../store';
import { shortDate } from '../utils/date';
import { Icon } from './Icon';

export function NotesPage({ onOpenNote }: { onOpenNote: (note: NoteView) => void }) {
  const notes = useStore(s => s.notes);
  const [query, setQuery] = useState('');
  const matches = notes
    .filter(n => `${n.title} ${n.content}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  return <section className="notes-view"><div className="section-heading"><h2>All notes <span className="inline-count">{notes.length}</span></h2><div className="inline-search"><Icon name="search" size={14}/><input aria-label="Search notes" placeholder="Find a note..." value={query} onChange={e => setQuery(e.target.value)}/></div></div>
    <div className="notes-list">{matches.map(note => <button className="note-list-item" onClick={() => onOpenNote(note)} key={note.id}><span style={{ color: note.color, flex: 'none', marginTop: 3 }}><Icon name="notes" size={21}/></span><span><strong>{note.title}{note.pinned && <Icon name="pin" size={12}/>}</strong><p>{note.content.replace(/\n+/g, ' ') || 'Empty note'}</p><small>Edited {shortDate(note.updatedAt)}</small></span><Icon name="right" size={15}/></button>)}
      {!matches.length && <div className="empty-state"><Icon name="notes" size={30}/><h3>{query ? 'No matching notes' : 'A blank page is a beginning'}</h3><p>{query ? 'Try another word or clear your search.' : 'Capture a thought using the New note button.'}</p></div>}</div></section>;
}
