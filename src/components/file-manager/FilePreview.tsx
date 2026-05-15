'use client'

import React from 'react'
import {
  Image as ImageIcon,
  Music,
  FileText,
  FileEdit,
  Film,
  File,
  X,
  Download,
  Trash2,
  Folder,
  Calendar,
  HardDrive,
  Tag,
  ExternalLink,
  Loader2,
  Star
} from 'lucide-react'
import { useAppStore, type FileCategory, type FileItem } from '@/lib/store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

// ===== HELPERS =====
const formatSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

const formatDate = (iso: string): string => {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getCategoryIcon = (category: FileCategory) => {
  const cn = 'size-16'
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

const getCategoryLabel = (category: FileCategory): string => {
  switch (category) {
    case 'image': return 'Image'
    case 'audio': return 'Audio'
    case 'pdf': return 'PDF Document'
    case 'doc': return 'Document'
    case 'video': return 'Video'
    case 'folder': return 'Folder'
    default: return 'File'
  }
}

const getCategoryColor = (category: FileCategory): string => {
  switch (category) {
    case 'image': return 'from-emerald-500/30 to-emerald-600/10 text-emerald-400'
    case 'audio': return 'from-purple-500/30 to-purple-600/10 text-purple-400'
    case 'pdf': return 'from-red-500/30 to-red-600/10 text-red-400'
    case 'doc': return 'from-blue-500/30 to-blue-600/10 text-blue-400'
    case 'video': return 'from-pink-500/30 to-pink-600/10 text-pink-400'
    case 'folder': return 'from-amber-500/30 to-amber-600/10 text-amber-400'
    default: return 'from-slate-500/30 to-slate-600/10 text-slate-400'
  }
}

// ===== PREVIEW CONTENT =====
function PreviewContent({ file, fileUrl }: { file: FileItem; fileUrl?: string | null }) {
  if (fileUrl === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-50">
        <Loader2 className="size-10 animate-spin mb-4" />
        <p>Fetching file preview...</p>
      </div>
    )
  }

  switch (file.category) {
    case 'image':
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="w-full aspect-video rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden relative group">
            {fileUrl ? (
              <img
                src={fileUrl}
                alt={file.name}
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-emerald-400">
                <ImageIcon className="size-20 opacity-50" />
                <span className="text-sm opacity-50">Preview Unavailable</span>
              </div>
            )}
          </div>
        </div>
      )
    case 'audio':
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="w-full rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-white/10 p-12 flex flex-col items-center gap-6">
            <div className="size-24 rounded-full bg-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/10">
              <Music className="size-12 text-purple-400" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-semibold text-lg">{file.name}</p>
              <p className="text-muted-foreground text-sm uppercase tracking-widest mt-1">Audio Track</p>
            </div>
            {fileUrl && (
              <audio controls className="w-full h-12 opacity-90 brightness-110" style={{ filter: 'invert(100%) hue-rotate(180deg) brightness(1.5)' }}>
                <source src={fileUrl} />
              </audio>
            )}
          </div>
        </div>
      )
    case 'pdf':
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="w-full rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/5 border border-white/10 p-12 flex flex-col items-center gap-6 text-center">
            <div className="size-24 rounded-2xl bg-red-500/20 flex items-center justify-center">
              <FileText className="size-12 text-red-400" />
            </div>
            <div>
              <p className="text-foreground font-semibold text-lg">{file.name}</p>
              <p className="text-muted-foreground text-sm uppercase tracking-widest mt-1">PDF Document</p>
            </div>
            {fileUrl && (
              <Button asChild className="rounded-2xl bg-red-500 hover:bg-red-600 text-white gap-2 px-8 py-6 h-auto">
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-5" />
                  View in New Tab
                </a>
              </Button>
            )}
          </div>
        </div>
      )
    case 'video':
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="w-full aspect-video rounded-2xl bg-black border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
            {fileUrl ? (
              <video controls className="w-full h-full shadow-inner">
                <source src={fileUrl} />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="size-16 rounded-full bg-pink-500/20 flex items-center justify-center">
                <Film className="size-8 text-pink-400" />
              </div>
            )}
          </div>
        </div>
      )
    default:
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="w-full rounded-2xl bg-white/5 border border-white/10 p-12 flex flex-col items-center gap-6 opacity-60">
            <div className="size-24 rounded-2xl bg-white/5 flex items-center justify-center">
              <File className="size-12 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-semibold">{file.name}</p>
              <p className="text-muted-foreground text-sm uppercase tracking-widest mt-1">Preview not available</p>
            </div>
          </div>
        </div>
      )
  }
}

