'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type ActivePage } from '@/lib/store'
import Header from '@/components/navigation/Header'
import NavigationRail from '@/components/navigation/NavigationRail'
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

export default function Home() {
  const activePage = useAppStore((s) => s.activePage)
  const setVerse = useAppStore((s) => s.setVerse)
  const setVerseLoading = useAppStore((s) => s.setVerseLoading)
  const setHadith = useAppStore((s) => s.setHadith)
  const setHadithLoading = useAppStore((s) => s.setHadithLoading)

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <Header />

      {/* Main Layout */}
      <div className="flex flex-1 pt-16">
        {/* Navigation Rail (desktop only) */}
        <NavigationRail />

        {/* Content Area */}
        <main className="flex-1 md:ml-[84px] pb-20 md:pb-4 overflow-y-auto">
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
      </div>

      {/* Dashboard Manager Sheet */}
      <DashboardManager />

      {/* Global Search Command Dialog */}
      <GlobalSearch />
    </div>
  )
}
