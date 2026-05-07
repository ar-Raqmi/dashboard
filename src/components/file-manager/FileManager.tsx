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
  MoreHorizontal, Play, Pause, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
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
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

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
  const toggleStar = useMutation(api.files.toggleStar)
  const renameFile = useMutation(api.files.rename)

  // Handlers
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

  const displayFiles = useMemo(() => {
    let items = searchQuery ? searchResults : files
    if (!items) return items

    return [...items].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'date') return b.updatedAt - a.updatedAt
      if (sortBy === 'size') return (b.size || 0) - (a.size || 0)
      return 0
    })
  }, [files, searchResults, searchQuery, sortBy])

  return (
    <div className="flex h-[calc(100vh-120px)] w-full overflow-hidden bg-background/50 backdrop-blur-xl rounded-3xl border border-white/10">
      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-white/5 p-4 flex flex-col gap-6">
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between gap-4">
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder="Search files and folders..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary/50"
            />
          </div>

          <div className="flex items-center gap-2">
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
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setIsNewFolderDialogOpen(true)}
              className="size-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10"
            >
              <FolderPlus className="size-5" />
            </Button>
          </div>
        </header>

        {/* Breadcrumbs & Actions */}
        <div className="h-12 px-6 flex items-center justify-between bg-white/5 border-b border-white/5">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={() => setCurrentFolderId(undefined)}
                  className="cursor-pointer hover:text-primary transition-colors flex items-center"
                >
                  My Files
                </BreadcrumbLink>
              </BreadcrumbItem>
              {path?.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <BreadcrumbSeparator><ChevronRight className="size-4" /></BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbLink 
                      onClick={() => setCurrentFolderId(item.id)}
                      className={`cursor-pointer hover:text-primary transition-colors ${idx === path.length - 1 ? 'font-semibold text-foreground' : ''}`}
                    >
                      {item.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="text-xs text-muted-foreground font-medium">
            {displayFiles?.length || 0} items
          </div>
        </div>

        {/* Content View */}
        <ScrollArea className="flex-1">
          <div className="p-6">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                <AnimatePresence mode="popLayout">
                  {displayFiles.filter(f => f && f._id).map((file) => (
                    <FileGridItem 
                      key={file._id.toString()} 
                      file={file} 
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
                      onToggleStar={(e) => handleToggleStar(file._id, e)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/5">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-white/10">
                      <TableHead className="w-[400px]">Name</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Modified</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayFiles.filter(f => f && f._id).map((file) => (
                      <FileListItem 
                        key={file._id.toString()} 
                        file={file} 
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
                        onToggleStar={(e) => handleToggleStar(file._id, e)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Dialogs */}
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

function FileGridItem({ file, onOpen, onDelete, onToggleStar }: { file: any, onOpen: () => void, onDelete: () => void, onToggleStar: (e: React.MouseEvent) => void }) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col p-3 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={onOpen}
    >
      <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-3 relative overflow-hidden">
        {getFileIcon(file)}
        
        {/* Star Button */}
        <button 
          onClick={onToggleStar}
          className={`
            absolute top-2 right-2 p-1.5 rounded-lg transition-all duration-200 z-10
            ${file.starred ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-black/20 text-white opacity-0 group-hover:opacity-100 hover:bg-black/40'}
          `}
        >
          <Star className={`size-3.5 ${file.starred ? 'fill-current' : ''}`} />
        </button>

        {/* Thumbnail Preview Hint (Mock) */}
        {file.category === 'image' && (
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <ExternalLink className="size-6 text-emerald-400 opacity-60" />
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            {file.type === 'folder' ? 'Folder' : file.category || 'File'}
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
            <DropdownMenuItem onClick={onOpen} className="rounded-xl">
              <Play className="size-4 mr-2" /> Open
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl">
              <Edit3 className="size-4 mr-2" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl">
              <Download className="size-4 mr-2" /> Download
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={onDelete} className="text-destructive rounded-xl hover:bg-destructive/10">
              <Trash2 className="size-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  )
}

function FileListItem({ file, onOpen, onDelete, onToggleStar }: { file: any, onOpen: () => void, onDelete: () => void, onToggleStar: (e: React.MouseEvent) => void }) {
  return (
    <TableRow 
      className="group hover:bg-white/10 border-white/5 cursor-pointer transition-colors"
      onClick={onOpen}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <button onClick={onToggleStar} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <Star className={`size-4 ${file.starred ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
          </button>
          <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center">
            {getFileIcon(file)}
          </div>
          <span className="truncate max-w-[300px]">{file.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">{formatSize(file.size)}</TableCell>
      <TableCell className="text-muted-foreground text-xs uppercase tracking-tighter font-semibold">
        {file.type === 'folder' ? 'Folder' : file.category || 'File'}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">{formatDate(file.updatedAt)}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
            <DropdownMenuItem onClick={onOpen} className="rounded-xl"><Play className="size-4 mr-2" /> Open</DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl"><Download className="size-4 mr-2" /> Download</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={onDelete} className="text-destructive rounded-xl hover:bg-destructive/10"><Trash2 className="size-4 mr-2" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

function UploadModal({ open, onClose, folderId }: { open: boolean, onClose: () => void, folderId: string | undefined }) {
  const { sessionToken } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const saveFile = useMutation(api.files.createFile)

  const handleUpload = async () => {
    if (!file || !sessionToken) return
    setUploading(true)
    setProgress(10)
    
    try {
      const url = await generateUploadUrl()
      setProgress(30)
      
      const result = await fetch(url, { method: 'POST', body: file })
      const { storageId } = await result.json()
      setProgress(70)
      
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
      
      setProgress(100)
      toast.success('Upload complete')
      setTimeout(() => {
        setFile(null)
        setUploading(false)
        setProgress(0)
        onClose()
      }, 500)
    } catch (error) {
      toast.error('Upload failed')
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !uploading && onClose()}>
      <DialogContent className="rounded-3xl border-white/10 bg-background/95 backdrop-blur-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload New File</DialogTitle>
          <DialogDescription>Select a file to upload to the current folder.</DialogDescription>
        </DialogHeader>
        
        <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors relative cursor-pointer group">
          <input 
            type="file" 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={uploading}
          />
          <div className="flex flex-col items-center gap-4">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              {file ? <Check className="size-8" /> : <Upload className="size-8" />}
            </div>
            <div className="text-center">
              <p className="font-semibold">{file ? file.name : 'Click or drag to upload'}</p>
              <p className="text-xs text-muted-foreground mt-1">{file ? `${formatSize(file.size)} • ${file.type || 'Unknown type'}` : 'Any file up to 50MB'}</p>
            </div>
          </div>
        </div>

        {uploading && (
          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-xs font-medium">
              <span>Uploading...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary" 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose} disabled={uploading} className="rounded-xl">Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || uploading} className="rounded-xl bg-primary shadow-lg shadow-primary/20 min-w-[120px]">
            {uploading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Upload className="size-4 mr-2" />}
            {uploading ? 'Uploading' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
