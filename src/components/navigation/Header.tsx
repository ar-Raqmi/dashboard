'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, LayoutGrid, Sun, Moon, MoonStar } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAppStore } from '@/lib/store'
import { toHijri } from 'hijri-converter'

const ISLAMIC_MONTHS_EN = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
]

const ISLAMIC_MONTHS_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الثانية', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
]

// ===== Hijri Date helper using hijri-converter =====
function getHijriDate(offset: number): { day: number; month: string; year: number; monthAr: string } | null {
  try {
    const now = new Date()
    now.setDate(now.getDate() + offset)

    const hijri = toHijri(now.getFullYear(), now.getMonth() + 1, now.getDate())

    return {
      day: hijri.hd,
      month: ISLAMIC_MONTHS_EN[hijri.hm - 1],
      year: hijri.hy,
      monthAr: ISLAMIC_MONTHS_AR[hijri.hm - 1]
    }
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
  const searchOpen = useAppStore((s) => s.searchOpen)
  const setSearchOpen = useAppStore((s) => s.setSearchOpen)
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
        <div key={appLogo} className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
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
                src="/logo.png"
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
        <div className="flex flex-col min-w-0">
          <h1 className="text-foreground font-semibold text-sm md:text-base truncate leading-none">
            {appTitle}
          </h1>
          {profileName && (
            <span className="text-muted-foreground text-[10px] md:text-xs truncate mt-0.5 leading-tight">
              {profileName}
            </span>
          )}
        </div>
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
            ${showDashboardManager
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          aria-label="Toggle dashboard manager"
        >
          <LayoutGrid className="h-4 w-4" />
        </motion.button>

        {/* Profile Avatar Disable for a while*/}
        {/* <div className="w-9 h-9 rounded-2xl overflow-hidden flex items-center justify-center bg-secondary/20 border border-secondary/30 flex-shrink-0">
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
        </div> */}
      </div>

      {/* Mobile Date Bar (shown below header on small screens) */}
      <div className="sm:hidden absolute top-full left-0 right-0 flex justify-center py-2 bg-background/50 backdrop-blur-md">
        <MobileDateDisplay />
      </div>
    </motion.header>
  )
}

function MobileDateDisplay() {
  const [showHijri, setShowHijri] = useState(true)
  const hijriVisible = useAppStore((s) => s.hijriVisible)
  const hijriOffset = useAppStore((s) => s.hijriOffset)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const hijri = mounted && hijriVisible ? getHijriDate(hijriOffset) : null
  const gregorian = mounted
    ? new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : ''

  if (!mounted) return null

  return (
    <button
      onClick={() => setShowHijri(!showHijri)}
      className="flex items-center justify-center gap-2 px-6 py-1.5 rounded-full bg-background border border-border/50 text-[11px] font-medium w-[90%] shadow-sm text-primary"
    >
      <MoonStar className="size-3 shrink-0" />
      <span>
        {showHijri && hijri
          ? `${hijri.day} ${hijri.month} ${hijri.year} AH`
          : gregorian
        }
      </span>
    </button>
  )
}
