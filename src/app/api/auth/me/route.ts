import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

// GET /api/auth/me - Get current user session
export async function GET(request: NextRequest) {
  try {
    const jwt = request.cookies.get('ar-raqmi-session')?.value
    const sessionToken = request.cookies.get('ar-raqmi-token')?.value

    if (!jwt || !sessionToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Verify JWT
    const payload = await verifyToken(jwt)
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Verify session is still valid in Convex
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!convexUrl) {
      return NextResponse.json({ authenticated: false }, { status: 500 })
    }

    const sessionResponse = await fetch(`${convexUrl}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'auth:validateSession',
        args: { sessionToken },
      }),
    })

    if (!sessionResponse.ok) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const sessionData = await sessionResponse.json()
    const session = sessionData.value

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      sessionToken,
      user: {
        userId: session.userId,
        username: session.username,
      },
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}
