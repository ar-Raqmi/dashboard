import { useState, type FormEvent } from 'react';
import { type SettingsView } from '@/store';
import { Toggle, Row } from './fields';

const JAKIM_ZONE = /^[A-Z]{3}\d{2}$/;
export function PrayerGroup({ settings, onSave }: { settings: SettingsView; onSave: (patch: Partial<SettingsView>) => void }) {
  const [provider, setProvider] = useState(settings.hijriProvider === 'aladhan' ? 'aladhan' : 'jakim');
  const [zone, setZone] = useState(JAKIM_ZONE.test(settings.hijriCalendar) ? settings.hijriCalendar : 'SGR01');
  const [city, setCity] = useState(settings.aladhanCity), [country, setCountry] = useState(settings.aladhanCountry);
  const [offset, setOffset] = useState(settings.hijriOffset), [hijriVisible, setHijriVisible] = useState(settings.hijriVisible);
  function submit(e: FormEvent) {
    e.preventDefault();
    onSave(provider === 'jakim'
      ? { hijriProvider: 'jakim', hijriCalendar: zone.toUpperCase(), hijriOffset: offset, hijriVisible }
      : { hijriProvider: 'aladhan', aladhanCity: city.trim(), aladhanCountry: country.trim(), hijriOffset: offset, hijriVisible });
  }
  return <form className="settings-group" onSubmit={submit}><span className="eyebrow">PRAYER TIMES & HIJRI DATE</span>
    <div className="form-grid mt-4"><label className="form-label">Source<select value={provider} onChange={e => setProvider(e.target.value)}><option value="jakim">JAKIM e-Solat (Malaysia)</option><option value="aladhan">Aladhan (worldwide)</option></select></label>
      {provider === 'jakim'
        ? <label className="form-label">JAKIM zone <span>(e.g. WLY01, SGR01)</span><input required pattern="[A-Za-z]{3}[0-9]{2}" maxLength={5} value={zone} onChange={e => setZone(e.target.value)}/></label>
        : <label className="form-label">City<input required maxLength={100} value={city} onChange={e => setCity(e.target.value)}/></label>}
    </div>
    <div className="form-grid">{provider === 'aladhan' ? <label className="form-label">Country<input required maxLength={100} value={country} onChange={e => setCountry(e.target.value)}/></label> : <span/>}<label className="form-label">Hijri day adjustment<select value={offset} onChange={e => setOffset(Number(e.target.value))}>{[-3, -2, -1, 0, 1, 2, 3].map(n => <option key={n} value={n}>{n > 0 ? `+${n}` : n} day{Math.abs(n) === 1 ? '' : 's'}</option>)}</select></label></div>
    <Row title="Show Hijri date" hint="In the side rail and on the Spiritual page."><Toggle on={hijriVisible} label="Show Hijri date" onChange={setHijriVisible}/></Row>
    <div className="settings-data-actions"><button className="button primary" type="submit">Save prayer settings</button></div>
  </form>;
}
