import bcrypt from 'bcryptjs';
import { Db, HttpError, nowIso, uuid } from './db';

export const SESSION_COOKIE = 'raqmi-session';
const SESSION_DAYS = 7;

export interface AuthUser {
  id: string;
  username: string;
}

export function readSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function sessionCookie(token: string, maxAgeSeconds: number) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSeconds}`;
}

/** Resolves the Session row for a token (shared `Session` table), or null when missing/expired. */
export async function resolveSession(db: Db, token: string | null): Promise<AuthUser | null> {
  if (!token) return null;
  const row = await db.first<{ id: string; username: string; expiresAt: string }>(
    'SELECT u.id, u.username, s.expiresAt FROM Session s JOIN User u ON u.id = s.userId WHERE s.token = ?',
    token,
  );
  if (!row || new Date(row.expiresAt).getTime() < Date.now()) return null;
  return { id: row.id, username: row.username };
}

export async function requireUser(db: Db, request: Request): Promise<AuthUser> {
  const user = await resolveSession(db, readSessionToken(request));
  if (!user) throw new HttpError(401, 'Your session has ended. Please sign in again.');
  return user;
}

/** Verifies the password hash server-side; the hash never leaves the worker. */
export async function login(db: Db, username: string, password: string) {
  const user = await db.first<{ id: string; username: string; passwordHash: string }>(
    'SELECT id, username, passwordHash FROM User WHERE username = ?',
    username.trim(),
  );
  // Compare against a dummy hash when the user is missing so timing does not reveal usernames.
  const hash = user?.passwordHash ?? '$2b$12$bruv8LOuw6KM4hxYHTrSEuEDefKbJMOD1tnqz9z9noJocHit.GtoG';
  const valid = await bcrypt.compare(password, hash);
  if (!user || !valid) throw new HttpError(401, 'Invalid username or password');

  const token = `${uuid()}${uuid()}`.replace(/-/g, '');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await db.run('INSERT INTO Session (id, userId, token, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)', uuid(), user.id, token, expiresAt, nowIso());
  // Opportunistic cleanup of this user's expired sessions.
  await db.run('DELETE FROM Session WHERE userId = ? AND expiresAt < ?', user.id, nowIso());
  return { token, maxAge: SESSION_DAYS * 86400, user: { id: user.id, username: user.username } };
}

export async function logout(db: Db, token: string | null) {
  if (token) await db.run('DELETE FROM Session WHERE token = ?', token);
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(12);
  return { hash: await bcrypt.hash(password, salt), salt };
}

export async function verifyPassword(db: Db, userId: string, password: string) {
  const row = await db.first<{ passwordHash: string }>('SELECT passwordHash FROM User WHERE id = ?', userId);
  return !!row && bcrypt.compare(password, row.passwordHash);
}
