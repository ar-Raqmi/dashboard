import { hashPassword, login, logout, readSessionToken, requireUser, sessionCookie, verifyPassword, type AuthUser } from './auth';
import { assert, Db, HttpError, type Env } from './db';
import { ClockService } from './services/clocks';
import { ContentService } from './services/content';
import { EventService } from './services/events';
import { FileService } from './services/files';
import { GoalService } from './services/goals';
import { NoteService } from './services/notes';
import { PreferenceService, WidgetService } from './services/preferences';
import { SettingService } from './services/settings';
import { TaskService } from './services/tasks';
import { TwoFactorService } from './services/twoFactor';

type Args = Record<string, unknown>;
type Handler = (args: Args) => unknown;

/** One request's worth of user-scoped services. */
function services(db: Db, env: Env, user: AuthUser) {
  return {
    tasks: new TaskService(db, env, user),
    goals: new GoalService(db, env, user),
    notes: new NoteService(db, env, user),
    events: new EventService(db, env, user),
    clocks: new ClockService(db, env, user),
    settings: new SettingService(db, env, user),
    preferences: new PreferenceService(db, env, user),
    widgets: new WidgetService(db, env, user),
    twoFactor: new TwoFactorService(db, env, user),
    files: new FileService(db, env, user),
    content: new ContentService(db, env, user),
  };
}
type Services = ReturnType<typeof services>;

const queries = (s: Services, user: AuthUser): Record<string, Handler> => ({
  'auth:me': () => user,
  /** Everything the shell needs on first paint, in one round trip. */
  'workspace:load': async args => {
    const [tasks, goals, notes, events, clocks, settings, preferences, widgets] = await Promise.all([
      s.tasks.list(args), s.goals.list(), s.notes.list(), s.events.list(args), s.clocks.list(),
      s.settings.get(), s.preferences.load(), s.widgets.list(),
    ]);
    return { user, ...tasks, goals, notes, events, clocks, settings, preferences, widgets };
  },
  'tasks:list': args => s.tasks.list(args),
  'goals:list': () => s.goals.list(),
  'notes:list': () => s.notes.list(),
  'events:list': args => s.events.list(args),
  'clocks:list': () => s.clocks.list(),
  'settings:get': () => s.settings.get(),
  'preferences:get': () => s.preferences.load(),
  'widgets:list': () => s.widgets.list(),
  'twoFactor:list': () => s.twoFactor.list(),
  'files:list': args => s.files.list(args),
  'files:stats': () => s.files.stats(),
  'content:verse': args => s.content.verse(args),
  'content:hadith': args => s.content.hadith(args),
  'content:prayer': args => s.content.prayer(args),
});

const mutations = (s: Services, db: Db, user: AuthUser): Record<string, Handler> => ({
  'tasks:create': args => s.tasks.create(args),
  'tasks:update': args => s.tasks.update(args),
  'tasks:remove': args => s.tasks.remove(args),
  'tasks:toggleStatus': args => s.tasks.toggle(args),
  'tasks:setOccurrenceException': args => s.tasks.setOccurrence(args),
  'tasks:deleteCompleted': () => s.tasks.deleteCompleted(),

  'goals:create': args => s.goals.create(args),
  'goals:update': args => s.goals.update(args),
  'goals:remove': args => s.goals.remove(args),
  'goals:reorder': args => s.goals.reorder(args),
  'goals:addMilestone': args => s.goals.addMilestone(args),
  'goals:updateMilestone': args => s.goals.updateMilestone(args),
  'goals:toggleMilestone': args => s.goals.toggleMilestone(args),
  'goals:removeMilestone': args => s.goals.removeMilestone(args),

  'notes:create': args => s.notes.create(args),
  'notes:update': args => s.notes.update(args),
  'notes:remove': args => s.notes.remove(args),
  'notes:togglePinned': args => s.notes.togglePinned(args),

  'events:create': args => s.events.create(args),
  'events:update': args => s.events.update(args),
  'events:remove': args => s.events.remove(args),
  'events:setOccurrenceException': args => s.events.setOccurrence(args),

  'clocks:add': args => s.clocks.add(args),
  'clocks:update': args => s.clocks.update(args),
  'clocks:remove': args => s.clocks.remove(args),

  'settings:update': args => s.settings.update(args),
  'preferences:update': args => s.preferences.update(args),
  'widgets:toggle': args => s.widgets.toggle(args),

  'twoFactor:create': args => s.twoFactor.create(args),
  'twoFactor:update': args => s.twoFactor.update(args),
  'twoFactor:remove': args => s.twoFactor.remove(args),

  'files:createFolder': args => s.files.createFolder(args),
  'files:rename': args => s.files.rename(args),
  'files:move': args => s.files.move(args),
  'files:toggleStar': args => s.files.toggleStar(args),
  'files:remove': args => s.files.remove(args),

  'auth:changePassword': async args => {
    assert(await verifyPassword(db, user.id, String(args.currentPassword ?? '')), 400, 'Current password is incorrect');
    const next = String(args.newPassword ?? '');
    assert(next.length >= 8, 400, 'New password must be at least 8 characters');
    const { hash, salt } = await hashPassword(next);
    await db.run('UPDATE User SET passwordHash = ?, salt = ? WHERE id = ?', hash, salt, user.id);
    // Sign out every other session.
    await db.run('DELETE FROM Session WHERE userId = ? AND token != ?', user.id, String(args.__token ?? ''));
    return { success: true };
  },
});

