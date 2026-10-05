import { useId } from 'react';
import { presetById, type PresetId } from '@/features/brand/icons';

/** A built-in brand icon. Its gradient follows the theme through --logo-from / --logo-to. */
export function BrandMark({ id = 'raqmi' }: { id?: PresetId }) {
  const gradient = useId();
  const preset = presetById(id);
  const [x, y, w, h] = preset.box;
  const paint = `url(#${gradient})`;
  return <svg viewBox={`${x} ${y} ${w} ${h}`} className={w === h || preset.strokes ? 'square' : undefined} fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={gradient} gradientUnits="userSpaceOnUse" x1={x} y1={y} x2={x + w} y2={y + h}>
        <stop offset="0" style={{ stopColor: 'var(--logo-from)' }}/>
        <stop offset="1" style={{ stopColor: 'var(--logo-to)' }}/>
      </linearGradient>
    </defs>
    {preset.fill && <path d={preset.fill} fill={paint} fillRule="evenodd"/>}
    {preset.strokes?.map(s => <path key={s.d} d={s.d} stroke={paint} strokeWidth={s.width} strokeLinecap="round" strokeLinejoin="round"/>)}
  </svg>;
}
