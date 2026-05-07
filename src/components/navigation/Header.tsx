'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, LayoutGrid, Sun, Moon, MoonStar } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAppStore } from '@/lib/store'

// ===== Hijri Date helper (same logic as DashboardGrid) =====
function getHijriDate(offset: number): { day: number; month: string; year: number; monthAr: string } | null {
  try {
    const now = new Date()
    now.setDate(now.getDate() + offset)

    const hijriFmt = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const hijriFmtAr = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const parts = hijriFmt.formatToParts(now)
    const arParts = hijriFmtAr.formatToParts(now)

    const day = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10)
    const month = parts.find(p => p.type === 'month')?.value || ''
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10)
    const monthAr = arParts.find(p => p.type === 'month')?.value || ''

    return { day, month, year, monthAr }
  } catch {
    return null
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function Header() {
  const appLogo = useAppStore((s) => s.appLogo)
  const appTitle = useAppStore((s) => s.appTitle)
  const profilePicture = useAppStore((s) => s.profilePicture)
  const profileName = useAppStore((s) => s.profileName)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const showDashboardManager = useAppStore((s) => s.showDashboardManager)
  const setShowDashboardManager = useAppStore((s) => s.setShowDashboardManager)
  const hijriVisible = useAppStore((s) => s.hijriVisible)
  const hijriOffset = useAppStore((s) => s.hijriOffset)

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [tick, setTick] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const updateTime = useCallback(() => setTick((t) => t + 1), [])

  // Set mounted on next tick to avoid hydration mismatch
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    const interval = setInterval(updateTime, 60000) // Update every minute for date changes
    return () => {
      cancelAnimationFrame(id)
      clearInterval(interval)
    }
  }, [updateTime])

  // Suppress unused variable warning - tick drives re-renders for date change
  void tick

  // Compute dates (client-only)
  const hijri = mounted && hijriVisible ? getHijriDate(hijriOffset) : null
  const gregorian = mounted
    ? new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : ''

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
      className="fixed top-0 left-0 right-0 z-50 h-16
        bg-background/80 backdrop-blur-xl
        border-b border-border
        flex items-center justify-between px-4 md:px-6"
    >
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {appLogo && !logoError ? (
            <img
              src={appLogo}
              alt={`${appTitle} logo`}
              className="w-full h-full object-cover rounded-2xl"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <img
                src="/logo.svg"
                alt={`${appTitle} logo`}
                className="w-5 h-5"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement
                  target.style.display = 'none'
                  setLogoError(true)
                }}
                style={{ display: logoError ? 'none' : 'block' }}
              />
              {logoError && (
                <span className="text-primary font-bold text-sm">
                  {getInitials(appTitle || 'R')}
                </span>
              )}
            </div>
          )}
        </div>
        <h1 className="text-foreground font-semibold text-sm md:text-base truncate">
          {appTitle}
        </h1>
      </div>

      {/* Center: Dual Date (Hijri + Gregorian) */}
      <div className="hidden sm:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-muted border border-border">
          {hijri && (
            <>
              <MoonStar className="size-3 text-primary shrink-0" />
              <span className="text-primary text-xs font-medium tracking-wide">
                {hijri.day} {hijri.month} {hijri.year} AH
              </span>
              <span className="text-muted-foreground/50 mx-1">·</span>
            </>
          )}
          <span className="text-xs text-muted-foreground font-medium">
            {gregorian}
          </span>
        </div>
      </div>

      {/* Right: Actions + Avatar */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-9 h-9 rounded-2xl flex items-center justify-center
            bg-muted border border-border
            text-muted-foreground hover:text-foreground hover:bg-accent
            transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {mounted && (theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          ))}
        </motion.button>

        {/* Search Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setSearchOpen(!searchOpen)
            if (searchOpen) {
              setSearchQuery('')
            }
          }}
          className="w-9 h-9 rounded-2xl flex items-center justify-center
            bg-muted border border-border
            text-muted-foreground hover:text-foreground hover:bg-accent
            transition-colors"
          aria-label={searchOpen ? 'Close search' : 'Open search'}
        >
          <Search className="h-4 w-4" />
        </motion.button>

        {/* Dashboard Manager Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowDashboardManager(!showDashboardManager)}
          className={`w-9 h-9 rounded-2xl flex items-center justify-center
            border transition-colors
            ${
              showDashboardManager
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          aria-label="Toggle dashboard manager"
        >
          <LayoutGrid className="h-4 w-4" />
        </motion.button>

        {/* Profile Avatar */}
        <div className="w-9 h-9 rounded-2xl overflow-hidden flex items-center justify-center bg-secondary/20 border border-secondary/30 flex-shrink-0">
          {profilePicture ? (
            <img
              src={profilePicture}
              alt={profileName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-secondary-foreground text-xs font-semibold">
              {getInitials(profileName)}
            </span>
          )}
        </div>
      </div>

      {/* Mobile Date Chip (shown below header on small screens) */}
      <div className="sm:hidden absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-background/90 backdrop-blur-xl border border-border">
          {hijri && (
            <>
              <MoonStar className="size-2.5 text-primary shrink-0" />
              <span className="text-primary text-[10px] font-medium">
                {hijri.day} {hijri.monthAr}
              </span>
              <span className="text-muted-foreground/50 mx-0.5">·</span>
            </>
          )}
          <span className="text-[10px] text-muted-foreground font-medium">
            {gregorian}
          </span>
        </div>
      </div>
    </motion.header>
  )
}
