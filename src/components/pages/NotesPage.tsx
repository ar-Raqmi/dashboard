'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { Plus, Trash2, StickyNote, Copy, Pencil, Search, Check, Pin, PinOff, X, AlertTriangle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAppStore } from '@/lib/store'
import type { Note } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const NOTE_COLORS = [
  { value: '#A5D6A7', label: 'Green' },
  { value: '#F48FB1', label: 'Pink' },
  { value: '#CE93D8', label: 'Purple' },
  { value: '#80CBC4', label: 'Teal' },
  { value: '#FFD54F', label: 'Amber' },
  { value: '#FF8A65', label: 'Orange' },
]

const MARKDOWN_STYLES = `[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-3 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-1 [&_h3]:mt-2 [&_p]:mb-2 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:mb-2 [&_li]:mb-1 [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:mb-2 [&_blockquote]:border-l-3 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:mb-2 [&_strong]:font-bold [&_a]:text-primary [&_a]:underline [&_hr]:border-border [&_hr]:my-3 [&_table]:w-full [&_table]:mb-2 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-muted [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1`

// NoteCard: Responsive and grows with content
function NoteCard({ note, editMode, onOpen, onPin, onDelete, onCopy, copiedId }: {
  note: Note; editMode: boolean; onOpen: () => void; onPin: () => void
  onDelete: () => void; onCopy: () => void; copiedId: string | null
}) {
  return (
    <div
      className={cn(
        'break-inside-avoid mb-4 rounded-3xl border flex flex-col group relative overflow-hidden transition-all duration-300',
        editMode ? 'border-primary/40 shadow-lg ring-1 ring-primary/20 cursor-grab active:cursor-grabbing' : 'border-border cursor-pointer hover:shadow-xl hover:border-primary/20 hover:-translate-y-1',
        'bg-card'
      )}
      onClick={editMode ? undefined : onOpen}
    >
      {/* Color accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 shrink-0" style={{ backgroundColor: note.color }} />

      <div className="flex flex-col p-5 gap-3 flex-1">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 shrink-0">
          <h3 className="font-bold text-foreground text-sm uppercase tracking-wider opacity-60">
            {note.title}
          </h3>
          <div className="flex gap-1 shrink-0">
            {note.pinned && <Pin className="size-3.5 text-primary -rotate-45" />}
          </div>
        </div>

        {/* Content - Showing all, no clamping */}
        <div className={cn('text-sm text-foreground leading-relaxed', MARKDOWN_STYLES)}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 pt-3 mt-auto border-t border-border/50">
          <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: note.color }} />
          <span className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-tight">
            {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <div className="ml-auto flex gap-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onCopy() }}
              className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Copy content">
              {copiedId === note.id ? <Check className="size-4" /> : <Copy className="size-4" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onPin() }}
              className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title={note.pinned ? 'Unpin' : 'Pin'}>
              {note.pinned ? <PinOff className="size-4" /> : <Pin className="size-4 -rotate-45" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete">
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotesGridSection({
  title,
  icon,
  notes,
  editMode,
  onOpen,
  onPin,
  onDelete,
  onCopy,
  copiedId,
}: {
  title: string; icon: React.ReactNode; notes: Note[]
  editMode: boolean
  onOpen: (id: string) => void; onPin: (id: string) => void
  onDelete: (id: string) => void; onCopy: (id: string) => void
  copiedId: string | null
}) {
  if (notes.length === 0) return null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 px-2">
        {icon}
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">{notes.length}</span>
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            editMode={editMode}
            onOpen={() => onOpen(note.id)}
            onPin={() => onPin(note.id)}
            onDelete={() => onDelete(note.id)}
            onCopy={() => onCopy(note.id)}
            copiedId={copiedId}
          />
        ))}
      </div>
    </div>
  )
}

