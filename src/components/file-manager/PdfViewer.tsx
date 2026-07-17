'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadPdfjs } from '@/lib/pdfjs'

const PAGE_PAD = 16

interface PdfViewerProps {
  url: string
  filename?: string
}

export function PdfViewer({ url, filename }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const docRef = useRef<any>(null)
  const renderTaskRef = useRef<any>(null)

  // Load the document when the url changes.
  useEffect(() => {
    let cancelled = false
    loadPdfjs().then(async (pdfjs) => {
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

  // Render the current page, fit-to-width. Serializes renders so a pending
  // render is fully cancelled before the next one touches the canvas.
  useEffect(() => {
    const doc = docRef.current
    const canvas = canvasRef.current
    if (!doc || !canvas || loading) return
    let cancelled = false

    const render = async () => {
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel() } catch {}
        try { await renderTaskRef.current.promise } catch {}
        renderTaskRef.current = null
      }
      if (cancelled) return
      try {
        const pdfPage = await doc.getPage(page)
        if (cancelled) return
        const base = pdfPage.getViewport({ scale: 1 })
        const containerWidth = (canvas.parentElement?.clientWidth ?? base.width) - PAGE_PAD
        const fit = Math.min(2.5, Math.max(0.5, containerWidth / base.width))
        const viewport = pdfPage.getViewport({ scale: fit })
        const ctx = canvas.getContext('2d')
        if (!ctx || cancelled) return
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        const task = pdfPage.render({ canvasContext: ctx, viewport })
        renderTaskRef.current = task
        await task.promise
      } catch {
        /* render cancelled or failed */
      }
    }

    render()
    return () => {
      cancelled = true
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel() } catch {}
      }
    }
  }, [page, loading])

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
      <div className="overflow-auto max-h-[55vh] w-full flex justify-center bg-muted/30 rounded-lg p-2">
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
