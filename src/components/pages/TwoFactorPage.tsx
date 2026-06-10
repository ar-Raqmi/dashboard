'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Trash2, Plus, Key, Copy, CheckCheck, Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery, useMutation } from '@/hooks/useCloudflareConvex'
import { api } from '@/lib/convex-client'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function TwoFactorPage() {
  const { sessionToken } = useAuth()
  const setActivePage = useAppStore((s) => s.setActivePage)
  
  // Queries & Mutations
  const list = useQuery(api.twoFactor.list, sessionToken ? { sessionToken } : 'skip')
  const createAccount = useMutation(api.twoFactor.create)
  const removeAccount = useMutation(api.twoFactor.remove)

  // Local State
  const [items, setItems] = useState<any[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Add Account Form
  const [accountName, setAccountName] = useState('')
  const [secret, setSecret] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (list) {
      setItems(list)
    }
  }, [list])

  // Countdown timer for progress bar
  useEffect(() => {
    if (items.length === 0) return

    const interval = setInterval(() => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.remainingSeconds <= 1) {
            // Force refresh on next poll
            return { ...item, remainingSeconds: 30 }
          }
          return { ...item, remainingSeconds: item.remainingSeconds - 1 }
        })
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [items.length])

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    toast.success('Verification code copied')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountName.trim() || !secret.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createAccount({
        sessionToken,
        accountName: accountName.trim(),
        secret: secret.trim(),
      })

      if (res && res.success === false) {
        toast.error(res.error || 'Failed to add account')
      } else {
        toast.success('2FA Account added successfully')
        setAccountName('')
        setSecret('')
        setIsAdding(false)
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the 2FA account for ${name}?`)) {
      return
    }

    try {
      await removeAccount({ sessionToken, id })
      toast.success('2FA Account removed')
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove account')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('dashboard')}
            className="p-2 rounded-xl bg-surface hover:bg-surface-variant text-muted-foreground hover:text-foreground transition-all duration-300 border border-outline/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              2FA Authenticator
            </h1>
            <p className="text-sm text-muted-foreground">Manage your dynamic two-factor verification codes</p>
          </div>
        </div>

        {!isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            className="rounded-xl flex items-center gap-1.5 shadow-md shadow-primary/10 hover:shadow-primary/25 transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Add Account Panel */}
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 p-6 rounded-2xl bg-surface/40 backdrop-blur-md border border-outline/10 shadow-lg"
          >
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-primary" />
              Add 2FA Account
            </h2>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Name</label>
                  <Input
                    placeholder="e.g. GitHub - user123"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Secret Key</label>
                  <Input
                    placeholder="Enter base32 secret key"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-xl font-mono uppercase tracking-wider"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAdding(false)}
                  disabled={isSubmitting}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl min-w-[120px]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save Account'
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main List */}
      {list === undefined ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading accounts...</p>
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-surface/20 border border-outline/10"
        >
          <ShieldCheck className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No accounts yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Add a 2FA account to generate dynamic verification codes here. We support standard TOTP secrets.
          </p>
          <Button
            onClick={() => setIsAdding(true)}
            variant="outline"
            className="rounded-xl mt-6 border-dashed"
          >
            Add your first account
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {items.map((item) => {
              const remainingPct = (item.remainingSeconds / 30) * 100
              const progressColor = item.remainingSeconds <= 5 ? 'bg-destructive' : 'bg-primary'
              
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative overflow-hidden p-5 rounded-2xl bg-surface/30 backdrop-blur-sm border border-outline/10 shadow-sm hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{item.accountName}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-2xl md:text-3xl font-mono font-bold tracking-widest text-primary tabular-nums">
                          {item.token.slice(0, 3)} {item.token.slice(3)}
                        </span>
                        <span className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full ${
                          item.remainingSeconds <= 5 
                            ? 'bg-destructive/10 text-destructive animate-pulse' 
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {item.remainingSeconds}s
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopy(item.id, item.token)}
                        className="p-2 rounded-xl hover:bg-surface-variant text-muted-foreground hover:text-primary transition-all duration-200"
                        title="Copy Verification Code"
                      >
                        {copiedId === item.id ? (
                          <CheckCheck className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.accountName)}
                        className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200"
                        title="Delete Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar at the bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-variant/20">
                    <div
                      className={`h-full transition-all duration-1000 ease-linear ${progressColor}`}
                      style={{ width: `${remainingPct}%` }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
