'use client'

import React, { useState, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '@/hooks/useAuth'
import { 
  Folder, File, Upload, FolderPlus, ArrowLeft, MoreVertical, 
  Trash2, FileText, ImageIcon, Music, Film, FileEdit, Loader2, 
  Check, X, Search, Grid, List, Star, Clock, Image, 
  FileStack, ChevronRight, Download, Edit3, Share2, Filter,
  MoreHorizontal, Play, Pause, ExternalLink, Menu, Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import FilePreview from './FilePreview'

// ===== TYPES & HELPERS =====
type ViewMode = 'grid' | 'list'
type NavCategory = 'all' | 'starred' | 'recent' | 'images' | 'audio' | 'video' | 'docs'

const formatSize = (bytes?: number): string => {
  if (!bytes) return '--'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

const formatDate = (ts?: number | string): string => {
  if (!ts) return '--'
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getFileIcon = (file: any) => {
  if (file.type === 'folder') return <Folder className="size-6 text-blue-400 fill-blue-400/20" />
  switch (file.category) {
    case 'image': return <Image className="size-6 text-emerald-400" />
    case 'audio': return <Music className="size-6 text-purple-400" />
    case 'video': return <Film className="size-6 text-pink-400" />
    case 'pdf': return <FileText className="size-6 text-red-400" />
    case 'doc': return <FileEdit className="size-6 text-blue-400" />
    default: return <File className="size-6 text-slate-400" />
  }
}

// ===== MAIN COMPONENT =====
export default function FileManager() {
  const { sessionToken } = useAuth()
  const { setPreviewFile } = useAppStore()
  
  // State
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [navCategory, setNavCategory] = useState<NavCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [renamingFile, setRenamingFile] = useState<{ id: string, name: string } | null>(null)
  const [newRenameName, setNewRenameName] = useState('')
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null)
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Queries
  const files = useQuery(api.files.list, sessionToken ? { 
    sessionToken, 
    parentId: navCategory === 'all' ? (currentFolderId as any) : undefined,
    starred: navCategory === 'starred' ? true : undefined,
    category: ['images', 'audio', 'video', 'docs'].includes(navCategory) 
      ? (navCategory === 'images' ? 'image' : navCategory === 'audio' ? 'audio' : navCategory === 'video' ? 'video' : 'doc') as any 
      : undefined
  } : 'skip')

  const searchResults = useQuery(api.files.search, sessionToken && searchQuery ? { sessionToken, query: searchQuery } : 'skip')
  const path = useQuery(api.files.getPath, sessionToken ? { sessionToken, folderId: currentFolderId as any } : 'skip')

  // Mutations
  const createFile = useMutation(api.files.createFile)
  const deleteFile = useMutation(api.files.remove)
  const deleteMultiple = useMutation(api.files.removeMultiple)
  const moveFiles = useMutation(api.files.moveFiles)
  const toggleStar = useMutation(api.files.toggleStar)
  const renameFile = useMutation(api.files.rename)

  // Handlers
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === displayFiles?.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(displayFiles?.map(f => f._id) || []))
    }
  }

  const handleBatchDelete = async () => {
    if (!sessionToken || selectedIds.size === 0) return
    try {
      await deleteMultiple({ sessionToken, ids: Array.from(selectedIds) as any })
      setSelectedIds(new Set())
      toast.success(`Deleted ${selectedIds.size} items`)
    } catch (error) {
      toast.error('Batch delete failed')
    }
  }

  const handleRename = async () => {
    if (!sessionToken || !renamingFile || !newRenameName) return
    try {
      await renameFile({ sessionToken, id: renamingFile.id as any, name: newRenameName })
      setIsRenameDialogOpen(false)
      setRenamingFile(null)
      toast.success('Renamed successfully')
    } catch (error) {
      toast.error('Rename failed')
    }
  }

  const handleBatchMove = async (newParentId: string | null) => {
    if (!sessionToken || selectedIds.size === 0) return
    try {
      await moveFiles({ sessionToken, ids: Array.from(selectedIds) as any, newParentId: newParentId as any })
      setSelectedIds(new Set())
      setIsMoveDialogOpen(false)
      toast.success(`Moved ${selectedIds.size} items`)
    } catch (error) {
      toast.error('Move failed')
    }
  }

  // ZIP Download Logic
  const [idsToDownload, setIdsToDownload] = useState<string[]>([])
  const filesToDownload = useQuery(api.files.getFilesRecursive, 
    idsToDownload.length > 0 ? { sessionToken, ids: idsToDownload as any } : 'skip'
  )

  const handleBatchDownload = async (ids: string[]) => {
    if (ids.length === 0) return
    setIdsToDownload(ids)
    toast.info("Preparing files for download...")
  }

  // Handle the download when the query returns data
  React.useEffect(() => {
    if (filesToDownload && idsToDownload.length > 0) {
      const downloadZip = async () => {
        const JSZip = (window as any).JSZip
        if (!JSZip) {
          toast.error("Download library not loaded yet. Please try again in a moment.")
          return
        }

        const zip = new JSZip()
        const toastId = toast.loading("Creating ZIP archive...")
        
        try {
          for (const file of filesToDownload) {
            if (!file.url) continue
            const res = await fetch(file.url)
            const blob = await res.blob()
            zip.file(file.relativePath, blob)
          }

          const content = await zip.generateAsync({ type: "blob" })
          const url = window.URL.createObjectURL(content)
          const a = document.createElement("a")
          a.href = url
          a.download = idsToDownload.length === 1 && filesToDownload.length > 0 && filesToDownload[0].type === 'folder' 
            ? `${filesToDownload[0].name}.zip` 
            : "batch_download.zip"
          a.click()
          window.URL.revokeObjectURL(url)
          toast.success("Download started", { id: toastId })
        } catch (e) {
          console.error(e)
          toast.error("Failed to create ZIP", { id: toastId })
        } finally {
          setIdsToDownload([])
        }
      }
      downloadZip()
    }
  }, [filesToDownload, idsToDownload])

  const handleDrop = async (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('fileId')
    if (!draggedId || draggedId === targetId) return
    
    // If dragging a selected item, move all selected items
    const idsToMove = selectedIds.has(draggedId) ? Array.from(selectedIds) : [draggedId]
    
    try {
      await moveFiles({ sessionToken, ids: idsToMove as any, newParentId: targetId as any })
      toast.success(`Moved ${idsToMove.length} item(s)`)
      if (selectedIds.has(draggedId)) setSelectedIds(new Set())
    } catch (error) {
      toast.error('Move failed')
    }
  }

  const handleCreateFolder = async () => {
    if (!sessionToken || !newFolderName) return
    try {
      await createFile({
        sessionToken,
        name: newFolderName,
        type: 'folder',
        parentId: currentFolderId as any,
      })
      setNewFolderName('')
      setIsNewFolderDialogOpen(false)
      toast.success('Folder created')
    } catch (error) {
      toast.error('Failed to create folder')
    }
  }

  const handleDelete = async (id: string) => {
    if (!sessionToken) return
    try {
      await deleteFile({ sessionToken, id: id as any })
      toast.success('Deleted successfully')
    } catch (error) {
      toast.error('Delete failed')
    }
  }

  const handleToggleStar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!sessionToken) return
    await toggleStar({ sessionToken, id: id as any })
  }

  const getDisplayFiles = () => {
    let items = searchQuery ? searchResults : files
    if (!items) return items

    return [...items].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      const timeA = typeof a.updatedAt === 'number' ? a.updatedAt : new Date(a.updatedAt).getTime()
      const timeB = typeof b.updatedAt === 'number' ? b.updatedAt : new Date(b.updatedAt).getTime()
      if (sortBy === 'date') return timeB - timeA
      if (sortBy === 'size') return (b.size || 0) - (a.size || 0)
      return 0
    })
  }
  const displayFiles = getDisplayFiles()

  return (
    <div className="flex h-full md:h-[calc(100vh-120px)] w-full overflow-hidden bg-background/50 md:backdrop-blur-xl md:rounded-3xl border-none md:border md:border-white/10 relative">
      {/* Desktop Sidebar Navigation */}
      <div className="hidden md:flex w-64 border-r border-white/5 p-4 flex-col gap-6 shrink-0">
        <div className="px-2">
          <Button 
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 flex items-center gap-2 font-semibold"
          >
            <Upload className="size-5" />
            New Upload
          </Button>
        </div>

        <nav className="flex flex-col gap-1">
          <NavButton active={navCategory === 'all'} onClick={() => { setNavCategory('all'); setSearchQuery(''); setCurrentFolderId(undefined); }} icon={<FileStack className="size-5" />} label="My Files" />
          <NavButton active={navCategory === 'starred'} onClick={() => { setNavCategory('starred'); setSearchQuery(''); }} icon={<Star className="size-5" />} label="Starred" />
          <NavButton active={navCategory === 'recent'} onClick={() => { setNavCategory('recent'); setSearchQuery(''); }} icon={<Clock className="size-5" />} label="Recent" />
          
          <div className="mt-4 mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</div>
          <NavButton active={navCategory === 'images'} onClick={() => { setNavCategory('images'); setSearchQuery(''); }} icon={<Image className="size-5" />} label="Images" />
          <NavButton active={navCategory === 'audio'} onClick={() => { setNavCategory('audio'); setSearchQuery(''); }} icon={<Music className="size-5" />} label="Audio" />
          <NavButton active={navCategory === 'video'} onClick={() => { setNavCategory('video'); setSearchQuery(''); }} icon={<Film className="size-5" />} label="Videos" />
          <NavButton active={navCategory === 'docs'} onClick={() => { setNavCategory('docs'); setSearchQuery(''); }} icon={<FileText className="size-5" />} label="Documents" />
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 px-4 md:px-6 flex items-center justify-between gap-4 shrink-0 bg-background/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden size-10 rounded-xl"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="size-6" />
            </Button>
            
            {!isSearchVisible && (
              <h1 className="text-lg font-bold truncate md:hidden">
                {navCategory === 'all' ? (path?.length ? path[path.length-1].name : 'My Files') : navCategory.charAt(0).toUpperCase() + navCategory.slice(1)}
              </h1>
            )}
          </div>

          <div className={`flex-1 ${isSearchVisible ? 'flex' : 'hidden md:flex'} items-center max-w-xl relative transition-all duration-300`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder="Search files and folders..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => !searchQuery && setIsSearchVisible(false)}
              className="pl-10 h-10 bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary/50 w-full"
              autoFocus={isSearchVisible}
            />
            {isSearchVisible && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden ml-2 shrink-0" 
                onClick={() => { setIsSearchVisible(false); setSearchQuery(''); }}
              >
                <X className="size-5" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isSearchVisible && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden size-10 rounded-xl"
                onClick={() => setIsSearchVisible(true)}
              >
                <Search className="size-5" />
              </Button>
            )}

            <div className="hidden sm:flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 rounded-xl border-white/10 bg-white/5 gap-2 px-3">
                    <Filter className="size-4" />
                    <span className="text-xs font-medium capitalize">Sort: {sortBy}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl border-white/10 bg-background/95 backdrop-blur-xl">
                  <DropdownMenuItem onClick={() => setSortBy('name')} className="rounded-lg">Name</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('date')} className="rounded-lg">Date Modified</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('size')} className="rounded-lg">Size</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <Button 
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                  size="icon" 
                  onClick={() => setViewMode('grid')}
                  className="size-8 rounded-lg"
                >
                  <Grid className="size-4" />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                  size="icon" 
                  onClick={() => setViewMode('list')}
                  className="size-8 rounded-lg"
                >
                  <List className="size-4" />
                </Button>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setIsNewFolderDialogOpen(true)}
              className="hidden md:flex size-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10"
            >
              <FolderPlus className="size-5" />
            </Button>
          </div>
        </header>

        {/* Breadcrumbs & Actions */}
        <div className="h-12 px-4 md:px-6 flex items-center justify-between bg-white/5 border-b border-white/5 overflow-x-auto no-scrollbar shrink-0">
          <Breadcrumb className="whitespace-nowrap flex-1">
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={() => { setCurrentFolderId(undefined); setNavCategory('all'); }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                  onDrop={(e) => handleDrop(e, null)}
                  className="cursor-pointer hover:text-primary transition-colors flex items-center text-xs"
                >
                  My Files
                </BreadcrumbLink>
              </BreadcrumbItem>
              {path?.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <BreadcrumbSeparator><ChevronRight className="size-4 opacity-50" /></BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbLink 
                      onClick={() => setCurrentFolderId(item.id)}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                      onDrop={(e) => handleDrop(e, item.id)}
                      className={`cursor-pointer hover:text-primary transition-colors text-xs ${idx === path.length - 1 ? 'font-semibold text-foreground' : ''}`}
                    >
                      {item.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="text-[10px] md:text-xs text-muted-foreground font-medium ml-4 shrink-0">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${displayFiles?.length || 0} items`}
          </div>
        </div>

        {/* Batch Action Bar */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mx-4 md:mx-6 mt-2 p-3 rounded-2xl bg-primary text-primary-foreground flex items-center justify-between shadow-lg shadow-primary/20 z-40 relative md:absolute md:bottom-6 md:left-0 md:right-0"
            >
              <div className="flex items-center gap-3 md:gap-4 px-1 md:px-2">
                <p className="text-xs md:text-sm font-bold">{selectedIds.size} selected</p>
                <div className="h-4 w-px bg-primary-foreground/20" />
                <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-[10px] md:text-xs h-8 hover:bg-white/10 text-primary-foreground px-2">
                  {selectedIds.size === displayFiles?.length ? 'Deselect' : 'All'}
                </Button>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <Button variant="ghost" size="icon" onClick={() => setIsMoveDialogOpen(true)} className="size-8 hover:bg-white/10 text-primary-foreground md:w-auto md:px-3 md:gap-2">
                  <Edit3 className="size-4" /> <span className="hidden md:inline text-xs">Move</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleBatchDownload(Array.from(selectedIds))} className="size-8 hover:bg-white/10 text-primary-foreground md:w-auto md:px-3 md:gap-2">
                  <Download className="size-4" /> <span className="hidden md:inline text-xs">ZIP</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleBatchDelete} className="size-8 hover:bg-white/10 text-primary-foreground md:w-auto md:px-3 md:gap-2">
                  <Trash2 className="size-4" /> <span className="hidden md:inline text-xs">Delete</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setSelectedIds(new Set())} className="size-8 hover:bg-white/10 text-primary-foreground">
                  <X className="size-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content View */}
        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6 pb-24 md:pb-6">
            {!displayFiles ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <Loader2 className="size-10 animate-spin mb-4" />
                <p>Loading your files...</p>
              </div>
            ) : displayFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 opacity-50 text-center">
                <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  {searchQuery ? <Search className="size-10" /> : <Folder className="size-10" />}
                </div>
                <h3 className="text-xl font-semibold mb-2">{searchQuery ? 'No matches found' : 'This folder is empty'}</h3>
                <p className="max-w-xs">Try searching for something else or upload a new file to get started.</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-6">
                <AnimatePresence mode="popLayout">
                  {displayFiles.filter(f => f && f._id).map((file) => (
                    <FileGridItem 
                      key={file._id.toString()} 
                      file={file} 
                      selected={selectedIds.has(file._id)}
                      onToggleSelect={() => handleToggleSelect(file._id)}
                      onOpen={() => file.type === 'folder' ? setCurrentFolderId(file._id) : setPreviewFile({
                        id: file._id,
                        name: file.name,
                        type: file.type as any,
                        category: (file.category || 'other') as any,
                        parentId: file.parentId || null,
                        size: file.size || 0,
                        createdAt: typeof file.createdAt === 'number' ? new Date(file.createdAt).toISOString() : file.createdAt,
                        updatedAt: typeof file.updatedAt === 'number' ? new Date(file.updatedAt).toISOString() : file.updatedAt,
                        storageId: file.storageId
                      })}
                      onDelete={() => handleDelete(file._id)}
                      onDownload={() => handleBatchDownload([file._id])}
                      onToggleStar={(e) => handleToggleStar(file._id, e)}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('fileId', file._id)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onDrop={(e) => file.type === 'folder' ? handleDrop(e, file._id) : undefined}
                      onRename={() => {
                        setRenamingFile({ id: file._id, name: file.name })
                        setNewRenameName(file.name)
                        setIsRenameDialogOpen(true)
                      }}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/5 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-white/10">
                      <TableHead className="w-[200px] md:w-[400px]">Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Size</TableHead>
                      <TableHead className="hidden md:table-cell">Type</TableHead>
                      <TableHead className="hidden sm:table-cell">Modified</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayFiles.filter(f => f && f._id).map((file) => (
                      <FileListItem 
                        key={file._id.toString()} 
                        file={file} 
                        selected={selectedIds.has(file._id)}
                        onToggleSelect={() => handleToggleSelect(file._id)}
                        onOpen={() => file.type === 'folder' ? setCurrentFolderId(file._id) : setPreviewFile({
                          id: file._id,
                          name: file.name,
                          type: file.type as any,
                          category: (file.category || 'other') as any,
                          parentId: file.parentId || null,
                          size: file.size || 0,
                          createdAt: typeof file.createdAt === 'number' ? new Date(file.createdAt).toISOString() : file.createdAt,
                          updatedAt: typeof file.updatedAt === 'number' ? new Date(file.updatedAt).toISOString() : file.updatedAt,
                          storageId: file.storageId
                        })}
                        onDelete={() => handleDelete(file._id)}
                        onDownload={() => handleBatchDownload([file._id])}
                        onToggleStar={(e) => handleToggleStar(file._id, e)}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('fileId', file._id)
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        onDrop={(e) => file.type === 'folder' ? handleDrop(e, file._id) : undefined}
                        onRename={() => {
                          setRenamingFile({ id: file._id, name: file.name })
                          setNewRenameName(file.name)
                          setIsRenameDialogOpen(true)
                        }}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Mobile Floating Action Button */}
      <div className="md:hidden fixed bottom-20 right-6 z-50 flex flex-col gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" className="size-14 rounded-full bg-primary shadow-2xl shadow-primary/40 text-primary-foreground">
              <Plus className="size-8" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl mb-4">
            <DropdownMenuItem onClick={() => setIsUploadModalOpen(true)} className="rounded-xl py-3">
              <Upload className="size-4 mr-2" /> Upload Files
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsNewFolderDialogOpen(true)} className="rounded-xl py-3">
              <FolderPlus className="size-4 mr-2" /> New Folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-72 border-r border-white/10 bg-background/95 backdrop-blur-2xl p-4">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-left flex items-center gap-2">
              <FileStack className="size-5 text-primary" />
              File Manager
            </SheetTitle>
          </SheetHeader>
          
          <nav className="flex flex-col gap-1">
            <NavButton 
              active={navCategory === 'all'} 
              onClick={() => { setNavCategory('all'); setSearchQuery(''); setCurrentFolderId(undefined); setIsSidebarOpen(false); }} 
              icon={<FileStack className="size-5" />} 
              label="My Files" 
            />
            <NavButton 
              active={navCategory === 'starred'} 
              onClick={() => { setNavCategory('starred'); setSearchQuery(''); setIsSidebarOpen(false); }} 
              icon={<Star className="size-5" />} 
              label="Starred" 
            />
            <NavButton 
              active={navCategory === 'recent'} 
              onClick={() => { setNavCategory('recent'); setSearchQuery(''); setIsSidebarOpen(false); }} 
              icon={<Clock className="size-5" />} 
              label="Recent" 
            />
            
            <div className="mt-6 mb-2 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Categories</div>
            <NavButton active={navCategory === 'images'} onClick={() => { setNavCategory('images'); setSearchQuery(''); setIsSidebarOpen(false); }} icon={<Image className="size-5" />} label="Images" />
            <NavButton active={navCategory === 'audio'} onClick={() => { setNavCategory('audio'); setSearchQuery(''); setIsSidebarOpen(false); }} icon={<Music className="size-5" />} label="Audio" />
            <NavButton active={navCategory === 'video'} onClick={() => { setNavCategory('video'); setSearchQuery(''); setIsSidebarOpen(false); }} icon={<Film className="size-5" />} label="Videos" />
            <NavButton active={navCategory === 'docs'} onClick={() => { setNavCategory('docs'); setSearchQuery(''); setIsSidebarOpen(false); }} icon={<FileText className="size-5" />} label="Documents" />
          </nav>
        </SheetContent>
      </Sheet>

      {/* Dialogs */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="rounded-3xl border-white/10 bg-background/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle>Rename Item</DialogTitle>
            <DialogDescription>Enter a new name for this item.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              autoFocus
              placeholder="New Name" 
              value={newRenameName} 
              onChange={(e) => setNewRenameName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              className="rounded-xl bg-white/5 border-white/10 h-12"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRenameDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleRename} className="rounded-xl bg-primary shadow-lg shadow-primary/20 px-6">Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
        <DialogContent className="rounded-3xl border-white/10 bg-background/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Give your folder a name to keep things organized.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              autoFocus
              placeholder="Folder Name" 
              value={newFolderName} 
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              className="rounded-xl bg-white/5 border-white/10 h-12"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsNewFolderDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleCreateFolder} className="rounded-xl bg-primary shadow-lg shadow-primary/20 px-6">Create Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent className="rounded-3xl border-white/10 bg-background/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle>Move {selectedIds.size} items</DialogTitle>
            <DialogDescription>Choose a target folder to move the selected items.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start rounded-xl border-white/10 h-12 bg-white/5"
              onClick={() => handleBatchMove(null)}
            >
              <Folder className="size-4 mr-2 text-amber-400" /> Root Directory
            </Button>
            {files?.filter(f => f.type === 'folder' && !selectedIds.has(f._id)).map(folder => (
              <Button 
                key={folder._id}
                variant="outline" 
                className="w-full justify-start rounded-xl border-white/10 h-12 bg-white/5"
                onClick={() => handleBatchMove(folder._id)}
              >
                <Folder className="size-4 mr-2 text-amber-400" /> {folder.name}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsMoveDialogOpen(false)} className="rounded-xl">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UploadModal 
        open={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        folderId={currentFolderId} 
      />

      <FilePreview />
    </div>
  )
}

// ===== SUB-COMPONENTS =====

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group
        ${active 
          ? 'bg-primary/15 text-primary font-semibold shadow-sm' 
          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
        }
      `}
    >
      <span className={`${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`}>
        {icon}
      </span>
      <span className="text-sm">{label}</span>
      {active && <motion.div layoutId="nav-active" className="ml-auto size-1.5 rounded-full bg-primary" />}
    </button>
  )
}

