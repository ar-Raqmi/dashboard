'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
} from 'lucide-react'
import { useAppStore, type FileCategory, type FileItem } from '@/lib/store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'

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
    case 'image': return 'from-blue-500/30 to-blue-600/10 text-blue-400'
    case 'audio': return 'from-purple-500/30 to-purple-600/10 text-purple-400'
    case 'pdf': return 'from-red-500/30 to-red-600/10 text-red-400'
    case 'doc': return 'from-amber-500/30 to-amber-600/10 text-amber-400'
    case 'video': return 'from-pink-500/30 to-pink-600/10 text-pink-400'
    case 'folder': return 'from-primary/30 to-primary/10 text-primary'
    default: return 'from-gray-500/30 to-gray-600/10 text-gray-400'
  }
}

// ===== PREVIEW CONTENT =====
function PreviewContent({ file }: { file: FileItem }) {
  switch (file.category) {
    case 'image':
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-md aspect-video rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center border border-border overflow-hidden">
            {file.content ? (
              <img
                src={file.content}
                alt={file.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-blue-400">
                <ImageIcon className="size-20 opacity-50" />
                <span className="text-sm opacity-50">Image Preview</span>
              </div>
            )}
          </div>
        </div>
      )
    case 'audio':
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-border p-8 flex flex-col items-center gap-4">
            <div className="size-20 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Music className="size-10 text-purple-400" />
            </div>
            <p className="text-foreground/70 text-sm font-medium">{file.name}</p>
            {/* Audio player mock */}
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-purple-400 to-pink-400" />
            </div>
            <div className="flex items-center gap-4 text-muted-foreground text-xs">
              <span>0:00</span>
              <span>3:45</span>
            </div>
            <audio controls className="w-full opacity-80" style={{ filter: 'hue-rotate(200deg)' }}>
              {file.content && <source src={file.content} type="audio/mpeg" />}
            </audio>
          </div>
        </div>
      )
    case 'pdf':
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/5 border border-border p-8 flex flex-col items-center gap-4">
            <FileText className="size-20 text-red-400 opacity-50" />
            <p className="text-muted-foreground text-sm">PDF Document</p>
            <Button className="rounded-2xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30">
              <FileText className="size-4" />
              Open PDF
            </Button>
          </div>
        </div>
      )
    case 'doc':
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileEdit className="size-6 text-amber-400" />
              <span className="text-foreground font-medium text-sm">Document Preview</span>
            </div>
            <div className="space-y-2 text-muted-foreground text-xs">
              <div className="h-3 bg-muted/50 rounded-full w-full" />
              <div className="h-3 bg-muted/50 rounded-full w-4/5" />
              <div className="h-3 bg-muted/50 rounded-full w-full" />
              <div className="h-3 bg-muted/50 rounded-full w-3/5" />
              <div className="h-3 bg-muted/50 rounded-full w-full" />
              <div className="h-3 bg-muted/50 rounded-full w-2/3" />
            </div>
          </div>
        </div>
      )
    case 'video':
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-md aspect-video rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-600/5 border border-border flex items-center justify-center">
            <div className="size-16 rounded-full bg-pink-500/20 flex items-center justify-center">
              <Film className="size-8 text-pink-400" />
            </div>
          </div>
        </div>
      )
    default:
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-gray-500/20 to-gray-600/5 border border-border p-8 flex flex-col items-center gap-4">
            <File className="size-20 text-gray-400 opacity-50" />
            <p className="text-muted-foreground text-sm">File Preview</p>
          </div>
        </div>
      )
  }
}

// ===== MAIN FILE PREVIEW =====
export default function FilePreview() {
  const { previewFile, setPreviewFile, deleteFile } = useAppStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

  if (!previewFile) return null

  const handleDelete = () => {
    deleteFile(previewFile.id)
    setPreviewFile(null)
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <Dialog open={!!previewFile} onOpenChange={(v) => { if (!v) setPreviewFile(null) }}>
        <DialogContent
          className="bg-card border-border text-foreground sm:max-w-2xl rounded-3xl p-0 overflow-hidden"
          showCloseButton={false}
        >
          <DialogTitle>
            <VisuallyHidden.Root>{previewFile.name}</VisuallyHidden.Root>
          </DialogTitle>
          <AnimatePresence>
            {previewFile && (
              <motion.div
                key={previewFile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Header with gradient */}
                <div className={`bg-gradient-to-br ${getCategoryColor(previewFile.category)} px-6 pt-6 pb-4`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="size-14 rounded-2xl bg-black/20 flex items-center justify-center">
                        {getCategoryIcon(previewFile.category)}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">{previewFile.name}</h2>
                        <Badge className="mt-1 bg-muted text-muted-foreground border-0 rounded-2xl text-xs">
                          {getCategoryLabel(previewFile.category)}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPreviewFile(null)}
                      className="rounded-full text-foreground/70 hover:text-foreground hover:bg-accent"
                    >
                      <X className="size-5" />
                    </Button>
                  </div>
                </div>

                {/* Preview content */}
                <div className="px-6 py-6">
                  <PreviewContent file={previewFile} />
                </div>

                {/* Metadata */}
                <div className="px-6 pb-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <HardDrive className="size-3.5" />
                      <span>{formatSize(previewFile.size)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Tag className="size-3.5" />
                      <span>{getCategoryLabel(previewFile.category)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Calendar className="size-3.5" />
                      <span>{formatDate(previewFile.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex items-center gap-3">
                  <Button
                    className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                    onClick={() => {
                      // Mock download
                      const a = document.createElement('a')
                      a.href = previewFile.content || '#'
                      a.download = previewFile.name
                      a.click()
                    }}
                  >
                    <Download className="size-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-2xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-2"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border text-foreground rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete &quot;{previewFile?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This file will be permanently deleted. This action cannot be undone.
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
    </>
  )
}
