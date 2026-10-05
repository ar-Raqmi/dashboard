// Regenerates the PNG icon set from public/logo.svg:  npm run icons
// The maskable icon shrinks the glyph to 90% so launchers can crop to any shape without clipping it.
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const SOURCE = new URL('../public/logo.svg', import.meta.url);
const OUT = new URL('../public/', import.meta.url);
const GLYPH_SCALE = 'scale(1.0)';
const MASKABLE_SCALE = 'scale(0.9)';

const icons = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
];

const svg = await readFile(SOURCE, 'utf8');
if (!svg.includes(GLYPH_SCALE)) throw new Error(`public/logo.svg must contain "${GLYPH_SCALE}"`);

for (const { file, size, maskable } of icons) {
  const source = maskable ? svg.replace(GLYPH_SCALE, MASKABLE_SCALE) : svg;
  await sharp(Buffer.from(source), { density: 400 })
    .resize(size, size)
    .flatten({ background: '#EFEBD4' })
    .png({ compressionLevel: 9 })
    .toFile(new URL(file, OUT).pathname);
  console.log(`wrote public/${file}`);
}
