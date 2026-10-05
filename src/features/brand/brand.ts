import { useStore } from '@/store';

export const DEFAULT_BRAND = 'raqmi';
const CACHE_KEY = 'raqmi-brand';

/** The login screen renders before settings can load, so the last known name is kept on this device. */
export function cachedBrand() {
  try { return localStorage.getItem(CACHE_KEY) || DEFAULT_BRAND; } catch { return DEFAULT_BRAND; }
}

export function cacheBrand(name: string) {
  try { localStorage.setItem(CACHE_KEY, name); } catch { /* The name falls back to the default next visit. */ }
}

/** Brand name for non-React callers (file names, exports). */
export const currentBrand = () => useStore.getState().settings?.brandName || cachedBrand();

/** Lower-case, filename-safe form: "My Space" becomes "my-space". */
export const brandSlug = (name = currentBrand()) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || DEFAULT_BRAND;

/** For running prose and the tab title, where a leading capital reads better than the stylised lower-case. */
export const brandTitle = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);
