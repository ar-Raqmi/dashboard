import { useEffect, useMemo, useState } from 'react';
import { AUTO_TIMEZONE, timeZone } from '@/lib/timezone';
import type { SettingsView } from '@/store';

const zoneName = (zone: string) => zone.replaceAll('_', ' ');

export function TimeZoneGroup({ settings, onSave }: { settings: SettingsView; onSave: (patch: Partial<SettingsView>) => void }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 15_000); return () => clearInterval(timer); }, []);

  const zones = useMemo(() => {
    try { return Intl.supportedValuesOf('timeZone'); } catch { return [timeZone.device]; }
  }, []);
  const chosen = settings.timezone;
  const effective = chosen === AUTO_TIMEZONE ? timeZone.device : chosen;
  const clock = timeZone.format(now, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return <div className="settings-group"><span className="eyebrow">TIME ZONE</span>
    <p className="settings-description">Sets what &ldquo;today&rdquo; means for tasks, the calendar, daily verses and prayer countdowns. Leave it on your device and it follows you when you travel.</p>
    <div className="form-grid mt-4">
      <label className="form-label">Time zone
        <select value={chosen} onChange={e => onSave({ timezone: e.target.value })}>
          <option value={AUTO_TIMEZONE}>Follow this device ({zoneName(timeZone.device)}, {timeZone.offsetLabel(timeZone.device, now)})</option>
          {zones.map(zone => <option key={zone} value={zone}>{zoneName(zone)} ({timeZone.offsetLabel(zone, now)})</option>)}
        </select>
      </label>
      <span className="form-label">Right now<span>{clock} &middot; {zoneName(effective)}</span></span>
    </div>
  </div>;
}
