'use client'

import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type ActivePage } from '@/lib/store'
import Header from '@/components/navigation/Header'
import TabBar from '@/components/navigation/TabBar'
import { DashboardGrid } from '@/components/dashboard/DashboardGrid'
import { DashboardManager } from '@/components/dashboard/DashboardManager'
import GlobalSearch from '@/components/search/GlobalSearch'
import TasksPage from '@/components/pages/TasksPage'
import CalendarPage from '@/components/pages/CalendarPage'
import NotesPage from '@/components/pages/NotesPage'
import FileManagerPage from '@/components/pages/FileManagerPage'
import SpiritualPage from '@/components/pages/SpiritualPage'
import GoalsPage from '@/components/pages/GoalsPage'
import SettingsPage from '@/components/pages/SettingsPage'
import DynamicHead from '@/components/DynamicHead'

const pageComponents: Record<ActivePage, React.ComponentType> = {
  dashboard: DashboardGrid,
  tasks: TasksPage,
  calendar: CalendarPage,
  notes: NotesPage,
  files: FileManagerPage,
  spiritual: SpiritualPage,
  goals: GoalsPage,
  settings: SettingsPage,
}

// Preset gradient definitions
const GRADIENT_MAP: Record<string, string> = {
  'citrus-dawn': 'linear-gradient(135deg, #A5D6A7 0%, #F48FB1 50%, #CE93D8 100%)',
  'citrus-breeze': 'linear-gradient(135deg, #80CBC4 0%, #A5D6A7 50%, #C5E1A5 100%)',
  'pink-sunset': 'linear-gradient(135deg, #F48FB1 0%, #CE93D8 50%, #9FA8DA 100%)',
  'ocean-mist': 'linear-gradient(135deg, #80DEEA 0%, #80CBC4 50%, #A5D6A7 100%)',
  'warm-sand': 'linear-gradient(135deg, #FFE082 0%, #FFCC80 50%, #F48FB1 100%)',
  'forest-dew': 'linear-gradient(135deg, #A5D6A7 0%, #66BB6A 50%, #26A69A 100%)',
  'lavender-dream': 'linear-gradient(135deg, #CE93D8 0%, #B39DDB 50%, #9FA8DA 100%)',
  'golden-hour': 'linear-gradient(135deg, #FFD54F 0%, #FFB74D 50%, #FF8A65 100%)',
}

export default function Home() {
  const activePage = useAppStore((s) => s.activePage)
  const setVerse = useAppStore((s) => s.setVerse)
  const setVerseLoading = useAppStore((s) => s.setVerseLoading)
  const setHadith = useAppStore((s) => s.setHadith)
  const setHadithLoading = useAppStore((s) => s.setHadithLoading)
  const background = useAppStore((s) => s.background)

  // Fetch spiritual data on mount
  useEffect(() => {
    const fetchSpiritual = async () => {
      setVerseLoading(true)
      setHadithLoading(true)
      try {
        const [verseRes, hadithRes] = await Promise.all([
          fetch('/api/verse'),
          fetch('/api/hadith'),
        ])
        if (verseRes.ok) {
          const verseData = await verseRes.json()
          setVerse(verseData)
        }
        if (hadithRes.ok) {
          const hadithData = await hadithRes.json()
          setHadith(hadithData)
        }
      } catch {
        // Silently fail - components show fallback
      } finally {
        setVerseLoading(false)
        setHadithLoading(false)
      }
    }
    fetchSpiritual()
  }, [setVerse, setVerseLoading, setHadith, setHadithLoading])

  const PageComponent = pageComponents[activePage]

  // Compute the background style for the decorative layer
  const bgStyle = useMemo(() => {
    if (background.type === 'default') return null
    const opacity = background.opacity / 100
    switch (background.type) {
      case 'color':
        return { backgroundColor: background.color, opacity }
      case 'gradient': {
        const gradient = GRADIENT_MAP[background.gradient] || background.gradient
        return { background: gradient, opacity }
      }
      case 'image':
        return {
          backgroundImage: `url(${background.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity,
        }
      default:
        return null
    }
  }, [background])

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      {/* Dynamic head updates (title, favicon, manifest) */}
      <DynamicHead />
      {/* Decorative Background Layer */}
      {bgStyle && (
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={bgStyle}
        />
      )}
      {/* Header */}
      <Header />

      {/* Tab Bar Navigation (below header) */}
      <div className="fixed top-16 left-0 right-0 z-40">
        <TabBar />
      </div>

      {/* Content Area */}
      <main className="flex-1 pt-[112px] overflow-y-auto relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            className={activePage === 'dashboard' ? 'p-4 md:p-6' : ''}
          >
            <PageComponent />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Dashboard Manager Sheet */}
      <DashboardManager />

      {/* Global Search Command Dialog */}
      <GlobalSearch />
    </div>
  )
}