// ===== MAIN FILE PREVIEW =====
export default function FilePreview() {
  const { previewFile, setPreviewFile } = useAppStore()
  const { sessionToken } = useAuth()
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

  const fileUrl = useQuery(
    api.files.getFileUrl,
    previewFile?.storageId || previewFile?.r2Key 
      ? { 
          sessionToken: sessionToken!, 
          storageId: previewFile.storageId as any,
          r2Key: previewFile.r2Key
        } 
      : 'skip'
  )

  const removeFile = useAction(api.r2.removeFile)
  const renameFile = useMutation(api.files.rename)
  const toggleStar = useMutation(api.files.toggleStar)

  if (!previewFile) return null

  const handleDelete = async () => {
    if (!sessionToken) return
    try {
      await removeFile({ sessionToken, id: previewFile.id as any })
      setPreviewFile(null)
      setShowDeleteConfirm(false)
      toast.success('File deleted successfully')
    } catch (error) {
      toast.error('Failed to delete file')
    }
  }

  const handleToggleStar = async () => {
    if (!sessionToken) return
    await toggleStar({ sessionToken, id: previewFile.id as any })
  }

  return (
    <>
      <Dialog open={!!previewFile} onOpenChange={(v) => { if (!v) setPreviewFile(null) }}>
        <DialogContent
          className="bg-background/95 backdrop-blur-2xl border-white/10 text-foreground sm:max-w-2xl w-[95vw] sm:w-full rounded-[2rem] sm:rounded-[2.5rem] p-0 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
          showCloseButton={false}
        >
          <DialogTitle>
            <VisuallyHidden.Root>{previewFile.name}</VisuallyHidden.Root>
          </DialogTitle>
          {previewFile && (
            <div key={previewFile.id} className="relative">
                {/* Header with gradient background */}
                <div className={`bg-gradient-to-br ${getCategoryColor(previewFile.category)} px-5 sm:px-8 pt-8 sm:pt-10 pb-6 sm:pb-8`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-5">
                      <div className="size-12 sm:size-16 rounded-xl sm:rounded-[1.25rem] bg-black/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/5 shrink-0">
                        {getCategoryIcon(previewFile.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <input
                          className="bg-transparent border-none text-xl font-bold text-foreground focus:outline-none focus:ring-0 w-full hover:bg-black/10 rounded px-1 transition-colors"
                          defaultValue={previewFile.name}
                          onBlur={async (e) => {
                            if (e.target.value && e.target.value !== previewFile.name) {
                              try {
                                await renameFile({ sessionToken: sessionToken!, id: previewFile.id as any, name: e.target.value })
                                setPreviewFile({ ...previewFile, name: e.target.value })
                                toast.success('File renamed')
                              } catch (e) {
                                toast.error('Rename failed')
                              }
                            }
                          }}
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-white/10 text-foreground hover:bg-white/20 border-0 rounded-xl px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                            {getCategoryLabel(previewFile.category)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPreviewFile(null)}
                        className="rounded-full bg-black/10 text-foreground/70 hover:text-foreground hover:bg-black/20 size-8 sm:size-10"
                      >
                        <X className="size-4 sm:size-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Main Preview */}
                <div className="px-5 sm:px-8 py-6 sm:py-8">
                  <PreviewContent file={previewFile} fileUrl={fileUrl} />
                </div>

                {/* Metadata & Actions */}
                <div className="px-5 sm:px-8 pb-8 sm:pb-10">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/5">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Size</p>
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <HardDrive className="size-4 text-primary" />
                        <span>{formatSize(previewFile.size)}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Category</p>
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Tag className="size-4 text-primary" />
                        <span>{getCategoryLabel(previewFile.category)}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Created At</p>
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Calendar className="size-4 text-primary" />
                        <span>{formatDate(previewFile.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Button
                      size="lg"
                      className="w-full sm:flex-1 rounded-xl sm:rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-12 sm:h-14 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                      onClick={async () => {
                        if (!fileUrl) return
                        toast.info('Starting download...')
                        const response = await fetch(fileUrl)
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = previewFile.name
                        a.click()
                        window.URL.revokeObjectURL(url)
                      }}
                      disabled={!fileUrl}
                    >
                      <Download className="size-5" />
                      Download File
                    </Button>
                    
                    <div className="flex w-full sm:w-auto items-center gap-3">
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 sm:flex-none rounded-xl sm:rounded-2xl border-white/10 bg-white/5 text-foreground hover:bg-white/10 gap-2 h-12 sm:h-14 sm:w-14 p-0 shadow-lg"
                        onClick={handleToggleStar}
                      >
                        <Star className="size-5" />
                        <span className="sm:hidden font-medium">Star</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 sm:flex-none rounded-xl sm:rounded-2xl border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-2 h-12 sm:h-14 sm:w-14 p-0 shadow-lg"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <Trash2 className="size-5" />
                        <span className="sm:hidden font-medium">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
            </div>
            )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-background/95 backdrop-blur-2xl border-white/10 text-foreground rounded-[2rem] shadow-2xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete &quot;{previewFile?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground mt-2">
              This action is permanent and cannot be undone. All data associated with this file will be wiped from our storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="rounded-2xl border-white/10 bg-white/5 text-foreground hover:bg-white/10 h-12 flex-1">
              Keep it
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-2xl bg-red-500 text-white hover:bg-red-600 h-12 flex-1 shadow-lg shadow-red-500/20"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
