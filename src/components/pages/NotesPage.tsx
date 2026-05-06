'use client'

import { useState, useMemo } from 'react'
import { Plus, Trash2, StickyNote, Copy, Pencil, Search, Check, Eye, Edit3, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAppStore } from '@/lib/store'
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
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

const NOTE_COLORS = [
  { value: '#A5D6A7', label: 'Green' },
  { value: '#F48FB1', label: 'Pink' },
  { value: '#CE93D8', label: 'Purple' },
  { value: '#80CBC4', label: 'Teal' },
  { value: '#FFD54F', label: 'Amber' },
  { value: '#FF8A65', label: 'Orange' },
]

const MARKDOWN_STYLES = `[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-3 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-1 [&_h3]:mt-2 [&_p]:mb-2 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:mb-2 [&_li]:mb-1 [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:mb-2 [&_blockquote]:border-l-3 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:mb-2 [&_strong]:font-bold [&_a]:text-primary [&_a]:underline [&_hr]:border-border [&_hr]:my-3 [&_table]:w-full [&_table]:mb-2 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-muted [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1`

export default function NotesPage() {
  const { notes, addNote, updateNote, deleteNote } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0].value)
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes
    const q = searchQuery.toLowerCase()
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    )
  }, [notes, searchQuery])

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
    } catch {
      // fallback
    }
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
      // Save any pending edits before closing
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
                <Input
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title..."
                  className="rounded-2xl bg-input border-border"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-on-surface-variant">Content</label>
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write your note in Markdown..."
                  rows={6}
                  className="rounded-2xl bg-input border-border resize-none max-h-[50vh]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-on-surface-variant">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.value}
                      className={`size-8 rounded-xl transition-all ${
                        noteColor === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-card scale-110' : ''
                      }`}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setNoteColor(c.value)}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost" className="rounded-2xl">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleAddNote}
                className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Add Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes..."
          className="pl-10 rounded-2xl bg-muted border-border"
        />
      </div>

      {/* Note View / Edit Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={handleViewDialogClose}>
        <DialogContent className="bg-card border-border rounded-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">{activeNote?.title || 'Note'}</DialogTitle>
          {activeNote && (
            <>
              {/* Header with color accent */}
              <div
                className="px-6 pt-5 pb-3 shrink-0"
                style={{ backgroundColor: `${activeNote.color}12` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: activeNote.color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {new Date(activeNote.updatedAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {isEditing ? (
                      <Input
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        className="text-lg font-semibold bg-input border-border rounded-xl"
                      />
                    ) : (
                      <h2 className="text-lg font-semibold text-foreground truncate">
                        {activeNote.title}
                      </h2>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Edit / Preview toggle */}
                    <Button
                      variant={isEditing ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (isEditing) {
                          handleSaveNote()
                        } else {
                          setIsEditing(true)
                        }
                      }}
                      className="rounded-xl gap-1.5 text-xs h-8"
                    >
                      {isEditing ? (
                        <>
                          <Check className="size-3.5" />
                          Save
                        </>
                      ) : (
                        <>
                          <Pencil className="size-3.5" />
                          Edit
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        deleteNote(activeNote.id)
                        setViewDialogOpen(false)
                        resetForm()
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Content Area - scrollable */}
              <ScrollArea className="flex-1 min-h-0 px-6 pb-6">
                {isEditing ? (
                  <div className="flex flex-col gap-3">
                    <Textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Write your note in Markdown..."
                      className="rounded-2xl bg-input border-border resize-none min-h-[200px]"
                      autoFocus
                    />
                    <div className="flex gap-2 flex-wrap">
                      {NOTE_COLORS.map((c) => (
                        <button
                          key={c.value}
                          className={`size-7 rounded-lg transition-all ${
                            noteColor === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-card scale-110' : 'opacity-60 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c.value }}
                          onClick={() => setNoteColor(c.value)}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={`text-sm text-foreground pr-2 ${MARKDOWN_STYLES}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {activeNote.content || '*No content*'}
                    </ReactMarkdown>
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 rounded-3xl bg-muted">
            <StickyNote className="size-12 text-on-surface-variant" />
          </div>
          <p className="text-muted-foreground text-center">
            {searchQuery ? 'No notes match your search' : 'No notes yet. Create your first note!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="rounded-3xl border border-border p-4 flex flex-col gap-3 group relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              style={{ backgroundColor: `${note.color}15` }}
              onClick={() => openNotePreview(note.id)}
            >
              {/* Color accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
                style={{ backgroundColor: note.color }}
              />
              <div className="flex items-start justify-between gap-2 pt-1">
                <h3 className="font-semibold text-foreground text-sm line-clamp-1">
                  {note.title}
                </h3>
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10"
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(note.content, note.id) }}
                    title="Copy to clipboard"
                  >
                    {copiedId === note.id ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => { e.stopPropagation(); deleteNote(note.id) }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <div className={`text-xs text-on-surface-variant line-clamp-4 leading-relaxed ${MARKDOWN_STYLES}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
              </div>
              <div className="flex items-center gap-2 mt-auto pt-2">
                <div
                  className="size-2 rounded-full"
                  style={{ backgroundColor: note.color }}
                />
                <span className="text-[0.65rem] text-outline">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
