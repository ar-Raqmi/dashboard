import { useStore } from '@/store';
import { Icon } from '@/components/Icon';

export function Verse({ full = false }: { full?: boolean }) {
  const verse = useStore(s => s.verse);
  return <section className={`daily-verse ${full ? 'full-verse' : ''}`}><div className="verse-label"><Icon name="book" size={15}/><span>A moment of reflection</span></div>
    {verse === undefined ? <blockquote>Loading today's verse...</blockquote> : !verse ? <blockquote>Today's verse could not be loaded. Try refreshing in a moment.</blockquote> : <>
      {full && <blockquote className="verse-arabic" dir="rtl" lang="ar">{verse.arabic}</blockquote>}
      <blockquote>{verse.translation}</blockquote>
      <a href={verse.url} target="_blank" rel="noreferrer">{verse.reference}<Icon name="upRight" size={12}/></a>
    </>}
  </section>;
}

/** The day's verse as a wider anchor on the overview; same data and markup as the rail widget. */
export function OverviewVerse() {
  const verse = useStore(s => s.verse);
  return <section className="daily-verse overview-verse" aria-label="Daily verse"><div className="verse-label"><Icon name="book" size={15}/><span>A moment of reflection</span></div>
    {verse === undefined ? <blockquote>Loading today's verse...</blockquote> : !verse ? <blockquote>Today's verse could not be loaded. Try refreshing in a moment.</blockquote> : <>
      <blockquote className="verse-arabic" dir="rtl" lang="ar">{verse.arabic}</blockquote>
      <blockquote>{verse.translation}</blockquote>
      <a href={verse.url} target="_blank" rel="noreferrer">{verse.reference}<span>Read on quran.com</span><Icon name="upRight" size={12}/></a>
    </>}
  </section>;
}
