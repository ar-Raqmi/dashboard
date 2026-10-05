// Regenerates the PNG icon set from public/logo.svg:  npm run icons
// The maskable icon keeps the glyph inside the safe zone so launchers can crop it to any shape.
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const SOURCE = new URL('../public/logo.svg', import.meta.url);
const OUT = new URL('../public/', import.meta.url);
// The glyph is 332x224 in a 512 canvas: 1.3 fills ~84% of the width like other Dock and home-screen icons.
// A maskable icon is meant to stay inside the central 80% circle (scale ~1.0); 1.12 trades a little
// of that margin for a Dock icon that is not visibly smaller when a desktop browser picks this one.
const GLYPH_SCALE = 'scale(1.3)';
const MASKABLE_SCALE = 'scale(1.12)';

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
