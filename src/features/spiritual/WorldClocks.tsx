import { useEffect, useState } from 'react';
import { timeZone } from '@/lib/timezone';
import { useStore } from '@/store';

export function WorldClocks({ onManage }: { onManage?: () => void }) {
  const clocks = useStore(s => s.clocks);
  const showSeconds = useStore(s => s.settings?.showSeconds ?? true);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
  useStore(s => s.settings?.timezone); // re-render when the active time zone changes
  const local = timeZone.active;
  const rows: [string, string][] = [['Local time', local], ...clocks.map(c => [c.label, c.timezone] as [string, string])];
  return <section className="world-clocks"><div className="section-heading"><h2>World clock</h2><span className="live-label"><i className="tiny-dot"/>LIVE</span></div>
    {rows.map(([city, zone], i) => <div key={`${zone}-${i}`}><span>{city}<small>{timeZone.abbreviation(zone, now)}</small></span><time>{now.toLocaleTimeString('en-US', { timeZone: zone, hour: '2-digit', minute: '2-digit', hour12: false })}{showSeconds && <small>{now.toLocaleTimeString('en-US', { timeZone: zone, second: '2-digit' }).padStart(2, '0')}</small>}</time></div>)}
    <p className="view-footnote">{clocks.length ? 'Live time.' : 'Live time. Add cities in Settings.'}{onManage && <> <button className="text-button" style={{ display: 'inline-flex' }} onClick={onManage}>Manage clocks</button></>}</p>
  </section>;
}
