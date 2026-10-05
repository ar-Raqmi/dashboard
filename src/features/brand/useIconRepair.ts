import { useEffect } from 'react';
import { useStore } from '@/store';
import { renderImageIcons, renderPresetIcons, type PwaIcons } from './rasterize';
import type { PresetId } from './icons';

const isInstallable = (dataUrl: string) => /^data:image\/(png|webp);base64,/.test(dataUrl);

/**
 * Icons saved earlier as JPEG make the app uninstallable. When the chosen icon has installed-app images in
 * another format, render them again as PNG and save them.
 */
export function useIconRepair() {
  const settings = useStore(s => s.settings);
  useEffect(() => {
    if (!settings || !settings.pwaIcon || isInstallable(settings.pwaIcon)) return;
    const { brandIcon, appLogo, iconBackgroundColor } = settings;
    const render: Promise<PwaIcons> = brandIcon === 'custom'
      ? renderImageIcons(appLogo, iconBackgroundColor)
      : renderPresetIcons(brandIcon as PresetId);
    render
      .then(icons => useStore.getState().mutate('settings:update', { ...icons }, ['settings']))
      .catch(() => useStore.getState().mutate('settings:update', { pwaIcon: '', pwaIconMaskable: '' }, ['settings']).catch(() => undefined));
  }, [settings?.pwaIcon]); // eslint-disable-line react-hooks/exhaustive-deps
}
