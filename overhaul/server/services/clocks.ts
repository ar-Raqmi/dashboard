import { assert, uuid } from '../db';
import { BaseService, reqStr } from './base';

const validZone = (zone: unknown) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: String(zone) });
    return String(zone);
  } catch {
    assert(false, 400, 'Unknown time zone');
  }
};

export class ClockService extends BaseService {
  list() {
    return this.db.all<{ id: string; label: string; timezone: string }>('SELECT id, label, timezone FROM Clock WHERE userId = ? ORDER BY rowid', this.user.id);
  }

  async add(args: { label?: unknown; timezone?: unknown }) {
    const id = uuid();
    await this.db.run('INSERT INTO Clock (id, userId, label, timezone) VALUES (?, ?, ?, ?)', id, this.user.id, reqStr(args.label, 'City name', 80), validZone(args.timezone));
    return id;
  }

  async update(args: { id?: unknown; label?: unknown; timezone?: unknown }) {
    const clock = await this.owned<{ id: string }>('Clock', args.id, 'Clock');
    await this.db.update('Clock', clock.id, { label: reqStr(args.label, 'City name', 80), timezone: validZone(args.timezone) });
    return { success: true };
  }

  async remove(args: { id?: unknown }) {
    const clock = await this.owned<{ id: string }>('Clock', args.id, 'Clock');
    await this.db.run('DELETE FROM Clock WHERE id = ?', clock.id);
    return { success: true };
  }
}
