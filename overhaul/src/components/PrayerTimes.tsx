import { useEffect, useState } from 'react';
import { useStore, type PrayerDay, type SettingsView } from '../store';
import { Icon } from './Icon';

const PRAYERS = [['Fajr', 'fajr'], ['Dhuhr', 'dhuhr'], ['Asr', 'asr'], ['Maghrib', 'maghrib'], ['Isha', 'isha']] as const;

/** Minutes since midnight in the given zone. */
function minutesIn(zone: string, at: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(at);
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value || 0);
  return get('hour') * 60 + get('minute');
}
const toMinutes = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const split12 = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return [`${h % 12 || 12}:${String(m).padStart(2, '0')}`, h < 12 ? 'AM' : 'PM'] as const; };
function zoneAbbr(zone: string) {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'short' }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || zone;
  } catch { return zone; }
}

/** "22 Rabi al-Thani 1448 AH", with the user's day offset applied. */
export function hijriLabel(prayer: PrayerDay | null | undefined, settings: SettingsView | null) {
  if (!prayer?.hijri || settings?.hijriVisible === false) return null;
  const day = Math.min(30, Math.max(1, prayer.hijri.day + (settings?.hijriOffset ?? 0)));
  return `${day} ${prayer.hijri.month} ${prayer.hijri.year} AH`;
}

export function PrayerTimes({ expanded = false }: { expanded?: boolean }) {
  const prayer = useStore(s => s.prayer);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(timer); }, []);

  const heading = <div className="rail-section-heading"><h2>Prayer times</h2><Icon name="moon" size={17}/></div>;
  if (prayer === undefined) return <section className={`prayer-section ${expanded ? 'expanded-prayer' : ''}`}>{heading}<p className="muted-note">Loading today's times...</p></section>;
  if (!prayer) return <section className={`prayer-section ${expanded ? 'expanded-prayer' : ''}`}>{heading}<p className="muted-note">Prayer times are unavailable right now. Check the location in Settings.</p></section>;

  const current = minutesIn(prayer.timezone, now);
  const passed = PRAYERS.filter(([, key]) => toMinutes(prayer.times[key]) <= current).length;
  const nextIndex = passed % PRAYERS.length, tomorrow = passed === PRAYERS.length;
  const [nextName, nextKey] = PRAYERS[nextIndex];
  const until = (toMinutes(prayer.times[nextKey]) - current + (tomorrow ? 1440 : 0) + 1440) % 1440;
  const [nextTime, nextMeridiem] = split12(prayer.times[nextKey]);
  const abbr = zoneAbbr(prayer.timezone);

  return <section className={`prayer-section ${expanded ? 'expanded-prayer' : ''}`}>{heading}
    <div className="location-label"><Icon name="location" size={11}/>{prayer.location}<span className="timezone-label">{abbr}</span></div>
    <div className="next-prayer"><div><span className="eyebrow">{tomorrow ? 'NEXT PRAYER, TOMORROW' : 'NEXT PRAYER'}</span><div className="prayer-name">{nextName}<span className="prayer-countdown">in {until >= 60 ? `${Math.floor(until / 60)}h ` : ''}{until % 60}m</span></div></div><div className="next-prayer-time">{nextTime}<span>{nextMeridiem}</span></div></div>
    <div className="prayer-progress" title={`${Math.min(passed, 5)} of 5 prayer times passed today`}>{PRAYERS.map(([name], i) => <i key={name} className={i < passed ? '' : 'future'}/>)}</div>
    <div className="prayer-list">{PRAYERS.map(([name, key], index) => {
      const [time, meridiem] = split12(prayer.times[key]);
      const isNext = !tomorrow && index === nextIndex, isPassed = index < passed;
      return <div className={`prayer-row ${isNext ? 'next' : ''} ${isPassed ? 'passed' : ''}`} key={name} title={`${name} at ${time} ${meridiem} ${abbr}`}><span>{isPassed ? <Icon name="check" size={12}/> : <i className={isNext ? 'tiny-dot' : 'prayer-dot'}/>}<span>{name}</span>{isNext && <span className="next-label">NEXT</span>}</span><time>{time}<span>{meridiem}</span></time></div>;
    })}</div>
    <div className="prayer-disclaimer"><Icon name="info" size={10}/>Source: {prayer.source}{prayer.times.syuruk ? ` · Syuruk ${split12(prayer.times.syuruk).join(' ')}` : ''}</div>
  </section>;
}
