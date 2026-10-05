import { presetSquareSvg, presetById, type PresetId } from './icons';

const SIZE = 512;

function canvasToPng(draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');
  draw(ctx);
  // PNG only: Chrome refuses to install an app whose manifest icons are JPEG.
  return canvas.toDataURL('image/png');
}

const loadImage = (src: string, crossOrigin = false) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  if (crossOrigin) img.crossOrigin = 'anonymous';
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error('The image could not be loaded'));
  img.src = src;
});

export interface PwaIcons { pwaIcon: string; pwaIconMaskable: string }

/** The installed-app icons for a built-in icon: rendered on the light Everforest tile. */
export async function renderPresetIcons(id: PresetId): Promise<PwaIcons> {
  const { fit } = presetById(id);
  const render = async (fraction: number) => {
    const svg = presetSquareSvg(id, { theme: 'light', fraction });
    const img = await loadImage(`data:image/svg+xml,${encodeURIComponent(svg)}`);
    return canvasToPng(ctx => ctx.drawImage(img, 0, 0, SIZE, SIZE));
  };
  return { pwaIcon: await render(fit.any), pwaIconMaskable: await render(fit.maskable) };
}

/**
 * The installed-app icons for a custom image, centred on `background`. Browsers refuse to read pixels
 * from a cross-origin image that does not send CORS headers; that case throws, and the caller keeps the default.
 */
export async function renderImageIcons(src: string, background: string): Promise<PwaIcons> {
  const img = await loadImage(src, true);
  const render = (fraction: number) => canvasToPng(ctx => {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, SIZE, SIZE);
    const scale = Math.min((SIZE * fraction) / img.width, (SIZE * fraction) / img.height);
    const w = img.width * scale, h = img.height * scale;
    ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
  });
  return { pwaIcon: render(0.9), pwaIconMaskable: render(0.7) };
}
