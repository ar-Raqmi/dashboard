import { useAuth } from '@/features/auth/auth';
import { useStore, type SettingsView, type Theme } from '@/store';
import { exportWorkspace } from '@/lib/workspaceExport';
import { Icon } from '@/components/Icon';
import { Toggle, Row } from './fields';
import { ProfileGroup } from './ProfileGroup';
import { PrayerGroup } from './PrayerGroup';
import { ClocksGroup } from './ClocksGroup';
import { PasswordGroup } from './PasswordGroup';

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
      <div className="settings-data-actions"><button className="button" onClick={() => { exportWorkspace(); notify('Workspace exported'); }}><Icon name="download" size={14}/>Export JSON</button><button className="button" onClick={() => void logout()}><Icon name="logout" size={14}/>Sign out</button></div>
    </div>
  </div>;
}
