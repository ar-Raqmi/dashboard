'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadPdfjs } from '@/lib/pdfjs'

interface PdfViewerProps {
  url: string
  filename?: string
}

export function PdfViewer({ url, filename }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)
  const [scale, setScale] = useState(1.1)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const docRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    loadPdfjs()
      .then(async (pdfjs) => {
        try {
          const doc = await pdfjs.getDocument({ url }).promise
          if (cancelled) {
            ;(doc as any).destroy?.()
            return
          }
          docRef.current = doc
          setNumPages(doc.numPages)
          setPage(1)
          setLoading(false)
        } catch {
          if (!cancelled) {
            setFailed(true)
            setLoading(false)
          }
        }
      })
    return () => {
      cancelled = true
      docRef.current?.destroy?.()
      docRef.current = null
    }
  }, [url])

  useEffect(() => {
    const doc = docRef.current
    const canvas = canvasRef.current
    if (!doc || !canvas || loading) return
    let cancelled = false
    let renderTask: any
    doc.getPage(page)
      .then(async (pdfPage: any) => {
        if (cancelled) return
        const viewport = pdfPage.getViewport({ scale })
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        canvas.width = viewport.width
        canvas.height = viewport.height
        renderTask = pdfPage.render({ canvasContext: ctx, viewport, canvas })
        try {
          await renderTask.promise
        } catch {
          /* render cancelled */
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
      renderTask?.cancel?.()
    }
  }, [page, scale, loading])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="size-8 animate-spin mb-3" />
        <p className="text-sm">Loading PDF…</p>
      </div>
    )
  }

  if (failed) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <p className="text-sm text-muted-foreground">PDF preview unavailable</p>
        <Button asChild variant="outline">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" /> Open in new tab
          </a>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="overflow-auto max-h-[55vh] rounded-lg bg-muted/30 p-2 w-full flex justify-center">
        <canvas ref={canvasRef} className="max-w-full h-auto rounded shadow-sm bg-white" />
      </div>
      <div className="flex items-center gap-1.5">
        <Button size="icon" variant="outline" className="size-9 rounded-xl" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-xs tabular-nums w-16 text-center text-muted-foreground">
          {page} / {numPages}
        </span>
        <Button size="icon" variant="outline" className="size-9 rounded-xl" disabled={page >= numPages} onClick={() => setPage((p) => Math.min(numPages, p + 1))}>
          <ChevronRight className="size-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button size="icon" variant="outline" className="size-9 rounded-xl" disabled={scale <= 0.5} onClick={() => setScale((s) => Math.max(0.5, +(s - 0.25).toFixed(2)))}>
          <ZoomOut className="size-4" />
        </Button>
        <Button size="icon" variant="outline" className="size-9 rounded-xl" disabled={scale >= 3} onClick={() => setScale((s) => Math.min(3, +(s + 0.25).toFixed(2)))}>
          <ZoomIn className="size-4" />
        </Button>
        {filename && (
          <Button asChild size="sm" variant="ghost" className="ml-1 rounded-xl">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
