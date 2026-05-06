'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
} from 'lucide-react'
import { useAppStore, type FileItem, type FileCategory } from '@/lib/store'
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
    case 'image': return 'bg-blue-500/20 text-blue-400'
    case 'audio': return 'bg-purple-500/20 text-purple-400'
    case 'pdf': return 'bg-red-500/20 text-red-400'
    case 'doc': return 'bg-amber-500/20 text-amber-400'
    case 'video': return 'bg-pink-500/20 text-pink-400'
    case 'folder': return 'bg-[oklch(0.72_0.19_142)_/20] text-[oklch(0.72_0.19_142)]'
    default: return 'bg-gray-500/20 text-gray-400'
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
    <nav aria-label="File breadcrumb" className="flex items-center gap-1 text-sm px-1 py-2 overflow-x-auto">
      {breadcrumbs.map((crumb, i) => (
        <React.Fragment key={crumb.id ?? 'home'}>
          {i > 0 && <ChevronRight className="size-3.5 text-white/30 shrink-0" />}
          {i === breadcrumbs.length - 1 ? (
            <span className="text-white font-medium truncate max-w-48">{crumb.name}</span>
          ) : (
            <button
              onClick={() => setCurrentFolderId(crumb.id)}
              className="text-white/50 hover:text-white transition-colors truncate max-w-32"
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

  // Get all folders
  const folders = useMemo(() => files.filter(f => f.type === 'folder'), [files])

  // Get descendants of the files being moved (to prevent moving into own subtree)
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

  // Build folder tree
  const rootFolders = folders.filter(f => f.parentId === null && !descendantIds.has(f.id))

  const renderFolderTree = (parentId: string | null, depth: number = 0) => {
    const children = folders.filter(
      f => f.parentId === parentId && !descendantIds.has(f.id)
    )
    return children.map(folder => (
      <div key={folder.id}>
        <button
          onClick={() => setSelectedFolderId(folder.id)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${
            selectedFolderId === folder.id
              ? 'bg-[oklch(0.72_0.19_142)]/20 text-[oklch(0.72_0.19_142)]'
              : 'text-white/70 hover:bg-white/5 hover:text-white'
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
      <DialogContent className="bg-[oklch(0.2_0.02_260)] border-white/10 text-white sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-white">Move to Folder</DialogTitle>
          <DialogDescription className="text-white/50">
            Select a destination folder for {fileIds.length} item{fileIds.length > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${
              selectedFolderId === null
                ? 'bg-[oklch(0.72_0.19_142)]/20 text-[oklch(0.72_0.19_142)]'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
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
            className="rounded-2xl border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            className="rounded-2xl bg-[oklch(0.72_0.19_142)] text-white hover:bg-[oklch(0.72_0.19_142)]/90"
          >
            <ArrowRight className="size-4" />
            Move Here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ===== FILE CARD =====
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
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`group relative rounded-3xl p-4 cursor-pointer transition-all border ${
        selected
          ? 'bg-[oklch(0.72_0.19_142)]/15 border-[oklch(0.72_0.19_142)]/30'
          : 'bg-[oklch(0.22_0.015_260)] border-white/5 hover:border-white/15 hover:bg-[oklch(0.24_0.015_260)]'
      }`}
      onClick={handleClick}
    >
      {/* Selection checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleSelect(file.id) }}
        className={`absolute top-3 left-3 size-5 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
          selected
            ? 'bg-[oklch(0.72_0.19_142)] border-[oklch(0.72_0.19_142)]'
            : 'border-white/20 opacity-0 group-hover:opacity-100 hover:border-white/50'
        }`}
      >
        {selected && <Check className="size-3 text-white" />}
      </button>

      {/* Context menu */}
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="size-7 rounded-full text-white/50 hover:text-white hover:bg-white/10">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[oklch(0.2_0.02_260)] border-white/10 text-white rounded-2xl" align="end">
            <DropdownMenuItem
              className="gap-2 focus:bg-white/10 focus:text-white cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onRename(file); setRenaming(true); setRenameValue(file.name) }}
            >
              <Pencil className="size-4" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 focus:bg-white/10 focus:text-white cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onMove(file) }}
            >
              <Move className="size-4" /> Move
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className="gap-2 focus:bg-red-500/20 focus:text-red-400 cursor-pointer text-red-400"
              onClick={(e) => { e.stopPropagation(); onDelete(file) }}
            >
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Icon */}
      <div className="flex justify-center mb-3 mt-2">
        <div className={`size-14 rounded-2xl flex items-center justify-center ${getCategoryColor(file.category)}`}>
          {getCategoryIcon(file.category)}
        </div>
      </div>

      {/* Name */}
      {renaming ? (
        <div onClick={(e) => e.stopPropagation()} className="mb-2">
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') setRenaming(false)
            }}
            onBlur={handleRename}
            autoFocus
            className="h-7 text-xs text-center bg-white/10 border-white/20 text-white rounded-xl"
          />
        </div>
      ) : (
        <p className="text-sm font-medium text-white truncate text-center mb-1">{file.name}</p>
      )}

      {/* Meta */}
      {!isFolder && (
        <div className="flex items-center justify-center gap-2 text-xs text-white/40">
          <span>{formatSize(file.size)}</span>
          <span className="size-1 rounded-full bg-white/20" />
          <span>{formatDate(file.createdAt)}</span>
        </div>
      )}
      {isFolder && (
        <p className="text-xs text-white/30 text-center">Folder</p>
      )}
    </motion.div>
  )
}

// ===== EMPTY STATE =====
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-white/30"
    >
      <div className="size-24 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
        <FolderOpen className="size-12 text-white/20" />
      </div>
      <p className="text-lg font-medium text-white/40">This folder is empty</p>
      <p className="text-sm text-white/25 mt-1">Create a new folder or upload a file to get started</p>
    </motion.div>
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

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null)
  const [moveTargetIds, setMoveTargetIds] = useState<string[]>([])
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFileName, setUploadFileName] = useState('')

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

  const handleUploadFile = () => {
    if (uploadFileName.trim()) {
      const ext = uploadFileName.split('.').pop()?.toLowerCase() || ''
      let category: FileCategory = 'other'
      if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) category = 'image'
      else if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) category = 'audio'
      else if (ext === 'pdf') category = 'pdf'
      else if (['doc', 'docx', 'txt', 'xlsx', 'xls', 'csv'].includes(ext)) category = 'doc'
      else if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) category = 'video'

      addFile({
        name: uploadFileName.trim(),
        type: 'file',
        category,
        parentId: currentFolderId,
        size: Math.floor(Math.random() * 5000000) + 10000,
      })
      setUploadFileName('')
      setShowUpload(false)
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
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <BreadcrumbNav />

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <Badge className="bg-[oklch(0.72_0.19_142)]/20 text-[oklch(0.72_0.19_142)] border-0 rounded-2xl">
                {selectedIds.size} selected
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkMove}
                className="rounded-2xl text-white/70 hover:text-white hover:bg-white/10"
              >
                <Move className="size-4" />
                Move
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
                className="rounded-2xl text-white/50 hover:text-white hover:bg-white/10"
              >
                <X className="size-4" />
              </Button>
            </motion.div>
          )}

          <Button
            onClick={() => setShowNewFolder(true)}
            size="sm"
            className="rounded-2xl bg-[oklch(0.72_0.19_142)] text-white hover:bg-[oklch(0.72_0.19_142)]/90 gap-1.5"
          >
            <FolderPlus className="size-4" />
            <span className="hidden sm:inline">New Folder</span>
          </Button>
          <Button
            onClick={() => setShowUpload(true)}
            size="sm"
            className="rounded-2xl bg-[oklch(0.8_0.08_350)] text-white hover:bg-[oklch(0.8_0.08_350)]/90 gap-1.5"
          >
            <Upload className="size-4" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
        </div>
      </div>

      {/* New Folder Input */}
      <AnimatePresence>
        {showNewFolder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-[oklch(0.22_0.015_260)] border border-[oklch(0.72_0.19_142)]/20">
              <FolderPlus className="size-5 text-[oklch(0.72_0.19_142)]" />
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder()
                  if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName('') }
                }}
                placeholder="Folder name..."
                autoFocus
                className="h-8 bg-white/5 border-white/10 text-white rounded-xl text-sm"
              />
              <Button size="sm" onClick={handleCreateFolder} className="rounded-2xl bg-[oklch(0.72_0.19_142)] text-white hover:bg-[oklch(0.72_0.19_142)]/90 size-8">
                <Check className="size-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowNewFolder(false); setNewFolderName('') }} className="rounded-2xl text-white/50 hover:text-white hover:bg-white/10 size-8">
                <X className="size-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Input */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-[oklch(0.22_0.015_260)] border border-[oklch(0.8_0.08_350)]/20">
              <Upload className="size-5 text-[oklch(0.8_0.08_350)]" />
              <Input
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUploadFile()
                  if (e.key === 'Escape') { setShowUpload(false); setUploadFileName('') }
                }}
                placeholder="filename.ext (mock upload)..."
                autoFocus
                className="h-8 bg-white/5 border-white/10 text-white rounded-xl text-sm"
              />
              <Button size="sm" onClick={handleUploadFile} className="rounded-2xl bg-[oklch(0.8_0.08_350)] text-white hover:bg-[oklch(0.8_0.08_350)]/90 size-8">
                <Check className="size-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowUpload(false); setUploadFileName('') }} className="rounded-2xl text-white/50 hover:text-white hover:bg-white/10 size-8">
                <X className="size-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Grid */}
      <div className="flex-1 overflow-y-auto">
        {sortedItems.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            <AnimatePresence mode="popLayout">
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
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
        <AlertDialogContent className="bg-[oklch(0.2_0.02_260)] border-white/10 text-white rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete &quot;{deleteTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              {deleteTarget?.type === 'folder'
                ? 'This will delete the folder and all its contents. This action cannot be undone.'
                : 'This file will be permanently deleted. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl border-white/20 text-white hover:bg-white/10">
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
