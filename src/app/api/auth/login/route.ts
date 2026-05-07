import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, verifyPassword, createToken, getSessionDuration } from '@/lib/auth'

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // We need to verify against the Convex database
    // Since we can't directly call Convex from server-side in this setup,
    // we'll use the Convex HTTP API
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!convexUrl) {
      return NextResponse.json(
        { error: 'Convex is not configured. Please set NEXT_PUBLIC_CONVEX_URL.' },
        { status: 500 }
      )
    }

    // Query Convex for the user
    const userResponse = await fetch(`${convexUrl}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'auth:getUserByUsername',
        args: { username },
      }),
    })

    if (!userResponse.ok) {
      const errText = await userResponse.text()
      console.error('Convex query failed:', errText)
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 500 }
      )
    }

    const userData = await userResponse.json()
    const user = userData.value

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Create session token
    const sessionToken = crypto.randomUUID()
    const expiresAt = Date.now() + getSessionDuration()

    // Create session in Convex
    const sessionResponse = await fetch(`${convexUrl}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'sessions:create',
        args: {
          userId: user._id,
          token: sessionToken,
          expiresAt,
        },
      }),
    })

    if (!sessionResponse.ok) {
      console.error('Failed to create session')
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Create JWT for additional verification
    const jwt = await createToken({
      userId: user._id,
      username: user.username,
    })

    // Set httpOnly cookie with JWT
    const response = NextResponse.json({
      success: true,
      sessionToken,
      user: {
        userId: user._id,
        username: user.username,
      },
    })

    response.cookies.set('ar-raqmi-session', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    response.cookies.set('ar-raqmi-token', sessionToken, {
      httpOnly: false, // Accessible by JS for Convex calls
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
