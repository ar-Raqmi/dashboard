import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth'

// POST /api/auth/seed - Seed the admin user
// This should only be called once during initial setup
export async function POST(request: NextRequest) {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!convexUrl) {
      return NextResponse.json(
        { error: 'Convex is not configured. Please set NEXT_PUBLIC_CONVEX_URL.' },
        { status: 500 }
      )
    }

    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Hash the password
    const { hash, salt } = await hashPassword(password)

    // Call Convex to reset the admin user (wipes existing and seeds fresh without sample data)
    const response = await fetch(`${convexUrl}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'seed:resetAdmin',
        args: {
          username,
          passwordHash: hash,
          salt,
        },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Seed failed:', errText)
      return NextResponse.json(
        { error: 'Failed to seed admin user' },
        { status: 500 }
      )
    }

    const result = await response.json()
    const data = result.value

    if (!data?.success) {
      return NextResponse.json(
        { error: data?.message || 'Failed to seed admin user' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user reset successfully with clean data',
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
