/**
 * Client-side media helpers: metadata extraction + thumbnail generation.
 * Browser-only (uses DOM Image/Video/Canvas). Used at upload time.
 */

export interface MediaMeta {
  width?: number
  height?: number
  duration?: number
}

/** Extracts dimensions (image/video) and/or duration (audio/video) from a File. */
export async function extractMediaMeta(file: File): Promise<MediaMeta> {
  return new Promise((resolve) => {
    const type = file.type
    const url = URL.createObjectURL(file)
    let settled = false
    const done = (meta: MediaMeta) => {
      if (settled) return
      settled = true
      URL.revokeObjectURL(url)
      resolve(meta)
    }
    const timeout = setTimeout(() => done({}), 4000)

    if (type.startsWith('image/')) {
      const img = new Image()
      img.onload = () => {
        clearTimeout(timeout)
        done({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = () => { clearTimeout(timeout); done({}) }
      img.src = url
      return
    }
    if (type.startsWith('video/')) {
      const v = document.createElement('video')
      v.onloadedmetadata = () => {
        clearTimeout(timeout)
        done({ width: v.videoWidth, height: v.videoHeight, duration: v.duration })
      }
      v.onerror = () => { clearTimeout(timeout); done({}) }
      v.src = url
      return
    }
    if (type.startsWith('audio/')) {
      const a = document.createElement('audio')
      a.onloadedmetadata = () => {
        clearTimeout(timeout)
        done({ duration: a.duration })
      }
      a.onerror = () => { clearTimeout(timeout); done({}) }
      a.src = url
      return
    }
    clearTimeout(timeout)
    done({})
  })
}

function canvasFromSource(src: CanvasImageSource, sw: number, sh: number, maxDim: number): HTMLCanvasElement {
  const scale = Math.min(1, maxDim / Math.max(sw, sh))
  const cw = Math.max(1, Math.round(sw * scale))
  const ch = Math.max(1, Math.round(sh * scale))
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  ctx?.drawImage(src, 0, 0, cw, ch)
  return canvas
}

/** Generates a JPEG thumbnail Blob for an image file (max edge ~maxDim px). */
export async function generateImageThumbnail(file: File, maxDim = 480): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    let settled = false
    const finish = (b: Blob | null) => {
      if (settled) return
      settled = true
      URL.revokeObjectURL(url)
      resolve(b)
    }
    setTimeout(() => finish(null), 5000)
    img.onload = () => {
      try {
        const canvas = canvasFromSource(img, img.naturalWidth, img.naturalHeight, maxDim)
        canvas.toBlob((b) => finish(b), 'image/jpeg', 0.8)
      } catch {
        finish(null)
      }
    }
    img.onerror = () => finish(null)
    img.src = url
  })
}

/** Generates a JPEG thumbnail Blob from a video file by seeking near the start. */
export async function generateVideoThumbnail(file: File, maxDim = 480): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    v.muted = true
    v.preload = 'metadata'
    let settled = false
    const finish = (b: Blob | null) => {
      if (settled) return
      settled = true
      URL.revokeObjectURL(url)
      resolve(b)
    }
    setTimeout(() => finish(null), 6000)
    v.onloadeddata = () => {
      const seekTo = Math.min(1, (v.duration || 2) / 2)
      const onSeeked = () => {
        try {
          const canvas = canvasFromSource(v, v.videoWidth, v.videoHeight, maxDim)
          canvas.toBlob((b) => finish(b), 'image/jpeg', 0.8)
        } catch {
          finish(null)
        }
      }
      v.onseeked = onSeeked
      try {
        v.currentTime = seekTo
      } catch {
        onSeeked()
      }
    }
    v.onerror = () => finish(null)
    v.src = url
  })
}
