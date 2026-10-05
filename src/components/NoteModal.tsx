import { useState, type FormEvent } from 'react';
import { useNoteWrap } from '../hooks/useNoteWrap';
import { useStore, type NoteView } from '../store';
import { copyText } from '../utils/date';
import { Icon } from './Icon';
import { Markdown } from './Markdown';
import { Modal } from './Modal';

const NOTE_COLORS = ['#A7C080', '#83C092', '#7FBBB3', '#DBBC7F', '#E69875', '#E67E80', '#D699B6'];
type EditorMode = 'write' | 'split' | 'preview';
const MODES: { mode: EditorMode; label: string }[] = [{ mode: 'write', label: 'Write' }, { mode: 'split', label: 'Split' }, { mode: 'preview', label: 'Preview' }];

export function NoteModal({ note, onClose, onSaved, onDelete, notify }: { note: NoteView | null; onClose: () => void; onSaved: () => void; onDelete: (note: NoteView) => void; notify: (message: string) => void }) {
  const saveNote = useStore(s => s.saveNote);
  const [title, setTitle] = useState(note?.title || ''), [text, setText] = useState(note?.content || ''), [pinned, setPinned] = useState(note?.pinned || false);
  const [color, setColor] = useState(note?.color || NOTE_COLORS[0]), [mode, setMode] = useState<EditorMode>(note?.content.trim() ? 'preview' : 'write'), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [wrap80, toggleWrap] = useNoteWrap(), measure = wrap80 ? 'wrap-80' : '';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await saveNote({ id: note?.id, title: title.trim() || 'Untitled note', content: text, pinned, color });
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return <Modal title={note ? 'Edit note' : 'Quick capture'} onClose={onClose} className={`note-modal ${measure} ${mode === 'split' ? 'split' : ''}`}><form onSubmit={submit}><div className="form-body">
    <input className="note-title-input" aria-label="Note title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your thought a title..." maxLength={300}/>
    <div className="segmented note-mode" role="group" aria-label="Editor view">{MODES.map(m => <button type="button" key={m.mode} className={mode === m.mode ? 'active' : ''} aria-pressed={mode === m.mode} onClick={() => setMode(m.mode)}>{m.label}</button>)}</div>
    {/* The textarea is the source of truth; the preview only ever renders it. */}
    <div className={`note-panes ${mode}`}>
      {mode !== 'preview' && <div className="note-pane">{mode === 'split' && <span className="note-pane-label">Markdown</span>}<textarea className={`note-editor note-source ${measure}`} wrap="soft" aria-label="Note content" placeholder="The pen hasn't lifted. Start writing..." value={text} onChange={e => setText(e.target.value)} rows={12}/></div>}
      {mode !== 'write' && <div className="note-pane">{mode === 'split' && <span className="note-pane-label">Preview</span>}<Markdown source={text} empty="Nothing to preview yet." className={`note-editor note-preview ${measure}`}/></div>}
    </div>
    <div className="note-tools">
      <button type="button" className={`small-button ${pinned ? 'active' : ''}`} onClick={() => setPinned(!pinned)} aria-pressed={pinned}><Icon name="pin" size={14}/>{pinned ? 'Pinned' : 'Pin note'}</button>
      <button type="button" className={`small-button ${wrap80 ? 'active' : ''}`} onClick={toggleWrap} aria-pressed={wrap80} title={wrap80 ? 'Notes wrap at 80 columns. Display only; your text is not changed.' : 'Notes fill the available width. Display only; your text is not changed.'}><Icon name="sort" size={14}/>Wrap 80</button>
      <span className="flex items-center gap-1.5" role="radiogroup" aria-label="Note colour">{NOTE_COLORS.map(c => <button type="button" key={c} role="radio" aria-checked={color === c} aria-label={`Colour ${c}`} onClick={() => setColor(c)} style={{ width: 14, height: 14, borderRadius: 99, background: c, outline: color === c ? '2px solid var(--fg)' : 'none', outlineOffset: 2 }}/>)}</span>
      <button type="button" className="icon-button" aria-label="Copy note" title="Copy note" onClick={() => copyText(`${title}\n\n${text}`).then(() => notify('Note copied to clipboard')).catch(() => notify('Clipboard unavailable. Select and copy the note text.'))}><Icon name="copy" size={16}/></button>
      {note && <button type="button" className="icon-button danger-button" aria-label="Delete note" title="Delete note" onClick={() => onDelete(note)}><Icon name="trash" size={16}/></button>}
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
  </div><div className="modal-footer"><span>Markdown supported</span><div><button type="button" className="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save note'}</button></div></div></form></Modal>;
}
