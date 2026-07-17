'use client'

import React from 'react'
import {
  Download,
  Trash2,
  Calendar,
  HardDrive,
  Loader2,
  Star,
  Share2,
  X,
} from 'lucide-react'
import { useAppStore, type FileItem } from '@/lib/store'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
import { useQuery, useMutation, useAction } from '@/hooks/useApi'
import { api, ApiClient } from '@/lib/api-client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { PdfViewer } from '@/components/file-manager/PdfViewer'
import {
  FileCategoryService,
  formatFileSize,
  formatFileDate,
  formatDuration,
} from '@/lib/file-utils'
import { cn } from '@/lib/utils'

// ===== PREVIEW MEDIA =====
function PreviewMedia({ file, fileUrl }: { file: FileItem; fileUrl?: string | null }) {
  if (fileUrl === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="size-8 animate-spin mb-3" />
        <p className="text-sm">Loading preview…</p>
      </div>
    )
  }

  const shell =
    'rounded-xl border bg-muted/30 min-h-[220px] flex items-center justify-center p-6'

  switch (file.category) {
    case 'image':
      return (
        <div className={shell}>
          {fileUrl ? (
            <img
              src={fileUrl}
              alt={file.name}
              className="max-h-[55vh] w-auto rounded-lg object-contain"
            />
          ) : (
            <p className="text-sm text-muted-foreground">Preview unavailable</p>
          )}
        </div>
      )
    case 'video':
      return (
        <div className={cn(shell, 'p-0 overflow-hidden bg-black/40')}>
          {fileUrl ? (
            <video controls src={fileUrl} className="w-full max-h-[55vh]" />
          ) : (
            <p className="text-sm text-muted-foreground">Preview unavailable</p>
          )}
        </div>
      )
    case 'audio':
      return (
        <div className={cn(shell, 'flex-col gap-5 py-10')}>
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="font-medium text-foreground line-clamp-1 max-w-full">{file.name}</p>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Audio</p>
          </div>
          {fileUrl && <audio controls src={fileUrl} className="w-full max-w-md" />}
        </div>
      )
    case 'pdf':
      return (
        <div className="rounded-xl border bg-muted/20 p-3">
          {fileUrl ? (
            <PdfViewer key={fileUrl} url={fileUrl} filename={file.name} />
          ) : (
            <p className="text-sm text-muted-foreground py-10 text-center">Preview unavailable</p>
          )}
        </div>
      )
    default:
      return (
        <div className={cn(shell, 'flex-col gap-2 py-12 opacity-70')}>
          <p className="font-medium text-foreground line-clamp-1 max-w-full">{file.name}</p>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Preview not available
          </p>
        </div>
      )
  }
}

