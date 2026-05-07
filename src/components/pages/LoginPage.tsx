'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, User, Eye, EyeOff, Database, AlertCircle, Loader2, Server, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const { login, seedAdmin, isConvexConfigured } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [seedLoading, setSeedLoading] = useState(false)
  const [seedSuccess, setSeedSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(username, password)
    if (!result.success) {
      setError(result.error || 'Login failed')
    }
    setLoading(false)
  }

  const handleSeed = async () => {
    setSeedLoading(true)
    setError('')
    const result = await seedAdmin('ar-raqmi', 'password')
    if (result.success) {
      setSeedSuccess(true)
    } else {
      setError(result.error || 'Failed to seed admin user')
    }
    setSeedLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center justify-center size-20 rounded-3xl bg-gradient-to-br from-primary/25 to-primary/10 mb-4 shadow-lg"
          >
            <Database className="size-10 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">ar-Raqmi Database</h1>
          <p className="text-muted-foreground mt-1.5">Sign in to your dashboard</p>
        </div>

        {/* Login Form */}
        <div className="rounded-3xl bg-card border border-border/50 shadow-xl p-6 md:p-8">
          {!isConvexConfigured ? (
            // Convex not configured
            <div className="text-center py-4">
              <div className="size-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Server className="size-7 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Database Not Connected</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Convex is not configured. Please set the <code className="text-xs bg-muted px-1.5 py-0.5 rounded">NEXT_PUBLIC_CONVEX_URL</code> environment variable in your <code className="text-xs bg-muted px-1.5 py-0.5 rounded">.env</code> file.
              </p>
              <div className="bg-muted/50 rounded-2xl p-4 text-left text-xs text-muted-foreground space-y-1.5">
                <p className="font-medium text-foreground">Setup Steps:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Create a free account at <span className="text-primary">convex.dev</span></li>
                  <li>Create a new project</li>
                  <li>Copy the deployment URL</li>
                  <li>Add it to your <code className="bg-muted px-1 rounded">.env</code> file</li>
                  <li>Restart the development server</li>
                </ol>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-2xl bg-destructive/10 text-destructive text-sm"
                  >
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="username">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-12 rounded-2xl border-border/50 bg-background"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-2xl border-border/50 bg-background"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !username || !password}
                  className="w-full h-12 rounded-2xl text-base font-semibold"
                >
                  {loading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Setup Section */}
              <div className="mt-6 pt-4 border-t border-border/30">
                <button
                  type="button"
                  onClick={() => setShowSetup(!showSetup)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                >
                  {showSetup ? 'Hide' : 'Show'} Initial Setup
                </button>

                {showSetup && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 space-y-3"
                  >
                    <div className="bg-muted/50 rounded-2xl p-4 text-sm text-muted-foreground">
                      <p className="mb-2 font-medium text-foreground">First-time setup:</p>
                      <p className="mb-3">Click the button below to create the default admin account. Credentials will be:</p>
                      <div className="bg-background rounded-xl p-3 font-mono text-xs space-y-1">
                        <p>Username: <span className="text-primary">ar-raqmi</span></p>
                        <p>Password: <span className="text-primary">password</span></p>
                      </div>
                    </div>

                    {seedSuccess ? (
                      <div className="flex items-center gap-2 p-3 rounded-2xl bg-primary/10 text-primary text-sm">
                        <CheckCircle2 className="size-4" />
                        <span>Admin user reset successfully! You can now sign in.</span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={handleSeed}
                        disabled={seedLoading}
                        className="w-full rounded-2xl"
                      >
                        {seedLoading ? (
                          <Loader2 className="size-4 animate-spin mr-2" />
                        ) : (
                          <Database className="size-4 mr-2" />
                        )}
                        Reset & Seed Admin User
                      </Button>
                    )}
                  </motion.div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          ar-Raqmi Database &middot; Clean Reset Mode
        </p>
      </motion.div>
    </div>
  )
}
