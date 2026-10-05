import { useState, type FormEvent } from 'react';
import { Icon } from '@/components/Icon';
import type { SettingsView } from '@/store';
import { JAKIM_ZONES_BY_STATE, PRAYER_METHODS, PRAYER_SCHOOLS } from './prayerData';

const COORDINATE_DECIMALS = 4;

export function PrayerGroup({ settings, notify, onSave }: { settings: SettingsView; notify: (message: string) => void; onSave: (patch: Partial<SettingsView>) => void }) {
  const [provider, setProvider] = useState(settings.prayerProvider);
  const [zone, setZone] = useState(settings.jakimZone);
  const [place, setPlace] = useState(settings.prayerPlace);
  const [city, setCity] = useState(settings.aladhanCity), [country, setCountry] = useState(settings.aladhanCountry);
  const [latitude, setLatitude] = useState(settings.prayerLatitude?.toString() ?? ''), [longitude, setLongitude] = useState(settings.prayerLongitude?.toString() ?? '');
  const [placeName, setPlaceName] = useState(settings.prayerPlaceName);
  const [method, setMethod] = useState(settings.prayerMethod), [school, setSchool] = useState(settings.prayerSchool);
  const [locating, setLocating] = useState(false);

  function useMyLocation() {
    if (!navigator.geolocation) return notify('This browser cannot share your location.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLatitude(coords.latitude.toFixed(COORDINATE_DECIMALS));
        setLongitude(coords.longitude.toFixed(COORDINATE_DECIMALS));
        setPlaceName(name => name || 'My location');
        setPlace('coords');
        setLocating(false);
      },
      err => { setLocating(false); notify(err.code === err.PERMISSION_DENIED ? 'Location permission was denied.' : 'Could not get your location.'); },
      { timeout: 15_000 },
    );
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (provider === 'jakim') return onSave({ prayerProvider: 'jakim', jakimZone: zone });
    onSave({
      prayerProvider: 'aladhan', prayerPlace: place, prayerMethod: method, prayerSchool: school,
      ...(place === 'city'
        ? { aladhanCity: city.trim(), aladhanCountry: country.trim() }
        : { prayerLatitude: Number(latitude), prayerLongitude: Number(longitude), prayerPlaceName: placeName.trim() }),
    });
  }

  return <form className="settings-group" onSubmit={submit}><span className="eyebrow">PRAYER TIMES</span>
    <p className="settings-description">Where prayer times are read or calculated. Change it when you travel; the countdown follows the place you pick.</p>
    <div className="form-grid mt-4">
      <label className="form-label">Source<select value={provider} onChange={e => setProvider(e.target.value as typeof provider)}>
        <option value="jakim">JAKIM e-Solat (Malaysia, official)</option><option value="aladhan">Aladhan (worldwide)</option>
      </select></label>
      {provider === 'jakim'
        ? <label className="form-label">JAKIM zone<select value={zone} onChange={e => setZone(e.target.value)}>
          {JAKIM_ZONES_BY_STATE.map(([state, zones]) => <optgroup key={state} label={state}>{zones.map(z => <option key={z.code} value={z.code}>{z.code} · {z.districts}</option>)}</optgroup>)}
        </select></label>
        : <label className="form-label">Location by<select value={place} onChange={e => setPlace(e.target.value as typeof place)}>
          <option value="city">City and country</option><option value="coords">Coordinates (GPS)</option>
        </select></label>}
    </div>
    {provider === 'aladhan' && place === 'city' && <>
      <div className="form-grid">
        <label className="form-label">City<input required maxLength={100} value={city} onChange={e => setCity(e.target.value)}/></label>
        <label className="form-label">Country<input required maxLength={100} value={country} onChange={e => setCountry(e.target.value)}/></label>
      </div>
      <p className="settings-description">Aladhan guesses when it does not know a city, so check the time zone shown with the times, or use coordinates.</p>
    </>}
    {provider === 'aladhan' && place === 'coords' && <>
      <div className="form-grid">
        <label className="form-label">Latitude<input required type="number" step="any" min={-90} max={90} value={latitude} onChange={e => setLatitude(e.target.value)}/></label>
        <label className="form-label">Longitude<input required type="number" step="any" min={-180} max={180} value={longitude} onChange={e => setLongitude(e.target.value)}/></label>
      </div>
      <div className="form-grid">
        <label className="form-label">Place name <span>(shown above the times)</span><input maxLength={100} value={placeName} onChange={e => setPlaceName(e.target.value)}/></label>
        <span className="form-label">&nbsp;<button className="button" type="button" onClick={useMyLocation} disabled={locating}><Icon name="location" size={14}/>{locating ? 'Locating...' : 'Use my location'}</button></span>
      </div>
    </>}
    {provider === 'aladhan' && <div className="form-grid">
      <label className="form-label">Calculation method<select value={method} onChange={e => setMethod(Number(e.target.value))}>{PRAYER_METHODS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
      <label className="form-label">Asr<select value={school} onChange={e => setSchool(Number(e.target.value) as 0 | 1)}>{PRAYER_SCHOOLS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    </div>}
    <div className="settings-data-actions"><button className="button primary" type="submit">Save prayer settings</button></div>
  </form>;
}
