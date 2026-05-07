import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/logout
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('ar-raqmi-token')?.value

    if (sessionToken) {
      // Delete session from Convex
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
      if (convexUrl) {
        await fetch(`${convexUrl}/api/mutation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: 'sessions:remove',
            args: { token: sessionToken },
          }),
        }).catch(() => {
          // Ignore errors during session cleanup
        })
      }
    }

    const response = NextResponse.json({ success: true })

    // Clear cookies
    response.cookies.set('ar-raqmi-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    response.cookies.set('ar-raqmi-token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
