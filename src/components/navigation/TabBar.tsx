'use client'

import { useRef, useEffect, useState } from 'react'
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
  ChevronLeft,
  ChevronRight,
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

export default function TabBar() {
  const activePage = useAppStore((s) => s.activePage)
  const setActivePage = useAppStore((s) => s.setActivePage)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  useEffect(() => {
    const id = requestAnimationFrame(checkScroll)
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      cancelAnimationFrame(id)
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [])

  const scrollBy = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' })
  }

  return (
    <nav
      className="relative flex items-center border-b border-border bg-background/80 backdrop-blur-xl"
      aria-label="Main navigation"
    >
      {/* Left scroll indicator */}
      {canScrollLeft && (
        <button
          onClick={() => scrollBy(-1)}
          className="absolute left-0 z-10 w-8 h-full flex items-center justify-center
            bg-gradient-to-r from-background/95 to-transparent"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      {/* Scrollable tab bar */}
      <div
        ref={scrollRef}
        className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {navItems.map((item) => {
          const isActive = activePage === item.id
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`
                relative flex items-center gap-1.5 px-3 py-2 rounded-2xl
                text-sm font-medium whitespace-nowrap transition-colors shrink-0
                ${isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-2xl bg-primary/10 border border-primary/20"
                  transition={{
                    type: 'spring',
                    stiffness: 350,
                    damping: 30,
                  }}
                />
              )}
              <Icon className="relative z-10 w-4 h-4" />
              <span className="relative z-10">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Right scroll indicator */}
      {canScrollRight && (
        <button
          onClick={() => scrollBy(1)}
          className="absolute right-0 z-10 w-8 h-full flex items-center justify-center
            bg-gradient-to-l from-background/95 to-transparent"
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </nav>
  )
}