const json = (value: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });

async function readJson(request: Request): Promise<Args> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? (body as Args) : {};
  } catch {
    throw new HttpError(400, 'Request body must be JSON');
  }
}

/** Rejects cross-site state-changing requests (cookies are SameSite=Strict too). */
function checkOrigin(request: Request) {
  const origin = request.headers.get('Origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) throw new HttpError(403, 'Cross-origin request rejected');
}

async function route(request: Request, env: Env): Promise<Response> {
  assert(env.DB, 503, 'The D1 database binding "DB" is missing for this deployment.');
  const db = new Db(env.DB);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '').replace(/\/+$/, '') || '/';
  const method = request.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') checkOrigin(request);

  if (path === '/auth/login' && method === 'POST') {
    const body = await readJson(request);
    const result = await login(db, String(body.username ?? ''), String(body.password ?? ''));
    return json({ user: result.user }, 200, { 'Set-Cookie': sessionCookie(result.token, result.maxAge) });
  }
  if (path === '/auth/logout' && method === 'POST') {
    await logout(db, readSessionToken(request));
    return json({ success: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
  }

  const user = await requireUser(db, request);
  const s = services(db, env, user);

  if (path === '/auth/session' && method === 'GET') return json({ user });

  if ((path === '/query' || path === '/mutation') && method === 'POST') {
    const body = await readJson(request);
    const table = path === '/query' ? queries(s, user) : mutations(s, db, user);
    const name = String(body.path ?? '');
    const handler = Object.hasOwn(table, name) ? table[name] : undefined;
    assert(handler, 404, `Unknown ${path.slice(1)} path: ${name}`);
    const args = body.args && typeof body.args === 'object' ? { ...(body.args as Args) } : {};
    if (name === 'auth:changePassword') args.__token = readSessionToken(request);
    return json({ value: (await handler(args)) ?? null });
  }

  if (path === '/files/upload' && method === 'PUT') {
    assert(request.body, 400, 'Missing file body');
    const name = url.searchParams.get('name') || '';
    const size = Number(request.headers.get('Content-Length') || 0);
    const id = await s.files.upload(request.body, {
      name, parentId: url.searchParams.get('parentId'), size,
      mimeType: request.headers.get('Content-Type') || 'application/octet-stream',
    });
    return json({ value: id });
  }

  const content = path.match(/^\/files\/([\w-]+)\/content$/);
  if (content && method === 'GET') return s.files.content(content[1], url.searchParams.get('download') === '1');

  throw new HttpError(404, 'Not found');
}

/** Single entry point for every /api/* request. */
export async function handleApi(request: Request, env: Env): Promise<Response> {
  try {
    return await route(request, env);
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error('API error', err);
    return json({ error: 'Something went wrong on the server. Please try again.' }, 500);
  }
}
