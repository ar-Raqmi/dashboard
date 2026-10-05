import { useState, type FormEvent } from 'react';
import type { SettingsView } from '@/store';
import { Row, Toggle } from './fields';
import { HIJRI_METHODS } from './prayerData';

const ADJUSTMENTS = [-3, -2, -1, 0, 1, 2, 3];

export function HijriGroup({ settings, onSave }: { settings: SettingsView; onSave: (patch: Partial<SettingsView>) => void }) {
  const [visible, setVisible] = useState(settings.hijriVisible);
  const [method, setMethod] = useState(settings.hijriMethod);
  const [rollover, setRollover] = useState(settings.hijriRollover);
  const [offset, setOffset] = useState(settings.hijriOffset);

  function submit(e: FormEvent) {
    e.preventDefault();
    onSave({ hijriVisible: visible, hijriMethod: method, hijriRollover: rollover, hijriOffset: offset });
  }

  return <form className="settings-group" onSubmit={submit}><span className="eyebrow">HIJRI DATE</span>
    <Row title="Show Hijri date" hint="In the side rail and on the Spiritual page."><Toggle on={visible} label="Show Hijri date" onChange={setVisible}/></Row>
    <div className="form-grid mt-4">
      <label className="form-label">Calendar<select value={method} onChange={e => setMethod(e.target.value as typeof method)}>{HIJRI_METHODS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
      <label className="form-label">The day changes<select value={rollover} onChange={e => setRollover(e.target.value as typeof rollover)}>
        <option value="midnight">At midnight</option><option value="maghrib">At Maghrib (sunset)</option>
      </select></label>
    </div>
    <div className="form-grid">
      <label className="form-label">Day adjustment<select value={offset} onChange={e => setOffset(Number(e.target.value))}>{ADJUSTMENTS.map(n => <option key={n} value={n}>{n > 0 ? `+${n}` : n} day{Math.abs(n) === 1 ? '' : 's'}</option>)}</select></label>
      <span className="form-label">&nbsp;<span>JAKIM follows Malaysia&rsquo;s moon sighting and uses the JAKIM zone above. The others are published calendars, and can differ by a day.</span></span>
    </div>
    <div className="settings-data-actions"><button className="button primary" type="submit">Save Hijri settings</button></div>
  </form>;
}
