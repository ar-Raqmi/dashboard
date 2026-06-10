import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

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

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Save the file
    const filePath = path.join(uploadDir, key)
    fs.writeFileSync(filePath, uint8Array)

    return NextResponse.json({ success: true, url: `/uploads/${key}` })
  } catch (err: any) {
    console.error('Local upload endpoint error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
