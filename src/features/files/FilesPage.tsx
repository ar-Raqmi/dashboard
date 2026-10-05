import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type MutableRefObject } from 'react';
import { ApiClient, ApiError } from '@/lib/api';
import { useMarquee } from '@/features/files/useMarquee';
import { useStore, type FileView } from '@/store';
import { formatBytes, shortDate } from '@/lib/date';
import { makeThumbnail } from '@/lib/thumbnail';
import { Icon, type IconName } from '@/components/Icon';
import { ConfirmModal, Modal } from '@/components/Modal';

interface Listing { items: FileView[]; path: { id: string; name: string }[] }
interface Loc { folderId: string | null; starred: boolean }
interface Outcome { item: FileView; error?: string }
type SortKey = 'name' | 'size' | 'date';
interface MenuEntry { label: string; icon?: IconName; danger?: boolean; run: () => void }

const ROOT: Loc = { folderId: null, starred: false };
const SORTS: [SortKey, string][] = [['name', 'Name'], ['size', 'Size'], ['date', 'Modified']];
const isCoarse = () => window.matchMedia('(pointer: coarse)').matches;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function download(url: string, name: string) {
  const link = document.createElement('a');
  link.href = url; link.download = name; link.rel = 'noreferrer';
  document.body.appendChild(link); link.click(); link.remove();
}

