import { useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { ApiClient } from '../api';
import { useAuth } from '../auth';
import { useStore, type SettingsView, type Theme } from '../store';
import { downloadFile } from '../utils/date';
import { Icon } from './Icon';

function Toggle({ on, label, onChange }: { on: boolean; label: string; onChange: (next: boolean) => void }) {
  return <button className={`toggle-switch ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}><span/></button>;
}
function Row({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return <div className="setting-row"><span><strong>{title}</strong>{hint && <small>{hint}</small>}</span>{children}</div>;
}

/** Seeded by the server but not rendered anywhere on the Overview yet, so a toggle would do nothing. */
const WIDGETS_WITHOUT_EFFECT = ['clock', 'files'];

export function SettingsPage({ theme, setTheme, notify }: { theme: Theme; setTheme: (theme: Theme) => void; notify: (message: string) => void }) {
  const { user, logout } = useAuth();
  const settings = useStore(s => s.settings), preferences = useStore(s => s.preferences), widgets = useStore(s => s.widgets), clocks = useStore(s => s.clocks);
  const mutate = useStore(s => s.mutate), updatePreferences = useStore(s => s.updatePreferences), loadDaily = useStore(s => s.loadDaily);
  const fail = (err: unknown) => notify((err as Error).message);

  const saveSettings = (patch: Partial<SettingsView>, message = 'Settings saved', refreshDaily = false) =>
    void mutate('settings:update', patch, ['settings']).then(() => { notify(message); if (refreshDaily) void loadDaily(); }).catch(fail);

  if (!settings) return <p className="muted-note">Loading settings...</p>;
  return <div className="settings-body" style={{ padding: 0, maxWidth: 720 }}>
    <div className="settings-group"><span className="eyebrow">APPEARANCE</span>
      <Row title="Appearance" hint="Everforest · medium contrast"><div className="theme-segment" role="group" aria-label="Color theme"><button type="button" className={theme === 'light' ? 'active' : ''} aria-pressed={theme === 'light'} onClick={() => setTheme('light')}><Icon name="sun" size={14}/>Light</button><button type="button" className={theme === 'dark' ? 'active' : ''} aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}><Icon name="moon" size={14}/>Dark</button></div></Row>
      <Row title="Compact density" hint="A little more information, a little less space."><Toggle on={!!preferences.compact} label="Compact density" onChange={v => void updatePreferences({ compact: v }).catch(fail)}/></Row>
      <Row title="Reduce motion" hint="Keep transitions and chart animations still."><Toggle on={!!preferences.reducedMotion} label="Reduce motion" onChange={v => void updatePreferences({ reducedMotion: v }).catch(fail)}/></Row>
      <Row title="Show seconds" hint="On world clocks."><Toggle on={settings.showSeconds} label="Show seconds" onChange={v => saveSettings({ showSeconds: v })}/></Row>
    </div>

    <ProfileGroup settings={settings} username={user?.username || ''} notify={notify} onSave={(patch, message = 'Profile saved') => saveSettings(patch, message)}/>
    <PrayerGroup settings={settings} onSave={patch => saveSettings(patch, 'Prayer settings saved', true)}/>
    <ClocksGroup clocks={clocks} notify={notify}/>

    <div className="settings-group"><span className="eyebrow">OVERVIEW WIDGETS</span>
      <p className="settings-description">Choose which sections appear on the Overview and in the side rail.</p>
      {widgets.filter(w => !WIDGETS_WITHOUT_EFFECT.includes(w.type)).map(w => <Row key={w.type} title={w.label}><Toggle on={w.visible} label={w.label} onChange={() => void mutate('widgets:toggle', { type: w.type }, ['widgets']).catch(fail)}/></Row>)}
    </div>

    <PasswordGroup notify={notify}/>

    <div className="settings-group"><span className="eyebrow">YOUR DATA</span>
      <p className="settings-description">Your workspace is stored in your Cloudflare D1 database; files live in R2. Export a JSON copy of tasks, projects, notes, and events at any time.</p>
      <div className="settings-data-actions"><button className="button" onClick={() => { const s = useStore.getState(); downloadFile(JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), tasks: s.tasks, goals: s.goals, notes: s.notes, events: s.events, clocks: s.clocks }, null, 2), 'raqmi-workspace.json', 'application/json'); notify('Workspace exported'); }}><Icon name="download" size={14}/>Export JSON</button><button className="button" onClick={() => void logout()}><Icon name="logout" size={14}/>Sign out</button></div>
    </div>
  </div>;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Picks an image, stores it in R2 through the files upload route, and hands back its content URL. */
function ImageUpload({ label, src, fallback, previewStyle, notify, onUploaded, onRemove }: {
  label: string; src: string; fallback: ReactNode; previewStyle?: CSSProperties; notify: (message: string) => void;
  onUploaded: (url: string) => void; onRemove: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  async function upload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { notify('Please choose an image file.'); return; }
    if (file.size > MAX_IMAGE_BYTES) { notify('Please choose an image smaller than 5 MB.'); return; }
    setBusy(true);
    try { onUploaded(ApiClient.fileUrl(await ApiClient.upload(file, null))); }
    catch (err) { notify((err as Error).message); }
    finally { setBusy(false); }
  }
  return <div className="settings-data-actions" style={{ alignItems: 'center' }}>
    <span className="avatar" style={{ width: 44, height: 44, overflow: 'hidden', ...previewStyle }}>{src ? <img src={src} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : fallback}</span>
    <button type="button" className="button" disabled={busy} onClick={() => input.current?.click()}><Icon name="upload" size={14}/>{busy ? 'Uploading...' : src ? 'Replace' : 'Upload'}</button>
    {src && <button type="button" className="button" disabled={busy} onClick={onRemove}><Icon name="trash" size={14}/>Remove</button>}
    <input ref={input} className="visually-hidden" type="file" accept="image/*" tabIndex={-1} aria-label={`Choose ${label.toLowerCase()}`} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }}/>
  </div>;
}

function ProfileGroup({ settings, username, notify, onSave }: { settings: SettingsView; username: string; notify: (message: string) => void; onSave: (patch: Partial<SettingsView>, message?: string) => void }) {
  const [profileName, setProfileName] = useState(settings.profileName), [appTitle, setAppTitle] = useState(settings.appTitle);
  const [iconBackgroundColor, setIconBackgroundColor] = useState(settings.iconBackgroundColor || '#A7C080');
  const dirty = profileName !== settings.profileName || appTitle !== settings.appTitle || iconBackgroundColor !== settings.iconBackgroundColor;
  const initials = (profileName || username).split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '·';
  return <form className="settings-group" onSubmit={e => { e.preventDefault(); onSave({ profileName: profileName.trim(), appTitle: appTitle.trim() || 'Dashboard', iconBackgroundColor }); }}><span className="eyebrow">PROFILE</span>
    <p className="settings-description">Signed in as <strong>{username}</strong>.</p>
    <div className="form-grid mt-4"><label className="form-label">Display name<input maxLength={200} value={profileName} onChange={e => setProfileName(e.target.value)}/></label><label className="form-label">Workspace name<input maxLength={200} value={appTitle} onChange={e => setAppTitle(e.target.value)}/></label></div>
    <Row title="Profile picture" hint="Shown in the sidebar and top bar.">
      <ImageUpload label="Profile picture" src={settings.profilePicture} fallback={initials} notify={notify}
        onUploaded={url => onSave({ profilePicture: url }, 'Profile picture updated')} onRemove={() => onSave({ profilePicture: '' }, 'Profile picture removed')}/>
    </Row>
    <Row title="App logo" hint="Replaces the brand mark, workspace icon, and favicon.">
      <ImageUpload label="App logo" src={settings.appLogo} fallback={<Icon name="upload" size={16}/>} previewStyle={{ borderRadius: 8, background: iconBackgroundColor }} notify={notify}
        onUploaded={url => onSave({ appLogo: url }, 'App logo updated')} onRemove={() => onSave({ appLogo: '' }, 'App logo removed')}/>
    </Row>
    <Row title="Icon background" hint="Fills the space behind the app logo.">
      <input type="color" aria-label="Icon background color" value={iconBackgroundColor} onChange={e => setIconBackgroundColor(e.target.value)} style={{ width: 44, height: 32, padding: 2, cursor: 'pointer' }}/>
    </Row>
    <div className="settings-data-actions"><button className="button primary" type="submit" disabled={!dirty}>Save profile</button></div>
  </form>;
}

const JAKIM_ZONE = /^[A-Z]{3}\d{2}$/;
function PrayerGroup({ settings, onSave }: { settings: SettingsView; onSave: (patch: Partial<SettingsView>) => void }) {
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

function ClocksGroup({ clocks, notify }: { clocks: { id: string; label: string; timezone: string }[]; notify: (message: string) => void }) {
  const mutate = useStore(s => s.mutate);
  const zones = useMemo(() => { try { return Intl.supportedValuesOf('timeZone'); } catch { return ['UTC']; } }, []);
  const [label, setLabel] = useState(''), [zone, setZone] = useState('Asia/Riyadh');
  const fail = (err: unknown) => notify((err as Error).message);
  return <div className="settings-group" id="settings-clocks"><span className="eyebrow">WORLD CLOCKS</span>
    {clocks.map(c => <Row key={c.id} title={c.label} hint={c.timezone}><button className="icon-button" title={`Remove ${c.label}`} aria-label={`Remove ${c.label}`} onClick={() => void mutate('clocks:remove', { id: c.id }, ['clocks']).then(() => notify('Clock removed')).catch(fail)}><Icon name="trash" size={15}/></button></Row>)}
    {!clocks.length && <p className="settings-description">No cities yet. Your local time is always shown.</p>}
    <form className="form-grid mt-4" onSubmit={e => { e.preventDefault(); if (!label.trim()) return; void mutate('clocks:add', { label: label.trim(), timezone: zone }, ['clocks']).then(() => { setLabel(''); notify('Clock added'); }).catch(fail); }}>
      <label className="form-label">City<input required maxLength={80} placeholder="e.g. Makkah" value={label} onChange={e => setLabel(e.target.value)}/></label>
      <label className="form-label">Time zone<select value={zone} onChange={e => setZone(e.target.value)}>{zones.map(z => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}</select></label>
      <div className="settings-data-actions" style={{ marginTop: 0 }}><button className="button" type="submit"><Icon name="plus" size={14}/>Add clock</button></div>
    </form>
  </div>;
}

function PasswordGroup({ notify }: { notify: (message: string) => void }) {
  const mutate = useStore(s => s.mutate);
  const [current, setCurrent] = useState(''), [next, setNext] = useState(''), [confirm, setConfirm] = useState(''), [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (next !== confirm) { setError('The new passwords do not match.'); return; }
    try {
      await mutate('auth:changePassword', { currentPassword: current, newPassword: next }, []);
      setCurrent(''); setNext(''); setConfirm(''); setError('');
      notify('Password changed. Other sessions were signed out.');
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return <form className="settings-group" onSubmit={submit}><span className="eyebrow">SECURITY</span>
    <div className="form-grid mt-4"><label className="form-label">Current password<input type="password" required autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)}/></label><span/></div>
    <div className="form-grid"><label className="form-label">New password<input type="password" required minLength={8} autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)}/></label><label className="form-label">Confirm new password<input type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)}/></label></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="settings-data-actions"><button className="button" type="submit">Change password</button></div>
  </form>;
}
