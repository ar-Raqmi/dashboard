import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ApiClient } from '@/lib/api';
import { Icon } from '@/components/Icon';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Picks an image, stores it in R2 through the files upload route, and hands back its content URL. */
export function ImageUpload({ label, src, fallback, previewStyle, notify, onUploaded, onRemove }: {
  label: string; src: string; fallback: ReactNode; previewStyle?: CSSProperties; notify: (message: string) => void;
  onUploaded: (url: string) => void; onRemove: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  async function upload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { notify('Please choose an image file.'); return; }
    if (file.size > MAX_IMAGE_BYTES) { notify('Please choose an image smaller than 5 MB.'); return; }
    setBusy(true);
    try { onUploaded(ApiClient.fileUrl(await ApiClient.upload(file, null))); }
    catch (err) { notify((err as Error).message); }
    finally { setBusy(false); }
  }
  return <div className="settings-data-actions" style={{ alignItems: 'center' }}>
    <span className="avatar" style={{ width: 44, height: 44, overflow: 'hidden', ...previewStyle }}>{src ? <img src={src} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : fallback}</span>
    <button type="button" className="button" disabled={busy} onClick={() => input.current?.click()}><Icon name="upload" size={14}/>{busy ? 'Uploading...' : src ? 'Replace' : 'Upload'}</button>
    {src && <button type="button" className="button" disabled={busy} onClick={onRemove}><Icon name="trash" size={14}/>Remove</button>}
    <input ref={input} className="visually-hidden" type="file" accept="image/*" tabIndex={-1} aria-label={`Choose ${label.toLowerCase()}`} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }}/>
  </div>;
}