export function FilesPage({ notify, uploadTrigger }: { notify: (message: string) => void; uploadTrigger: MutableRefObject<(() => void) | null> }) {
  const mutate = useStore(s => s.mutate);
  // Internal history stack: back/forward/up all move through it, so the page behaves like a file manager.
  const [nav, setNav] = useState({ stack: [ROOT], index: 0 });
  const { folderId, starred: starredOnly } = nav.stack[nav.index];
  const [listing, setListing] = useState<Listing | null>(null), [stats, setStats] = useState<{ totalBytes: number; count: number } | null>(null);
  const [error, setError] = useState(''), [uploading, setUploading] = useState(0), [dragging, setDragging] = useState(false);
  const [naming, setNaming] = useState<{ mode: 'folder' } | { mode: 'rename'; item: FileView } | null>(null);
  const [deleting, setDeleting] = useState<FileView[] | null>(null), [moving, setMoving] = useState<FileView[] | null>(null), [report, setReport] = useState<{ verb: string; outcomes: Outcome[] } | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'name', desc: false });
  const [selected, setSelected] = useState<Set<string>>(new Set()), [menu, setMenu] = useState<{ x: number; y: number; targets: FileView[] } | null>(null);
  const input = useRef<HTMLInputElement>(null), area = useRef<HTMLDivElement>(null), anchor = useRef<string | null>(null);
  const fail = (err: unknown) => notify((err as Error).message);

  const go = (next: Loc) => setNav(n => ({ stack: [...n.stack.slice(0, n.index + 1), next], index: n.index + 1 }));
  const back = () => setNav(n => ({ ...n, index: Math.max(0, n.index - 1) }));
  const forward = () => setNav(n => ({ ...n, index: Math.min(n.stack.length - 1, n.index + 1) }));
  const parent = listing?.path.length ? (listing.path[listing.path.length - 2]?.id ?? null) : null;
  const canUp = starredOnly || !!folderId;
  const up = () => go(starredOnly ? ROOT : { folderId: parent, starred: false });

  const load = useCallback(async () => {
    try {
      const [next, nextStats] = await Promise.all([
        ApiClient.query<Listing>('files:list', { parentId: folderId, starred: starredOnly }),
        ApiClient.query<{ totalBytes: number; count: number }>('files:stats'),
      ]);
      setListing(next);
      setStats(nextStats);
      setSelected(prev => { const live = new Set(next.items.map(i => i.id)); const kept = [...prev].filter(id => live.has(id)); return kept.length === prev.size ? prev : new Set(kept); });
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }, [folderId, starredOnly]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setSelected(new Set()); setMenu(null); anchor.current = null; }, [folderId, starredOnly]);
  useEffect(() => { uploadTrigger.current = () => input.current?.click(); return () => { uploadTrigger.current = null; }; }, [uploadTrigger]);
  // Mouse back/forward buttons navigate the folder history while the Files page is open.
  useEffect(() => {
    const onMouse = (e: MouseEvent) => { if (e.button === 3) { e.preventDefault(); back(); } else if (e.button === 4) { e.preventDefault(); forward(); } };
    window.addEventListener('mouseup', onMouse);
    return () => window.removeEventListener('mouseup', onMouse);
  }, []);

  const items = useMemo(() => {
    const dir = sort.desc ? -1 : 1, list = [...(listing?.items ?? [])];
    return list.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      const byName = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      const diff = sort.key === 'size' ? a.size - b.size : sort.key === 'date' ? Date.parse(a.updatedAt) - Date.parse(b.updatedAt) : byName;
      return (diff || byName) * dir;
    });
  }, [listing, sort]);
  const chosen = useMemo(() => items.filter(i => selected.has(i.id)), [items, selected]);

  const selectedRef = useRef(selected); selectedRef.current = selected;
  const rect = useMarquee(area, () => selectedRef.current, ids => setSelected(ids), additive => { if (!additive) setSelected(new Set()); });

  async function upload(files: File[]) {
    if (!files.length) return;
    setUploading(n => n + files.length);
    let ok = 0;
    for (const file of files) {
      try {
        const id = await ApiClient.upload(file, starredOnly ? null : folderId);
        ok++;
        // Preview generation is best-effort: a file without one simply keeps the icon.
        const thumb = await makeThumbnail(file);
        if (thumb) await ApiClient.putThumbnail(id, thumb.blob, thumb).catch(() => undefined);
      } catch (err) {
        notify(`${file.name}: ${(err as Error).message}`);
      } finally {
        setUploading(n => n - 1);
      }
    }
    if (ok) notify(`${ok} file${ok === 1 ? '' : 's'} uploaded`);
    await load();
  }

  const act = (path: string, args: Record<string, unknown>, message: string) =>
    void mutate(path, args, []).then(() => { notify(message); return load(); }).catch(fail);

  // --- bulk helpers: every item is attempted, and the result says exactly which ones worked ---
  async function runBulk(targets: FileView[], run: (item: FileView) => Promise<unknown>, tolerate?: (err: unknown) => boolean) {
    const outcomes: Outcome[] = await Promise.all(targets.map(async item => {
      try { await run(item); return { item }; } catch (err) { return tolerate?.(err) ? { item } : { item, error: (err as Error).message }; }
    }));
    const failed = outcomes.filter(o => o.error);
    if (!failed.length) notify(targets.length === 1 ? `${targets[0].name} ${bulkVerb.current}` : `${plural(targets.length, 'item')} ${bulkVerb.current}`);
    else { notify(`${targets.length - failed.length} of ${targets.length} ${bulkVerb.current}; ${failed.length} failed`); setReport({ verb: bulkVerb.current, outcomes }); }
    // Moved or deleted items have left this folder, so only the failures stay selected; starring keeps the selection.
    if (bulkVerb.current === 'deleted' || bulkVerb.current === 'moved') setSelected(new Set(failed.map(o => o.item.id)));
    await load();
  }
  const bulkVerb = useRef('');
  const bulk = (verb: string, targets: FileView[], run: (item: FileView) => Promise<unknown>, tolerate?: (err: unknown) => boolean) => { bulkVerb.current = verb; return runBulk(targets, run, tolerate); };

  const deleteItems = (targets: FileView[]) => bulk('deleted', targets, i => mutate('files:remove', { id: i.id }, []), err => err instanceof ApiError && err.status === 404);
  const moveItems = (targets: FileView[], parentId: string | null) => bulk('moved', targets, i => mutate('files:move', { id: i.id, parentId }, []));
  function starItems(targets: FileView[]) {
    const star = targets.some(i => !i.starred); // mixed selection: star everything; all starred: unstar all
    return bulk(star ? 'starred' : 'unstarred', targets.filter(i => i.starred !== star), i => mutate('files:toggleStar', { id: i.id }, []));
  }

  async function downloadItems(targets: FileView[]) {
    if (targets.length === 1 && targets[0].type === 'file') {
      if (!targets[0].available) return notify(`${targets[0].name} is not stored in R2`);
      return download(ApiClient.fileUrl(targets[0].id, true), targets[0].name);
    }
    try {
      const info = await ApiClient.query<{ name: string; files: number; folders: number; bytes: number; skipped: number }>('files:zipInfo', { ids: targets.map(i => i.id) });
      download(ApiClient.zipUrl(targets.map(i => i.id)), info.name);
      notify(`Preparing ${info.name} (${plural(info.files, 'file')}, ${formatBytes(info.bytes)})${info.skipped ? ` - ${plural(info.skipped, 'item')} not in R2 left out` : ''}`);
    } catch (err) { fail(err); }
  }

  function open(item: FileView) {
    if (item.type === 'folder') go({ folderId: item.id, starred: false });
    else if (item.available) window.open(ApiClient.fileUrl(item.id), '_blank', 'noopener');
    else notify(`${item.name} is not stored in R2`);
  }

  // --- selection ---
  function clickRow(e: ReactMouseEvent, item: FileView) {
    if ((e.target as HTMLElement).closest('button, a')) return;
    area.current?.focus({ preventScroll: true });
    if (isCoarse() && !selected.size) return open(item); // no double-click on touch: a tap opens
    if (e.shiftKey && anchor.current) {
      const a = items.findIndex(i => i.id === anchor.current), b = items.findIndex(i => i.id === item.id);
      const range = items.slice(Math.min(a, b), Math.max(a, b) + 1).map(i => i.id);
      setSelected(new Set([...(e.metaKey || e.ctrlKey ? selected : []), ...range]));
    } else if (e.metaKey || e.ctrlKey || (isCoarse() && selected.size)) {
      setSelected(prev => { const next = new Set(prev); if (!next.delete(item.id)) next.add(item.id); return next; });
      anchor.current = item.id;
    } else {
      setSelected(new Set([item.id]));
      anchor.current = item.id;
    }
  }
  function openMenu(e: ReactMouseEvent) {
    const row = (e.target as HTMLElement).closest<HTMLElement>('[data-file-id]');
    if (!row) { setSelected(new Set()); return; }
    e.preventDefault();
    const id = row.dataset.fileId!;
    const targets = selected.has(id) ? chosen : items.filter(i => i.id === id);
    if (!selected.has(id)) { setSelected(new Set([id])); anchor.current = id; }
    setMenu({ x: e.clientX, y: e.clientY, targets });
  }
  function areaKey(e: ReactKeyboardEvent) {
    if (menu || /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'a') { e.preventDefault(); setSelected(new Set(items.map(i => i.id))); }
    else if (e.key === 'Escape' && selected.size) { e.stopPropagation(); setSelected(new Set()); }
    else if (e.key === 'Enter' && chosen.length === 1) { e.preventDefault(); open(chosen[0]); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && chosen.length) { e.preventDefault(); setDeleting(chosen); }
    else if (e.key === 'F2' && chosen.length === 1) { e.preventDefault(); setNaming({ mode: 'rename', item: chosen[0] }); }
    else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && items.length) {
      e.preventDefault();
      const at = items.findIndex(i => i.id === anchor.current), next = items[Math.max(0, Math.min(items.length - 1, at < 0 ? 0 : at + (e.key === 'ArrowDown' ? 1 : -1)))];
      setSelected(prev => new Set(e.shiftKey ? [...prev, next.id] : [next.id]));
      anchor.current = next.id;
      area.current?.querySelector(`[data-file-id="${next.id}"]`)?.scrollIntoView({ block: 'nearest' });
    }
  }

  function menuEntries(targets: FileView[]): MenuEntry[] {
    if (targets.length === 1) {
      const [item] = targets, isFolder = item.type === 'folder';
      return [
        { label: 'Open', icon: isFolder ? 'files' : 'external', run: () => open(item) },
        ...(isFolder ? [{ label: 'Download as zip', icon: 'download' as const, run: () => void downloadItems(targets) }] : item.available ? [{ label: 'Download', icon: 'download' as const, run: () => void downloadItems(targets) }] : []),
        { label: 'Rename', icon: 'pen', run: () => setNaming({ mode: 'rename', item }) },
        { label: item.starred ? 'Unstar' : 'Star', icon: 'star', run: () => void starItems(targets) },
        { label: 'Move to folder', icon: 'files', run: () => setMoving(targets) },
        { label: 'Delete', icon: 'trash', danger: true, run: () => setDeleting(targets) },
      ];
    }
    const allStarred = targets.every(i => i.starred);
    return [
      { label: `Download ${targets.length} items as zip`, icon: 'download', run: () => void downloadItems(targets) },
      { label: allStarred ? 'Unstar all' : 'Star all', icon: 'star', run: () => void starItems(targets) },
      { label: 'Move to folder', icon: 'files', run: () => setMoving(targets) },
      { label: `Delete ${targets.length} items`, icon: 'trash', danger: true, run: () => setDeleting(targets) },
    ];
  }

  const dropHandlers = {
    onDragOver: (e: DragEvent) => { e.preventDefault(); setDragging(true); },
    onDragLeave: () => setDragging(false),
    onDrop: (e: DragEvent) => { e.preventDefault(); setDragging(false); void upload(Array.from(e.dataTransfer.files)); },
  };
  const changeSort = (key: SortKey) => setSort(s => s.key === key ? { key, desc: !s.desc } : { key, desc: key !== 'name' });

  return <section className="files-view" {...dropHandlers} style={dragging ? { outline: '1px dashed var(--border-hover)', outlineOffset: 8, borderRadius: 10 } : undefined}>
    <div className="section-heading">
      <h2 className="flex items-center gap-2">
        <span className="file-nav">
          <button className="icon-button compact" title="Back" aria-label="Back" disabled={nav.index === 0} onClick={back}><Icon name="left" size={14}/></button>
          <button className="icon-button compact" title="Forward" aria-label="Forward" disabled={nav.index >= nav.stack.length - 1} onClick={forward}><Icon name="right" size={14}/></button>
          <button className="icon-button compact file-nav-up" title="Up one level" aria-label="Up one level" disabled={!canUp} onClick={up}><Icon name="left" size={14}/></button>
        </span>
        {starredOnly ? 'Starred' : listing?.path.length ? <>
          <button className="text-button" onClick={() => go(ROOT)}>Files</button>
          {listing.path.map((p, i) => <span key={p.id} className="flex items-center gap-2"><span className="breadcrumb-slash">/</span>{i === listing.path.length - 1 ? <span>{p.name}</span> : <button className="text-button" onClick={() => go({ folderId: p.id, starred: false })}>{p.name}</button>}</span>)}
        </> : 'Your files'}
        <span className="inline-count">{items.length}</span>
      </h2>
      <div className="section-actions">
        <button className={`small-button ${starredOnly ? 'active' : ''}`} aria-pressed={starredOnly} onClick={() => go(starredOnly ? ROOT : { folderId: null, starred: true })}><Icon name="star" size={14}/>Starred</button>
        {!starredOnly && <button className="small-button" onClick={() => setNaming({ mode: 'folder' })}><Icon name="plus" size={14}/>New folder</button>}
      </div>
    </div>
    <p className="view-footnote">{stats ? `${stats.count} file${stats.count === 1 ? '' : 's'} · ${formatBytes(stats.totalBytes)} stored` : 'Loading...'}{uploading > 0 && ` · Uploading ${uploading}...`}</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    {items.length > 0 && <div className="file-toolbar">
      {chosen.length > 0 ? <div className="file-selection-bar" role="toolbar" aria-label="Selection actions">
        <strong>{chosen.length} selected</strong>
        <button className="small-button" onClick={() => void downloadItems(chosen)}><Icon name="download" size={14}/>{chosen.length === 1 && chosen[0].type === 'file' ? 'Download' : 'Zip'}</button>
        <button className="small-button" onClick={() => void starItems(chosen)}><Icon name="star" size={14}/>{chosen.every(i => i.starred) ? 'Unstar' : 'Star'}</button>
        <button className="small-button" onClick={() => setMoving(chosen)}><Icon name="files" size={14}/>Move</button>
        <button className="small-button danger-button" onClick={() => setDeleting(chosen)}><Icon name="trash" size={14}/>Delete</button>
        <button className="text-button" onClick={() => setSelected(new Set())}>Clear</button>
      </div> : <span className="view-footnote">Click to select, double-click to open. Drag on empty space to select several.</span>}
      <div className="file-sort" role="group" aria-label="Sort files">{SORTS.map(([key, label]) => <button key={key} className={`small-button ${sort.key === key ? 'active' : ''}`} aria-pressed={sort.key === key} aria-label={`Sort by ${label}${sort.key === key ? (sort.desc ? ', descending' : ', ascending') : ''}`} onClick={() => changeSort(key)}>{label}{sort.key === key && <Icon name="down" size={11} className={sort.desc ? '' : 'file-sort-asc'}/>}</button>)}</div>
    </div>}
    <div ref={area} className="file-area" tabIndex={0} role="listbox" aria-multiselectable="true" aria-label="Files" onKeyDown={areaKey} onContextMenu={openMenu}>
      {items.length ? <div className="file-list">{items.map(item => {
        const isFolder = item.type === 'folder', isSelected = selected.has(item.id);
        const meta = isFolder ? 'Folder' : `${item.mimeType || 'File'} · ${formatBytes(item.size)}${item.available ? '' : ' · Not in R2'}`;
        return <div className={`file-row ${isSelected ? 'selected-row' : ''}`} key={item.id} data-file-id={item.id} role="option" aria-selected={isSelected} onClick={e => clickRow(e, item)} onDoubleClick={e => { if (!(e.target as HTMLElement).closest('button, a')) open(item); }}>
          <FileThumb item={item}/>
          <div className="file-name"><strong>{item.name}</strong><small>{meta}</small></div>
          <span>{shortDate(item.updatedAt)}</span>
          <button className="icon-button" title={item.starred ? 'Unstar' : 'Star'} aria-label={`${item.starred ? 'Unstar' : 'Star'} ${item.name}`} aria-pressed={item.starred} style={item.starred ? { color: 'var(--yellow)' } : undefined} onClick={() => act('files:toggleStar', { id: item.id }, item.starred ? 'Removed from starred' : 'Starred')}><Icon name="star" size={15}/></button>
          <button className="icon-button" title={`Rename ${item.name}`} aria-label={`Rename ${item.name}`} onClick={() => setNaming({ mode: 'rename', item })}><Icon name="pen" size={15}/></button>
          {!isFolder && item.available && <a href={ApiClient.fileUrl(item.id, true)} className="icon-button" title={`Download ${item.name}`} aria-label={`Download ${item.name}`}><Icon name="download" size={16}/></a>}
          <button className="icon-button" title={`Delete ${item.name}`} aria-label={`Delete ${item.name}`} onClick={() => setDeleting([item])}><Icon name="trash" size={15}/></button>
        </div>;
      })}</div> : listing && <button className="file-drop-zone" onClick={() => input.current?.click()}><Icon name="files" size={32}/><strong>{starredOnly ? 'Nothing starred yet' : 'A little space for your work'}</strong><span>{starredOnly ? 'Star a file to keep it close.' : 'Drop files here, or click to browse.'}</span><small>Files are stored privately in your workspace.</small></button>}
    </div>
    {rect && createPortal(<div className="marquee" style={rect} aria-hidden="true"/>, document.body)}
    {menu && <ContextMenu x={menu.x} y={menu.y} entries={menuEntries(menu.targets)} onClose={() => { setMenu(null); area.current?.focus({ preventScroll: true }); }}/>}
    <input ref={input} className="visually-hidden" type="file" multiple tabIndex={-1} aria-label="Choose files" onChange={e => { void upload(Array.from(e.target.files || [])); e.target.value = ''; }}/>
    {naming && <NameModal title={naming.mode === 'folder' ? 'New folder' : 'Rename'} initial={naming.mode === 'rename' ? naming.item.name : ''} onClose={() => setNaming(null)} onSave={name => {
      setNaming(null);
      if (naming.mode === 'folder') act('files:createFolder', { name, parentId: folderId }, 'Folder created');
      else act('files:rename', { id: naming.item.id, name }, 'Renamed');
    }}/>}
    {deleting && <ConfirmModal title={deleting.length === 1 ? `Delete this ${deleting[0].type}?` : `Delete ${deleting.length} items?`} message={deleting.length === 1 ? (deleting[0].type === 'folder' ? `"${deleting[0].name}" and everything inside it will be permanently deleted.` : `"${deleting[0].name}" will be permanently deleted.`) : `${[['file', deleting.filter(i => i.type === 'file').length], ['folder', deleting.filter(i => i.type === 'folder').length]].filter(([, n]) => n).map(([word, n]) => plural(n as number, word as string)).join(' and ')}${deleting.some(i => i.type === 'folder') ? ' (including everything inside)' : ''} will be permanently deleted.`} onClose={() => setDeleting(null)} onConfirm={() => { const targets = deleting; setDeleting(null); void deleteItems(targets); }}/>}
    {moving && <MoveModal items={moving} onClose={() => setMoving(null)} onMove={dest => { const targets = moving; setMoving(null); void moveItems(targets, dest); }}/>}
    {report && <Modal title={`Some items were not ${report.verb}`} onClose={() => setReport(null)}>
      <div className="form-body">
        <p className="confirmation-copy">{plural(report.outcomes.filter(o => !o.error).length, 'item')} {report.verb}, {report.outcomes.filter(o => o.error).length} failed.</p>
        <p className="menu-label">FAILED</p>
        <ul className="bulk-report">{report.outcomes.filter(o => o.error).map(o => <li key={o.item.id}><strong>{o.item.name}</strong><small>{o.error}</small></li>)}</ul>
        {report.outcomes.some(o => !o.error) && <><p className="menu-label">SUCCEEDED</p><ul className="bulk-report">{report.outcomes.filter(o => !o.error).map(o => <li key={o.item.id}><strong>{o.item.name}</strong></li>)}</ul></>}
      </div>
      <div className="modal-footer"><span/><div><button className="button primary" onClick={() => setReport(null)}>Done</button></div></div>
    </Modal>}
  </section>;
}

