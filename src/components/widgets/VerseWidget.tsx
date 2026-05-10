'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, RefreshCw } from 'lucide-react'
import { useAction } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { useAppStore } from '@/lib/store'

export default function VerseWidget() {
  const { verse, setVerse, verseDate, setVerseDate, verseLoading, setVerseLoading } = useAppStore()
  const [error, setError] = useState<string | null>(null)
  const getVerseAction = useAction(api.content.getDailyVerseAction)

  // Helper to get local date string
  const localDateStr = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const fetchVerse = async () => {
    setVerseLoading(true)
    setError(null)
    try {
      const data = await getVerseAction({})
      if (data) {
        setVerse(data)
        setVerseDate(localDateStr(new Date()))
      } else {
        throw new Error('No data received')
      }
    } catch {
      setError('Could not load verse')
    } finally {
      setVerseLoading(false)
    }
  }

  useEffect(() => {
    const today = localDateStr(new Date())
    if (!verse || verseDate !== today) {
      fetchVerse()
    }
  }, []) // Run once on mount

  // Also check when user returns to the tab (e.g., after a new day)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const today = localDateStr(new Date())
        if (verseDate !== today) {
          fetchVerse()
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [verseDate, fetchVerse])

  // Loading skeleton
  if (verseLoading && !verse) {
    return (
      <div className="flex flex-col h-full justify-center items-center gap-3 p-4">
        <div className="w-full h-6 bg-[oklch(0.2_0.01_155)] rounded-xl animate-pulse" />
        <div className="w-3/4 h-4 bg-[oklch(0.2_0.01_155)] rounded-xl animate-pulse" />
        <div className="w-1/2 h-4 bg-[oklch(0.2_0.01_155)] rounded-xl animate-pulse" />
        <div className="w-1/3 h-3 bg-[oklch(0.2_0.01_155)] rounded-xl animate-pulse mt-2" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col h-full relative overflow-hidden rounded-3xl"
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-br from-[oklch(0.72_0.19_142)/30] via-transparent to-[oklch(0.8_0.08_350)/20] pointer-events-none" />

      <div className="relative flex flex-col h-full p-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[oklch(0.72_0.19_142)]" />
<span className="text-[10px] uppercase tracking-wider text-[oklch(0.5_0.01_155)] font-semibold">
               Verse
             </span>
          </div>
          <button
            onClick={fetchVerse}
            disabled={verseLoading}
            className="w-6 h-6 rounded-lg hover:bg-[oklch(0.2_0.01_155)] flex items-center justify-center transition-colors"
          >
            <RefreshCw
              className={`w-3 h-3 text-[oklch(0.5_0.01_155)] ${
                verseLoading ? 'animate-spin' : ''
              }`}
            />
          </button>
        </div>

        {verse && (
          <>
            {/* Arabic Text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-3 w-full"
              dir="rtl"
            >
              <p className="arabic-text text-lg leading-loose text-right">
                {verse.arabic}
              </p>
            </motion.div>

            {/* Translation */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex-1"
            >
              <p className="text-xs text-[oklch(0.7_0.01_155)] leading-relaxed italic">
                &ldquo;{verse.translation}&rdquo;
              </p>
            </motion.div>

            {/* Reference */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="mt-3 pt-2 border-t border-[oklch(0.25_0.01_155)]"
            >
              <p className="text-[10px] text-[oklch(0.72_0.19_142)] font-semibold text-center">
                {verse.reference}
              </p>
            </motion.div>
          </>
        )}

        {error && !verse && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-[oklch(0.8_0.08_350)]">{error}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
