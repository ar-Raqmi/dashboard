'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, StickyNote, Copy, Pencil, Search, Check } from 'lucide-react'
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

const NOTE_COLORS = [
  { value: '#A5D6A7', label: 'Green' },
  { value: '#F48FB1', label: 'Pink' },
  { value: '#CE93D8', label: 'Purple' },
  { value: '#80CBC4', label: 'Teal' },
  { value: '#FFD54F', label: 'Amber' },
  { value: '#FF8A65', label: 'Orange' },
]

export default function NotesPage() {
  const { notes, addNote, updateNote, deleteNote } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0].value)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes
    const q = searchQuery.toLowerCase()
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    )
  }, [notes, searchQuery])

  const handleAddNote = () => {
    if (!noteTitle.trim()) return
    addNote({
      title: noteTitle.trim(),
      content: noteContent.trim(),
      color: noteColor,
    })
    resetForm()
    setDialogOpen(false)
  }

  const handleEditNote = () => {
    if (!editingNoteId || !noteTitle.trim()) return
    updateNote(editingNoteId, {
      title: noteTitle.trim(),
      content: noteContent.trim(),
      color: noteColor,
    })
    resetForm()
    setEditDialogOpen(false)
  }

  const openEditDialog = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId)
    if (!note) return
    setEditingNoteId(noteId)
    setNoteTitle(note.title)
    setNoteContent(note.content)
    setNoteColor(note.color)
    setEditDialogOpen(true)
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
    setEditingNoteId(null)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1 },
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-[oklch(0.72_0.19_142_/_0.15)]">
            <StickyNote className="size-6 text-[oklch(0.72_0.19_142)]" />
          </div>
          <h1 className="text-2xl font-bold">Notes</h1>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl bg-[oklch(0.72_0.19_142)] text-[oklch(0.13_0.005_155)] hover:bg-[oklch(0.65_0.19_142)]">
              <Plus className="size-4 mr-1" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[oklch(0.17_0.008_155)] border-[oklch(0.28_0.01_155)] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-[oklch(0.96_0.005_155)]">Add New Note</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-[oklch(0.75_0.01_155)]">Title</label>
                <Input
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title..."
                  className="rounded-2xl bg-[oklch(0.24_0.01_155)] border-[oklch(0.28_0.01_155)]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-[oklch(0.75_0.01_155)]">Content</label>
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write your note..."
                  rows={4}
                  className="rounded-2xl bg-[oklch(0.24_0.01_155)] border-[oklch(0.28_0.01_155)] resize-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-[oklch(0.75_0.01_155)]">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.value}
                      className={`size-8 rounded-xl transition-all ${
                        noteColor === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-[oklch(0.17_0.008_155)] scale-110' : ''
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
                className="rounded-2xl bg-[oklch(0.72_0.19_142)] text-[oklch(0.13_0.005_155)] hover:bg-[oklch(0.65_0.19_142)]"
              >
                Add Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[oklch(0.65_0.01_155)]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="pl-10 rounded-2xl bg-[oklch(0.22_0.008_155)] border-[oklch(0.28_0.01_155)]"
          />
        </div>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="bg-[oklch(0.17_0.008_155)] border-[oklch(0.28_0.01_155)] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[oklch(0.96_0.005_155)]">Edit Note</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-[oklch(0.75_0.01_155)]">Title</label>
              <Input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="rounded-2xl bg-[oklch(0.24_0.01_155)] border-[oklch(0.28_0.01_155)]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-[oklch(0.75_0.01_155)]">Content</label>
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
                className="rounded-2xl bg-[oklch(0.24_0.01_155)] border-[oklch(0.28_0.01_155)] resize-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-[oklch(0.75_0.01_155)]">Color</label>
              <div className="flex gap-2 flex-wrap">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    className={`size-8 rounded-xl transition-all ${
                      noteColor === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-[oklch(0.17_0.008_155)] scale-110' : ''
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
              onClick={handleEditNote}
              className="rounded-2xl bg-[oklch(0.72_0.19_142)] text-[oklch(0.13_0.005_155)] hover:bg-[oklch(0.65_0.19_142)]"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Grid */}
      <AnimatePresence mode="wait">
        {filteredNotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 gap-4"
          >
            <div className="p-4 rounded-3xl bg-[oklch(0.22_0.008_155)]">
              <StickyNote className="size-12 text-[oklch(0.75_0.01_155)]" />
            </div>
            <p className="text-[oklch(0.65_0.01_155)] text-center">
              {searchQuery ? 'No notes match your search' : 'No notes yet. Create your first note!'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredNotes.map((note) => (
              <motion.div
                key={note.id}
                variants={itemVariants}
                layout
                exit={{ opacity: 0, scale: 0.9 }}
                className="rounded-3xl border border-[oklch(0.28_0.01_155)] p-4 flex flex-col gap-3 group relative overflow-hidden"
                style={{ backgroundColor: `${note.color}15` }}
              >
                {/* Color accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
                  style={{ backgroundColor: note.color }}
                />
                <div className="flex items-start justify-between gap-2 pt-1">
                  <h3 className="font-semibold text-[oklch(0.96_0.005_155)] text-sm line-clamp-1">
                    {note.title}
                  </h3>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-xl text-[oklch(0.75_0.01_155)] hover:text-[oklch(0.72_0.19_142)] hover:bg-[oklch(0.72_0.19_142_/_0.1)]"
                      onClick={() => copyToClipboard(note.content, note.id)}
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
                      className="size-7 rounded-xl text-[oklch(0.75_0.01_155)] hover:text-[oklch(0.72_0.19_142)] hover:bg-[oklch(0.72_0.19_142_/_0.1)]"
                      onClick={() => openEditDialog(note.id)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-xl text-[oklch(0.65_0.2_25)] hover:text-[oklch(0.7_0.2_25)] hover:bg-[oklch(0.65_0.2_25_/_0.1)]"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-[oklch(0.75_0.01_155)] line-clamp-4 leading-relaxed">
                  {note.content}
                </p>
                <div className="flex items-center gap-2 mt-auto pt-2">
                  <div
                    className="size-2 rounded-full"
                    style={{ backgroundColor: note.color }}
                  />
                  <span className="text-[0.65rem] text-[oklch(0.55_0.01_155)]">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
