/**
 * Featherlight D1 access. The schema is owned by prisma/schema.prisma in the parent
 * project; this layer reads and writes the same tables with plain SQL so the SPA and
 * the legacy app can share one database.
 */
export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  /** Same secret as the legacy app; required to decrypt stored 2FA secrets. */
  JWT_SECRET?: string;
}

export type Row = Record<string, unknown>;

export class Db {
  constructor(private readonly d1: D1Database) {}

  async all<T = Row>(sql: string, ...params: unknown[]): Promise<T[]> {
    const { results } = await this.d1.prepare(sql).bind(...params).all<T>();
    return results ?? [];
  }

  async first<T = Row>(sql: string, ...params: unknown[]): Promise<T | null> {
    return (await this.d1.prepare(sql).bind(...params).first<T>()) ?? null;
  }

  async run(sql: string, ...params: unknown[]) {
    return this.d1.prepare(sql).bind(...params).run();
  }

  async batch(statements: { sql: string; params: unknown[] }[]) {
    if (!statements.length) return;
    await this.d1.batch(statements.map(s => this.d1.prepare(s.sql).bind(...s.params)));
  }

  /** Builds `UPDATE table SET a = ?, b = ? WHERE id = ?` from the defined keys of a patch. */
  async update(table: string, id: string, patch: Record<string, unknown>) {
    const keys = Object.keys(patch).filter(k => patch[k] !== undefined);
    if (!keys.length) return;
    const sets = keys.map(k => `"${k}" = ?`).join(', ');
    await this.run(`UPDATE "${table}" SET ${sets} WHERE id = ?`, ...keys.map(k => toSql(patch[k])), id);
  }
}

export const uuid = () => crypto.randomUUID();
export const nowIso = () => new Date().toISOString();
export const bool = (v: unknown) => v === 1 || v === true || v === '1' || v === 'true';
export function toSql(v: unknown) {
  if (typeof v === 'boolean') return v ? 1 : 0;
  return v ?? null;
}
/** Prisma stores DateTime as ISO text; legacy rows may use "+00:00" instead of "Z". */
export const iso = (v: unknown) => (v ? new Date(String(v)).toISOString() : null);

export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}
export const assert: (condition: unknown, status: number, message: string) => asserts condition = (condition, status, message) => {
  if (!condition) throw new HttpError(status, message);
};
