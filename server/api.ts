import { login, logout, readSessionToken, requireUser, sessionCookie, type AuthUser } from './auth';
import { assert, Db, HttpError, type Env } from './db';
import { checkOrigin, json, readJson } from './http';
import { mutations, queries, services, type Args, type ProcedureTable, type Services } from './procedures';

/** Everything a signed-in request needs, built once per request. */
interface Session {
  db: Db;
  user: AuthUser;
  token: string;
  services: Services;
}

/** Single entry point for every /api/* request. */
export class ApiRouter {
  constructor(private readonly env: Env) {}

  async handle(request: Request): Promise<Response> {
    try {
      return await this.route(request);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error('API error', err);
      return json({ error: 'Something went wrong on the server. Please try again.' }, 500);
    }
  }

  private async route(request: Request): Promise<Response> {
    assert(this.env.DB, 503, 'The D1 database binding "DB" is missing for this deployment.');
    const db = new Db(this.env.DB);
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, '').replace(/\/+$/, '') || '/';
    const method = request.method.toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') checkOrigin(request);

    if (path === '/auth/login' && method === 'POST') return this.login(db, request);
    if (path === '/auth/logout' && method === 'POST') return this.logout(db, request);

    const user = await requireUser(db, request);
    const session: Session = { db, user, token: readSessionToken(request) ?? '', services: services(db, this.env, user) };

    if (path === '/auth/session' && method === 'GET') return json({ user });
    if (path === '/query' && method === 'POST') return this.procedure(request, queries(session.services, user));
    if (path === '/mutation' && method === 'POST') {
      return this.procedure(request, mutations(session.services, db, user, session.token));
    }
    return this.files(request, url, path, method, session.services);
  }

  private async login(db: Db, request: Request) {
    const body = await readJson(request);
    const result = await login(db, String(body.username ?? ''), String(body.password ?? ''));
    return json({ user: result.user }, 200, { 'Set-Cookie': sessionCookie(result.token, result.maxAge) });
  }

  private async logout(db: Db, request: Request) {
    await logout(db, readSessionToken(request));
    return json({ success: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
  }

  private async procedure(request: Request, table: ProcedureTable) {
    const body = await readJson(request);
    const name = String(body.path ?? '');
    const handler = Object.hasOwn(table, name) ? table[name] : undefined;
    assert(handler, 404, `Unknown procedure: ${name}`);
    const args = body.args && typeof body.args === 'object' ? { ...(body.args as Args) } : {};
    return json({ value: (await handler(args)) ?? null });
  }

  /** File routes are authenticated and user-scoped like the rest: every id is checked against the session user inside the service. */
  private async files(request: Request, url: URL, path: string, method: string, s: Services) {
    if (path === '/files/upload' && method === 'PUT') {
      assert(request.body, 400, 'Missing file body');
      const id = await s.files.upload(request.body, {
        name: url.searchParams.get('name') || '',
        parentId: url.searchParams.get('parentId'),
        size: Number(request.headers.get('Content-Length') || 0),
        mimeType: request.headers.get('Content-Type') || 'application/octet-stream',
      });
      return json({ value: id });
    }
    if (path === '/files/zip' && method === 'GET') return s.files.zip((url.searchParams.get('ids') || '').split(',').filter(Boolean));

    const thumb = path.match(/^\/files\/([\w-]+)\/thumbnail$/);
    if (thumb && method === 'GET') return s.files.thumbnail(thumb[1]);
    if (thumb && method === 'PUT') {
      const num = (key: string) => Number(url.searchParams.get(key)) || undefined;
      const dimensions = { width: num('width'), height: num('height'), duration: num('duration') };
      return json({ value: await s.files.setThumbnail(thumb[1], await request.arrayBuffer(), dimensions) });
    }

    const content = path.match(/^\/files\/([\w-]+)\/content$/);
    if (content && method === 'GET') return s.files.content(content[1], url.searchParams.get('download') === '1');

    throw new HttpError(404, 'Not found');
  }
}

export const handleApi = (request: Request, env: Env) => new ApiRouter(env).handle(request);
