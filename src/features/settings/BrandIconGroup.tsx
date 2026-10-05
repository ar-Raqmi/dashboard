import { useState } from 'react';
import { BrandMark } from '@/components/BrandMark';
import { Icon } from '@/components/Icon';
import { PRESETS, type BrandIconSetting } from '@/features/brand/icons';
import { renderImageIcons, renderPresetIcons, type PwaIcons } from '@/features/brand/rasterize';
import type { SettingsView } from '@/store';
import { Row } from './fields';
import { ImageUpload } from './ImageUpload';

const DEFAULT_ICONS: PwaIcons = { pwaIcon: '', pwaIconMaskable: '' };

export function BrandIconGroup({ settings, notify, onSave }: { settings: SettingsView; notify: (message: string) => void; onSave: (patch: Partial<SettingsView>, message?: string) => void }) {
  const [busy, setBusy] = useState(false);
  const selected = settings.brandIcon;

  /** Saves the choice together with the installed-app icons rendered from it. */
  async function apply(icon: BrandIconSetting, extra: Partial<SettingsView> = {}, image = settings.appLogo) {
    setBusy(true);
    let message = 'Icon updated';
    try {
      let icons = DEFAULT_ICONS;
      if (icon === 'custom') {
        try { icons = await renderImageIcons(image, settings.iconBackgroundColor); }
        catch { message = 'Icon updated. The installed app keeps its default icon, because that link cannot be copied. Upload the image to use it there too.'; }
      } else if (icon !== 'none' && icon !== 'raqmi') icons = await renderPresetIcons(icon);
      onSave({ brandIcon: icon, ...icons, ...extra }, message);
    } catch (err) {
      notify((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const choice = (id: BrandIconSetting, label: string, preview: React.ReactNode, disabled = false) =>
    <button key={id} type="button" role="radio" aria-checked={selected === id} disabled={busy || disabled} className={`icon-choice ${selected === id ? 'active' : ''}`} onClick={() => void apply(id)}>{preview}<span>{label}</span></button>;

  return <div className="settings-group"><span className="eyebrow">APP ICON</span>
    <p className="settings-description">Used in the sidebar and sign-in screen, the browser tab and the installed app. After changing it, remove and reinstall the app to refresh its home-screen icon.</p>
    <div className="icon-picker" role="radiogroup" aria-label="App icon">
      {PRESETS.map(p => choice(p.id, p.label, <BrandMark id={p.id}/>))}
      {choice('custom', 'Your image', settings.appLogo ? <img src={settings.appLogo} alt=""/> : <Icon name="upload" size={22}/>, !settings.appLogo)}
      {choice('none', 'None', <Icon name="close" size={22}/>)}
    </div>
    <p className="settings-description">None hides the mark in the app; the tab and installed app keep the Raqmi icon.</p>
    <Row title="Your own image" hint="Upload a file, or paste a link to save storage.">
      <ImageUpload label="App icon" src={settings.appLogo} fallback={<Icon name="upload" size={16}/>} previewStyle={{ borderRadius: 8, background: settings.iconBackgroundColor }} notify={notify}
        onUploaded={url => void apply('custom', { appLogo: url }, url)}
        onRemove={() => onSave({ appLogo: '', ...(selected === 'custom' ? { brandIcon: 'raqmi' as const, ...DEFAULT_ICONS } : {}) }, 'Image removed')}/>
    </Row>
  </div>;
}
