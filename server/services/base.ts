import type { AuthUser } from '../auth';
import { assert, type Db, type Env, type Row } from '../db';

/** Domain services are scoped to the signed-in user for the lifetime of one request. */
export abstract class BaseService {
  constructor(protected readonly db: Db, protected readonly env: Env, protected readonly user: AuthUser) {}

  /** Loads a row that must belong to the current user, or fails with 404. */
  protected async owned<T = Row>(table: string, id: unknown, label = table): Promise<T> {
    assert(typeof id === 'string' && id, 400, `Missing ${label.toLowerCase()} id`);
    const row = await this.db.first<T>(`SELECT * FROM "${table}" WHERE id = ? AND userId = ?`, id, this.user.id);
    assert(row, 404, `${label} not found`);
    return row;
  }
}

export const str = (v: unknown, max = 5000) => (typeof v === 'string' ? v.slice(0, max) : undefined);
export const reqStr = (v: unknown, label: string, max = 500) => {
  const s = typeof v === 'string' ? v.trim().slice(0, max) : '';
  assert(s, 400, `${label} is required`);
  return s;
};
export const optDate = (v: unknown) => {
  if (v === null || v === '') return null;
  if (v === undefined) return undefined;
  assert(typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v), 400, 'Dates must be YYYY-MM-DD');
  return v;
};
export const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback?: T): T | undefined => {
  if (v === undefined) return fallback;
  assert(options.includes(v as T), 400, `Expected one of: ${options.join(', ')}`);
  return v as T;
};
