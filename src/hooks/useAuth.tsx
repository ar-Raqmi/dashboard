'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface AuthUser {
  userId: string
  username: string
}

interface AuthContextType {
  user: AuthUser | null
  sessionToken: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateCredentials: (username?: string, password?: string) => Promise<{ success: boolean; error?: string }>
  isConvexConfigured: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConvexConfigured] = useState(() => !!process.env.NEXT_PUBLIC_CONVEX_URL)

  // Helper to set cookie
  const setSessionCookie = (token: string, days: number) => {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `ar-raqmi-token=${token}; expires=${expires}; path=/; SameSite=Lax`
  }

  // Helper to get cookie
  const getSessionCookie = () => {
    const name = "ar-raqmi-token="
    const decodedCookie = decodeURIComponent(document.cookie)
    const ca = decodedCookie.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === ' ') c = c.substring(1)
      if (c.indexOf(name) === 0) return c.substring(name.length, c.length)
    }
    return null
  }

  // Check auth status on mount
  useEffect(() => {
    async function checkAuth() {
      const token = getSessionCookie()
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
        if (!convexUrl) {
          setLoading(false)
          return
        }

        // Use fetch for the initial check to avoid dependency loops with ConvexProvider
        const res = await fetch(`${convexUrl}/api/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: 'auth:validateSession',
            args: { sessionToken: token },
          }),
        })

        if (res.ok) {
          const data = await res.json()
          if (data.value) {
            setUser({
              userId: data.value.userId,
              username: data.value.username
            })
            setSessionToken(token)
          } else {
            // Invalid token
            document.cookie = "ar-raqmi-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
          }
        }
      } catch (err) {
        console.error('Auth check error:', err)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    try {
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
      if (!convexUrl) return { success: false, error: 'Convex not configured' }

      // 1. Get user by username
      const userRes = await fetch(`${convexUrl}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'auth:getUserByUsername',
          args: { username },
        }),
      })

      if (!userRes.ok) return { success: false, error: 'Auth service unavailable' }
      const userData = await userRes.json()
      const userFound = userData.value

      if (!userFound) return { success: false, error: 'Invalid username or password' }

      // 2. Verify password (using bcryptjs which is bundled in the client)
      const bcrypt = (await import('bcryptjs')).default
      const isValid = await bcrypt.compare(password, userFound.passwordHash)

      if (!isValid) return { success: false, error: 'Invalid username or password' }

      // 3. Create session
      const token = crypto.randomUUID()
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days

      const sessionRes = await fetch(`${convexUrl}/api/mutation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'sessions:create',
          args: {
            userId: userFound._id,
            token,
            expiresAt,
          },
        }),
      })

      if (!sessionRes.ok) return { success: false, error: 'Failed to create session' }

      // Success
      setSessionCookie(token, 7)
      setUser({
        userId: userFound._id,
        username: userFound.username
      })
      setSessionToken(token)
      return { success: true }

    } catch (err) {
      console.error('Login error:', err)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
      if (convexUrl && sessionToken) {
        await fetch(`${convexUrl}/api/mutation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: 'sessions:remove',
            args: { token: sessionToken },
          }),
        })
      }
    } finally {
      document.cookie = "ar-raqmi-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      setUser(null)
      setSessionToken(null)
    }
  }, [sessionToken])

  const updateCredentials = useCallback(async (newUsername?: string, newPassword?: string) => {
    try {
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
      if (!convexUrl || !sessionToken) return { success: false, error: 'Unauthorized' }

      const args: any = { sessionToken }
      if (newUsername) args.newUsername = newUsername

      if (newPassword) {
        const bcrypt = (await import('bcryptjs')).default
        const salt = await bcrypt.genSalt(12)
        args.newPasswordHash = await bcrypt.hash(newPassword, salt)
        args.newSalt = salt
      }

      const res = await fetch(`${convexUrl}/api/mutation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'auth:updateUser',
          args,
        }),
      })

      if (!res.ok) return { success: false, error: 'Failed to update credentials' }
      const data = await res.json()
      
      if (data.value && data.value.success) {
        if (newUsername && user) {
          setUser({ ...user, username: newUsername })
        }
        return { success: true }
      }

      return { success: false, error: data.value?.error || 'Update failed' }
    } catch (err) {
      console.error('Update error:', err)
      return { success: false, error: 'An error occurred during update' }
    }
  }, [sessionToken, user])

  return (
    <AuthContext.Provider value={{ user, sessionToken, loading, login, logout, updateCredentials, isConvexConfigured }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
