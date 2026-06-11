import { NextResponse } from 'next/server'


const MIME_MAP: Record<string, string> = {
  // Images
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon', avif: 'image/avif',
  // Video
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', avi: 'video/x-msvideo',
  // Audio
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac',
  // Documents
  pdf: 'application/pdf', txt: 'text/plain',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Archives
  zip: 'application/zip', gz: 'application/gzip',
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return MIME_MAP[ext] || 'application/octet-stream'
}

export const runtime = 'edge'

export async function GET(
  _request: Request,
  { params }: { params: { storageId: string } }
) {
  try {
    const { storageId } = params
    if (!storageId) {
      return NextResponse.json({ error: 'Missing storageId' }, { status: 400 })
    }

    const proc = (globalThis as any).process
    if (typeof proc !== 'undefined' && proc.release?.name === 'node') {
      const getModule = (name: string) => typeof require !== 'undefined' ? require(name) : null;
      const fs = getModule('fs');
      const path = getModule('path');
      if (fs && path) {
        const uploadDir = path.join(proc.cwd(), 'public', 'uploads')
        const filePath = path.resolve(uploadDir, storageId)

        if (filePath.startsWith(uploadDir + path.sep) && fs.existsSync(filePath)) {
          const buffer = fs.readFileSync(filePath)
          const mimeType = getMimeType(storageId)
          return new Response(buffer, {
            headers: {
              'Content-Type': mimeType,
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          })
        }
      }
    }

    return NextResponse.json({ error: 'Local filesystem storage is not available in this environment' }, { status: 404 })
  } catch (err: any) {
    console.error('Storage serve error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
