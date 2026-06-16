import { NextResponse } from 'next/server'
export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const name = searchParams.get('name') || 'download'
    if (!url) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
    }

    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch file from source')

    return new Response(response.body, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${name}"`,
      }
    })
  } catch (err: any) {
    console.error('Download proxy error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
