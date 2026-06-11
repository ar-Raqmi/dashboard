import { NextResponse } from 'next/server'


export const runtime = 'edge'

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 })
    }

    // Read body as ArrayBuffer
    const buffer = await request.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)

    // Ensure uploads directory exists if running in Node.js local dev
    const proc = (globalThis as any).process
    if (typeof proc !== 'undefined' && proc.release?.name === 'node') {
      const getModule = (name: string) => typeof require !== 'undefined' ? require(name) : null;
      const fs = getModule('fs');
      const path = getModule('path');
      if (fs && path) {
        const uploadDir = path.join(proc.cwd(), 'public', 'uploads')
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true })
        }
        const filePath = path.join(uploadDir, key)
        fs.writeFileSync(filePath, uint8Array)
        return NextResponse.json({ success: true, url: `/uploads/${key}` })
      }
    }

    return NextResponse.json({ error: 'Local uploading is disabled in cloud production' }, { status: 403 })
  } catch (err: any) {
    console.error('Local upload endpoint error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
