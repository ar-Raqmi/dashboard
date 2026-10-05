import { useStore } from '@/store';
import { Icon } from '@/components/Icon';
import { hijriLabel, PrayerTimes } from '@/features/spiritual/PrayerTimes';
import { Verse } from '@/features/spiritual/Verse';
import { WorldClocks } from '@/features/spiritual/WorldClocks';

export function SpiritualPage({ onManageClocks }: { onManageClocks: () => void }) {
  const prayer = useStore(s => s.prayer), settings = useStore(s => s.settings), hadith = useStore(s => s.hadith);
  const hijri = hijriLabel(prayer, settings);
  return <div className="spiritual-view">
    <div className="spiritual-date"><Icon name="moon" size={21}/><span>{hijri || new Date().toLocaleDateString('en-US', { weekday: 'long' })}<small>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</small></span></div>
    <PrayerTimes expanded/>
    <Verse full/>
    {hadith && <section className="daily-verse full-verse"><div className="verse-label"><Icon name="book" size={15}/><span>Hadith of the day</span></div><blockquote>{hadith.translation}</blockquote><a href={hadith.url} target="_blank" rel="noreferrer">{hadith.source}<Icon name="upRight" size={12}/></a></section>}
    <WorldClocks onManage={onManageClocks}/>
  </div>;
}
