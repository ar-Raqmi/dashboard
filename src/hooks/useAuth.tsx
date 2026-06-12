'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { ApiClient } from '@/lib/api-client'

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
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
        const val = await ApiClient.query('auth:validateSession', { sessionToken: token })
        if (val) {
          setUser({
            userId: val.userId,
            username: val.username
          })
          setSessionToken(token)
        } else {
          // Invalid token
          document.cookie = "ar-raqmi-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
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
      // 1. Get user by username
      const userFound = await ApiClient.query('auth:getUserByUsername', { username })

      if (!userFound) return { success: false, error: 'Invalid username or password' }

      // 2. Verify password (using bcryptjs which is bundled in the client)
      const bcrypt = (await import('bcryptjs')).default
      const isValid = await bcrypt.compare(password, userFound.passwordHash)

      if (!isValid) return { success: false, error: 'Invalid username or password' }

      // 3. Create session
      const token = crypto.randomUUID()
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days

      await ApiClient.mutate('sessions:create', {
        userId: userFound._id,
        token,
        expiresAt,
      })

      // Success
      setSessionCookie(token, 7)
      setUser({
        userId: userFound._id,
        username: userFound.username
      })
      setSessionToken(token)
      return { success: true }

    } catch (err: any) {
      console.error('Login error:', err)
      return { success: false, error: err.message || 'An unexpected error occurred' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      if (sessionToken) {
        await ApiClient.mutate('sessions:remove', { token: sessionToken })
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      document.cookie = "ar-raqmi-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      setUser(null)
      setSessionToken(null)
    }
  }, [sessionToken])

  const updateCredentials = useCallback(async (newUsername?: string, newPassword?: string) => {
    try {
      if (!sessionToken) return { success: false, error: 'Unauthorized' }

      const args: any = { sessionToken }
      if (newUsername) args.newUsername = newUsername

      if (newPassword) {
        const bcrypt = (await import('bcryptjs')).default
        const salt = await bcrypt.genSalt(12)
        args.newPasswordHash = await bcrypt.hash(newPassword, salt)
        args.newSalt = salt
      }

      const val = await ApiClient.mutate('auth:updateUser', args)
      
      if (val && val.success) {
        if (newUsername && user) {
          setUser({ ...user, username: newUsername })
        }
        return { success: true }
      }

      return { success: false, error: val?.error || 'Update failed' }
    } catch (err: any) {
      console.error('Update error:', err)
      return { success: false, error: err.message || 'An error occurred during update' }
    }
  }, [sessionToken, user])

  return (
    <AuthContext.Provider value={{ user, sessionToken, loading, login, logout, updateCredentials }}>
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
