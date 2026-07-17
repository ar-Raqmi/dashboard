'use client'

import { useState } from 'react'
import { Film } from 'lucide-react'
import { FileCategoryService, resolveFileCategory } from '@/lib/file-utils'
import { PdfThumb } from '@/components/file-manager/PdfThumb'
import { cn } from '@/lib/utils'

interface FileThumbnailProps {
  file: any
  variant?: 'grid' | 'list'
  className?: string
}

/**
 * Renders a file's visual preview with graceful fallback:
 *  - stored thumbnail (thumbnailUrl) → img
 *  - else image → lazy full-res img
 *  - else video → <video> first frame
 *  - (PDF first-page render is handled by the PDF viewer)
 *  - else → category icon
 */
export function FileThumbnail({ file, variant = 'grid', className }: FileThumbnailProps) {
  const [errored, setErrored] = useState(false)
  const category = resolveFileCategory(file)
  const cfg = FileCategoryService.get(category)
  const Icon = cfg.icon

  const iconEl = (
    <Icon className={cn(variant === 'grid' ? 'size-9' : 'size-5', cfg.iconClass)} />
  )

  if (file?.type === 'folder' || errored) {
    return <div className={cn('flex items-center justify-center w-full h-full', className)}>{iconEl}</div>
  }

  const src = file?.thumbnailUrl || file?.fileUrl
  const showImage = (category === 'image' || (category === 'video' && file?.thumbnailUrl)) && src
  const showVideoFrame = category === 'video' && !file?.thumbnailUrl && file?.fileUrl

  if (showImage) {
    return (
      <img
        src={src}
        alt={file.name}
        loading="lazy"
        onError={() => setErrored(true)}
        className={cn('object-cover w-full h-full', className)}
      />
    )
  }

  if (showVideoFrame) {
    return (
      <div className="relative w-full h-full">
        <video
          src={file.fileUrl}
          muted
          playsInline
          preload="metadata"
          onError={() => setErrored(true)}
          className={cn('object-cover w-full h-full', className)}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <Film className="size-5 text-white/90" />
        </div>
      </div>
    )
  }

  if (category === 'pdf' && file?.fileUrl) {
    return <PdfThumb url={file.fileUrl} className={cn('object-cover w-full h-full', className)} />
  }

  return <div className={cn('flex items-center justify-center w-full h-full', className)}>{iconEl}</div>
}
