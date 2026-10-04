import { assert, bool, iso, nowIso, uuid } from '../db';
import { streamZip, type ZipEntry } from '../zip';
import { BaseService, reqStr } from './base';

interface FileRow {
  id: string; name: string; type: string; category: string | null; parentId: string | null; size: number | null;
  storageId: string | null; r2Key: string | null; storageSource: string | null; starred: number | null; lastAccessed: number | null;
  mimeType: string | null; width: number | null; height: number | null; duration: number | null; thumbnailR2Key: string | null;
  createdAt: string; updatedAt: string;
}

const categoryOf = (mime: string, name: string) => {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) return 'pdf';
  if (/zip|gzip|tar|rar|7z/.test(mime)) return 'archive';
  if (/text|word|document|sheet|excel|presentation|powerpoint|json|csv/.test(mime)) return 'document';
  return 'other';
};
const MAX_ZIP_ROOTS = 200, MAX_ZIP_FILES = 1000;
/** One archive path segment: no separators or characters Windows refuses, and never `.`/`..`. */
const zipSegment = (name: string) => {
  const safe = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim();
  return !safe || /^\.+$/.test(safe) ? '_' : safe;
};
const cleanName = (name: string) => name.replace(/[\\/\u0000-\u001f]/g, '_').trim().slice(0, 255);

/** `FileItem` rows form a folder tree; file bytes live in the R2 bucket under `r2Key`. */
export class FileService extends BaseService {
  private serialize(f: FileRow) {
    return {
      id: f.id, name: f.name, type: f.type, category: f.category, parentId: f.parentId, size: f.size ?? 0,
      mimeType: f.mimeType, width: f.width, height: f.height, duration: f.duration, thumbnail: f.type === 'file' && !!f.thumbnailR2Key, starred: bool(f.starred), storageSource: f.storageSource,
      // Only R2-backed files can be served by this deployment.
      available: f.type === 'folder' || !!f.r2Key,
      createdAt: iso(f.createdAt), updatedAt: iso(f.updatedAt),
    };
  }

  async list(args: { parentId?: unknown; starred?: unknown }) {
    const parentId = typeof args.parentId === 'string' && args.parentId ? args.parentId : null;
    if (parentId) await this.owned('FileItem', parentId, 'Folder');
    const rows = args.starred
      ? await this.db.all<FileRow>('SELECT * FROM FileItem WHERE userId = ? AND starred = 1 ORDER BY updatedAt DESC', this.user.id)
      : await this.db.all<FileRow>(
        `SELECT * FROM FileItem WHERE userId = ? AND parentId ${parentId ? '= ?' : 'IS NULL'} ORDER BY CASE type WHEN 'folder' THEN 0 ELSE 1 END, name COLLATE NOCASE`,
        ...(parentId ? [this.user.id, parentId] : [this.user.id]),
      );
    return { items: rows.map(r => this.serialize(r)), path: await this.path(parentId) };
  }

  private async path(folderId: string | null) {
    const path: { id: string; name: string }[] = [];
    for (let id = folderId, guard = 0; id && guard < 50; guard++) {
      const row = await this.db.first<{ id: string; name: string; parentId: string | null }>('SELECT id, name, parentId FROM FileItem WHERE id = ? AND userId = ?', id, this.user.id);
      if (!row) break;
      path.unshift({ id: row.id, name: row.name });
      id = row.parentId;
    }
    return path;
  }

  async stats() {
    const r = await this.db.first<{ bytes: number | null; count: number }>("SELECT SUM(size) bytes, COUNT(*) count FROM FileItem WHERE userId = ? AND type = 'file'", this.user.id);
    return { totalBytes: r?.bytes ?? 0, count: r?.count ?? 0 };
  }

  async createFolder(args: { name?: unknown; parentId?: unknown }) {
    const parentId = await this.folderOrRoot(args.parentId);
    const id = uuid(), now = nowIso();
    await this.db.run(
      "INSERT INTO FileItem (id, userId, name, type, parentId, starred, createdAt, updatedAt) VALUES (?, ?, ?, 'folder', ?, 0, ?, ?)",
      id, this.user.id, cleanName(reqStr(args.name, 'Folder name', 255)), parentId, now, now,
    );
    return id;
  }

  /** Stores an uploaded body in R2 and records it in the tree. */
  async upload(body: ReadableStream | ArrayBuffer, args: { name: string; parentId: string | null; mimeType: string; size: number }) {
    assert(this.env.BUCKET, 503, 'File storage (R2) is not bound to this deployment.');
    const parentId = await this.folderOrRoot(args.parentId);
    const name = cleanName(args.name);
    assert(name, 400, 'File name is required');
    const id = uuid(), now = nowIso();
    const r2Key = `overhaul/${this.user.id}/${id}/${encodeURIComponent(name)}`;
    const mimeType = args.mimeType || 'application/octet-stream';
    const object = await this.env.BUCKET.put(r2Key, body, { httpMetadata: { contentType: mimeType } });
    await this.db.run(
      "INSERT INTO FileItem (id, userId, name, type, category, parentId, size, r2Key, storageSource, starred, mimeType, createdAt, updatedAt) VALUES (?, ?, ?, 'file', ?, ?, ?, ?, 'r2', 0, ?, ?, ?)",
      id, this.user.id, name, categoryOf(mimeType, name), parentId, object?.size ?? args.size, r2Key, mimeType, now, now,
    );
    return id;
  }

