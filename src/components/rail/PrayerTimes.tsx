'use client'

import Icon from '@/components/ui/Icon'
import { usePrayerTimes } from '@/hooks/usePrayerTimes'

export default function PrayerTimes({ expanded = false }: { expanded?: boolean }) {
  const p = usePrayerTimes()

  return (
    <section className={`prayer-section ${expanded ? 'expanded-prayer' : ''}`}>
      <div className="rail-section-heading">
        <h2>Prayer times</h2>
        <Icon name="moon" size={17} />
      </div>
      <div className="location-label">
        <Icon name="location" size={11} />
        {p.locationLabel}
        <span className="timezone-label">{p.zone}</span>
      </div>

      {p.status === 'loading' && <div className="rail-skeleton" aria-label="Loading prayer times"><i /><i /><i /><i /></div>}

      {p.status === 'error' && (
        <div className="rail-empty">
          <p>Couldn&apos;t load today&apos;s prayer times.</p>
          <button className="text-button" onClick={p.retry}><Icon name="refresh" size={13} />Try again</button>
        </div>
      )}

      {p.status === 'ready' && p.rows && p.next && (
        <>
          <div className="next-prayer">
            <div>
              <span className="eyebrow">NEXT PRAYER</span>
              <div className="prayer-name">
                {p.next.label}
                <span className="prayer-countdown">in {p.next.countdown}{p.next.tomorrow ? ' · tomorrow' : ''}</span>
              </div>
            </div>
            <div className="next-prayer-time">{p.next.clock}<span>{p.next.meridiem}</span></div>
          </div>
          <div className="prayer-progress" title={`${p.passedCount} of 5 prayer times passed`}>
            {p.rows.map((r) => <i key={r.key} className={r.state === 'passed' ? '' : 'future'} />)}
          </div>
          <div className="prayer-list">
            {p.rows.map((r) => (
              <div key={r.key} className={`prayer-row ${r.state === 'next' ? 'next' : ''} ${r.state === 'passed' ? 'passed' : ''}`}>
                <span>
                  {r.state === 'passed' ? <Icon name="check" size={12} /> : <i className={r.state === 'next' ? 'tiny-dot' : 'prayer-dot'} />}
                  <span>{r.label}</span>
                  {r.state === 'next' && <span className="next-label">NEXT</span>}
                </span>
                <time>{r.clock}<span>{r.meridiem}</span></time>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