// ===== DETAIL ROW =====
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs uppercase tracking-widest font-medium text-muted-foreground w-20 shrink-0">
        {label}
      </span>
      <span className="text-sm text-foreground font-medium truncate">{value}</span>
    </div>
  )
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
          r2Key: previewFile.r2Key,
          filename: previewFile.name,
          inline: true,
        }
      : 'skip',
  )

  const removeFile = useAction(api.r2.removeFile)
  const renameFile = useMutation(api.files.rename)
  const toggleStar = useMutation(api.files.toggleStar)

  if (!previewFile) return null

  const category = FileCategoryService.get(previewFile.category)
  const CategoryIcon = category.icon
  const isStarred = Boolean((previewFile as any).starred)

  const handleDelete = async () => {
    if (!sessionToken) return
    try {
      await removeFile({ sessionToken, id: previewFile.id as any })
      setPreviewFile(null)
      setShowDeleteConfirm(false)
      toast.success('File deleted successfully')
    } catch {
      toast.error('Failed to delete file')
    }
  }

  const handleToggleStar = async () => {
    if (!sessionToken) return
    await toggleStar({ sessionToken, id: previewFile.id as any })
    setPreviewFile({ ...previewFile, starred: !isStarred } as any)
  }

  const handleDownload = async () => {
    if (!sessionToken) return
    try {
      // Fetch an attachment-disposition URL so the browser downloads
      // (the display URL above is inline, for previewing/open-in-tab).
      const dlUrl = (await ApiClient.query(api.files.getFileUrl.path, {
        sessionToken,
        storageId: previewFile.storageId,
        r2Key: previewFile.r2Key,
        filename: previewFile.name,
        inline: false,
      } as any)) as string | null
      if (!dlUrl) return
      toast.info('Starting download…')
      const a = document.createElement('a')
      a.href = dlUrl
      a.download = previewFile.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {
      toast.error('Download failed')
    }
  }

  const handleCopyLink = async () => {
    if (!fileUrl) return
    try {
      await navigator.clipboard.writeText(fileUrl)
      toast.success('Link copied (valid for 1 hour)')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  return (
    <>
      <Dialog open={!!previewFile} onOpenChange={(v) => { if (!v) setPreviewFile(null) }}>
        <DialogContent
          className="bg-background/95 backdrop-blur-xl border text-foreground sm:max-w-2xl w-[95vw] sm:w-full rounded-2xl p-0 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
          showCloseButton={false}
          aria-describedby={undefined}
        >
          <DialogTitle>
            <VisuallyHidden.Root>{previewFile.name}</VisuallyHidden.Root>
          </DialogTitle>

          {/* Header */}
          <div className="flex items-start gap-3 p-4 border-b shrink-0">
            <div
              className={cn(
                'size-11 rounded-xl flex items-center justify-center shrink-0',
                category.chipClass,
              )}
            >
              <CategoryIcon className={cn('size-5', category.iconClass)} />
            </div>
            <div className="min-w-0 flex-1">
              <textarea
                className="bg-transparent border-none text-base font-semibold text-foreground focus:outline-none focus:ring-0 w-full hover:bg-accent/50 rounded-md px-1 -mx-1 transition-colors resize-none break-words leading-snug"
                defaultValue={previewFile.name}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.currentTarget.blur()
                  }
                }}
                onBlur={async (e) => {
                  const value = e.target.value.trim()
                  if (value && value !== previewFile.name) {
                    try {
                      await renameFile({
                        sessionToken: sessionToken!,
                        id: previewFile.id as any,
                        name: value,
                      })
                      setPreviewFile({ ...previewFile, name: value })
                      toast.success('File renamed')
                    } catch {
                      toast.error('Rename failed')
                    }
                  }
                }}
              />
              <Badge variant="secondary" className="mt-1 uppercase tracking-widest text-[10px]">
                {category.label}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPreviewFile(null)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </Button>
          </div>

          {/* Body */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <PreviewMedia file={previewFile} fileUrl={fileUrl} />

              {/* Details */}
              <div className="rounded-xl border px-4">
                <DetailRow
                  icon={<HardDrive className="size-4" />}
                  label="Size"
                  value={formatFileSize(previewFile.size)}
                />
                {previewFile.width && previewFile.height ? (
                  <>
                    <Separator />
                    <DetailRow
                      icon={<HardDrive className="size-4" />}
                      label="Dims"
                      value={`${previewFile.width} × ${previewFile.height}`}
                    />
                  </>
                ) : null}
                {previewFile.duration ? (
                  <>
                    <Separator />
                    <DetailRow
                      icon={<HardDrive className="size-4" />}
                      label="Length"
                      value={formatDuration(previewFile.duration)}
                    />
                  </>
                ) : null}
                {previewFile.mimeType ? (
                  <>
                    <Separator />
                    <DetailRow
                      icon={<HardDrive className="size-4" />}
                      label="Type"
                      value={previewFile.mimeType}
                    />
                  </>
                ) : null}
                <Separator />
                <DetailRow
                  icon={<Calendar className="size-4" />}
                  label="Modified"
                  value={formatFileDate(previewFile.updatedAt, true)}
                />
                <Separator />
                <DetailRow
                  icon={<Calendar className="size-4" />}
                  label="Created"
                  value={formatFileDate(previewFile.createdAt, true)}
                />
              </div>
            </div>
          </ScrollArea>

          {/* Footer actions */}
          <div className="flex items-center gap-2 p-4 border-t shrink-0">
            <Button className="flex-1 h-11" onClick={handleDownload} disabled={!fileUrl}>
              <Download className="size-4" />
              Download
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11"
              onClick={handleCopyLink}
              disabled={!fileUrl}
              aria-label="Copy link"
            >
              <Share2 className="size-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11"
              onClick={handleToggleStar}
              aria-label="Toggle star"
            >
              <Star className={cn('size-5', isStarred && 'fill-amber-400 text-amber-400')} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                ;(document.activeElement as HTMLElement)?.blur()
                setShowDeleteConfirm(true)
              }}
              aria-label="Delete"
            >
              <Trash2 className="size-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-background border text-foreground rounded-2xl shadow-2xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Delete &quot;{previewFile?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground mt-2">
              This action is permanent and cannot be undone. All data associated with this file will
              be wiped from our storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-3">
            <AlertDialogCancel className="rounded-xl border h-11 flex-1">Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-white hover:bg-destructive/90 h-11 flex-1"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
