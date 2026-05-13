'use client'

import { useState } from 'react'
import { Copy, Plus, X, Check, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAppStore } from '@/lib/store'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function NotesWidget() {
  const { notes, addNote, deleteNote, setActivePage } = useAppStore()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newColor, setNewColor] = useState('#A5D6A7')
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null)

  const visibleNotes = notes.slice(0, 4)

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleAddNote = () => {
    if (!newTitle.trim()) return
    addNote({
      title: newTitle.trim(),
      content: newContent.trim(),
      color: newColor,
    })
    setNewTitle('')
    setNewContent('')
    setShowAddForm(false)
  }

  const confirmDelete = () => {
    if (deleteNoteId) {
      deleteNote(deleteNoteId)
      setDeleteNoteId(null)
    }
  }

  const colorOptions = ['#A5D6A7', '#F48FB1', '#CE93D8', '#80CBC4', '#FFE082', '#FFAB91']

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-xs font-semibold text-[oklch(0.5_0.01_155)] uppercase tracking-wider">
          Quick Notes
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-7 h-7 rounded-xl bg-[oklch(0.72_0.19_142)] flex items-center justify-center text-[oklch(0.17_0.008_155)] hover:opacity-90 transition-opacity"
        >
          {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-3 p-3 rounded-2xl bg-[oklch(0.17_0.008_155)] space-y-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Note title..."
            className="h-8 text-xs bg-[oklch(0.13_0.008_155)] border-[oklch(0.25_0.01_155)] rounded-xl placeholder:text-[oklch(0.4_0.01_155)]"
          />
          <Textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Note content (markdown)..."
            className="min-h-[60px] max-h-[100px] text-xs bg-[oklch(0.13_0.008_155)] border-[oklch(0.25_0.01_155)] rounded-xl placeholder:text-[oklch(0.4_0.01_155)] resize-none"
          />
          <div className="flex items-center gap-1.5">
            {colorOptions.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`w-4 h-4 rounded-full transition-transform ${newColor === c ? 'scale-125 ring-2 ring-white/30' : ''
                  }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <button
              onClick={handleAddNote}
              className="ml-auto text-[10px] px-3 py-1.5 rounded-xl bg-[oklch(0.72_0.19_142)] text-[oklch(0.17_0.008_155)] font-semibold hover:opacity-90 transition-opacity"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Notes Grid */}
      <div className="flex-1 grid grid-cols-2 gap-2 auto-rows-min overflow-y-auto scrollbar-thin">
        {visibleNotes.map((note) => (
          <div
            key={note.id}
            className="relative p-3 rounded-2xl cursor-pointer group hover:ring-1 hover:ring-white/10 transition-all min-h-[90px] flex flex-col justify-between"
            style={{ backgroundColor: note.color + '20' }}
            onClick={() => setActivePage('notes')}
          >
            {/* Color bar */}
            <div
              className="absolute top-0 left-3 right-3 h-0.5 rounded-b-full"
              style={{ backgroundColor: note.color }}
            />

            {/* Title */}
            <h4
              className="text-xs font-semibold text-foreground mt-1"
              style={{ color: note.color }}
            >
              {note.title}
            </h4>

            {/* Content Preview */}
            <div className="text-[10px] text-[oklch(0.6_0.01_155)] line-clamp-2 mt-1 mb-2 flex-1 prose-sm [&_p]:mb-0.5 [&_strong]:font-bold max-h-[2.5rem] overflow-hidden">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
            </div>

            {/* Action Bar (Pinned to bottom) */}
            <div className="flex justify-end gap-1.5 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopy(note.id, note.content)
                }}
                className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
              >
                {copiedId === note.id ? (
                  <Check className="w-3 h-3 text-[oklch(0.72_0.19_142)]" />
                ) : (
                  <Copy className="w-3 h-3 text-[oklch(0.5_0.01_155)] hover:text-[oklch(0.7_0.01_155)]" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteNoteId(note.id)
                }}
                className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3 h-3 text-[oklch(0.5_0.01_155)] hover:text-destructive" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteNoteId} onOpenChange={(open) => !open && setDeleteNoteId(null)}>
        <DialogContent className="bg-card border-border rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete Note</DialogTitle>
            <DialogDescription>Are you sure you want to delete this note?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild><Button variant="ghost" className="rounded-2xl">Cancel</Button></DialogClose>
            <Button onClick={confirmDelete} className="rounded-2xl bg-destructive text-destructive-foreground">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View All */}
      {notes.length > 4 && (
        <button
          onClick={() => setActivePage('notes')}
          className="mt-3 text-[10px] text-[oklch(0.72_0.19_142)] hover:underline text-center"
        >
          View All Notes →
        </button>
      )}
    </div>
  )
}
