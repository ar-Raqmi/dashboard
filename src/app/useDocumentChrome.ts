import { useEffect } from 'react';
import { brandTitle } from '@/features/brand/brand';
import { useBrand } from '@/features/brand/useBrand';
import { useBrandIcon } from '@/features/brand/useBrandIcon';
import { presetFaviconHref, type PresetId } from '@/features/brand/icons';
import { useStore } from '@/store';

/** Keeps what lives outside React in step with the workspace: motion preference, tab title and favicon. */
export function useDocumentChrome(pageTitle: string) {
  const reducedMotionPref = useStore(s => s.preferences.reducedMotion);
  const appTitle = useStore(s => s.settings?.appTitle);
  const brand = useBrand();
  const { icon, logo } = useBrandIcon();
  const reducedMotion = reducedMotionPref ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => { document.documentElement.classList.toggle('reduce-motion', reducedMotion); }, [reducedMotion]);
  useEffect(() => { document.title = `${pageTitle} - ${appTitle && appTitle !== 'Dashboard' ? appTitle : brandTitle(brand)}`; }, [pageTitle, appTitle, brand]);
  useEffect(() => {
    const custom = icon === 'custom' && logo ? logo : null;
    const preset = icon !== 'custom' && icon !== 'none' && icon !== 'raqmi' ? presetFaviconHref(icon as PresetId) : null;
    document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]').forEach(link => {
      const defaultHref = link.dataset.defaultHref ??= link.href;
      const defaultType = link.dataset.defaultType ??= link.type;
      link.href = custom ?? preset ?? defaultHref;
      link.type = preset ? 'image/svg+xml' : custom ? '' : defaultType;
    });
  }, [icon, logo]);
}
