/**
 * Client for the Pages Functions API. Every data read goes through `ApiClient.query`
 * and every write through `ApiClient.mutate`; both post `{ path, args }` and unwrap `{ value }`.
 */

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

/** Fired when the server reports the session has ended; the auth provider listens for it. */
export const UNAUTHORIZED_EVENT = 'raqmi:unauthorized';

async function errorFrom(res: Response) {
  let message = `Request failed (${res.status})`;
  try {
    const text = await res.text();
    try {
      message = (JSON.parse(text) as { error?: string }).error || message;
    } catch {
      if (text.includes('1101')) message = 'The server failed to start. Check the D1 "DB" binding for this deployment.';
    }
  } catch { /* keep the generic message */ }
  if (res.status === 401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  return new ApiError(res.status, message);
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { credentials: 'same-origin', ...init });
  } catch {
    throw new ApiError(0, 'You appear to be offline. Check your connection and try again.');
  }
  if (!res.ok) throw await errorFrom(res);
  return res.json() as Promise<T>;
}

const post = <T>(url: string, body: unknown) =>
  request<T>(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export class ApiClient {
  static async query<T = unknown>(path: string, args: Record<string, unknown> = {}): Promise<T> {
    return (await post<{ value: T }>('/api/query', { path, args })).value;
  }

  static async mutate<T = unknown>(path: string, args: Record<string, unknown> = {}): Promise<T> {
    return (await post<{ value: T }>('/api/mutation', { path, args })).value;
  }

  static login(username: string, password: string) {
    return post<{ user: { id: string; username: string } }>('/api/auth/login', { username, password });
  }

  static logout() {
    return post<{ success: boolean }>('/api/auth/logout', {});
  }

  static session() {
    return request<{ user: { id: string; username: string } }>('/api/auth/session', { method: 'GET' });
  }

  /** Streams a file to R2 through the API; resolves to the new FileItem id. */
  static async upload(file: File, parentId: string | null) {
    const params = new URLSearchParams({ name: file.name });
    if (parentId) params.set('parentId', parentId);
    const res = await request<{ value: string }>(`/api/files/upload?${params}`, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });
    return res.value;
  }

  /** Attaches a client-generated JPEG preview to an uploaded file. */
  static async putThumbnail(id: string, blob: Blob, meta: { width: number; height: number; duration?: number }) {
    const params = new URLSearchParams({ width: String(meta.width), height: String(meta.height) });
    if (meta.duration) params.set('duration', String(meta.duration));
    await request(`/api/files/${encodeURIComponent(id)}/thumbnail?${params}`, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: blob });
  }

  static thumbnailUrl(id: string) {
    return `/api/files/${encodeURIComponent(id)}/thumbnail`;
  }

  /** Streaming ZIP of files and folder trees, built server-side from R2. Authenticated by the session cookie like every other route. */
  static zipUrl(ids: string[]) {
    return `/api/files/zip?ids=${ids.map(encodeURIComponent).join(',')}`;
  }

  static fileUrl(id: string, download = false) {
    return `/api/files/${encodeURIComponent(id)}/content${download ? '?download=1' : ''}`;
  }
}
