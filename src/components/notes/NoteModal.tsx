'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Icon from '@/components/ui/Icon'
import Markdown from '@/components/ui/Markdown'
import { useAppStore, type Note } from '@/lib/store'
import { useUi, confirmAction } from '@/lib/ui'
import { notify, notifyError } from '@/lib/toast'
import { copyText } from '@/lib/clipboard'
import { relativeTime } from '@/lib/dates'
import { DEFAULT_NOTE_COLOR, NOTE_COLORS } from '@/lib/note-colors'

function NoteForm({ note, onClose }: { note: Note | null; onClose: () => void }) {
  const addNote = useAppStore((s) => s.addNote)
  const updateNote = useAppStore((s) => s.updateNote)
  const deleteNote = useAppStore((s) => s.deleteNote)

  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [color, setColor] = useState(note?.color || DEFAULT_NOTE_COLOR)
  const [pinned, setPinned] = useState(note?.pinned ?? false)
  const [preview, setPreview] = useState(false)

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const data = { title: title.trim() || 'Untitled note', content, color, pinned }
    if (note) updateNote(note.id, data)
    else addNote(data)
    notify('Note saved')
    onClose()
  }

  const remove = async () => {
    if (!note) return
    const ok = await confirmAction({
      title: 'Delete this note?',
      body: `“${note.title}” will be removed. This cannot be undone.`,
      confirmLabel: 'Delete note',
      danger: true,
    })
    if (!ok) return
    deleteNote(note.id)
    notify('Note deleted')
    onClose()
  }

  return (
    <form onSubmit={save}>
      <div className="form-body">
        <input className="note-title-input" aria-label="Note title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give your thought a title..." maxLength={160} />
        {preview ? (
          <div className="note-preview">
            {content.trim() ? <Markdown>{content}</Markdown> : <p className="muted-note">Nothing to preview yet.</p>}
          </div>
        ) : (
          <textarea className="note-editor" aria-label="Note content" placeholder="Start writing. Markdown works." value={content} onChange={(e) => setContent(e.target.value)} rows={12} />
        )}
        <div className="note-tools">
          <div className="theme-segment" role="group" aria-label="Editor mode">
            <button type="button" className={!preview ? 'active' : ''} onClick={() => setPreview(false)}>Write</button>
            <button type="button" className={preview ? 'active' : ''} onClick={() => setPreview(true)}>Preview</button>
          </div>
          <button type="button" className={`small-button ${pinned ? 'active' : ''}`} onClick={() => setPinned(!pinned)} aria-pressed={pinned}>
            <Icon name="pin" size={14} />{pinned ? 'Pinned' : 'Pin note'}
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Copy note"
            title="Copy note"
            onClick={() => copyText(`${title}\n\n${content}`).then(() => notify('Note copied to clipboard')).catch((err) => notifyError('Copy failed', err.message))}
          >
            <Icon name="copy" size={16} />
          </button>
          {note && (
            <button type="button" className="icon-button danger-button" aria-label="Delete note" title="Delete note" onClick={remove}>
              <Icon name="trash" size={16} />
            </button>
          )}
        </div>
        <div className="swatches" role="radiogroup" aria-label="Note colour">
          {NOTE_COLORS.map((c) => (
            <button key={c.value} type="button" role="radio" aria-checked={color.toLowerCase() === c.value.toLowerCase()} aria-label={c.label} title={c.label} className={`swatch ${color.toLowerCase() === c.value.toLowerCase() ? 'active' : ''}`} style={{ background: c.value }} onClick={() => setColor(c.value)} />
          ))}
          {!NOTE_COLORS.some((c) => c.value.toLowerCase() === color.toLowerCase()) && (
            <button type="button" role="radio" aria-checked className="swatch active" aria-label="Current colour" style={{ background: color }} />
          )}
        </div>
      </div>
      <div className="modal-footer">
        <span>{note ? `Edited ${relativeTime(note.updatedAt)}` : 'Saved to your account'}</span>
        <div>
          <button type="button" className="button" onClick={onClose}>Cancel</button>
          <button className="button primary" type="submit">Save note</button>
        </div>
      </div>
    </form>
  )
}

export default function NoteModal() {
  const editor = useUi((s) => s.noteEditor)
  const setEditor = useUi((s) => s.setNoteEditor)
  if (!editor) return null
  const note = editor === 'new' ? null : editor
  return (
    <Modal title={note ? 'Edit note' : 'Quick capture'} onClose={() => setEditor(null)} className="note-modal">
      <NoteForm key={note?.id ?? 'new'} note={note} onClose={() => setEditor(null)} />
    </Modal>
  )
}
