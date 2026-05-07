import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, createToken, verifyToken } from '@/lib/auth'

// POST /api/auth/update
export async function POST(request: NextRequest) {
  try {
    const jwt = request.cookies.get('ar-raqmi-session')?.value
    const sessionToken = request.cookies.get('ar-raqmi-token')?.value

    if (!jwt || !sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify JWT
    const payload = await verifyToken(jwt)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username, password } = await request.json()

    if (!username && !password) {
      return NextResponse.json(
        { error: 'At least one field (username or password) is required' },
        { status: 400 }
      )
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!convexUrl) {
      return NextResponse.json(
        { error: 'Convex is not configured' },
        { status: 500 }
      )
    }

    const args: Record<string, any> = { sessionToken }

    if (username) {
      args.newUsername = username
    }

    if (password) {
      const { hash, salt } = await hashPassword(password)
      args.newPasswordHash = hash
      args.newSalt = salt
    }

    // Call Convex mutation
    const updateResponse = await fetch(`${convexUrl}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'auth:updateUser',
        args,
      }),
    })

    if (!updateResponse.ok) {
      const errText = await updateResponse.text()
      console.error('Convex update failed:', errText)
      return NextResponse.json(
        { error: 'Failed to update credentials' },
        { status: 500 }
      )
    }

    const updateData = await updateResponse.json()
    const result = updateData.value

    if (!result || result.success === false) {
      return NextResponse.json(
        { error: result?.error || 'Failed to update credentials' },
        { status: 400 }
      )
    }

    // If username changed, we need to issue a new JWT
    const response = NextResponse.json({ success: true })

    if (username) {
      const newJwt = await createToken({
        userId: payload.userId,
        username: username,
      })

      response.cookies.set('ar-raqmi-session', newJwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('Update credentials error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
