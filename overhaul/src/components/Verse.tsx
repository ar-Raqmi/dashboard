import { useStore } from '../store';
import { Icon } from './Icon';

export function Verse({ full = false }: { full?: boolean }) {
  const verse = useStore(s => s.verse);
  return <section className={`daily-verse ${full ? 'full-verse' : ''}`}><div className="verse-label"><Icon name="book" size={15}/><span>A moment of reflection</span></div>
    {verse === undefined ? <blockquote>Loading today's verse...</blockquote> : !verse ? <blockquote>Today's verse could not be loaded. Try refreshing in a moment.</blockquote> : <>
      {full && <blockquote dir="rtl" lang="ar" style={{ fontFamily: 'serif', fontSize: '1.35em', lineHeight: 2 }}>{verse.arabic}</blockquote>}
      <blockquote>{verse.translation}</blockquote>
      <a href={verse.url} target="_blank" rel="noreferrer">{verse.reference}<Icon name="upRight" size={12}/></a>
    </>}
  </section>;
}
