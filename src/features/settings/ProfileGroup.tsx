import { useState } from 'react';
import { type SettingsView } from '@/store';
import { initialsOf } from '@/lib/text';
import { Row } from './fields';
import { ImageUpload } from './ImageUpload';

export function ProfileGroup({ settings, username, notify, onSave }: { settings: SettingsView; username: string; notify: (message: string) => void; onSave: (patch: Partial<SettingsView>, message?: string) => void }) {
  const [profileName, setProfileName] = useState(settings.profileName), [appTitle, setAppTitle] = useState(settings.appTitle);
  const [brandName, setBrandName] = useState(settings.brandName);
  const [iconBackgroundColor, setIconBackgroundColor] = useState(settings.iconBackgroundColor || '#A7C080');
  const dirty = profileName !== settings.profileName || appTitle !== settings.appTitle || brandName !== settings.brandName || iconBackgroundColor !== settings.iconBackgroundColor;
  const initials = initialsOf(profileName || username);
  return <form className="settings-group" onSubmit={e => { e.preventDefault(); onSave({ profileName: profileName.trim(), appTitle: appTitle.trim() || 'Dashboard', brandName: brandName.trim(), iconBackgroundColor }); }}><span className="eyebrow">PROFILE</span>
    <p className="settings-description">Signed in as <strong>{username}</strong>.</p>
    <div className="form-grid mt-4"><label className="form-label">Display name<input maxLength={200} value={profileName} onChange={e => setProfileName(e.target.value)}/></label><label className="form-label">Workspace name<input maxLength={200} value={appTitle} onChange={e => setAppTitle(e.target.value)}/></label></div>
    <div className="form-grid"><label className="form-label">Brand name <span>(sidebar, sign-in, footer, tab title)</span><input maxLength={24} value={brandName} placeholder="raqmi" onChange={e => setBrandName(e.target.value)}/></label></div>
    <Row title="Profile picture" hint="Shown in the sidebar and top bar.">
      <ImageUpload label="Profile picture" src={settings.profilePicture} fallback={initials} notify={notify}
        onUploaded={url => onSave({ profilePicture: url }, 'Profile picture updated')} onRemove={() => onSave({ profilePicture: '' }, 'Profile picture removed')}/>
    </Row>
    <Row title="Icon background" hint="Fills the space behind your own image.">
      <input type="color" aria-label="Icon background color" value={iconBackgroundColor} onChange={e => setIconBackgroundColor(e.target.value)} style={{ width: 44, height: 32, padding: 2, cursor: 'pointer' }}/>
    </Row>
    <div className="settings-data-actions"><button className="button primary" type="submit" disabled={!dirty}>Save profile</button></div>
  </form>;
}
