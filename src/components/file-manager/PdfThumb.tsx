'use client'

import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { loadPdfjs } from '@/lib/pdfjs'
import { cn } from '@/lib/utils'

interface PdfThumbProps {
  url: string
  className?: string
}

/** Renders the first page of a PDF as a thumbnail; shows a PDF icon while loading or on failure. */
export function PdfThumb({ url, className }: PdfThumbProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let doc: any
    loadPdfjs()
      .then(async (pdfjs) => {
        try {
          doc = await pdfjs.getDocument({ url }).promise
          if (cancelled) return
          const pdfPage = await doc.getPage(1)
          const viewport = pdfPage.getViewport({ scale: 0.4 })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext('2d')
          if (!ctx) return
          await pdfPage.render({ canvasContext: ctx, viewport, canvas }).promise
          if (!cancelled) setDataUrl(canvas.toDataURL('image/jpeg', 0.7))
        } catch {
          if (!cancelled) setFailed(true)
        } finally {
          doc?.destroy?.()
        }
      })
    return () => {
      cancelled = true
    }
  }, [url])

  if (dataUrl) {
    return <img src={dataUrl} alt="" loading="lazy" className={className} />
  }

  return (
    <div className={cn('flex items-center justify-center w-full h-full bg-red-500/5', className)}>
      <FileText className={cn('size-6', failed ? 'text-muted-foreground/40' : 'text-red-500 dark:text-red-400 animate-pulse')} />
    </div>
  )
}
