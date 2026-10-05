/** Built-in brand icons: one definition drives the in-app mark, the favicon and the installed-app icon. */

export type PresetId = 'raqmi' | 'feather' | 'leaf' | 'moon' | 'compass' | 'book' | 'bolt' | 'star';
export type BrandIconSetting = PresetId | 'custom' | 'none';

interface Stroke { d: string; width: number }
export interface Preset {
  id: PresetId;
  label: string;
  /** x y width height of the artwork. */
  box: [number, number, number, number];
  /** A filled shape, for the raqmi mark. */
  fill?: string;
  strokes?: Stroke[];
  /** Share of the icon's width the artwork takes: ordinary icons vs maskable ones (which must survive a circular crop). */
  fit: { any: number; maskable: number };
}

const OUTLINE = { any: 0.62, maskable: 0.5 };

export const PRESETS: Preset[] = [
  {
    id: 'raqmi', label: 'Raqmi', box: [90, 150, 332, 224], fit: { any: 0.84, maskable: 0.72 },
    fill: 'M127 159 L259 159 L373 273 L373 203 L416 161 L416 366 L262 366 L262 261 L156 366 L96 366 L261 201 L127 201 L106 180 Z M294 254 L294 333 L373 333 Z',
  },
  {
    id: 'feather', label: 'Feather pen', box: [0, 0, 28, 31], fit: OUTLINE,
    strokes: [
      { d: 'M5 25.5 22 5M8.5 21.3C5 10.5 11.5 3.2 25 2c-.2 13-7.5 21-16.5 19.3Z', width: 1.6 },
      { d: 'm12.5 16.5-.8-6M16.3 12.2l5.3-.5M6.5 27H20', width: 1.4 },
    ],
  },
  { id: 'leaf', label: 'Leaf', box: [0, 0, 24, 24], fit: OUTLINE, strokes: [{ d: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10ZM2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12', width: 1.65 }] },
  { id: 'moon', label: 'Crescent', box: [0, 0, 24, 24], fit: OUTLINE, strokes: [{ d: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z', width: 1.65 }] },
  { id: 'compass', label: 'Compass', box: [0, 0, 24, 24], fit: OUTLINE, strokes: [{ d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z', width: 1.65 }] },
  { id: 'book', label: 'Open book', box: [0, 0, 24, 24], fit: OUTLINE, strokes: [{ d: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z', width: 1.65 }] },
  { id: 'bolt', label: 'Bolt', box: [0, 0, 24, 24], fit: OUTLINE, strokes: [{ d: 'M13 2 4 14h7l-1 8 10-13h-8z', width: 1.65 }] },
  { id: 'star', label: 'Star', box: [0, 0, 24, 24], fit: OUTLINE, strokes: [{ d: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z', width: 1.65 }] },
];

export const presetById = (id: string) => PRESETS.find(p => p.id === id) ?? PRESETS[0];

const PALETTE = {
  light: { background: '#EFEBD4', from: '#93B259', to: '#4B5A00' },
  dark: { background: '#232A2E', from: '#B3CF8A', to: '#7E9C4D' },
};

/** Markup for the artwork alone, filled with a gradient named `gradientId`. */
function artwork(preset: Preset, gradientId: string) {
  const paint = `url(#${gradientId})`;
  if (preset.fill) return `<path d="${preset.fill}" fill="${paint}" fill-rule="evenodd"/>`;
  return (preset.strokes ?? []).map(s => `<path d="${s.d}" fill="none" stroke="${paint}" stroke-width="${s.width}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
}

const gradient = (preset: Preset, id: string, from: string, to: string) => {
  const [x, y, w, h] = preset.box;
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`;
};

/** A square icon (512 units) with the artwork centred at `fraction` of its width. */
export function presetSquareSvg(id: PresetId, options: { theme: 'light' | 'dark'; fraction: number; rounded?: boolean }) {
  const preset = presetById(id);
  const { background, from, to } = PALETTE[options.theme];
  const [x, y, w, h] = preset.box;
  const scale = (options.fraction * 512) / Math.max(w, h);
  const move = `translate(${256 - (x + w / 2) * scale} ${256 - (y + h / 2) * scale}) scale(${scale})`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><defs>${gradient(preset, 'g', from, to)}</defs>`
    + `<rect width="512" height="512" rx="${options.rounded ? 112 : 0}" fill="${background}"/><g transform="${move}">${artwork(preset, 'g')}</g></svg>`;
}

/** A browser-tab icon that follows the OS light/dark scheme. */
export function presetFaviconHref(id: PresetId) {
  const preset = presetById(id);
  const [x, y, w, h] = preset.box;
  const scale = (0.8 * 512) / Math.max(w, h);
  const move = `translate(${256 - (x + w / 2) * scale} ${256 - (y + h / 2) * scale}) scale(${scale})`;
  const { light, dark } = PALETTE;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><style>:root{--bg:${light.background};--from:${light.from};--to:${light.to}}`
    + `@media (prefers-color-scheme:dark){:root{--bg:${dark.background};--from:${dark.from};--to:${dark.to}}}</style>`
    + `<defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}"><stop offset="0" style="stop-color:var(--from)"/><stop offset="1" style="stop-color:var(--to)"/></linearGradient></defs>`
    + `<rect width="512" height="512" rx="112" style="fill:var(--bg)"/><g transform="${move}">${artwork(preset, 'g')}</g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