  /** Streams a file's bytes from R2. */
  async content(id: string, download: boolean) {
    const file = await this.owned<FileRow>('FileItem', id, 'File');
    assert(file.type === 'file' && file.r2Key, 404, 'This file is not stored in R2');
    assert(this.env.BUCKET, 503, 'File storage (R2) is not bound to this deployment.');
    const object = await this.env.BUCKET.get(file.r2Key);
    assert(object, 404, 'File contents are missing from storage');
    await this.db.run('UPDATE FileItem SET lastAccessed = ? WHERE id = ?', Date.now(), file.id);
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    if (!headers.get('Content-Type')) headers.set('Content-Type', file.mimeType || 'application/octet-stream');
    headers.set('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    headers.set('Cache-Control', 'private, max-age=300');
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(object.body, { headers });
  }

  /** Serves the small preview image generated for a file. */
  async thumbnail(id: string) {
    const file = await this.owned<FileRow>('FileItem', id, 'File');
    assert(file.thumbnailR2Key, 404, 'This file has no thumbnail');
    assert(this.env.BUCKET, 503, 'File storage (R2) is not bound to this deployment.');
    const object = await this.env.BUCKET.get(file.thumbnailR2Key);
    assert(object, 404, 'Thumbnail is missing from storage');
    return new Response(object.body, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=86400', 'X-Content-Type-Options': 'nosniff' } });
  }

  /** Stores a client-generated JPEG preview (and the source dimensions) for an uploaded image or video. */
  async setThumbnail(id: string, body: ArrayBuffer, args: { width?: number; height?: number; duration?: number }) {
    const file = await this.owned<FileRow>('FileItem', id, 'File');
    assert(file.type === 'file' && /^(image|video)\//.test(file.mimeType || ''), 400, 'Only images and videos have thumbnails');
    assert(body.byteLength > 0 && body.byteLength <= 512 * 1024, 400, 'Thumbnail must be under 512 KB');
    assert(this.env.BUCKET, 503, 'File storage (R2) is not bound to this deployment.');
    const key = `overhaul/${this.user.id}/${file.id}/thumbnail.jpg`;
    await this.env.BUCKET.put(key, body, { httpMetadata: { contentType: 'image/jpeg' } });
    const dim = (n?: number) => (n && Number.isFinite(n) && n > 0 ? Math.round(n) : undefined);
    await this.db.update('FileItem', file.id, {
      thumbnailR2Key: key, width: dim(args.width), height: dim(args.height),
      duration: args.duration && Number.isFinite(args.duration) && args.duration > 0 ? args.duration : undefined,
    });
    return { success: true };
  }

  /** Resolves a selection (files and whole folder trees) into archive entries, validating ownership of every root. */
  private async zipPlan(ids: unknown) {
    assert(Array.isArray(ids) && ids.length > 0, 400, 'Nothing selected');
    const roots = [...new Set(ids.map(String))];
    assert(roots.length <= MAX_ZIP_ROOTS, 400, `Select at most ${MAX_ZIP_ROOTS} items to download at once`);
    const used = new Set<string>(), entries: (ZipEntry & { key?: string; size: number })[] = [];
    // Siblings with the same name get " (2)", " (3)" ... so nothing silently overwrites inside the archive.
    const unique = (bare: string, dir: boolean) => {
      const dot = dir ? -1 : bare.lastIndexOf('.'), slash = bare.lastIndexOf('/');
      const stem = dot > slash + 1 ? bare.slice(0, dot) : bare, ext = dot > slash + 1 ? bare.slice(dot) : '';
      for (let n = 1; ; n++) {
        const candidate = `${n === 1 ? stem : `${stem} (${n})`}${ext}${dir ? '/' : ''}`;
        if (!used.has(candidate.toLowerCase())) { used.add(candidate.toLowerCase()); return candidate; }
      }
    };
    let files = 0, folders = 0, bytes = 0, skipped = 0;
    for (const id of roots) {
      const root = await this.owned<FileRow>('FileItem', id, 'File');
      // One query per selected root; D1/R2 subrequests are a scarce budget on the edge.
      const rows = await this.db.all<FileRow>(
        `WITH RECURSIVE tree(id) AS (SELECT id FROM FileItem WHERE id = ? AND userId = ? UNION ALL SELECT f.id FROM FileItem f JOIN tree t ON f.parentId = t.id WHERE f.userId = ?)
         SELECT * FROM FileItem WHERE id IN (SELECT id FROM tree)`, root.id, this.user.id, this.user.id);
      const byId = new Map(rows.map(r => [r.id, r]));
      const pathOf = (row: FileRow) => {
        const parts: string[] = [];
        for (let cur: FileRow | undefined = row, guard = 0; cur && guard < 100; guard++) { parts.unshift(zipSegment(cur.name)); cur = cur.id === root.id ? undefined : byId.get(cur.parentId ?? ''); }
        return parts.join('/');
      };
      const hasChildren = new Set(rows.map(r => r.parentId));
      const base = unique(pathOf(root), root.type === 'folder');
      const rel = (row: FileRow) => base.replace(/\/$/, '') + pathOf(row).slice(pathOf(root).length);
      for (const row of rows.sort((a, b) => pathOf(a).localeCompare(pathOf(b)))) {
        if (row.type === 'folder') {
          folders++;
          // Non-empty folders appear implicitly through their files; only empty ones need an explicit directory entry.
          if (row.id === root.id) { if (!hasChildren.has(row.id)) entries.push({ path: base, size: 0 }); }
          else if (!hasChildren.has(row.id)) entries.push({ path: unique(rel(row), true), size: 0 });
        } else if (row.r2Key) {
          files++; bytes += row.size ?? 0;
          entries.push({ path: row.id === root.id ? base : unique(rel(row), false), size: row.size ?? 0, key: row.r2Key, modified: Date.parse(row.updatedAt) || undefined });
        } else skipped++;
      }
      assert(files <= MAX_ZIP_FILES, 400, `That selection holds more than ${MAX_ZIP_FILES} files. Download it in smaller parts.`);
    }
    const first = roots.length === 1 ? await this.owned<FileRow>('FileItem', roots[0], 'File') : null;
    const name = first?.type === 'folder' ? `${zipSegment(first.name)}.zip` : `raqmi-files-${new Date().toISOString().slice(0, 10)}.zip`;
    return { name, entries, files, folders, bytes, skipped };
  }

  /** Preflight for the client: validates the selection and reports what the archive will hold. */
  async zipInfo(args: { ids?: unknown }) {
    const { name, files, folders, bytes, skipped } = await this.zipPlan(args.ids);
    assert(files + folders > 0, 400, 'Nothing in the selection can be downloaded');
    return { name, files, folders, bytes, skipped };
  }

  /** Streams the selection as a ZIP, reading each object from R2 on the server so bytes never round-trip through the browser. */
  async zip(ids: string[]) {
    assert(this.env.BUCKET, 503, 'File storage (R2) is not bound to this deployment.');
    const bucket = this.env.BUCKET;
    const { name, entries } = await this.zipPlan(ids);
    assert(entries.length > 0, 400, 'Nothing in the selection can be downloaded');
    const body = streamZip(entries.map(({ path, modified, key }) => ({
      path, modified,
      open: key === undefined ? undefined : async () => (await bucket.get(key))?.body ?? null,
    })));
    return new Response(body, { headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${name.replace(/[^\x20-\x7e]|["\\]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    } });
  }

  async rename(args: { id?: unknown; name?: unknown }) {
    const file = await this.owned<FileRow>('FileItem', args.id, 'File');
    await this.db.update('FileItem', file.id, { name: cleanName(reqStr(args.name, 'Name', 255)), updatedAt: nowIso() });
    return { success: true };
  }

  async toggleStar(args: { id?: unknown }) {
    const file = await this.owned<FileRow>('FileItem', args.id, 'File');
    await this.db.run('UPDATE FileItem SET starred = ? WHERE id = ?', bool(file.starred) ? 0 : 1, file.id);
    return { starred: !bool(file.starred) };
  }

  async move(args: { id?: unknown; parentId?: unknown }) {
    const file = await this.owned<FileRow>('FileItem', args.id, 'File');
    const parentId = await this.folderOrRoot(args.parentId);
    for (const step of await this.path(parentId)) assert(step.id !== file.id, 400, 'A folder cannot be moved inside itself');
    await this.db.update('FileItem', file.id, { parentId, updatedAt: nowIso() });
    return { success: true };
  }

  /** Deletes a file or a whole folder subtree, including the stored R2 objects. */
  async remove(args: { id?: unknown }) {
    const root = await this.owned<FileRow>('FileItem', args.id, 'File');
    const doomed: FileRow[] = [];
    for (let queue = [root]; queue.length;) {
      const item = queue.shift()!;
      doomed.push(item);
      if (item.type === 'folder') queue = queue.concat(await this.db.all<FileRow>('SELECT * FROM FileItem WHERE parentId = ? AND userId = ?', item.id, this.user.id));
    }
    const keys = doomed.flatMap(f => [f.r2Key, f.thumbnailR2Key]).filter((k): k is string => !!k);
    if (keys.length && this.env.BUCKET) await this.env.BUCKET.delete(keys);
    // Children first so the parent foreign key never blocks a delete.
    await this.db.batch(doomed.reverse().map(f => ({ sql: 'DELETE FROM FileItem WHERE id = ?', params: [f.id] })));
    return { removed: doomed.length };
  }

  private async folderOrRoot(id: unknown) {
    if (typeof id !== 'string' || !id) return null;
    const folder = await this.owned<FileRow>('FileItem', id, 'Folder');
    assert(folder.type === 'folder', 400, 'Target is not a folder');
    return folder.id;
  }
}
