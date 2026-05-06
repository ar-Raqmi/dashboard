'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { Plus, Trash2, StickyNote, Copy, Pencil, Search, Check, Pin, PinOff, GripVertical, Maximize2, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useAppStore, MAX_GRID_W, MAX_GRID_H } from '@/lib/store'
import type { Note, Layout } from '@/lib/store'
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
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
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

// ===== Note Size Picker (reused from dashboard pattern) =====
function NoteSizePicker({ currentW, currentH, onSizeChange }: {
  currentW: number; currentH: number; onSizeChange: (w: number, h: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Size</div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${MAX_GRID_W}, minmax(0, 1fr))` }}>
        {Array.from({ length: MAX_GRID_H }, (_, row) =>
          Array.from({ length: MAX_GRID_W }, (_, col) => {
            const w = col + 1; const h = row + 1
            const isSelected = w <= currentW && h <= currentH
            const isCurrent = w === currentW && h === currentH
            return (
              <button key={`${w}-${h}`} onClick={() => onSizeChange(w, h)}
                className={cn('w-8 h-6 rounded-md transition-all border-2 flex items-center justify-center',
                  'hover:scale-110 active:scale-95',
                  isCurrent ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                    : isSelected ? 'bg-primary/20 border-primary/40 text-primary'
                    : 'bg-muted/50 border-transparent text-muted-foreground hover:border-primary/30')}
                title={`${w}×${h}`}>
                <span className="text-[8px] font-bold leading-none">{w}×{h}</span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

// ===== Note Card Component =====
function NoteCard({ note, editMode, onOpen, onPin, onDelete, onCopy, copiedId }: {
  note: Note; editMode: boolean; onOpen: () => void; onPin: () => void
  onDelete: () => void; onCopy: () => void; copiedId: string | null
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border flex flex-col gap-2 group relative overflow-hidden transition-shadow h-full',
        editMode ? 'border-primary/40 shadow-md shadow-primary/5 ring-1 ring-primary/20 cursor-default' : 'border-border cursor-pointer hover:shadow-md',
        'bg-card' // Solid card background — always readable
      )}
      onClick={editMode ? undefined : onOpen}
    >
      {/* Color accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 shrink-0" style={{ backgroundColor: note.color }} />

      {/* Drag handle in edit mode */}
      {editMode && (
        <div className="note-drag-handle cursor-grab active:cursor-grabbing p-1 flex items-center justify-center">
          <GripVertical className="w-4 h-4 text-primary/50" />
        </div>
      )}

      <div className={cn('flex flex-col gap-2 px-4 pb-3 pt-3', editMode ? 'pt-1' : 'pt-2')}>
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground text-sm line-clamp-1 flex-1 min-w-0">
            {note.title}
          </h3>
          <div className="flex gap-0.5 shrink-0">
            {note.pinned && <Pin className="size-3.5 text-primary/70 -rotate-45" />}
          </div>
        </div>

        {/* Content preview */}
        <div className={`text-xs text-muted-foreground line-clamp-3 leading-relaxed ${MARKDOWN_STYLES}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: note.color }} />
          <span className="text-[0.65rem] text-outline">
            {new Date(note.updatedAt).toLocaleDateString()}
          </span>
          <div className="ml-auto flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onCopy() }}
              className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Copy content">
              {copiedId === note.id ? <Check className="size-3" /> : <Copy className="size-3" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onPin() }}
              className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title={note.pinned ? 'Unpin' : 'Pin'}>
              {note.pinned ? <PinOff className="size-3" /> : <Pin className="size-3 -rotate-45" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete">
              <Trash2 className="size-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== Notes Grid Section (reusable for pinned & regular) =====
function NotesGridSection({
  title,
  icon,
  notes,
  layouts,
  mobileLayouts,
  setLayouts,
  setMobileLayouts,
  editMode,
  onOpen,
  onPin,
  onDelete,
  onCopy,
  copiedId,
}: {
  title: string; icon: React.ReactNode; notes: Note[]
  layouts: Layout[]; mobileLayouts: Layout[]
  setLayouts: (l: Layout[]) => void; setMobileLayouts: (l: Layout[]) => void
  editMode: boolean
  onOpen: (id: string) => void; onPin: (id: string) => void
  onDelete: (id: string) => void; onCopy: (id: string) => void
  copiedId: string | null
}) {
  const { containerRef, width } = useContainerWidth()
  const currentBreakpointRef = useRef<string>('lg')

  const noteIds = useMemo(() => new Set(notes.map((n) => n.id)), [notes])

  // Build responsive layouts from store data
  const responsiveLayouts = useMemo(() => {
    const desktopLayout = layouts
      .filter((l) => noteIds.has(l.i))
      .map((l) => ({ ...l, w: Math.min(l.w, MAX_GRID_W), h: Math.min(l.h, MAX_GRID_H), x: Math.min(l.x, MAX_GRID_W - 1) }))
    const mobileLayout = mobileLayouts
      .filter((l) => noteIds.has(l.i))
      .map((l) => ({ ...l, w: 1, h: Math.min(l.h, MAX_GRID_H), x: 0 }))
    return { lg: desktopLayout, md: desktopLayout, sm: mobileLayout }
  }, [layouts, mobileLayouts, noteIds])

  // Generate auto layouts for notes that don't have one yet
  const finalLayouts = useMemo(() => {
    const existingIds = new Set(
      responsiveLayouts.lg.map((l) => l.i)
    )
    const missingNotes = notes.filter((n) => !existingIds.has(n.id))
    if (missingNotes.length === 0) return responsiveLayouts

    const extraDesktop: Layout[] = []
    const extraMobile: Layout[] = []
    // Find max y in existing layout
    const maxY = responsiveLayouts.lg.reduce((max, l) => Math.max(max, l.y + l.h), 0)
    missingNotes.forEach((note, idx) => {
      const col = idx % MAX_GRID_W
      const row = Math.floor(idx / MAX_GRID_W)
      extraDesktop.push({
        i: note.id, x: col, y: maxY + row, w: 1, h: 1,
        minW: 1, maxW: MAX_GRID_W, minH: 1, maxH: MAX_GRID_H,
      })
      extraMobile.push({
        i: note.id, x: 0, y: maxY + idx, w: 1, h: 1,
        minW: 1, maxW: 1, minH: 1, maxH: MAX_GRID_H,
      })
    })

    return {
      lg: [...responsiveLayouts.lg, ...extraDesktop],
      md: [...responsiveLayouts.lg, ...extraDesktop],
      sm: [...responsiveLayouts.sm, ...extraMobile],
    }
  }, [responsiveLayouts, notes])

  const handleLayoutChange = useCallback((currentLayout: Layout[]) => {
    if (currentBreakpointRef.current === 'sm') {
      const hiddenLayouts = mobileLayouts.filter((l) => !noteIds.has(l.i))
      setMobileLayouts([...hiddenLayouts, ...currentLayout])
    } else {
      const hiddenLayouts = layouts.filter((l) => !noteIds.has(l.i))
      setLayouts([...hiddenLayouts, ...currentLayout])
    }
  }, [layouts, mobileLayouts, noteIds, setLayouts, setMobileLayouts])

  // Lookup map for current sizes
  const sizeMap = useMemo(() => {
    const map = new Map<string, { w: number; h: number }>()
    for (const l of finalLayouts.lg) {
      map.set(l.i, { w: l.w, h: l.h })
    }
    return map
  }, [finalLayouts])

  // Handle size change — uses finalLayouts to find current position for notes missing from store
  const handleSizeChange = useCallback((noteId: string, w: number, h: number) => {
    const clampedW = Math.min(Math.max(w, 1), MAX_GRID_W)
    const clampedH = Math.min(Math.max(h, 1), MAX_GRID_H)

    // Find the note's current desktop layout (from finalLayouts which has auto-generated entries)
    const currentDesktop = finalLayouts.lg.find((l) => l.i === noteId)
    const currentMobile = finalLayouts.sm.find((l) => l.i === noteId)

    // Update desktop layout
    const existingDesktop = layouts.find((l) => l.i === noteId)
    if (existingDesktop) {
      setLayouts(layouts.map((l) => l.i === noteId ? { ...l, w: clampedW, h: clampedH } : l))
    } else if (currentDesktop) {
      // Note doesn't have a store entry yet — create one using current position from finalLayouts
      setLayouts([...layouts, { ...currentDesktop, w: clampedW, h: clampedH }])
    }

    // Update mobile layout
    const existingMobile = mobileLayouts.find((l) => l.i === noteId)
    if (existingMobile) {
      setMobileLayouts(mobileLayouts.map((l) => l.i === noteId ? { ...l, h: clampedH } : l))
    } else if (currentMobile) {
      setMobileLayouts([...mobileLayouts, { ...currentMobile, h: clampedH }])
    }
  }, [finalLayouts, layouts, mobileLayouts, setLayouts, setMobileLayouts])

  if (notes.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{notes.length}</span>
      </div>

      <div ref={containerRef} className="w-full">
        <ResponsiveGridLayout
          className="layout"
          layouts={finalLayouts}
          breakpoints={{ lg: 768, md: 768, sm: 0 }}
          cols={{ lg: 3, md: 3, sm: 1 }}
          rowHeight={100}
          width={width}
          onLayoutChange={handleLayoutChange}
          onBreakpointChange={(bp) => { currentBreakpointRef.current = bp }}
          draggableHandle={editMode ? '.note-drag-handle' : undefined}
          compactType="vertical"
          margin={[12, 12]}
          containerPadding={[0, 0]}
          isResizable={false}
          isDraggable={editMode}
        >
          {notes.map((note) => {
            const size = sizeMap.get(note.id)
            return (
              <div key={note.id} className="relative">
                {/* Size picker in edit mode */}
                {editMode && (
                  <div className="absolute top-1 right-1 z-10">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}>
                          <Maximize2 className="size-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="bottom" align="end" sideOffset={4} className="rounded-2xl p-3 w-auto">
                        <NoteSizePicker
                          currentW={size?.w ?? 1} currentH={size?.h ?? 1}
                          onSizeChange={(w, h) => handleSizeChange(note.id, w, h)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                <NoteCard
                  note={note} editMode={editMode}
                  onOpen={() => onOpen(note.id)}
                  onPin={() => onPin(note.id)}
                  onDelete={() => onDelete(note.id)}
                  onCopy={() => onCopy(note.id)}
                  copiedId={copiedId}
                />
              </div>
            )
          })}
        </ResponsiveGridLayout>
      </div>
    </div>
  )
}

// ===== Main Page =====
export default function NotesPage() {
  const {
    notes, addNote, updateNote, deleteNote, toggleNotePinned,
    noteLayouts, noteMobileLayouts, setNoteLayouts, setNoteMobileLayouts,
    pinnedNoteLayouts, pinnedNoteMobileLayouts, setPinnedNoteLayouts, setPinnedNoteMobileLayouts,
  } = useAppStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0].value)
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)

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

  const handleDelete = (id: string) => { deleteNote(id) }
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
                      <h2 className="text-lg font-semibold text-foreground truncate">{activeNote.title}</h2>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Pin toggle */}
                    <Button variant="ghost" size="icon"
                      className={`size-8 rounded-xl ${activeNote.pinned ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary'}`}
                      onClick={() => toggleNotePinned(activeNote.id)}
                      title={activeNote.pinned ? 'Unpin' : 'Pin'}>
                      {activeNote.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5 -rotate-45" />}
                    </Button>
                    <Button variant={isEditing ? 'default' : 'outline'} size="sm"
                      onClick={() => { if (isEditing) handleSaveNote(); else setIsEditing(true) }}
                      className="rounded-xl gap-1.5 text-xs h-8">
                      {isEditing ? <><Check className="size-3.5" />Save</> : <><Pencil className="size-3.5" />Edit</>}
                    </Button>
                    <Button variant="ghost" size="icon"
                      className="size-8 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { deleteNote(activeNote.id); setViewDialogOpen(false); resetForm() }}>
                      <Trash2 className="size-3.5" />
                    </Button>
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
                <ScrollArea className="flex-1 min-h-0 px-6 pb-6">
                  <div className={`text-sm text-foreground pr-2 ${MARKDOWN_STYLES}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {activeNote.content || '*No content*'}
                    </ReactMarkdown>
                  </div>
                </ScrollArea>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Pinned Notes Section */}
      {filteredPinned.length > 0 && (
        <NotesGridSection
          title="Pinned Notes" icon={<Pin className="size-4 text-primary -rotate-45" />}
          notes={filteredPinned}
          layouts={pinnedNoteLayouts} mobileLayouts={pinnedNoteMobileLayouts}
          setLayouts={setPinnedNoteLayouts} setMobileLayouts={setPinnedNoteMobileLayouts}
          editMode={editMode} onOpen={openNotePreview} onPin={toggleNotePinned}
          onDelete={handleDelete} onCopy={handleCopy} copiedId={copiedId}
        />
      )}

      {/* Regular Notes Section */}
      {filteredRegular.length > 0 && (
        <NotesGridSection
          title="Notes" icon={<StickyNote className="size-4 text-primary" />}
          notes={filteredRegular}
          layouts={noteLayouts} mobileLayouts={noteMobileLayouts}
          setLayouts={setNoteLayouts} setMobileLayouts={setNoteMobileLayouts}
          editMode={editMode} onOpen={openNotePreview} onPin={toggleNotePinned}
          onDelete={handleDelete} onCopy={handleCopy} copiedId={copiedId}
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
