import { readSessionToken, resolveSession } from './auth';
import { Db, type Env } from './db';

const APP_NAME = 'Dashboard';
const THEME = '#EFEBD4';

// Maskable first: when sizes tie, desktop browsers tend to take the later entry, and the 'any' icon is the larger-looking one.
const DEFAULT_ICONS = [
  { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
];

interface IconRow { userId: string; pwaIcon: string; pwaIconMaskable: string }

/** Serves the web app manifest and the installed-app icon the user picked in Settings. */
export class PwaAssets {
  constructor(private readonly env: Env) {}

  async manifest(request: Request) {
    const owner = await this.owner(request).catch(() => null);
    return new Response(JSON.stringify(this.document(owner)), {
      headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'no-cache' },
    });
  }

  async icon(request: Request, kind: string) {
    const row = await this.rowFor(new URL(request.url).searchParams.get('u'));
    const data = kind === 'maskable' ? row?.pwaIconMaskable : row?.pwaIcon;
    if (!data) return new Response('Not found', { status: 404 });
    const bytes = Uint8Array.from(atob(data.split(',')[1]), c => c.charCodeAt(0));
    // The URL carries a content hash (?v=), so a changed icon is a new URL.
    return new Response(bytes, { headers: { 'Content-Type': mimeOf(data), 'Cache-Control': 'public, max-age=86400' } });
  }

  private document(owner: IconRow | null) {
    return {
      id: '/', name: APP_NAME, short_name: APP_NAME,
      description: 'A personal workspace for tasks, calendar, notes, goals, files and daily prayer times.',
      start_url: '/', scope: '/', display: 'standalone', orientation: 'any',
      background_color: THEME, theme_color: THEME, lang: 'en', dir: 'ltr',
      icons: owner && installable(owner.pwaIcon) ? this.customIcons(owner) : DEFAULT_ICONS,
      categories: ['productivity', 'utilities'], prefer_related_applications: false,
    };
  }

  private customIcons(owner: IconRow) {
    const query = (data: string) => `?u=${owner.userId}&v=${hash(data)}`;
    const any = `/pwa-icon/any${query(owner.pwaIcon)}`;
    const type = mimeOf(owner.pwaIcon);
    const icons = [
      { src: any, sizes: '192x192', type, purpose: 'any' },
      { src: any, sizes: '512x512', type, purpose: 'any' },
    ];
    if (installable(owner.pwaIconMaskable)) icons.unshift({ src: `/pwa-icon/maskable${query(owner.pwaIconMaskable)}`, sizes: '512x512', type: mimeOf(owner.pwaIconMaskable), purpose: 'maskable' });
    return icons;
  }

  /** The signed-in user's icon when the request carries a session, otherwise the first account that has one (this is a personal dashboard). */
  private async owner(request: Request) {
    const db = new Db(this.env.DB);
    const user = await resolveSession(db, readSessionToken(request));
    return this.rowFor(user?.id ?? null, db);
  }

  private rowFor(userId: string | null, db = new Db(this.env.DB)) {
    return userId
      ? db.first<IconRow>('SELECT userId, pwaIcon, pwaIconMaskable FROM UserSettings WHERE userId = ?', userId)
      : db.first<IconRow>("SELECT userId, pwaIcon, pwaIconMaskable FROM UserSettings WHERE pwaIcon != '' ORDER BY rowid LIMIT 1");
  }
}

/** Chrome only treats PNG, SVG and WebP manifest icons as installable; anything else (an old JPEG) falls back to the built-in set. */
const installable = (dataUrl: string) => /^data:image\/(png|webp);base64,/.test(dataUrl);

const mimeOf = (dataUrl: string) => /^data:([^;]+);/.exec(dataUrl)?.[1] ?? 'image/png';

function hash(text: string) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
