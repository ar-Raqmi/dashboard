import { brandSlug } from '@/features/brand/brand';
import { useStore } from '@/store';
import { downloadFile } from '@/lib/date';

export function exportWorkspace() {
  const { tasks, goals, notes, events, clocks } = useStore.getState();
  downloadFile(JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), tasks, goals, notes, events, clocks }, null, 2), `${brandSlug()}-workspace.json`, 'application/json');
}

/** Renders the workspace shell to a PNG and downloads it. Throws when the browser can't. */
export async function downloadScreenshot(options: { background: string; name: string }) {
  const { getFontEmbedCSS, toPng } = await import('html-to-image');
  await new Promise(resolve => setTimeout(resolve, 750));
  await document.fonts.ready;
  const node = document.querySelector<HTMLElement>('.app-shell');
  if (!node) throw new Error('Workspace not found');
  let fontEmbedCSS = '';
  try { fontEmbedCSS = await getFontEmbedCSS(node, { preferredFontFormat: 'woff2' }); } catch { /* System typefaces provide a screenshot fallback. */ }
  const dataUrl = await toPng(node, {
    backgroundColor: options.background, pixelRatio: 2, fontEmbedCSS,
    filter: element => !(element instanceof Element) || !element.matches('.popover, .toast, .modal-backdrop, .mobile-scrim, .visually-hidden, .skip-link'),
  });
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = options.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
