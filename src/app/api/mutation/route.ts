import { NextResponse } from 'next/server'
import { handleMutation } from '@/lib/api-router'
import { getRequestContext } from '@cloudflare/next-on-pages'
export const runtime = 'edge'

export async function POST(request: Request) {
  let env: any = {}
  try { env = getRequestContext().env } catch { /* local dev — no CF context */ }

  try {
    const { path, args } = await request.json()
    const result = await handleMutation(path, args, env)
    return NextResponse.json({ value: result })
  } catch (err: any) {
    console.error(`API Mutation Error [${request.url}]:`, err)
    return NextResponse.json(
      { 
        error: err.message, 
        envKeys: Object.keys(env || {}),
        runtime: process.env.NEXT_RUNTIME || 'unknown'
      }, 
      { status: 500 }
    )
  }
}
