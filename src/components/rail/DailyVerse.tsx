'use client'

import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/lib/store'
import { useDailyContentSync } from '@/hooks/useDailyContent'

/** Today's verse. `full` shows the Arabic text and surah reference (Spiritual page). */
export default function DailyVerse({ full = false }: { full?: boolean }) {
  const verse = useAppStore((s) => s.verse)
  const loading = useAppStore((s) => s.verseLoading)
  const sync = useDailyContentSync()

  return (
    <section className={`daily-verse ${full ? 'full-verse' : ''}`}>
      <div className="verse-label">
        <Icon name="book" size={15} />
        <span>A moment of reflection</span>
        <button className="icon-button compact verse-refresh" aria-label="Fetch a new verse" title="Refresh verse" onClick={() => void sync('verse')} disabled={loading}>
          <Icon name="refresh" size={13} className={loading ? 'spin' : ''} />
        </button>
      </div>
      {!verse ? (
        <p className="rail-empty-note">{loading ? 'Loading today’s verse…' : 'Couldn’t load today’s verse.'}</p>
      ) : (
        <>
          {full && <p className="verse-arabic" lang="ar" dir="rtl">{verse.arabic}</p>}
          <blockquote>{verse.translation}</blockquote>
          <a href={`https://quran.com/${verse.surahNumber}/${verse.ayah}`} target="_blank" rel="noreferrer">
            {verse.surah}, {verse.surahNumber}:{verse.ayah}
            <Icon name="upRight" size={12} />
          </a>
        </>
      )}
    </section>
  )
}
