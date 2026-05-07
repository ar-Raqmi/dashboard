'use client'

import React, { useState, useMemo, useCallback } from 'react'
import {
  Folder,
  Image as ImageIcon,
  Music,
  FileText,
  FileEdit,
  Film,
  File,
  FolderPlus,
  Upload,
  Trash2,
  Pencil,
  ChevronRight,
  Home,
  ArrowRight,
  Check,
  X,
  FolderOpen,
  Move,
  MoreVertical,
  LayoutGrid,
  List,
  ArrowUpDown,
  Clock,
  HardDrive,
} from 'lucide-react'
import { useAppStore, type FileItem, type FileCategory } from '@/lib/store'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

// ===== HELPERS =====
const formatSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

const formatDate = (iso: string): string => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatDateShort = (iso: string): string => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getCategoryIcon = (category: FileCategory, className?: string) => {
  const cn = className || 'size-6'
  switch (category) {
    case 'image': return <ImageIcon className={cn} />
    case 'audio': return <Music className={cn} />
    case 'pdf': return <FileText className={cn} />
    case 'doc': return <FileEdit className={cn} />
    case 'video': return <Film className={cn} />
    case 'folder': return <Folder className={cn} />
    default: return <File className={cn} />
  }
}

const getCategoryColor = (category: FileCategory): string => {
  switch (category) {
    case 'image': return 'bg-blue-500/15 text-blue-400'
    case 'audio': return 'bg-purple-500/15 text-purple-400'
    case 'pdf': return 'bg-red-500/15 text-red-400'
    case 'doc': return 'bg-amber-500/15 text-amber-400'
    case 'video': return 'bg-pink-500/15 text-pink-400'
    case 'folder': return 'bg-primary/15 text-primary'
    default: return 'bg-gray-500/15 text-gray-400'
  }
}

const getCategoryGradient = (category: FileCategory): string => {
  switch (category) {
    case 'image': return 'from-blue-500/25 via-blue-400/10 to-blue-600/5'
    case 'audio': return 'from-purple-500/25 via-purple-400/10 to-purple-600/5'
    case 'pdf': return 'from-red-500/25 via-red-400/10 to-red-600/5'
    case 'doc': return 'from-amber-500/25 via-amber-400/10 to-amber-600/5'
    case 'video': return 'from-pink-500/25 via-pink-400/10 to-pink-600/5'
    case 'folder': return 'from-primary/25 via-primary/10 to-primary/5'
    default: return 'from-gray-500/25 via-gray-400/10 to-gray-600/5'
  }
}

const getCategoryBadgeColor = (category: FileCategory): string => {
  switch (category) {
    case 'image': return 'bg-blue-500/15 text-blue-400 border-blue-500/20'
    case 'audio': return 'bg-purple-500/15 text-purple-400 border-purple-500/20'
    case 'pdf': return 'bg-red-500/15 text-red-400 border-red-500/20'
    case 'doc': return 'bg-amber-500/15 text-amber-400 border-amber-500/20'
    case 'video': return 'bg-pink-500/15 text-pink-400 border-pink-500/20'
    case 'folder': return 'bg-primary/15 text-primary border-primary/20'
    default: return 'bg-gray-500/15 text-gray-400 border-gray-500/20'
  }
}

const getCategoryLabel = (category: FileCategory): string => {
  switch (category) {
    case 'image': return 'Image'
    case 'audio': return 'Audio'
    case 'pdf': return 'PDF'
    case 'doc': return 'Doc'
    case 'video': return 'Video'
    case 'folder': return 'Folder'
    default: return 'File'
  }
}

