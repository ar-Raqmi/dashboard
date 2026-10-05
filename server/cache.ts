import { HttpError } from './db';

/** JSON from slow, rate-limited upstreams, kept on the edge so each key is fetched at most once per TTL. */
export class EdgeCache {
  private get store() {
    return (caches as unknown as { default: Cache }).default;
  }

  /**
   * `key` only has to be a unique URL; it need not be what is fetched, which lets POST
   * responses be cached too. Failures are never stored.
   */
  async json<T>(key: string, ttlSeconds: number, load: () => Promise<Response>, upstream: string): Promise<T> {
    const hit = await this.store.match(key);
    if (hit) return hit.json() as Promise<T>;

    let res: Response;
    try {
      res = await load();
    } catch {
      throw new HttpError(502, `${upstream} could not be reached.`);
    }
    if (!res.ok) throw new HttpError(502, `${upstream} answered with an error (${res.status}).`);
    const body = await res.text();
    await this.store.put(key, new Response(body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${ttlSeconds}` } }));
    return JSON.parse(body) as T;
  }

  /** GET `url` as JSON. */
  get<T>(url: string, ttlSeconds: number, upstream: string) {
    return this.json<T>(url, ttlSeconds, () => fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'raqmi-dashboard' } }), upstream);
  }
}
