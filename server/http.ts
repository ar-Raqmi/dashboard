import { HttpError } from './db';
import type { Args } from './procedures';

export const json = (value: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });

export async function readJson(request: Request): Promise<Args> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? (body as Args) : {};
  } catch {
    throw new HttpError(400, 'Request body must be JSON');
  }
}

/** Rejects cross-site state-changing requests (cookies are SameSite=Strict too). */
export function checkOrigin(request: Request) {
  const origin = request.headers.get('Origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) throw new HttpError(403, 'Cross-origin request rejected');
}