// ===== BREADCRUMB =====
function BreadcrumbNav() {
  const { files, currentFolderId, setCurrentFolderId } = useAppStore()

  const breadcrumbs = useMemo(() => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: 'Home' }]
    let currentId = currentFolderId
    const chain: { id: string; name: string }[] = []
    while (currentId) {
      const folder = files.find(f => f.id === currentId)
      if (folder) {
        chain.unshift({ id: folder.id, name: folder.name })
        currentId = folder.parentId
      } else {
        break
      }
    }
    return [...crumbs, ...chain]
  }, [files, currentFolderId])

  return (
    <nav aria-label="File breadcrumb" className="flex items-center gap-1.5 overflow-x-auto py-1">
      {breadcrumbs.map((crumb, i) => (
        <React.Fragment key={crumb.id ?? 'home'}>
          {i > 0 && (
            <ChevronRight className="size-3.5 text-muted-foreground/50 shrink-0" />
          )}
          {i === breadcrumbs.length - 1 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-primary/15 text-primary text-sm font-medium truncate max-w-48">
              {i === 0 && <Home className="size-3.5" />}
              {crumb.name}
            </span>
          ) : (
            <button
              onClick={() => setCurrentFolderId(crumb.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all text-sm truncate max-w-32"
            >
              {i === 0 ? <Home className="size-3.5" /> : crumb.name}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

// ===== MOVE TO FOLDER MODAL =====
function MoveToFolderModal({
  open,
  onClose,
  fileIds,
}: {
  open: boolean
  onClose: () => void
  fileIds: string[]
}) {
  const { files, moveFile } = useAppStore()
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)

  const folders = useMemo(() => files.filter(f => f.type === 'folder'), [files])

  const descendantIds = useMemo(() => {
    const ids = new Set<string>()
    const collectChildren = (parentId: string) => {
      files.filter(f => f.parentId === parentId).forEach(child => {
        ids.add(child.id)
        if (child.type === 'folder') collectChildren(child.id)
      })
    }
    fileIds.forEach(id => {
      ids.add(id)
      collectChildren(id)
    })
    return ids
  }, [files, fileIds])

  const rootFolders = folders.filter(f => f.parentId === null && !descendantIds.has(f.id))

  const renderFolderTree = (parentId: string | null, depth: number = 0) => {
    const children = folders.filter(
      f => f.parentId === parentId && !descendantIds.has(f.id)
    )
    return children.map(folder => (
      <div key={folder.id}>
        <button
          onClick={() => setSelectedFolderId(folder.id)}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl text-sm transition-all ${
            selectedFolderId === folder.id
              ? 'bg-primary/15 text-primary font-medium'
              : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground'
          }`}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
        >
          <Folder className="size-4 shrink-0" />
          <span className="truncate">{folder.name}</span>
        </button>
        {renderFolderTree(folder.id, depth + 1)}
      </div>
    ))
  }

  const handleMove = () => {
    fileIds.forEach(id => moveFile(id, selectedFolderId))
    onClose()
    setSelectedFolderId(null)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setSelectedFolderId(null) } }}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Move to Folder</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select a destination folder for {fileIds.length} item{fileIds.length > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl text-sm transition-all ${
              selectedFolderId === null
                ? 'bg-primary/15 text-primary font-medium'
                : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <Home className="size-4 shrink-0" />
            <span>Root (Home)</span>
          </button>
          <ScrollArea className="max-h-64">
            {renderFolderTree(null)}
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => { onClose(); setSelectedFolderId(null) }}
            className="rounded-2xl border-border text-foreground hover:bg-accent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ArrowRight className="size-4" />
            Move Here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ===== FILE CARD (GRID VIEW) =====
function FileCard({
  file,
  onNavigate,
  onPreview,
  onRename,
  onDelete,
  onMove,
  selected,
  onToggleSelect,
}: {
  file: FileItem
  onNavigate: (id: string) => void
  onPreview: (file: FileItem) => void
  onRename: (file: FileItem) => void
  onDelete: (file: FileItem) => void
  onMove: (file: FileItem) => void
  selected: boolean
  onToggleSelect: (id: string) => void
}) {
  const isFolder = file.type === 'folder'
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(file.name)
  const { renameFile } = useAppStore()

  const handleClick = () => {
    if (isFolder) {
      onNavigate(file.id)
    } else {
      onPreview(file)
    }
  }

  const handleRename = () => {
    if (renameValue.trim() && renameValue !== file.name) {
      renameFile(file.id, renameValue.trim())
    }
    setRenaming(false)
  }

  return (
    <div
      className={`group relative rounded-3xl cursor-pointer transition-colors duration-150 overflow-hidden ${
        selected
          ? 'ring-2 ring-primary/40 bg-primary/5 shadow-lg shadow-primary/5'
          : 'bg-card hover:shadow-md hover:shadow-black/5 border border-border/40 hover:border-border/70'
      }`}
      onClick={handleClick}
    >
      {/* Folder tab visual */}
      {isFolder && (
        <div className="relative">
          <div className={`h-6 rounded-t-3xl ${selected ? 'bg-primary/20' : 'bg-primary/10'}`} />
          <div className="absolute -bottom-1 left-4 w-16 h-3 rounded-t-lg bg-primary/15" />
        </div>
      )}

      {/* Selection checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleSelect(file.id) }}
        className={`absolute top-3 left-3 size-5 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
          selected
            ? 'bg-primary border-primary scale-100'
            : 'border-border/40 opacity-0 group-hover:opacity-100 hover:border-border scale-90 group-hover:scale-100'
        }`}
      >
        {selected && <Check className="size-3 text-primary-foreground" />}
      </button>

      {/* Context menu */}
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/80 backdrop-blur-sm">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-card border-border text-foreground rounded-2xl" align="end">
            <DropdownMenuItem
              className="gap-2 focus:bg-accent focus:text-foreground cursor-pointer rounded-xl"
              onClick={(e) => { e.stopPropagation(); onRename(file); setRenaming(true); setRenameValue(file.name) }}
            >
              <Pencil className="size-4" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 focus:bg-accent focus:text-foreground cursor-pointer rounded-xl"
              onClick={(e) => { e.stopPropagation(); onMove(file) }}
            >
              <Move className="size-4" /> Move
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="gap-2 focus:bg-red-500/20 focus:text-red-400 cursor-pointer text-red-400 rounded-xl"
              onClick={(e) => { e.stopPropagation(); onDelete(file) }}
            >
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Icon area */}
      <div className="flex justify-center mb-3 mt-2 px-4">
        {isFolder ? (
          <div className={`size-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${getCategoryGradient(file.category)}`}>
            {getCategoryIcon(file.category)}
          </div>
        ) : (
          <div className={`w-full h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br ${getCategoryGradient(file.category)}`}>
            {getCategoryIcon(file.category, 'size-8')}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="px-3 pb-3">
        {renaming ? (
          <div onClick={(e) => e.stopPropagation()} className="mb-1">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') setRenaming(false)
              }}
              onBlur={handleRename}
              autoFocus
              className="h-7 text-xs text-center bg-input border-border/50 text-foreground rounded-xl"
            />
          </div>
        ) : (
          <p className="text-sm font-medium text-foreground truncate text-center">{file.name}</p>
        )}

        {/* Meta */}
        {!isFolder && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-1">
            <span>{formatSize(file.size)}</span>
            <span className="size-0.5 rounded-full bg-border" />
            <span>{formatDateShort(file.createdAt)}</span>
          </div>
        )}
        {isFolder && (
          <p className="text-xs text-muted-foreground text-center mt-0.5">Folder</p>
        )}
      </div>
    </div>
  )
}

// ===== FILE LIST ROW (LIST VIEW) =====
function FileListRow({
  file,
  onNavigate,
  onPreview,
  onRename,
  onDelete,
  onMove,
  selected,
  onToggleSelect,
}: {
  file: FileItem
  onNavigate: (id: string) => void
  onPreview: (file: FileItem) => void
  onRename: (file: FileItem) => void
  onDelete: (file: FileItem) => void
  onMove: (file: FileItem) => void
  selected: boolean
  onToggleSelect: (id: string) => void
}) {
  const isFolder = file.type === 'folder'
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(file.name)
  const { renameFile } = useAppStore()

  const handleClick = () => {
    if (isFolder) {
      onNavigate(file.id)
    } else {
      onPreview(file)
    }
  }

  const handleRename = () => {
    if (renameValue.trim() && renameValue !== file.name) {
      renameFile(file.id, renameValue.trim())
    }
    setRenaming(false)
  }

  return (
    <div
      className={`group flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-2xl cursor-pointer transition-colors duration-150 ${
        selected
          ? 'bg-primary/10 ring-1 ring-primary/30'
          : 'hover:bg-accent/60'
      }`}
      onClick={handleClick}
    >
      {/* Selection checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleSelect(file.id) }}
        className={`shrink-0 size-5 rounded-md border-2 flex items-center justify-center transition-all ${
          selected
            ? 'bg-primary border-primary'
            : 'border-border/40 opacity-0 group-hover:opacity-100 hover:border-border'
        }`}
      >
        {selected && <Check className="size-3 text-primary-foreground" />}
      </button>

      {/* Icon */}
      <div className={`shrink-0 size-9 rounded-xl flex items-center justify-center ${getCategoryColor(file.category)}`}>
        {getCategoryIcon(file.category, 'size-4.5')}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        {renaming ? (
          <div onClick={(e) => e.stopPropagation()}>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') setRenaming(false)
              }}
              onBlur={handleRename}
              autoFocus
              className="h-7 text-sm bg-input border-border/50 text-foreground rounded-xl"
            />
          </div>
        ) : (
          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
        )}
      </div>

      {/* Size - hidden on mobile */}
      {!isFolder && (
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 w-20 justify-end">
          <HardDrive className="size-3" />
          <span>{formatSize(file.size)}</span>
        </div>
      )}
      {isFolder && (
        <div className="hidden sm:block text-xs text-muted-foreground shrink-0 w-20 text-right">
          —
        </div>
      )}

      {/* Type badge - hidden on small mobile */}
      <div className="hidden md:block shrink-0">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border ${getCategoryBadgeColor(file.category)}`}>
          {getCategoryLabel(file.category)}
        </span>
      </div>

      {/* Date - hidden on small screens */}
      <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 w-28 justify-end">
        <Clock className="size-3" />
        <span>{formatDateShort(file.createdAt)}</span>
      </div>

      {/* Actions */}
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-card border-border text-foreground rounded-2xl" align="end">
            <DropdownMenuItem
              className="gap-2 focus:bg-accent focus:text-foreground cursor-pointer rounded-xl"
              onClick={(e) => { e.stopPropagation(); onRename(file); setRenaming(true); setRenameValue(file.name) }}
            >
              <Pencil className="size-4" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 focus:bg-accent focus:text-foreground cursor-pointer rounded-xl"
              onClick={(e) => { e.stopPropagation(); onMove(file) }}
            >
              <Move className="size-4" /> Move
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="gap-2 focus:bg-red-500/20 focus:text-red-400 cursor-pointer text-red-400 rounded-xl"
              onClick={(e) => { e.stopPropagation(); onDelete(file) }}
            >
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ===== EMPTY STATE =====
function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 text-outline"
    >
      <div className="size-24 rounded-3xl bg-gradient-to-br from-muted/60 to-muted/20 flex items-center justify-center mb-4 shadow-sm">
        <FolderOpen className="size-12 text-muted-foreground/60" />
      </div>
      <p className="text-lg font-medium text-muted-foreground">This folder is empty</p>
      <p className="text-sm text-outline mt-1">Create a new folder or upload a file to get started</p>
    </div>
  )
}

// ===== VIEW TOGGLE =====
function ViewToggle({ viewMode, setViewMode }: { viewMode: 'grid' | 'list'; setViewMode: (v: 'grid' | 'list') => void }) {
  return (
    <div className="inline-flex items-center rounded-2xl bg-muted/50 border border-border/30 p-0.5">
      <button
        onClick={() => setViewMode('grid')}
        className={`inline-flex items-center justify-center size-8 rounded-xl transition-all duration-200 ${
          viewMode === 'grid'
            ? 'bg-card text-foreground shadow-sm border border-border/50'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label="Grid view"
        title="Grid view"
      >
        <LayoutGrid className="size-4" />
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={`inline-flex items-center justify-center size-8 rounded-xl transition-all duration-200 ${
          viewMode === 'list'
            ? 'bg-card text-foreground shadow-sm border border-border/50'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label="List view"
        title="List view"
      >
        <List className="size-4" />
      </button>
    </div>
  )
}

// ===== LIST HEADER =====
function ListHeader() {
  return (
    <div className="flex items-center gap-3 px-3 sm:px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
      <div className="shrink-0 size-5" /> {/* checkbox spacer */}
      <div className="shrink-0 size-9" /> {/* icon spacer */}
      <div className="flex-1 min-w-0 flex items-center gap-1">
        <ArrowUpDown className="size-3" />
        <span>Name</span>
      </div>
      <div className="hidden sm:block shrink-0 w-20 text-right flex items-center gap-1 justify-end">
        <span>Size</span>
      </div>
      <div className="hidden md:block shrink-0">
        <span className="px-2">Type</span>
      </div>
      <div className="hidden lg:block shrink-0 w-28 text-right">Modified</div>
      <div className="shrink-0 size-7" /> {/* actions spacer */}
    </div>
  )
}

// ===== MAIN FILE MANAGER =====
export default function FileManager() {
  const {
    files,
    currentFolderId,
    setCurrentFolderId,
    addFile,
    deleteFile,
    setPreviewFile,
  } = useAppStore()

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null)
  const [moveTargetIds, setMoveTargetIds] = useState<string[]>([])
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  // Current directory items
  const currentItems = useMemo(
    () => files.filter(f => f.parentId === currentFolderId),
    [files, currentFolderId]
  )

  // Sort: folders first, then by name
  const sortedItems = useMemo(
    () =>
      [...currentItems].sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1
        if (a.type !== 'folder' && b.type === 'folder') return 1
        return a.name.localeCompare(b.name)
      }),
    [currentItems]
  )

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleNavigate = useCallback((folderId: string) => {
    setCurrentFolderId(folderId)
    setSelectedIds(new Set())
  }, [setCurrentFolderId])

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFile({
        name: newFolderName.trim(),
        type: 'folder',
        category: 'folder',
        parentId: currentFolderId,
        size: 0,
      })
      setNewFolderName('')
      setShowNewFolder(false)
    }
  }

  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const saveFile = useMutation(api.files.saveFile)
  const { sessionToken } = useAuth()

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !sessionToken) return

    try {
      // 1. Get upload URL
      const postUrl = await generateUploadUrl()

      // 2. Upload file
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })
      const { storageId } = await result.json()

      // 3. Save file metadata
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      let category: FileCategory = 'other'
      if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) category = 'image'
      else if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) category = 'audio'
      else if (ext === 'pdf') category = 'pdf'
      else if (['doc', 'docx', 'txt', 'xlsx', 'xls', 'csv'].includes(ext)) category = 'doc'
      else if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) category = 'video'

      await saveFile({
        sessionToken,
        name: file.name,
        type: 'file',
        category,
        parentId: currentFolderId ?? undefined,
        size: file.size,
        storageId: storageId,
      })

      setShowUpload(false)
    } catch (err) {
      console.error('Upload failed:', err)
      // TODO: Add toast notification
    }
  }

  const handleDelete = () => {
    if (deleteTarget) {
      deleteFile(deleteTarget.id)
      setDeleteTarget(null)
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(deleteTarget.id)
        return next
      })
    }
  }

  const handleBulkMove = () => {
    setMoveTargetIds(Array.from(selectedIds))
  }

  return (
    <div className="flex flex-col h-full rounded-3xl bg-card/80 backdrop-blur-sm border border-border/40 p-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <BreadcrumbNav />

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <div
              className="flex items-center gap-2"
            >
              <Badge className="bg-primary/15 text-primary border-0 rounded-2xl font-medium">
                {selectedIds.size} selected
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkMove}
                className="rounded-2xl text-foreground/70 hover:text-foreground hover:bg-accent"
              >
                <Move className="size-4" />
                <span className="hidden sm:inline">Move</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  selectedIds.forEach(id => deleteFile(id))
                  setSelectedIds(new Set())
                }}
                className="rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <X className="size-4" />
              </Button>
            </div>
          )}

          {/* View toggle */}
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />

          <Button
            onClick={() => setShowNewFolder(true)}
            size="sm"
            className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-sm shadow-primary/10"
          >
            <FolderPlus className="size-4" />
            <span className="hidden sm:inline">New Folder</span>
          </Button>
          <Button
            onClick={() => setShowUpload(true)}
            size="sm"
            variant="outline"
            className="rounded-2xl border-border/60 text-foreground hover:bg-accent gap-1.5"
          >
            <Upload className="size-4" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
        </div>
      </div>

      {/* New Folder Input */}
      {showNewFolder && (
        <div className="mb-3">
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-primary/5 border border-primary/20">
              <FolderPlus className="size-5 text-primary shrink-0" />
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder()
                  if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName('') }
                }}
                placeholder="Folder name..."
                autoFocus
                className="h-8 bg-input border-border text-foreground rounded-xl text-sm"
              />
              <Button size="sm" onClick={handleCreateFolder} className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 size-8 shrink-0">
                <Check className="size-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowNewFolder(false); setNewFolderName('') }} className="rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent size-8 shrink-0">
                <X className="size-4" />
              </Button>
          </div>
        </div>
      )}

      {/* Upload Input */}
      {showUpload && (
        <div className="mb-3">
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-muted/30 border border-border/40">
              <Upload className="size-5 text-muted-foreground shrink-0" />
              <input
                type="file"
                onChange={handleUploadFile}
                className="flex-1 text-sm text-foreground file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <Button size="sm" variant="ghost" onClick={() => setShowUpload(false)} className="rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent size-8 shrink-0">
                <X className="size-4" />
              </Button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {sortedItems.length === 0 ? (
          <EmptyState />
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
          >
            {sortedItems.map(file => (
              <FileCard
                  key={file.id}
                  file={file}
                  onNavigate={handleNavigate}
                  onPreview={setPreviewFile}
                  onRename={() => {}}
                  onDelete={setDeleteTarget}
                  onMove={(f) => setMoveTargetIds([f.id])}
                  selected={selectedIds.has(file.id)}
                  onToggleSelect={toggleSelect}
                />
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-0.5">
            <ListHeader />
            {sortedItems.map(file => (
              <FileListRow
                  key={file.id}
                  file={file}
                  onNavigate={handleNavigate}
                  onPreview={setPreviewFile}
                  onRename={() => {}}
                  onDelete={setDeleteTarget}
                  onMove={(f) => setMoveTargetIds([f.id])}
                  selected={selectedIds.has(file.id)}
                  onToggleSelect={toggleSelect}
                />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
        <AlertDialogContent className="bg-card border-border text-foreground rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete &quot;{deleteTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {deleteTarget?.type === 'folder'
                ? 'This will delete the folder and all its contents. This action cannot be undone.'
                : 'This file will be permanently deleted. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl border-border text-foreground hover:bg-accent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-2xl bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move Modal */}
      <MoveToFolderModal
        open={moveTargetIds.length > 0}
        onClose={() => setMoveTargetIds([])}
        fileIds={moveTargetIds}
      />
    </div>
  )
}
