'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Share2, BookOpen, Star } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { VerseData, HadithData } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function SpiritualPage() {
  const {
    verse, setVerse, verseLoading, setVerseLoading,
    hadith, setHadith, hadithLoading, setHadithLoading,
  } = useAppStore()

  const fetchVerse = useCallback(async () => {
    setVerseLoading(true)
    try {
      const res = await fetch('/api/verse')
      const data: VerseData = await res.json()
      setVerse(data)
    } catch {
      setVerse(null)
    } finally {
      setVerseLoading(false)
    }
  }, [setVerse, setVerseLoading])

  const fetchHadith = useCallback(async () => {
    setHadithLoading(true)
    try {
      const res = await fetch('/api/hadith')
      const data: HadithData = await res.json()
      setHadith(data)
    } catch {
      setHadith(null)
    } finally {
      setHadithLoading(false)
    }
  }, [setHadith, setHadithLoading])

  useEffect(() => {
    if (!verse) fetchVerse()
    if (!hadith) fetchHadith()
  }, [])

  const handleShare = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(text)
    }
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Daily Verse */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-2 rounded-2xl bg-[oklch(0.72_0.19_142_/_0.15)]">
          <BookOpen className="size-6 text-[oklch(0.72_0.19_142)]" />
        </div>
        <h1 className="text-2xl font-bold">Spiritual</h1>
      </motion.div>

      {/* Verse Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl bg-[oklch(0.17_0.008_155)] border border-[oklch(0.28_0.01_155)] p-6 md:p-8 relative overflow-hidden"
      >
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[oklch(0.72_0.19_142_/_0.05)] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[oklch(0.8_0.08_350_/_0.05)] rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <Star className="size-5 text-[oklch(0.72_0.19_142)]" />
            <h2 className="text-lg font-semibold text-[oklch(0.72_0.19_142)]">Daily Verse</h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-xl text-[oklch(0.75_0.01_155)] hover:text-[oklch(0.72_0.19_142)] hover:bg-[oklch(0.72_0.19_142_/_0.1)]"
              onClick={fetchVerse}
              disabled={verseLoading}
            >
              <RefreshCw className={`size-4 ${verseLoading ? 'animate-spin' : ''}`} />
            </Button>
            {verse && (
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl text-[oklch(0.75_0.01_155)] hover:text-[oklch(0.72_0.19_142)] hover:bg-[oklch(0.72_0.19_142_/_0.1)]"
                onClick={() => handleShare(`${verse.arabic}\n\n${verse.translation}\n\n${verse.reference}`)}
              >
                <Share2 className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {verseLoading ? (
            <motion.div key="loading" {...fadeInUp} className="flex flex-col gap-4">
              <Skeleton className="h-24 w-full rounded-2xl bg-[oklch(0.22_0.008_155)]" />
              <Skeleton className="h-4 w-3/4 rounded-xl bg-[oklch(0.22_0.008_155)]" />
              <Skeleton className="h-4 w-1/3 rounded-xl bg-[oklch(0.22_0.008_155)]" />
            </motion.div>
          ) : verse ? (
            <motion.div key={verse.reference} {...fadeInUp} className="flex flex-col gap-4 relative z-10">
              <p className="arabic-text text-2xl md:text-3xl text-[oklch(0.96_0.005_155)] leading-loose">
                {verse.arabic}
              </p>
              <p className="text-base text-[oklch(0.85_0.005_155)] italic leading-relaxed">
                &ldquo;{verse.translation}&rdquo;
              </p>
              <p className="text-sm font-medium text-[oklch(0.72_0.19_142)]">
                — {verse.reference}
              </p>
            </motion.div>
          ) : (
            <motion.div key="error" {...fadeInUp} className="text-center py-4">
              <p className="text-[oklch(0.65_0.01_155)]">Failed to load verse. Try refreshing.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Hadith Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-3xl bg-[oklch(0.17_0.008_155)] border border-[oklch(0.28_0.01_155)] p-6 md:p-8 relative overflow-hidden"
      >
        {/* Decorative */}
        <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-[oklch(0.8_0.08_350_/_0.3)]" />
        <div className="absolute top-4 left-8 w-1.5 h-1.5 rounded-full bg-[oklch(0.72_0.19_142_/_0.3)]" />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-[oklch(0.8_0.08_350)]" />
            <h2 className="text-lg font-semibold text-[oklch(0.8_0.08_350)]">Daily Hadith</h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-xl text-[oklch(0.75_0.01_155)] hover:text-[oklch(0.8_0.08_350)] hover:bg-[oklch(0.8_0.08_350_/_0.1)]"
              onClick={fetchHadith}
              disabled={hadithLoading}
            >
              <RefreshCw className={`size-4 ${hadithLoading ? 'animate-spin' : ''}`} />
            </Button>
            {hadith && (
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl text-[oklch(0.75_0.01_155)] hover:text-[oklch(0.8_0.08_350)] hover:bg-[oklch(0.8_0.08_350_/_0.1)]"
                onClick={() => handleShare(`${hadith.arabic}\n\n${hadith.translation}\n\nNarrated by: ${hadith.narrator}\nSource: ${hadith.source}\nGrade: ${hadith.grade}`)}
              >
                <Share2 className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {hadithLoading ? (
            <motion.div key="loading" {...fadeInUp} className="flex flex-col gap-4">
              <Skeleton className="h-20 w-full rounded-2xl bg-[oklch(0.22_0.008_155)]" />
              <Skeleton className="h-4 w-3/4 rounded-xl bg-[oklch(0.22_0.008_155)]" />
              <Skeleton className="h-4 w-1/2 rounded-xl bg-[oklch(0.22_0.008_155)]" />
            </motion.div>
          ) : hadith ? (
            <motion.div key={hadith.source} {...fadeInUp} className="flex flex-col gap-4">
              <p className="arabic-text text-xl md:text-2xl text-[oklch(0.96_0.005_155)] leading-loose">
                {hadith.arabic}
              </p>
              <p className="text-base text-[oklch(0.85_0.005_155)] italic leading-relaxed">
                &ldquo;{hadith.translation}&rdquo;
              </p>
              <div className="flex flex-col gap-2 mt-2 p-3 rounded-2xl bg-[oklch(0.22_0.008_155)]">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[oklch(0.65_0.01_155)]">Narrated by:</span>
                  <span className="text-sm text-[oklch(0.96_0.005_155)]">{hadith.narrator}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[oklch(0.65_0.01_155)]">Source:</span>
                  <span className="text-sm text-[oklch(0.96_0.005_155)]">{hadith.source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[oklch(0.65_0.01_155)]">Grade:</span>
                  <span className={`text-sm font-medium ${
                    hadith.grade === 'Sahih'
                      ? 'text-[oklch(0.72_0.19_142)]'
                      : hadith.grade === 'Hasan'
                      ? 'text-[oklch(0.8_0.12_80)]'
                      : 'text-[oklch(0.8_0.08_350)]'
                  }`}>
                    {hadith.grade}
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="error" {...fadeInUp} className="text-center py-4">
              <p className="text-[oklch(0.65_0.01_155)]">Failed to load hadith. Try refreshing.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
