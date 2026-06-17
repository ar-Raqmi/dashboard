import { NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getRequestContext } from '@cloudflare/next-on-pages'

const MIME_MAP: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon', avif: 'image/avif',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', avi: 'video/x-msvideo',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac',
  pdf: 'application/pdf', txt: 'text/plain',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip', gz: 'application/gzip',
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return MIME_MAP[ext] || 'application/octet-stream'
}

function getS3Client(env?: any) {
  const accessKeyId = env?.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = env?.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY
  const endpoint = env?.R2_ENDPOINT || process.env.R2_ENDPOINT || 'https://1253834dc9cac8e48edc6a7fec740ac9.r2.cloudflarestorage.com'

  if (!accessKeyId || !secretAccessKey || !endpoint) return null

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })
}

export const runtime = 'edge'

export async function GET(request: Request) {
  let env: any = {}
  try { env = getRequestContext().env } catch { /* local dev — no CF context */ }

  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const token = searchParams.get('token')
    const forceDownload = searchParams.get('download') === '1'

    if (!key) {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 })
    }


    // Validate session token
    const { getDb } = await import('@/lib/db')
    const db = await getDb(env)
    const session = await db.session.findUnique({
      where: { token: token || '' },
    })
    if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const s3 = getS3Client(env)
    if (!s3) {
      const accessKeyId = env?.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID
      const secretAccessKey = env?.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY
      const endpoint = env?.R2_ENDPOINT || process.env.R2_ENDPOINT
      
      const missing = [];
      if (!accessKeyId) missing.push('R2_ACCESS_KEY_ID');
      if (!secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');
      if (!endpoint) missing.push('R2_ENDPOINT');

      return NextResponse.json(
        { 
          error: 'R2 not configured.', 
          missing,
          envKeys: Object.keys(env || {}),
          processEnvKeys: Object.keys(process.env || {}).filter(k => k.startsWith('R2') || k.startsWith('NEXT_PUBLIC_R2'))
        },
        { status: 503 }
      )
    }

    const command = new GetObjectCommand({
      Bucket: env?.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'dashboard-files',
      Key: key,
    })

    const response = await s3.send(command)
    if (!response.Body) {
      return NextResponse.json({ error: 'File not found in R2' }, { status: 404 })
    }

    // Stream the body or collect chunks as blob
    let bodyData: any
    const reader = (response.Body as any).transformToWebStream?.()
    if (reader) {
      bodyData = reader
    } else {
      const ab = await (response.Body as any).transformToByteArray()
      bodyData = ab
    }

    const mimeType = response.ContentType || getMimeType(key)
    const filename = key.split('/').pop() || key
    const disposition = forceDownload
      ? `attachment; filename="${filename}"`
      : `inline; filename="${filename}"`

    return new Response(bodyData, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'private, max-age=3600',
        'Content-Disposition': disposition,
      },
    })
  } catch (err: any) {
    console.error('R2 proxy error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