function FileGridItem({ 
  file, onOpen, onDelete, onDownload, onToggleStar, selected, onToggleSelect, onDragStart, onDrop, onRename 
}: { 
  file: any, 
  onOpen: () => void, 
  onDelete: () => void, 
  onDownload: () => void,
  onToggleStar: (e: React.MouseEvent) => void, 
  selected: boolean, 
  onToggleSelect: () => void, 
  onDragStart: (e: React.DragEvent) => void, 
  onDrop: (e: React.DragEvent) => void,
  onRename: () => void
}) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
      onDrop={onDrop}
      className={`
        group relative flex flex-col p-3 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden
        ${selected ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'}
      `}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey) {
          onToggleSelect()
        } else {
          onOpen()
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        onToggleSelect()
      }}
    >
      <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-2 md:mb-3 relative overflow-hidden">
        {getFileIcon(file)}
        
        {/* Selection Checkbox */}
        <div 
          className={`absolute top-2 left-2 transition-all duration-200 z-10 ${selected ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox 
            checked={selected} 
            onCheckedChange={onToggleSelect} 
            className="rounded-lg border-white/20 bg-black/20"
          />
        </div>

        {/* Star Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleStar(e) }}
          className={`
            absolute top-2 right-2 p-1.5 rounded-lg transition-all duration-200 z-10
            ${file.starred ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-black/20 text-white opacity-0 md:group-hover:opacity-100 hover:bg-black/40'}
          `}
        >
          <Star className={`size-3 md:size-3.5 ${file.starred ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex items-start justify-between gap-1 md:gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs md:text-sm font-medium truncate">{file.name}</p>
          <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            {file.type === 'folder' ? 'Folder' : file.category || 'File'}
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
            <DropdownMenuItem onClick={onOpen} className="rounded-xl py-2.5">
              <Play className="size-4 mr-2" /> Open
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl py-2.5" onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}>
              {selected ? <X className="size-4 mr-2" /> : <Check className="size-4 mr-2" />} {selected ? 'Deselect' : 'Select'}
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl py-2.5" onClick={(e) => { e.stopPropagation(); onRename(); }}>
              <Edit3 className="size-4 mr-2" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl py-2.5" onClick={(e) => { e.stopPropagation(); setSelectedIds(new Set([file._id])); setIsMoveDialogOpen(true); }}>
              <Folder className="size-4 mr-2" /> Move
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl py-2.5" onClick={(e) => { e.stopPropagation(); onDownload(); }}>
              <Download className="size-4 mr-2" /> {file.type === 'folder' ? 'Download ZIP' : 'Download'}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={onDelete} className="text-destructive rounded-xl hover:bg-destructive/10 py-2.5">
              <Trash2 className="size-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  )
}

function FileListItem({ 
  file, onOpen, onDelete, onDownload, onToggleStar, selected, onToggleSelect, onDragStart, onDrop, onRename 
}: { 
  file: any, 
  onOpen: () => void, 
  onDelete: () => void, 
  onDownload: () => void,
  onToggleStar: (e: React.MouseEvent) => void, 
  selected: boolean, 
  onToggleSelect: () => void, 
  onDragStart: (e: React.DragEvent) => void, 
  onDrop: (e: React.DragEvent) => void,
  onRename: () => void
}) {
  return (
    <TableRow 
      className={`group border-white/5 cursor-pointer transition-colors ${selected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-white/10'}`}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey) {
          onToggleSelect()
        } else {
          onOpen()
        }
      }}
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
      onDrop={onDrop}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={selected} onCheckedChange={onToggleSelect} className="rounded-lg border-white/20" />
          </div>
          <button onClick={(e) => { e.stopPropagation(); onToggleStar(e); }} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <Star className={`size-4 ${file.starred ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
          </button>
          <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center">
            {getFileIcon(file)}
          </div>
          <span className="truncate max-w-[150px] md:max-w-[300px] text-xs md:text-sm">{file.name}</span>
      </div>
    </TableCell>
    <TableCell className="text-muted-foreground text-[10px] md:text-xs hidden sm:table-cell">{formatSize(file.size)}</TableCell>
    <TableCell className="text-muted-foreground text-[10px] md:text-xs uppercase tracking-tighter font-semibold hidden md:table-cell">
      {file.type === 'folder' ? 'Folder' : file.category || 'File'}
    </TableCell>
    <TableCell className="text-muted-foreground text-[10px] md:text-xs hidden sm:table-cell">{formatDate(file.updatedAt)}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
            <DropdownMenuItem onClick={onOpen} className="rounded-xl py-2.5"><Play className="size-4 mr-2" /> Open</DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl py-2.5" onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}>
              {selected ? <X className="size-4 mr-2" /> : <Check className="size-4 mr-2" />} {selected ? 'Deselect' : 'Select'}
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl py-2.5" onClick={(e) => { e.stopPropagation(); onRename(); }}>
              <Edit3 className="size-4 mr-2" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl py-2.5" onClick={(e) => { e.stopPropagation(); setSelectedIds(new Set([file._id])); setIsMoveDialogOpen(true); }}>
              <Folder className="size-4 mr-2" /> Move
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl py-2.5" onClick={(e) => { e.stopPropagation(); onDownload(); }}><Download className="size-4 mr-2" /> Download</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={onDelete} className="text-destructive rounded-xl hover:bg-destructive/10 py-2.5"><Trash2 className="size-4 mr-2" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

function UploadModal({ open, onClose, folderId }: { open: boolean, onClose: () => void, folderId: string | undefined }) {
  const { sessionToken } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [currentFileIndex, setCurrentFileIndex] = useState(-1)
  
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const saveFile = useMutation(api.files.createFile)

  const handleUpload = async () => {
    if (files.length === 0 || !sessionToken) return
    setUploading(true)
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setCurrentFileIndex(i)
      setUploadProgress(prev => ({ ...prev, [file.name]: 10 }))
      
      try {
        const url = await generateUploadUrl()
        setUploadProgress(prev => ({ ...prev, [file.name]: 30 }))
        
        const result = await fetch(url, { method: 'POST', body: file })
        const { storageId } = await result.json()
        setUploadProgress(prev => ({ ...prev, [file.name]: 70 }))
        
        // Determine category
        let category: any = 'other'
        if (file.type.startsWith('image/')) category = 'image'
        else if (file.type.startsWith('audio/')) category = 'audio'
        else if (file.type.startsWith('video/')) category = 'video'
        else if (file.type === 'application/pdf') category = 'pdf'
        else if (file.type.includes('word') || file.type.includes('text')) category = 'doc'

        await saveFile({
          sessionToken,
          name: file.name,
          type: 'file',
          category,
          storageId,
          parentId: folderId as any,
          size: file.size,
        })
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    
    toast.success(`Successfully uploaded ${files.length} file(s)`)
    setTimeout(() => {
      setFiles([])
      setUploading(false)
      setUploadProgress({})
      setCurrentFileIndex(-1)
      onClose()
    }, 500)
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const totalProgress = files.length > 0 
    ? Object.values(uploadProgress).reduce((a, b) => a + b, 0) / files.length 
    : 0

  return (
    <Dialog open={open} onOpenChange={(o) => !uploading && onClose()}>
      <DialogContent className="rounded-3xl border-white/10 bg-background/95 backdrop-blur-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>Select one or more files to upload to the current folder.</DialogDescription>
        </DialogHeader>
        
        <div className={`
          relative py-8 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5 
          transition-colors group min-h-[160px]
          ${!uploading ? 'hover:bg-white/10 cursor-pointer' : 'opacity-50 pointer-events-none'}
        `}>
          <input 
            type="file" 
            multiple
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={(e) => {
              const newFiles = Array.from(e.target.files || [])
              setFiles(prev => [...prev, ...newFiles])
            }}
            disabled={uploading}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Upload className="size-6" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm">Click or drag files to upload</p>
              <p className="text-xs text-muted-foreground mt-1">Select multiple files at once</p>
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <ScrollArea className="max-h-[240px] mt-4 rounded-xl border border-white/5 bg-white/5 p-2">
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      {f.type.startsWith('image/') ? <Image className="size-4 text-primary" /> : <File className="size-4 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate max-w-[200px]">{f.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatSize(f.size)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {uploading ? (
                      <div className="flex items-center gap-2">
                        {uploadProgress[f.name] === 100 ? (
                          <Check className="size-4 text-emerald-500" />
                        ) : i === currentFileIndex ? (
                          <Loader2 className="size-4 animate-spin text-primary" />
                        ) : (
                          <div className="size-4 rounded-full border border-white/20" />
                        )}
                      </div>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        onClick={() => removeFile(i)}
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {uploading && (
          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-xs font-medium">
              <span>{currentFileIndex >= 0 ? `Uploading: ${files[currentFileIndex]?.name}` : 'Preparing...'}</span>
              <span>{Math.round(totalProgress)}%</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary" 
                initial={{ width: 0 }}
                animate={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 gap-2">
          <Button variant="ghost" onClick={onClose} disabled={uploading} className="rounded-xl">Cancel</Button>
          <Button 
            onClick={handleUpload} 
            disabled={files.length === 0 || uploading} 
            className="rounded-xl bg-primary shadow-lg shadow-primary/20 min-w-[120px]"
          >
            {uploading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Upload className="size-4 mr-2" />}
            {uploading ? 'Uploading...' : `Upload ${files.length > 0 ? files.length : ''} File${files.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

