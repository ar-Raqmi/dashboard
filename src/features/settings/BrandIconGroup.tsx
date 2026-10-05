import { BrandMark } from '@/components/BrandMark';
import { Icon } from '@/components/Icon';
import { PRESETS, type BrandIconSetting } from '@/features/brand/icons';
import type { SettingsView } from '@/store';
import { Row } from './fields';
import { ImageUpload } from './ImageUpload';

export function BrandIconGroup({ settings, notify, onSave }: { settings: SettingsView; notify: (message: string) => void; onSave: (patch: Partial<SettingsView>, message?: string) => void }) {
  const selected = settings.brandIcon;
  const choose = (icon: BrandIconSetting) => onSave({ brandIcon: icon }, 'Icon updated');

  const choice = (id: BrandIconSetting, label: string, preview: React.ReactNode, disabled = false) =>
    <button key={id} type="button" role="radio" aria-checked={selected === id} disabled={disabled} className={`icon-choice ${selected === id ? 'active' : ''}`} onClick={() => choose(id)}>{preview}<span>{label}</span></button>;

  return <div className="settings-group"><span className="eyebrow">APP ICON</span>
    <p className="settings-description">Used in the sidebar, the sign-in screen and the browser tab. The installed app always keeps the Raqmi icon.</p>
    <div className="icon-picker" role="radiogroup" aria-label="App icon">
      {PRESETS.map(p => choice(p.id, p.label, <BrandMark id={p.id}/>))}
      {choice('custom', 'Your image', settings.appLogo ? <img src={settings.appLogo} alt=""/> : <Icon name="upload" size={22}/>, !settings.appLogo)}
      {choice('none', 'None', <Icon name="close" size={22}/>)}
    </div>
    <Row title="Your own image" hint="Upload a file, or paste a link to save storage.">
      <ImageUpload label="App icon" src={settings.appLogo} fallback={<Icon name="upload" size={16}/>} previewStyle={{ borderRadius: 8, background: settings.iconBackgroundColor }} notify={notify}
        onUploaded={url => onSave({ appLogo: url, brandIcon: 'custom' }, 'Icon updated')}
        onRemove={() => onSave({ appLogo: '', ...(selected === 'custom' ? { brandIcon: 'raqmi' as const } : {}) }, 'Image removed')}/>
    </Row>
  </div>;
}
