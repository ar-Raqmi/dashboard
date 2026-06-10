import { NextResponse } from 'next/server'
import { handleMutation } from '@/lib/api-router'


export async function POST(request: Request) {
  try {
    const { path, args } = await request.json()
    const result = await handleMutation(path, args)
    return NextResponse.json({ value: result })
  } catch (err: any) {
    console.error(`API Mutation Error [${request.url}]:`, err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
