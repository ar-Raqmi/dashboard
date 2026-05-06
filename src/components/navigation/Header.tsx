'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, LayoutGrid } from 'lucide-react'
import { useAppStore } from '@/lib/store'

function formatTimeInZone(timezone: string): string {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    })
    return formatter.format(now)
  } catch {
    // Fallback if timezone is invalid
    const now = new Date()
    const h = String(now.getUTCHours()).padStart(2, '0')
    const m = String(now.getUTCMinutes()).padStart(2, '0')
    const s = String(now.getUTCSeconds()).padStart(2, '0')
    return `${h}:${m}:${s} UTC`
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
  const timezone = useAppStore((s) => s.timezone)
  const profilePicture = useAppStore((s) => s.profilePicture)
  const profileName = useAppStore((s) => s.profileName)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const showDashboardManager = useAppStore((s) => s.showDashboardManager)
  const setShowDashboardManager = useAppStore((s) => s.setShowDashboardManager)

  const [tick, setTick] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)

  const updateTime = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [updateTime])

  // Suppress unused variable warning - tick drives re-renders
  void tick
  const time = formatTimeInZone(timezone)

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
      className="fixed top-0 left-0 right-0 z-50 h-16
        bg-[oklch(0.13_0.005_155)]/80 backdrop-blur-xl
        border-b border-white/[0.06]
        flex items-center justify-between px-4 md:px-6"
    >
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-2xl bg-[oklch(0.72_0.19_142)]/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {appLogo ? (
            <img
              src={appLogo}
              alt={`${appTitle} logo`}
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <img
              src="/logo.svg"
              alt={`${appTitle} logo`}
              className="w-5 h-5"
              onError={(e) => {
                // Fallback: hide broken image, show text
                const target = e.currentTarget as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  parent.innerHTML = `<span class="text-[oklch(0.72_0.19_142)] font-bold text-sm">R</span>`
                }
              }}
            />
          )}
        </div>
        <h1 className="text-white/90 font-semibold text-sm md:text-base truncate">
          {appTitle}
        </h1>
      </div>

      {/* Center: GMT Clock */}
      <div className="hidden sm:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
          <span className="text-[oklch(0.72_0.19_142)] text-xs font-medium tracking-wide">
            {time}
          </span>
        </div>
      </div>

      {/* Right: Actions + Avatar */}
      <div className="flex items-center gap-2">
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
            bg-white/[0.04] border border-white/[0.06]
            text-white/60 hover:text-white/90 hover:bg-white/[0.08]
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
                ? 'bg-[oklch(0.72_0.19_142)]/15 border-[oklch(0.72_0.19_142)]/30 text-[oklch(0.72_0.19_142)]'
                : 'bg-white/[0.04] border-white/[0.06] text-white/60 hover:text-white/90 hover:bg-white/[0.08]'
            }`}
          aria-label="Toggle dashboard manager"
        >
          <LayoutGrid className="h-4 w-4" />
        </motion.button>

        {/* Profile Avatar */}
        <div className="w-9 h-9 rounded-2xl overflow-hidden flex items-center justify-center bg-[oklch(0.8_0.08_350)]/20 border border-[oklch(0.8_0.08_350)]/30 flex-shrink-0">
          {profilePicture ? (
            <img
              src={profilePicture}
              alt={profileName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[oklch(0.8_0.08_350)] text-xs font-semibold">
              {getInitials(profileName)}
            </span>
          )}
        </div>
      </div>

      {/* Mobile Clock (shown below header on small screens) */}
      <div className="sm:hidden absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
        <div className="flex items-center gap-2 px-3 py-1 rounded-2xl bg-[oklch(0.13_0.005_155)]/90 backdrop-blur-xl border border-white/[0.06]">
          <span className="text-[oklch(0.72_0.19_142)] text-[10px] font-medium tracking-wide">
            {time}
          </span>
        </div>
      </div>
    </motion.header>
  )
}
