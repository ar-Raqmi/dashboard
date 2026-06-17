import { NextResponse } from 'next/server'
import { handleQuery } from '@/lib/api-router'
import { getRequestContext } from '@cloudflare/next-on-pages'
export const runtime = 'edge'

export async function POST(request: Request) {
  let env: any = {}
  try { env = getRequestContext().env } catch { /* local dev — no CF context */ }

  try {
    const { path, args } = await request.json()
    const result = await handleQuery(path, args, env)
    return NextResponse.json({ value: result })
  } catch (err: any) {
    console.error(`API Query Error [${request.url}]:`, err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
