import { bool, iso, nowIso, uuid } from '../db';
import { BaseService, str } from './base';

interface NoteRow { id: string; title: string; content: string; color: string; pinned: number; createdAt: string; updatedAt: string }
const COLOR = /^#[0-9a-fA-F]{6}$/;

export class NoteService extends BaseService {
  async list() {
    const rows = await this.db.all<NoteRow>('SELECT * FROM Note WHERE userId = ? ORDER BY updatedAt DESC', this.user.id);
    return rows.map(n => ({ id: n.id, title: n.title, content: n.content, color: n.color, pinned: bool(n.pinned), createdAt: iso(n.createdAt), updatedAt: iso(n.updatedAt) }));
  }

  async create(args: { title?: unknown; content?: unknown; color?: unknown; pinned?: unknown }) {
    const id = uuid(), now = nowIso();
    await this.db.run(
      'INSERT INTO Note (id, userId, title, content, color, pinned, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      id, this.user.id, (str(args.title, 300) || '').trim() || 'Untitled note', str(args.content, 200000) ?? '',
      COLOR.test(String(args.color)) ? args.color : '#A7C080', args.pinned ? 1 : 0, now, now,
    );
    return id;
  }

  async update(args: { id?: unknown; title?: unknown; content?: unknown; color?: unknown; pinned?: unknown }) {
    const note = await this.owned<NoteRow>('Note', args.id, 'Note');
    await this.db.update('Note', note.id, {
      title: args.title === undefined ? undefined : (str(args.title, 300) || '').trim() || 'Untitled note',
      content: str(args.content, 200000),
      color: COLOR.test(String(args.color)) ? args.color : undefined,
      pinned: args.pinned === undefined ? undefined : !!args.pinned,
      updatedAt: nowIso(),
    });
    return { success: true };
  }

  async togglePinned(args: { id?: unknown }) {
    const note = await this.owned<NoteRow>('Note', args.id, 'Note');
    await this.db.run('UPDATE Note SET pinned = ? WHERE id = ?', bool(note.pinned) ? 0 : 1, note.id);
    return { success: true };
  }

  async remove(args: { id?: unknown }) {
    const note = await this.owned<NoteRow>('Note', args.id, 'Note');
    await this.db.run('DELETE FROM Note WHERE id = ?', note.id);
    return { success: true };
  }
}
