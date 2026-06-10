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
  Briefcase,
  Users,
  Wallet,
  Gamepad2,
  Tag,
  Edit2,
  X
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery, useMutation } from '@/hooks/useCloudflareConvex'
import { api } from '@/lib/convex-client'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const PRESET_CATEGORIES = ['Work', 'Social', 'Finance', 'Gaming', 'Other']

// Helper icons mapping
const CATEGORY_LUCIDE_ICONS: { [key: string]: React.ReactNode } = {
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

// Popular Google Material Symbols Library
const POPULAR_MATERIAL_ICONS = [
  'security', 'key', 'lock', 'fingerprint', 'shield', 
  'person', 'group', 'forum', 'share', 'public',
  'work', 'business_center', 'assignment', 'event', 'analytics',
  'payments', 'account_balance', 'shopping_cart', 'monetization_on', 'trending_up',
  'sports_esports', 'videogame_asset', 'games',
  'cloud', 'dns', 'terminal', 'code', 'smartphone', 'computer',
  'home', 'school', 'star', 'favorite', 'lightbulb',
  'mail', 'chat', 'call', 'notifications', 'settings',
  'folder', 'description', 'image', 'play_circle', 'link'
]

export default function TwoFactorPage() {
  const { sessionToken } = useAuth()
  const setActivePage = useAppStore((s) => s.setActivePage)
  
  // Dynamic CSS Injector for Material Symbols Outlined Font
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }, [])

  // Queries & Mutations
  const list = useQuery(api.twoFactor.list, sessionToken ? { sessionToken } : 'skip')
  const createAccount = useMutation(api.twoFactor.create)
  const updateAccount = useMutation(api.twoFactor.update)
  const removeAccount = useMutation(api.twoFactor.remove)

  // Local State
  const [items, setItems] = useState<any[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All')
  
  // Add Account Form
  const [accountName, setAccountName] = useState('')
  const [secret, setSecret] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Work')
  const [selectedIcon, setSelectedIcon] = useState('security')
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [iconSearchText, setIconSearchText] = useState('')

  // Edit Account Form
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [editName, setEditName] = useState('')
  const [editSecret, setEditSecret] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [editIconSearchText, setEditIconSearchText] = useState('')

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
        category: selectedCategory.trim(),
        icon: selectedIcon,
      })

      if (res && res.success === false) {
        toast.error(res.error || 'Failed to add account')
      } else {
        toast.success('2FA Account added successfully')
        setAccountName('')
        setSecret('')
        setSelectedCategory('Work')
        setSelectedIcon('security')
        setIsAdding(false)
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem || !editName.trim()) {
      toast.error('Account Name is required')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await updateAccount({
        sessionToken,
        id: editingItem.id,
        accountName: editName.trim(),
        category: editCategory.trim(),
        icon: editIcon || null,
        secret: editSecret.trim() || undefined
      })

      if (res && res.success === false) {
        toast.error(res.error || 'Failed to update account')
      } else {
        toast.success('2FA Account updated successfully')
        setEditingItem(null)
        setEditSecret('')
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

  const renderIcon = (iconName: string | undefined, defaultCategory: string) => {
    if (iconName) {
      return (
        <span 
          className="material-symbols-outlined select-none leading-none shrink-0"
          style={{
            fontSize: '16px',
            width: '16px',
            height: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20"
          }}
        >
          {iconName}
        </span>
      )
    }
    return CATEGORY_LUCIDE_ICONS[defaultCategory] || <Tag className="w-4 h-4" />
  }

  // Filter lists of Material Symbols based on user typing
  const filteredPopularIcons = POPULAR_MATERIAL_ICONS.filter(name => 
    name.toLowerCase().includes(iconSearchText.toLowerCase())
  )

  const filteredEditPopularIcons = POPULAR_MATERIAL_ICONS.filter(name => 
    name.toLowerCase().includes(editIconSearchText.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            2FA Authenticator
          </h1>
          <p className="text-sm text-muted-foreground">Manage, search and customize your dynamic two-factor verification codes</p>
        </div>

        {!isAdding && !editingItem && (
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
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                Add 2FA Account
              </h2>
              <button onClick={() => setIsAdding(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
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

              {/* Group text input / Preset selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Group Name (Custom Category)</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Type custom group name e.g. AWS Keys"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="rounded-xl flex-1"
                  />
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-muted-foreground mr-1">Presets:</span>
                    {PRESET_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium transition-all ${
                          selectedCategory === cat 
                            ? 'bg-primary/25 border-primary text-primary' 
                            : 'border-outline/10 text-muted-foreground hover:bg-surface-variant/30'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Icon Picker (Emoji style) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Choose Icon</label>
                <div className="border border-outline/10 rounded-xl p-3 bg-surface-variant/10 space-y-3">
                  <div className="flex items-center justify-between gap-3 border-b border-outline/5 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">Selected:</span>
                      <span className="material-symbols-outlined text-primary bg-primary/10 border border-primary/20 p-1 rounded-lg text-lg select-none">
                        {selectedIcon}
                      </span>
                      <span className="text-xs text-foreground font-mono">{selectedIcon}</span>
                    </div>
                    {/* Icon Search */}
                    <div className="relative max-w-[150px]">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        placeholder="Search icon..."
                        value={iconSearchText}
                        onChange={(e) => setIconSearchText(e.target.value)}
                        className="pl-7 pr-2 py-0.5 text-xs rounded-lg bg-surface/20 border border-outline/10 focus:border-primary/50 focus:outline-none w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5 max-h-[120px] overflow-y-auto custom-scrollbar p-1">
                    {filteredPopularIcons.map((iconName) => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setSelectedIcon(iconName)}
                        className={`p-1.5 rounded-lg border transition-all text-center flex items-center justify-center hover:bg-surface-variant/50 ${
                          selectedIcon === iconName 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : 'border-outline/5 text-foreground/80'
                        }`}
                        title={iconName}
                      >
                        <span className="material-symbols-outlined text-[20px] select-none">{iconName}</span>
                      </button>
                    ))}
                    {filteredPopularIcons.length === 0 && (
                      <div className="col-span-full py-2 text-center text-xs text-muted-foreground">
                        No matching icons. Type name below manually.
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-muted-foreground">Or type Material Icon Name:</span>
                    <input
                      placeholder="e.g. key"
                      value={selectedIcon}
                      onChange={(e) => setSelectedIcon(e.target.value.toLowerCase().trim())}
                      className="px-2 py-0.5 text-xs rounded-lg bg-surface/20 border border-outline/10 focus:border-primary/50 focus:outline-none font-mono"
                    />
                  </div>
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

      <AnimatePresence mode="wait">
        {/* Edit Account Panel */}
        {editingItem && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 p-6 rounded-2xl bg-surface/40 backdrop-blur-md border border-outline/15 shadow-lg"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-primary" />
                Edit Account Settings
              </h2>
              <button onClick={() => setEditingItem(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditAccount} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Name</label>
                  <Input
                    placeholder="e.g. GitHub - user123"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    New Secret Key <span className="text-[10px] lowercase text-muted-foreground">(optional - leave blank to keep existing)</span>
                  </label>
                  <Input
                    placeholder="••••••••••••••••"
                    value={editSecret}
                    onChange={(e) => setEditSecret(e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-xl font-mono uppercase tracking-wider"
                  />
                </div>
              </div>

              {/* Group category input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Group Name (Custom Category)</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Type custom group name"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="rounded-xl flex-1"
                  />
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {PRESET_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setEditCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium transition-all ${
                          editCategory === cat 
                            ? 'bg-primary/25 border-primary text-primary' 
                            : 'border-outline/10 text-muted-foreground hover:bg-surface-variant/30'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Icon Picker for Edit */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Choose Icon</label>
                <div className="border border-outline/10 rounded-xl p-3 bg-surface-variant/10 space-y-3">
                  <div className="flex items-center justify-between gap-3 border-b border-outline/5 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">Selected:</span>
                      {editIcon ? (
                        <span className="material-symbols-outlined text-primary bg-primary/10 border border-primary/20 p-1 rounded-lg text-lg select-none">
                          {editIcon}
                        </span>
                      ) : (
                        <span className="p-1 rounded-lg bg-surface-variant border border-outline/10 text-xs text-muted-foreground select-none">
                          None
                        </span>
                      )}
                      <span className="text-xs text-foreground font-mono">{editIcon || 'None'}</span>
                    </div>
                    {/* Icon Search */}
                    <div className="relative max-w-[150px]">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        placeholder="Search icon..."
                        value={editIconSearchText}
                        onChange={(e) => setEditIconSearchText(e.target.value)}
                        className="pl-7 pr-2 py-0.5 text-xs rounded-lg bg-surface/20 border border-outline/10 focus:border-primary/50 focus:outline-none w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5 max-h-[120px] overflow-y-auto custom-scrollbar p-1">
                    <button
                      type="button"
                      onClick={() => setEditIcon('')}
                      className={`p-1.5 rounded-lg border text-xs text-muted-foreground hover:bg-surface-variant/50 transition-all ${
                        editIcon === '' ? 'bg-primary/20 border-primary text-primary' : 'border-outline/5'
                      }`}
                    >
                      None
                    </button>
                    {filteredEditPopularIcons.map((iconName) => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setEditIcon(iconName)}
                        className={`p-1.5 rounded-lg border transition-all text-center flex items-center justify-center hover:bg-surface-variant/50 ${
                          editIcon === iconName 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : 'border-outline/5 text-foreground/80'
                        }`}
                        title={iconName}
                      >
                        <span className="material-symbols-outlined text-[20px] select-none">{iconName}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-muted-foreground">Or type Material Icon Name:</span>
                    <input
                      placeholder="e.g. key"
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value.toLowerCase().trim())}
                      className="px-2 py-0.5 text-xs rounded-lg bg-surface/20 border border-outline/10 focus:border-primary/50 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingItem(null)}
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
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {list !== undefined && items.length > 0 && (
        <div className="space-y-5 mb-6">
          {/* Search Input */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts or groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 rounded-xl bg-surface/20 border-outline/10 focus:border-primary/50 transition-all duration-300 w-full"
            />
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
            
            {Array.from(new Set(items.map(i => i.category || 'Other'))).map((cat) => {
              const count = getCategoryCount(cat)
              if (count === 0 && selectedCategoryFilter !== cat) return null
              
              const isSelected = selectedCategoryFilter === cat
              const theme = CATEGORY_THEMES[cat] || CATEGORY_THEMES.Other
              
              // Find an icon for this category
              const matchingItem = items.find(i => i.category === cat && i.icon)
              const iconElement = matchingItem ? renderIcon(matchingItem.icon, cat) : renderIcon(undefined, cat)
              
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
                  {iconElement}
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
      ) : (
        /* Cards — flat grid, category pills above handle filtering */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredItems.map((item) => (
              <AccountCard
                key={item.id}
                item={item}
                copiedId={copiedId}
                handleCopy={handleCopy}
                handleEdit={handleOpenEdit}
                handleDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )

  function handleOpenEdit(item: any) {
    setEditingItem(item)
    setEditName(item.accountName)
    setEditSecret('')
    setEditCategory(item.category || 'Other')
    setEditIcon(item.icon || '')
    setEditIconSearchText('')
    setIsAdding(false) // Close add panel if open
  }
}

function AccountCard({ 
  item, 
  copiedId, 
  handleCopy, 
  handleEdit,
  handleDelete 
}: { 
  item: any
  copiedId: string | null
  handleCopy: (id: string, token: string) => void
  handleEdit: (item: any) => void
  handleDelete: (id: string, name: string) => void 
}) {
  const remainingPct = (item.remainingSeconds / 30) * 100
  const progressColor = item.remainingSeconds <= 5 ? 'bg-destructive' : 'bg-primary'
  const theme = CATEGORY_THEMES[item.category] || CATEGORY_THEMES.Other

  const renderIcon = (iconName: string | undefined, defaultCategory: string) => {
    if (iconName) {
      return (
        <span 
          className="material-symbols-outlined select-none leading-none shrink-0"
          style={{
            fontSize: '14px',
            width: '14px',
            height: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20"
          }}
        >
          {iconName}
        </span>
      )
    }
    return CATEGORY_LUCIDE_ICONS[defaultCategory] || <Tag className="w-3.5 h-3.5" />
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative overflow-hidden p-5 rounded-2xl bg-surface/30 backdrop-blur-sm border border-outline/10 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-semibold ${theme.border} ${theme.bg} ${theme.text}`}>
              {renderIcon(item.icon, item.category)}
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
            className="p-1.5 rounded-xl hover:bg-surface-variant text-muted-foreground hover:text-primary transition-all duration-200"
            title="Copy Verification Code"
          >
            {copiedId === item.id ? (
              <CheckCheck className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => handleEdit(item)}
            className="p-1.5 rounded-xl hover:bg-surface-variant text-muted-foreground hover:text-primary transition-all duration-200"
            title="Edit Settings"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(item.id, item.accountName)}
            className="p-1.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200"
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
