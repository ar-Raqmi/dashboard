import { useEffect } from 'react';
import { useStore } from '@/store';
import { cacheBrand, cachedBrand } from './brand';

/** The editable brand name: the account's setting once loaded, otherwise what this device last saw. */
export function useBrand() {
  const saved = useStore(s => s.settings?.brandName);
  useEffect(() => { if (saved) cacheBrand(saved); }, [saved]);
  return saved || cachedBrand();
}
