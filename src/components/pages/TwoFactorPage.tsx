'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, 
  Trash2, 
  Plus, 
  Key, 
  Copy, 
  CheckCheck, 
  Loader2, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  ChevronDown, 
  ChevronRight, 
  AlertCircle,
  Briefcase,
  Users,
  Wallet,
  Gamepad2,
  Tag
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery, useMutation } from '@/hooks/useCloudflareConvex'
import { api } from '@/lib/convex-client'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const PRESET_CATEGORIES = ['Work', 'Social', 'Finance', 'Gaming', 'Other']

const CATEGORY_ICONS: { [key: string]: React.ReactNode } = {
  Work: <Briefcase className="w-4 h-4" />,
  Social: <Users className="w-4 h-4" />,
  Finance: <Wallet className="w-4 h-4" />,
  Gaming: <Gamepad2 className="w-4 h-4" />,
  Other: <Tag className="w-4 h-4" />
}

const CATEGORY_THEMES: { [key: string]: { border: string; text: string; bg: string; activeBg: string } } = {
  Work: {
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    bg: 'bg-blue-500/5',
    activeBg: 'bg-blue-500/20 border-blue-500/50'
  },
  Social: {
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    bg: 'bg-purple-500/5',
    activeBg: 'bg-purple-500/20 border-purple-500/50'
  },
  Finance: {
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/5',
    activeBg: 'bg-emerald-500/20 border-emerald-500/50'
  },
  Gaming: {
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    bg: 'bg-rose-500/5',
    activeBg: 'bg-rose-500/20 border-rose-500/50'
  },
  Other: {
    border: 'border-zinc-500/20',
    text: 'text-zinc-400',
    bg: 'bg-zinc-500/5',
    activeBg: 'bg-zinc-500/20 border-zinc-500/50'
  }
}

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
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All')
  const [groupByCategory, setGroupByCategory] = useState(true)
  const [collapsedCategories, setCollapsedCategories] = useState<{ [key: string]: boolean }>({})
  
  // Add Account Form
  const [accountName, setAccountName] = useState('')
  const [secret, setSecret] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Work')
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
        category: selectedCategory,
      })

      if (res && res.success === false) {
        toast.error(res.error || 'Failed to add account')
      } else {
        toast.success('2FA Account added successfully')
        setAccountName('')
        setSecret('')
        setSelectedCategory('Work')
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

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  // Filter Items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategoryFilter === 'All' || item.category === selectedCategoryFilter
    return matchesSearch && matchesCategory
  })

  // Grouped Items Map
  const groupedItems = filteredItems.reduce((acc: { [key: string]: any[] }, item) => {
    const cat = item.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  const getCategoryCount = (cat: string) => {
    if (cat === 'All') return items.length
    return items.filter(item => item.category === cat).length
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            2FA Authenticator
          </h1>
          <p className="text-sm text-muted-foreground">Manage and group your dynamic two-factor verification codes</p>
        </div>

        {!isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            className="rounded-xl flex items-center gap-1.5 shadow-md shadow-primary/10 hover:shadow-primary/25 transition-all duration-300 self-start md:self-auto"
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
            <form onSubmit={handleAddAccount} className="space-y-5">
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

              {/* Category selector pills */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Category / Group</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_CATEGORIES.map((cat) => {
                    const theme = CATEGORY_THEMES[cat]
                    const isSelected = selectedCategory === cat
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200 ${
                          isSelected 
                            ? theme.activeBg + ' scale-105 shadow-sm' 
                            : 'border-outline/10 text-muted-foreground hover:bg-surface-variant/30'
                        }`}
                      >
                        {CATEGORY_ICONS[cat]}
                        {cat}
                      </button>
                    )
                  })}
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

      {list !== undefined && items.length > 0 && (
        <div className="space-y-5 mb-6">
          {/* Controls: Search, Filters, Grouping toggle */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 rounded-xl bg-surface/20 border-outline/10 focus:border-primary/50 transition-all duration-300 w-full"
              />
            </div>

            {/* Layout Toggles */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <span className="text-xs text-muted-foreground mr-1">Layout:</span>
              <button
                onClick={() => setGroupByCategory(false)}
                className={`p-2 rounded-xl border transition-all ${
                  !groupByCategory 
                    ? 'bg-primary/10 border-primary/30 text-primary' 
                    : 'border-outline/10 text-muted-foreground hover:bg-surface-variant/30'
                }`}
                title="Plain list view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGroupByCategory(true)}
                className={`p-2 rounded-xl border transition-all ${
                  groupByCategory 
                    ? 'bg-primary/10 border-primary/30 text-primary' 
                    : 'border-outline/10 text-muted-foreground hover:bg-surface-variant/30'
                }`}
                title="Group by category"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Pills Filters */}
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-outline/5 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setSelectedCategoryFilter('All')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                selectedCategoryFilter === 'All'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'border-outline/10 text-muted-foreground hover:bg-surface-variant/30'
              }`}
            >
              All
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                selectedCategoryFilter === 'All' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-surface-variant/50 text-muted-foreground'
              }`}>
                {getCategoryCount('All')}
              </span>
            </button>
            
            {PRESET_CATEGORIES.map((cat) => {
              const count = getCategoryCount(cat)
              if (count === 0 && selectedCategoryFilter !== cat) return null // Hide empty categories in filter unless selected
              
              const isSelected = selectedCategoryFilter === cat
              const theme = CATEGORY_THEMES[cat]
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    isSelected
                      ? theme.activeBg + ' shadow-sm'
                      : 'border-outline/10 text-muted-foreground hover:bg-surface-variant/30'
                  }`}
                >
                  {CATEGORY_ICONS[cat]}
                  {cat}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-foreground/10 text-foreground' : 'bg-surface-variant/50 text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

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
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-surface/10 border border-outline/5">
          <Search className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <h3 className="text-md font-semibold text-foreground">No results found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            We couldn't find any accounts matching "{searchQuery}"
          </p>
        </div>
      ) : groupByCategory ? (
        /* Grouped Category rendering */
        <div className="space-y-8">
          {Object.keys(groupedItems).map((cat) => {
            const catItems = groupedItems[cat]
            const isCollapsed = collapsedCategories[cat]
            const theme = CATEGORY_THEMES[cat] || CATEGORY_THEMES.Other

            return (
              <div key={cat} className="space-y-4">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategoryCollapse(cat)}
                  className="flex items-center justify-between w-full p-2.5 rounded-xl bg-surface/20 border border-outline/5 hover:bg-surface/30 hover:border-outline/10 transition-all text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg border ${theme.border} ${theme.bg} ${theme.text}`}>
                      {CATEGORY_ICONS[cat] || CATEGORY_ICONS.Other}
                    </div>
                    <span className="font-semibold text-foreground text-sm">{cat}</span>
                    <span className="text-[10px] font-semibold bg-surface-variant/50 text-muted-foreground px-2 py-0.5 rounded-full">
                      {catItems.length}
                    </span>
                  </div>
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {/* Collapsible card grid */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {catItems.map((item) => (
                          <AccountCard
                            key={item.id}
                            item={item}
                            copiedId={copiedId}
                            handleCopy={handleCopy}
                            handleDelete={handleDelete}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      ) : (
        /* Flat plain list rendering */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredItems.map((item) => (
              <AccountCard
                key={item.id}
                item={item}
                copiedId={copiedId}
                handleCopy={handleCopy}
                handleDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

function AccountCard({ 
  item, 
  copiedId, 
  handleCopy, 
  handleDelete 
}: { 
  item: any
  copiedId: string | null
  handleCopy: (id: string, token: string) => void
  handleDelete: (id: string, name: string) => void 
}) {
  const remainingPct = (item.remainingSeconds / 30) * 100
  const progressColor = item.remainingSeconds <= 5 ? 'bg-destructive' : 'bg-primary'
  const theme = CATEGORY_THEMES[item.category] || CATEGORY_THEMES.Other

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative overflow-hidden p-5 rounded-2xl bg-surface/30 backdrop-blur-sm border border-outline/10 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-semibold ${theme.border} ${theme.bg} ${theme.text}`}>
              {CATEGORY_ICONS[item.category] || CATEGORY_ICONS.Other}
              {item.category || 'Other'}
            </span>
          </div>
          <h3 className="font-semibold text-foreground text-sm md:text-base truncate" title={item.accountName}>
            {item.accountName}
          </h3>
        </div>

        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
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

      <div className="flex items-end justify-between">
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

      {/* Progress bar at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-variant/20">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${progressColor}`}
          style={{ width: `${remainingPct}%` }}
        />
      </div>
    </motion.div>
  )
}