// ===== Main Page =====
export default function NotesPage() {
  const {
    notes, addNote, updateNote, deleteNote, toggleNotePinned,
  } = useAppStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0].value)
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const { highlightedNoteId, setHighlightedNote } = useAppStore()

  // Handle highlighting from search
  useEffect(() => {
    if (highlightedNoteId) {
      openNotePreview(highlightedNoteId)
      setHighlightedNote(null)
    }
  }, [highlightedNoteId, setHighlightedNote, notes]) // Include notes to ensure we can find it

  // Separate pinned and regular notes
  const pinnedNotes = useMemo(() => notes.filter((n) => n.pinned), [notes])
  const regularNotes = useMemo(() => notes.filter((n) => !n.pinned), [notes])

  // Apply search filter
  const filteredPinned = useMemo(() => {
    if (!searchQuery.trim()) return pinnedNotes
    const q = searchQuery.toLowerCase()
    return pinnedNotes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
  }, [pinnedNotes, searchQuery])

  const filteredRegular = useMemo(() => {
    if (!searchQuery.trim()) return regularNotes
    const q = searchQuery.toLowerCase()
    return regularNotes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
  }, [regularNotes, searchQuery])

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId) || null,
    [notes, activeNoteId]
  )

  const handleAddNote = () => {
    if (!noteTitle.trim()) return
    addNote({
      title: noteTitle.trim(),
      content: noteContent.trim(),
      color: noteColor,
      pinned: false,
    })
    resetForm()
    setAddDialogOpen(false)
  }

  const handleSaveNote = () => {
    if (!activeNoteId || !noteTitle.trim()) return
    updateNote(activeNoteId, {
      title: noteTitle.trim(),
      content: noteContent.trim(),
      color: noteColor,
    })
    setIsEditing(false)
  }

  const openNotePreview = (noteId: string) => {
    if (editMode) return
    const note = notes.find((n) => n.id === noteId)
    if (!note) return
    setActiveNoteId(noteId)
    setNoteTitle(note.title)
    setNoteContent(note.content)
    setNoteColor(note.color)
    setIsEditing(false)
    setViewDialogOpen(true)
  }

  const copyToClipboard = async (content: string, noteId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(noteId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch { /* fallback */ }
  }

  const resetForm = () => {
    setNoteTitle('')
    setNoteContent('')
    setNoteColor(NOTE_COLORS[0].value)
    setActiveNoteId(null)
    setIsEditing(false)
  }

  const handleViewDialogClose = (open: boolean) => {
    if (!open) {
      if (isEditing && activeNoteId && noteTitle.trim()) {
        updateNote(activeNoteId, {
          title: noteTitle.trim(),
          content: noteContent.trim(),
          color: noteColor,
        })
      }
      resetForm()
    }
    setViewDialogOpen(open)
  }

  const initiateDelete = (id: string) => {
    setActiveNoteId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (activeNoteId) {
        deleteNote(activeNoteId)
        setDeleteDialogOpen(false)
        setViewDialogOpen(false)
        resetForm()
    }
  }

  const handleCopy = (id: string) => {
    const note = notes.find((n) => n.id === id)
    if (note) copyToClipboard(note.content, id)
  }

  const hasAnyNotes = filteredPinned.length > 0 || filteredRegular.length > 0

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-primary/15">
            <StickyNote className="size-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Notes</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit Layout Toggle */}
          <button
            onClick={() => setEditMode(!editMode)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-sm font-medium transition-all ${
              editMode
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {editMode ? (
              <><Check className="size-3.5" />Done</>
            ) : (
              <><Pencil className="size-3.5" />Edit Layout</>
            )}
          </button>

          {/* Add Note Dialog */}
          <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetForm() }}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="size-4 mr-1" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border rounded-3xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-foreground">Add New Note</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2 overflow-y-auto min-h-0">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-on-surface-variant">Title</label>
                  <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Note title..." className="rounded-2xl bg-input border-border" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-on-surface-variant">Content</label>
                  <Textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Write your note in Markdown..." rows={6}
                    className="rounded-2xl bg-input border-border resize-none max-h-[50vh]" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-on-surface-variant">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {NOTE_COLORS.map((c) => (
                      <button key={c.value}
                        className={`size-8 rounded-xl transition-all ${
                          noteColor === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-card scale-110' : ''
                        }`}
                        style={{ backgroundColor: c.value }} onClick={() => setNoteColor(c.value)} title={c.label} />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="ghost" className="rounded-2xl">Cancel</Button></DialogClose>
                <Button onClick={handleAddNote} className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90">
                  Add Note
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes..." className="pl-10 rounded-2xl bg-muted border-border" />
      </div>

      {/* Note View / Edit Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={handleViewDialogClose}>
        <DialogContent className={`bg-card border-border rounded-3xl flex flex-col p-0 gap-0 overflow-hidden h-[90vh] sm:max-h-[90vh] ${isEditing ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}>
          <DialogTitle className="sr-only">{activeNote?.title || 'Note'}</DialogTitle>
          {activeNote && (
            <>
              {/* Header */}
              <div className="px-6 pt-5 pb-3 shrink-0" style={{ backgroundColor: `${noteColor}12` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: noteColor }} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(activeNote.updatedAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      {activeNote.pinned && (
                        <span className="text-xs text-primary font-medium flex items-center gap-1">
                          <Pin className="size-3 -rotate-45" /> Pinned
                        </span>
                      )}
                    </div>
                    {isEditing ? (
                      <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)}
                        className="text-lg font-semibold bg-input border-border rounded-xl" />
                    ) : (
                      <h2 className="text-lg font-semibold text-foreground">{activeNote.title}</h2>
                    )}
                  </div>
                </div>
              </div>

              {isEditing ? (
                <>
                  <div className="flex-1 min-h-0 px-6 py-2 overflow-y-auto">
                    <Textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Write your note in Markdown..."
                      className="rounded-2xl bg-input border-border resize-none h-full min-h-[120px]" autoFocus />
                  </div>
                  <div className="shrink-0 px-6 pb-5 pt-3 border-t border-border/50 flex items-center justify-between gap-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {NOTE_COLORS.map((c) => (
                        <button key={c.value}
                          className={`size-7 rounded-lg transition-all ${
                            noteColor === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-card scale-110' : 'opacity-50 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c.value }} onClick={() => setNoteColor(c.value)} title={c.label} />
                      ))}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="ghost" size="sm" className="rounded-xl"
                        onClick={() => {
                          setNoteTitle(activeNote.title); setNoteContent(activeNote.content)
                          setNoteColor(activeNote.color); setIsEditing(false)
                        }}>Cancel</Button>
                      <Button size="sm" className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                        onClick={handleSaveNote}><Check className="size-3.5" />Save</Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <ScrollArea className="flex-1 min-h-0 px-6 py-2">
                    <div className={`text-sm text-foreground pr-2 ${MARKDOWN_STYLES}`}>
                      <div className="overflow-x-auto">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {activeNote.content || '*No content*'}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </ScrollArea>
                  <div className="shrink-0 px-6 pb-5 pt-3 border-t border-border/50 flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => handleCopy(activeNote.id)} title="Copy">
                      {copiedId === activeNote.id ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl"
                      onClick={() => toggleNotePinned(activeNote.id)} title={activeNote.pinned ? "Unpin" : "Pin"}>
                      {activeNote.pinned ? <PinOff className="size-4" /> : <Pin className="size-4 -rotate-45" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => initiateDelete(activeNote.id)} title="Delete">
                      <Trash2 className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-xl"
                      onClick={() => setIsEditing(true)} title="Edit">
                      <Pencil className="size-4" />
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border rounded-3xl sm:max-w-sm">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="size-5" />
                    Delete Note
                </DialogTitle>
                <DialogDescription className="text-muted-foreground pt-2">
                    Are you sure you want to delete this note? This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose asChild><Button variant="ghost" className="rounded-2xl">Cancel</Button></DialogClose>
                <Button onClick={confirmDelete} className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Note</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pinned Notes Section */}
      {filteredPinned.length > 0 && (
        <NotesGridSection
          title="Pinned Notes" icon={<Pin className="size-4 text-primary -rotate-45" />}
          notes={filteredPinned}
          editMode={editMode} onOpen={openNotePreview} onPin={toggleNotePinned}
          onDelete={initiateDelete} onCopy={handleCopy} copiedId={copiedId}
        />
      )}

      {/* Regular Notes Section */}
      {filteredRegular.length > 0 && (
        <NotesGridSection
          title="Notes" icon={<StickyNote className="size-4 text-primary" />}
          notes={filteredRegular}
          editMode={editMode} onOpen={openNotePreview} onPin={toggleNotePinned}
          onDelete={initiateDelete} onCopy={handleCopy} copiedId={copiedId}
        />
      )}

      {/* Empty state */}
      {!hasAnyNotes && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 rounded-3xl bg-muted">
            <StickyNote className="size-12 text-on-surface-variant" />
          </div>
          <p className="text-muted-foreground text-center">
            {searchQuery ? 'No notes match your search' : 'No notes yet. Create your first note!'}
          </p>
        </div>
      )}
    </div>
  )
}
