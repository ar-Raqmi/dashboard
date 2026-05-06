'use client'

import { motion } from 'framer-motion'
import {
  Home,
  CheckCircle,
  Calendar,
  StickyNote,
  Folder,
  BookOpen,
  Flag,
  Settings,
} from 'lucide-react'
import { useAppStore, type ActivePage } from '@/lib/store'

interface NavItem {
  id: ActivePage
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'tasks', label: 'Tasks', icon: CheckCircle },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'files', label: 'Files', icon: Folder },
  { id: 'spiritual', label: 'Spiritual', icon: BookOpen },
  { id: 'goals', label: 'Goals', icon: Flag },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function NavigationRail() {
  const activePage = useAppStore((s) => s.activePage)
  const setActivePage = useAppStore((s) => s.setActivePage)

  return (
    <>
      {/* Desktop: Vertical Navigation Rail */}
      <nav
        className="hidden md:flex fixed left-3 top-20 bottom-3 z-40 w-[72px] flex-col items-center gap-1 rounded-3xl py-4 px-1.5
          bg-[oklch(0.13_0.005_155)]/80 backdrop-blur-xl border border-white/[0.06]"
        aria-label="Main navigation"
      >
        {navItems.map((item) => {
          const isActive = activePage === item.id
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className="relative flex flex-col items-center justify-center gap-0.5 w-full py-2 rounded-2xl transition-colors group"
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill-desktop"
                  className="absolute inset-x-1.5 inset-y-0.5 rounded-2xl bg-[oklch(0.72_0.19_142)]/15"
                  transition={{
                    type: 'spring',
                    stiffness: 350,
                    damping: 30,
                  }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center w-10 h-10 rounded-2xl">
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive
                      ? 'text-[oklch(0.72_0.19_142)]'
                      : 'text-white/50 group-hover:text-white/80'
                  }`}
                />
              </span>
              <span
                className={`relative z-10 text-[10px] font-medium leading-tight transition-colors ${
                  isActive
                    ? 'text-[oklch(0.72_0.19_142)]'
                    : 'text-white/40 group-hover:text-white/70'
                }`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Mobile: Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16
          bg-[oklch(0.13_0.005_155)]/90 backdrop-blur-xl border-t border-white/[0.06]
          flex items-center justify-around px-2"
        aria-label="Main navigation"
      >
        {navItems.slice(0, 5).map((item) => {
          const isActive = activePage === item.id
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className="relative flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[44px] rounded-2xl transition-colors"
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill-mobile"
                  className="absolute inset-x-0.5 -inset-y-0.5 rounded-2xl bg-[oklch(0.72_0.19_142)]/15"
                  transition={{
                    type: 'spring',
                    stiffness: 350,
                    damping: 30,
                  }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center w-10 h-7">
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive
                      ? 'text-[oklch(0.72_0.19_142)]'
                      : 'text-white/50'
                  }`}
                />
              </span>
              <span
                className={`relative z-10 text-[10px] font-medium leading-tight transition-colors ${
                  isActive
                    ? 'text-[oklch(0.72_0.19_142)]'
                    : 'text-white/40'
                }`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
