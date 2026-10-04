'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { DataSync } from '@/components/DataSync'
import { useAppStore, type ActivePage } from '@/lib/store'
import AppShell from '@/components/app/AppShell'
import LoginPage from '@/components/pages/LoginPage'
import Overview from '@/components/overview/Overview'
import TasksPage from '@/components/pages/TasksPage'
import CalendarPage from '@/components/pages/CalendarPage'
import NotesPage from '@/components/pages/NotesPage'
import FileManagerPage from '@/components/pages/FileManagerPage'
import SpiritualPage from '@/components/pages/SpiritualPage'
import GoalsPage from '@/components/pages/GoalsPage'
import SettingsPage from '@/components/pages/SettingsPage'
import TwoFactorPage from '@/components/pages/TwoFactorPage'
import { Loader2 } from 'lucide-react'

const PAGES: Record<ActivePage, React.ComponentType> = {
  dashboard: Overview,
  tasks: TasksPage,
  calendar: CalendarPage,
  notes: NotesPage,
  files: FileManagerPage,
  spiritual: SpiritualPage,
  goals: GoalsPage,
  settings: SettingsPage,
  twoFactor: TwoFactorPage,
}

export default function Home() {
  const { user, loading } = useAuth()
  const page = useAppStore((s) => s.activePage)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return <LoginPage />

  const Page = PAGES[page]

  return (
    <DataSync>
      <AppShell>
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
          >
            <Page />
          </motion.div>
        </AnimatePresence>
      </AppShell>
    </DataSync>
  )
}