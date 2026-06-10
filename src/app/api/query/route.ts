import { NextResponse } from 'next/server'
import { handleQuery } from '@/lib/api-router'


export async function POST(request: Request) {
  try {
    const { path, args } = await request.json()
    const result = await handleQuery(path, args)
    return NextResponse.json({ value: result })
  } catch (err: any) {
    console.error(`API Query Error [${request.url}]:`, err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
