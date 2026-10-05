import { useState } from 'react';
import { DATE_FORMAT_PRESETS, dateFormat } from '@/lib/dateFormat';
import { todayKey } from '@/lib/date';
import type { SettingsView } from '@/store';

const CUSTOM = 'custom';

export function DateFormatGroup({ settings, onSave }: { settings: SettingsView; onSave: (patch: Partial<SettingsView>) => void }) {
  const known = DATE_FORMAT_PRESETS.some(p => p.id === settings.dateFormat);
  const [choice, setChoice] = useState(known ? settings.dateFormat : CUSTOM);
  const [custom, setCustom] = useState(known ? 'dd/mm/yyyy' : settings.dateFormat);
  const today = todayKey();
  const pattern = choice === CUSTOM ? custom.trim() : choice;
  const valid = pattern === 'auto' || dateFormat.parse(dateFormat.format(today, pattern), pattern) === today;
  const preview = pattern === 'auto' ? 'Oct 6, as written in the app' : dateFormat.format(today, pattern);

  return <div className="settings-group"><span className="eyebrow">DATE FORMAT</span>
    <p className="settings-description">How dates are written in tasks, the calendar and date fields. Automatic uses the browser&rsquo;s own date boxes.</p>
    <div className="form-grid mt-4">
      <label className="form-label">Style<select value={choice} onChange={e => setChoice(e.target.value)}>
        {DATE_FORMAT_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}{p.id === 'auto' ? '' : ` (${dateFormat.format(today, p.id)})`}</option>)}
        <option value={CUSTOM}>Custom...</option>
      </select></label>
      {choice === CUSTOM
        ? <label className="form-label">Pattern <span>d, m, y; mmm = month name; eee = weekday</span><input maxLength={30} value={custom} aria-invalid={!valid || undefined} onChange={e => setCustom(e.target.value)}/></label>
        : <span className="form-label">Today looks like<span>{preview}</span></span>}
    </div>
    {choice === CUSTOM && <p className="settings-description">{valid ? <>Today looks like <strong>{preview}</strong>.</> : 'Use a day, a month and a year, for example dd/mm/yyyy or eee, d mmm yyyy.'}</p>}
    <div className="settings-data-actions"><button className="button primary" type="button" disabled={!valid || pattern === settings.dateFormat} onClick={() => onSave({ dateFormat: pattern })}>Save date format</button></div>
  </div>;
}