/** Largest image served straight from its content URL when it has no generated thumbnail. */
const RAW_PREVIEW_LIMIT = 2 * 1024 * 1024;

/** Fixed-size leading cell: folder icon, lazy image/video preview, or the generic file icon (also when the image fails to load). */
function FileThumb({ item }: { item: FileView }) {
  const [failed, setFailed] = useState(false);
  const mime = item.mimeType || '';
  const src = item.type === 'folder' || !item.available ? null
    : item.thumbnail && (mime.startsWith('image/') || (mime.startsWith('video/') && item.duration)) ? ApiClient.thumbnailUrl(item.id)
    : mime.startsWith('image/') && item.size <= RAW_PREVIEW_LIMIT ? ApiClient.fileUrl(item.id) : null;
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) return <span className="file-thumb" style={{ color: item.type === 'folder' ? 'var(--yellow)' : 'var(--muted)' }}><Icon name={item.type === 'folder' ? 'files' : 'file'} size={24}/></span>;
  return <span className={`file-thumb has-image ${mime.startsWith('video/') ? 'is-video' : ''}`}><img src={src} alt="" width={36} height={36} loading="lazy" decoding="async" draggable={false} onError={() => setFailed(true)}/></span>;
}

function ContextMenu({ x, y, entries, onClose }: { x: number; y: number; entries: MenuEntry[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null), [pos, setPos] = useState({ left: x, top: y });
  // Keep the menu on screen: flip it over the pointer when it would overflow the viewport.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setPos({ left: Math.max(8, x + width > innerWidth - 8 ? x - width : x), top: Math.max(8, y + height > innerHeight - 8 ? y - height : y) });
    el.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
  }, [x, y]);
  useEffect(() => {
    const down = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const buttons = Array.from(ref.current?.querySelectorAll<HTMLElement>('button') ?? []), at = buttons.indexOf(document.activeElement as HTMLElement);
      buttons[(at + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
    };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('keydown', key, true);
    window.addEventListener('resize', onClose);
    window.addEventListener('wheel', onClose, { passive: true });
    window.addEventListener('blur', onClose);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('keydown', key, true);
      window.removeEventListener('resize', onClose);
      window.removeEventListener('wheel', onClose);
      window.removeEventListener('blur', onClose);
    };
  }, [onClose]);
  return createPortal(<div ref={ref} className="popover context-menu" role="menu" style={pos} onContextMenu={e => e.preventDefault()}>
    {entries.map(entry => <button key={entry.label} role="menuitem" className={entry.danger ? 'danger-button' : undefined} onClick={() => { onClose(); entry.run(); }}>{entry.icon && <Icon name={entry.icon} size={14}/>}{entry.label}</button>)}
  </div>, document.body);
}

