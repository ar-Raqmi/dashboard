import { useState } from 'react';
import { BrandMark } from '@/components/BrandMark';
import { useBrandIcon } from './useBrandIcon';

/** The in-app brand mark: a built-in icon, the user's own image, or nothing. */
export function BrandIcon() {
  const { icon, logo } = useBrandIcon();
  const [broken, setBroken] = useState(false);
  if (icon === 'none') return null;
  if (icon === 'custom') {
    return logo && !broken
      ? <img className="brand-logo" src={logo} alt="" onError={() => setBroken(true)}/>
      : <BrandMark/>;
  }
  return <BrandMark id={icon}/>;
}
