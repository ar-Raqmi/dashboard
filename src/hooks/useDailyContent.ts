'use client'

import { useCallback, useEffect } from 'react'
import { useAction } from '@/hooks/useApi'
import { api } from '@/lib/api-client'
import { getGMT8DateStr, useAppStore } from '@/lib/store'

/** Fetches verse/hadith into the store. Pass 'verse' or 'hadith' to replace today's entry. No effects. */
export function useDailyContentSync() {
  const getVerse = useAction(api.content.getDailyVerseAction)
  const getHadith = useAction(api.content.getDailyHadithAction)

  const sync = useCallback(
    async (force: false | 'verse' | 'hadith' = false) => {
      const state = useAppStore.getState()
      const today = getGMT8DateStr()
      const needsVerse = force === 'verse' || !state.verse || state.verseDate !== today
      const needsHadith = force === 'hadith' || !state.hadith || state.hadithDate !== today
      if (!needsVerse && !needsHadith) return

      if (needsVerse) state.setVerseLoading(true)
      if (needsHadith) state.setHadithLoading(true)

      const [verse, hadith] = await Promise.all([
        needsVerse ? getVerse({}).catch(() => null) : null,
        needsHadith ? getHadith({}).catch(() => null) : null,
      ])
      const s = useAppStore.getState()
      if (verse) {
        s.setVerse(verse)
        s.setVerseDate(today)
      }
      if (hadith) {
        s.setHadith(hadith)
        s.setHadithDate(today)
      }
      s.setVerseLoading(false)
      s.setHadithLoading(false)
    },
    [getVerse, getHadith],
  )
  return sync
}

/**
 * Keeps today's verse and hadith in the store. Mount once (AppShell); it refetches when the
 * GMT+8 day rolls over, including when the tab regains focus after midnight.
 */
export function useDailyContent() {
  const sync = useDailyContentSync()

  useEffect(() => {
    void sync()
    const onVisible = () => {
      if (!document.hidden) void sync()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [sync])
}
