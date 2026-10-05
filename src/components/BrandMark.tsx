import { useId } from 'react';

const GLYPH =
  'M127 159 L259 159 L373 273 L373 203 L416 161 L416 366 L262 366 L262 261 L156 366 L96 366 L261 201 L127 201 L106 180 Z ' +
  'M294 254 L294 333 L373 333 Z';

/** The raqmi mark. Its gradient follows the theme through --logo-from / --logo-to. */
export function BrandMark() {
  const gradient = useId();
  return <svg viewBox="90 150 332 224" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={gradient} gradientUnits="userSpaceOnUse" x1="96" y1="159" x2="416" y2="366">
        <stop offset="0" style={{ stopColor: 'var(--logo-from)' }}/>
        <stop offset="1" style={{ stopColor: 'var(--logo-to)' }}/>
      </linearGradient>
    </defs>
    <path d={GLYPH} fill={`url(#${gradient})`} fillRule="evenodd"/>
  </svg>;
}
