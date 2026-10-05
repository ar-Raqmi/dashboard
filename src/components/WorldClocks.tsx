import { useEffect, useState } from 'react';
import { useStore } from '../store';

function zoneAbbr(zone: string, at: Date) {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'short' }).formatToParts(at).find(p => p.type === 'timeZoneName')?.value || '';
  } catch { return ''; }
}

export function WorldClocks({ onManage }: { onManage?: () => void }) {
  const clocks = useStore(s => s.clocks);
  const showSeconds = useStore(s => s.settings?.showSeconds ?? true);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const rows: [string, string][] = [['Local time', local], ...clocks.map(c => [c.label, c.timezone] as [string, string])];
  return <section className="world-clocks"><div className="section-heading"><h2>World clock</h2><span className="live-label"><i className="tiny-dot"/>LIVE</span></div>
    {rows.map(([city, zone], i) => <div key={`${zone}-${i}`}><span>{city}<small>{zoneAbbr(zone, now)}</small></span><time>{now.toLocaleTimeString('en-US', { timeZone: zone, hour: '2-digit', minute: '2-digit', hour12: false })}{showSeconds && <small>{now.toLocaleTimeString('en-US', { timeZone: zone, second: '2-digit' }).padStart(2, '0')}</small>}</time></div>)}
    <p className="view-footnote">{clocks.length ? 'Live device time.' : 'Live device time. Add cities in Settings.'}{onManage && <> <button className="text-button" style={{ display: 'inline-flex' }} onClick={onManage}>Manage clocks</button></>}</p>
  </section>;
}
