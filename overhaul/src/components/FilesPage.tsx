import { useCallback, useEffect, useRef, useState, type DragEvent, type MutableRefObject } from 'react';
import { ApiClient } from '../api';
import { useStore, type FileView } from '../store';
import { formatBytes, shortDate } from '../utils/date';
import { Icon } from './Icon';
import { ConfirmModal, Modal } from './Modal';

interface Listing { items: FileView[]; path: { id: string; name: string }[] }

export function FilesPage({ notify, uploadTrigger }: { notify: (message: string) => void; uploadTrigger: MutableRefObject<(() => void) | null> }) {
  const mutate = useStore(s => s.mutate);
  const [folderId, setFolderId] = useState<string | null>(null), [starredOnly, setStarredOnly] = useState(false);
  const [listing, setListing] = useState<Listing | null>(null), [stats, setStats] = useState<{ totalBytes: number; count: number } | null>(null);
  const [error, setError] = useState(''), [uploading, setUploading] = useState(0), [dragging, setDragging] = useState(false);
  const [naming, setNaming] = useState<{ mode: 'folder' } | { mode: 'rename'; item: FileView } | null>(null), [deleting, setDeleting] = useState<FileView | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const fail = (err: unknown) => notify((err as Error).message);

  const load = useCallback(async () => {
    try {
      const [next, nextStats] = await Promise.all([
        ApiClient.query<Listing>('files:list', { parentId: folderId, starred: starredOnly }),
        ApiClient.query<{ totalBytes: number; count: number }>('files:stats'),
      ]);
      setListing(next);
      setStats(nextStats);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }, [folderId, starredOnly]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { uploadTrigger.current = () => input.current?.click(); return () => { uploadTrigger.current = null; }; }, [uploadTrigger]);

  async function upload(files: File[]) {
    if (!files.length) return;
    setUploading(n => n + files.length);
    let ok = 0;
    for (const file of files) {
      try {
        await ApiClient.upload(file, starredOnly ? null : folderId);
        ok++;
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

  const items = listing?.items ?? [];
  const dropHandlers = {
    onDragOver: (e: DragEvent) => { e.preventDefault(); setDragging(true); },
    onDragLeave: () => setDragging(false),
    onDrop: (e: DragEvent) => { e.preventDefault(); setDragging(false); void upload(Array.from(e.dataTransfer.files)); },
  };

  return <section className="files-view" {...dropHandlers} style={dragging ? { outline: '1px dashed var(--border-hover)', outlineOffset: 8, borderRadius: 10 } : undefined}>
    <div className="section-heading">
      <h2 className="flex items-center gap-2">
        {starredOnly ? 'Starred' : listing?.path.length ? <>
          <button className="text-button" onClick={() => setFolderId(null)}>Files</button>
          {listing.path.map((p, i) => <span key={p.id} className="flex items-center gap-2"><span className="breadcrumb-slash">/</span>{i === listing.path.length - 1 ? <span>{p.name}</span> : <button className="text-button" onClick={() => setFolderId(p.id)}>{p.name}</button>}</span>)}
        </> : 'Your files'}
        <span className="inline-count">{items.length}</span>
      </h2>
      <div className="section-actions">
        <button className={`small-button ${starredOnly ? 'active' : ''}`} aria-pressed={starredOnly} onClick={() => setStarredOnly(!starredOnly)}><Icon name="star" size={14}/>Starred</button>
        {!starredOnly && <button className="small-button" onClick={() => setNaming({ mode: 'folder' })}><Icon name="plus" size={14}/>New folder</button>}
      </div>
    </div>
    <p className="view-footnote">{stats ? `${stats.count} file${stats.count === 1 ? '' : 's'} · ${formatBytes(stats.totalBytes)} stored` : 'Loading...'}{uploading > 0 && ` · Uploading ${uploading}...`}</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    {items.length ? <div className="file-list">{items.map(item => {
      const isFolder = item.type === 'folder';
      const meta = isFolder ? 'Folder' : `${item.mimeType || 'File'} · ${formatBytes(item.size)}${item.available ? '' : ' · Not in R2'}`;
      return <div className="file-row" key={item.id}>
        <span style={{ color: isFolder ? 'var(--yellow)' : 'var(--muted)', flex: 'none' }}><Icon name={isFolder ? 'files' : 'file'} size={24}/></span>
        {isFolder
          ? <a href="#" onClick={e => { e.preventDefault(); setStarredOnly(false); setFolderId(item.id); }}><strong>{item.name}</strong><small>{meta}</small></a>
          : <a href={item.available ? ApiClient.fileUrl(item.id) : undefined} target="_blank" rel="noreferrer"><strong>{item.name}</strong><small>{meta}</small></a>}
        <span>{shortDate(item.updatedAt)}</span>
        <button className="icon-button" title={item.starred ? 'Unstar' : 'Star'} aria-label={`${item.starred ? 'Unstar' : 'Star'} ${item.name}`} aria-pressed={item.starred} style={item.starred ? { color: 'var(--yellow)' } : undefined} onClick={() => act('files:toggleStar', { id: item.id }, item.starred ? 'Removed from starred' : 'Starred')}><Icon name="star" size={15}/></button>
        <button className="icon-button" title={`Rename ${item.name}`} aria-label={`Rename ${item.name}`} onClick={() => setNaming({ mode: 'rename', item })}><Icon name="pen" size={15}/></button>
        {!isFolder && item.available && <a href={ApiClient.fileUrl(item.id, true)} className="icon-button" title={`Download ${item.name}`} aria-label={`Download ${item.name}`}><Icon name="download" size={16}/></a>}
        <button className="icon-button" title={`Delete ${item.name}`} aria-label={`Delete ${item.name}`} onClick={() => setDeleting(item)}><Icon name="trash" size={15}/></button>
      </div>;
    })}</div> : listing && <button className="file-drop-zone" onClick={() => input.current?.click()}><Icon name="files" size={32}/><strong>{starredOnly ? 'Nothing starred yet' : 'A little space for your work'}</strong><span>{starredOnly ? 'Star a file to keep it close.' : 'Drop files here, or click to browse.'}</span><small>Files are stored privately in your workspace.</small></button>}
    <input ref={input} className="visually-hidden" type="file" multiple tabIndex={-1} aria-label="Choose files" onChange={e => { void upload(Array.from(e.target.files || [])); e.target.value = ''; }}/>
    {naming && <NameModal title={naming.mode === 'folder' ? 'New folder' : 'Rename'} initial={naming.mode === 'rename' ? naming.item.name : ''} onClose={() => setNaming(null)} onSave={name => {
      setNaming(null);
      if (naming.mode === 'folder') act('files:createFolder', { name, parentId: folderId }, 'Folder created');
      else act('files:rename', { id: naming.item.id, name }, 'Renamed');
    }}/>}
    {deleting && <ConfirmModal title={`Delete this ${deleting.type}?`} message={deleting.type === 'folder' ? `"${deleting.name}" and everything inside it will be permanently deleted.` : `"${deleting.name}" will be permanently deleted.`} onClose={() => setDeleting(null)} onConfirm={() => { const item = deleting; setDeleting(null); act('files:remove', { id: item.id }, `${item.type === 'folder' ? 'Folder' : 'File'} deleted`); }}/>}
  </section>;
}

function NameModal({ title, initial, onClose, onSave }: { title: string; initial: string; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState(initial);
  return <Modal title={title} onClose={onClose}><form onSubmit={e => { e.preventDefault(); if (name.trim()) onSave(name.trim()); }}><div className="form-body"><label className="form-label">Name<input autoFocus required maxLength={255} value={name} onChange={e => setName(e.target.value)}/></label></div><div className="modal-footer"><span/><div><button type="button" className="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit">Save</button></div></div></form></Modal>;
}