/** Folder picker: browse the tree and move every item in one call per item. */
function MoveModal({ items, onClose, onMove }: { items: FileView[]; onClose: () => void; onMove: (parentId: string | null) => void }) {
  const [at, setAt] = useState<string | null>(null), [listing, setListing] = useState<Listing | null>(null), [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    ApiClient.query<Listing>('files:list', { parentId: at, starred: false }).then(next => { if (live) { setListing(next); setError(''); } }).catch(err => { if (live) setError((err as Error).message); });
    return () => { live = false; };
  }, [at]);
  const moving = new Set(items.map(i => i.id));
  const folders = (listing?.items ?? []).filter(i => i.type === 'folder' && !moving.has(i.id));
  const inside = !!at && (listing?.path ?? []).some(p => moving.has(p.id));
  const unchanged = items.every(i => i.parentId === at);
  const destination = listing?.path.length ? listing.path[listing.path.length - 1].name : 'Files';
  return <Modal title={items.length === 1 ? `Move "${items[0].name}"` : `Move ${items.length} items`} onClose={onClose}>
    <div className="form-body">
      <div className="folder-picker-path">
        <button className="text-button" onClick={() => setAt(null)}>Files</button>
        {listing?.path.map(p => <span key={p.id} className="flex items-center gap-2"><span className="breadcrumb-slash">/</span><button className="text-button" onClick={() => setAt(p.id)}>{p.name}</button></span>)}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="folder-picker" role="list">
        {folders.map(f => <button key={f.id} role="listitem" onClick={() => setAt(f.id)}><Icon name="files" size={16}/><span>{f.name}</span><Icon name="right" size={12}/></button>)}
        {listing && !folders.length && <p className="view-footnote">No folders here.</p>}
      </div>
    </div>
    <div className="modal-footer"><span/><div><button type="button" className="button" onClick={onClose}>Cancel</button><button className="button primary" disabled={!listing || inside || unchanged} onClick={() => onMove(at)}>Move to {destination}</button></div></div>
  </Modal>;
}

function NameModal({ title, initial, onClose, onSave }: { title: string; initial: string; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState(initial);
  return <Modal title={title} onClose={onClose}><form onSubmit={e => { e.preventDefault(); if (name.trim()) onSave(name.trim()); }}><div className="form-body"><label className="form-label">Name<input autoFocus required maxLength={255} value={name} onChange={e => setName(e.target.value)}/></label></div><div className="modal-footer"><span/><div><button type="button" className="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit">Save</button></div></div></form></Modal>;
}
