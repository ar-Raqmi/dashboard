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
  // Check if Convex URL is configured (NEXT_PUBLIC_ vars are available client-side)
  const [isConvexConfigured] = useState(() => !!process.env.NEXT_PUBLIC_CONVEX_URL)

  // Check auth status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data.authenticated) {
            setUser(data.user)
            setSessionToken(data.sessionToken)
          }
        }
      } catch {
        // Network error
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setUser(data.user)
        setSessionToken(data.sessionToken)
        return { success: true }
      }

      return { success: false, error: data.error || 'Login failed' }
    } catch {
      return { success: false, error: 'Network error. Please check your connection.' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
      setSessionToken(null)
    }
  }, [])


  const updateCredentials = useCallback(async (username?: string, password?: string) => {
    try {
      const res = await fetch('/api/auth/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        if (username && user) {
          setUser({ ...user, username })
        }
        return { success: true }
      }

      return { success: false, error: data.error || 'Update failed' }
    } catch {
      return { success: false, error: 'Network error. Please check your connection.' }
    }
  }, [user])

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
