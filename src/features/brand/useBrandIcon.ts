import { useEffect } from 'react';
import { useStore } from '@/store';
import { cacheBrandIcon, cachedBrandIcon } from './brand';

/** The chosen icon: the account's setting once loaded, otherwise what this device last saw (the sign-in screen needs it before settings load). */
export function useBrandIcon() {
  const icon = useStore(s => s.settings?.brandIcon);
  const logo = useStore(s => s.settings?.appLogo);
  useEffect(() => { if (icon) cacheBrandIcon({ icon, logo: logo ?? '' }); }, [icon, logo]);
  return icon ? { icon, logo: logo ?? '' } : cachedBrandIcon();
}
