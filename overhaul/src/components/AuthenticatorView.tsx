import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiClient } from '../api';
import { useStore, type TwoFactorAccount, type TwoFactorList } from '../store';
import { copyText } from '../utils/date';
import { Icon } from './Icon';
import { ConfirmModal, Modal } from './Modal';

export function AuthenticatorView({ notify, adding, setAdding }: { notify: (message: string) => void; adding: boolean; setAdding: (open: boolean) => void }) {
  const mutate = useStore(s => s.mutate);
  const [list, setList] = useState<TwoFactorList | null>(null), [error, setError] = useState('');
  const [now, setNow] = useState(Date.now()), [removing, setRemoving] = useState<TwoFactorAccount | null>(null), [query, setQuery] = useState('');
  const fetchedWindow = useRef(-1);

  const load = useCallback(async () => {
    try {
      const next = await ApiClient.query<TwoFactorList>('twoFactor:list');
      fetchedWindow.current = Math.floor(next.generatedAt / 1000 / next.period);
      setList(next);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);

  const period = list?.period ?? 30, slot = Math.floor(now / 1000 / period), remaining = period - (Math.floor(now / 1000) % period);
  // Codes are generated server-side for the current and next window; refetch once both are stale.
  useEffect(() => { if (list && slot > fetchedWindow.current) void load(); }, [slot, list, load]);
  const codeFor = (a: TwoFactorAccount) => (slot === fetchedWindow.current ? a.token : slot === fetchedWindow.current + 1 ? a.nextToken : null);
  const accounts = (list?.accounts ?? []).filter(a => `${a.accountName} ${a.category}`.toLowerCase().includes(query.toLowerCase()));

  return <section className="authenticator-view"><div className="section-heading"><h2>Your accounts{list && <span className="inline-count">{list.accounts.length}</span>}</h2>{list && list.accounts.length > 4 ? <div className="inline-search"><Icon name="search" size={14}/><input aria-label="Search accounts" placeholder="Find an account..." value={query} onChange={e => setQuery(e.target.value)}/></div> : <button className="button" onClick={() => setAdding(true)} disabled={list?.locked}><Icon name="plus" size={14}/>Add account</button>}</div>
    <div className="security-notice"><Icon name="shield" size={19}/><p>{list?.locked
      ? <><strong>Codes are unavailable.</strong> The encryption key (JWT_SECRET) is not configured for this deployment, so stored secrets cannot be decrypted.</>
      : <><strong>Encrypted at rest.</strong> Secrets are stored encrypted and never sent to your browser; only the current one-time codes are. Keep your recovery codes somewhere safe.</>}</p></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {!list && !error && <p className="muted-note">Loading accounts...</p>}
    {list && (accounts.length ? accounts.map(account => {
      const code = codeFor(account);
      return <div className="auth-account" key={account.id}><span className="account-service-icon"><Icon name="shield" size={20}/></span><div><strong>{account.accountName}<small className="ml-2 text-[var(--muted)]">{account.category}</small></strong><button className="auth-code" title="Copy one-time code" disabled={!code} onClick={() => code && copyText(code).then(() => notify('One-time code copied')).catch(() => notify('Clipboard unavailable'))}>{code?.replace(/(\d{3})(\d{3})/, '$1 $2') || '--- ---'}<Icon name="copy" size={15}/></button></div><span className="code-timer">{remaining}s</span><button className="icon-button" title="Remove account" aria-label={`Remove ${account.accountName}`} onClick={() => setRemoving(account)}><Icon name="trash" size={15}/></button></div>;
    }) : <div className="empty-state"><Icon name="shield" size={36}/><h3>{query ? 'No matching accounts' : 'No accounts connected'}</h3><p>{query ? 'Try another name.' : 'Add an existing authenticator setup key to generate six-digit TOTP codes.'}</p>{!query && !list.locked && <button className="button" onClick={() => setAdding(true)}>Add your first account<Icon name="plus" size={14}/></button>}</div>)}
    {adding && <AddAccountModal onClose={() => setAdding(false)} onAdded={() => { setAdding(false); notify('Account added'); void load(); }}/>}
    {removing && <ConfirmModal title="Remove this account?" message={`Codes for ${removing.accountName} will no longer be generated here. Make sure you can still sign in to that service another way.`} confirmLabel="Remove" onClose={() => setRemoving(null)} onConfirm={() => { const target = removing; setRemoving(null); void mutate('twoFactor:remove', { id: target.id }, []).then(() => { notify('Account removed'); void load(); }).catch(err => notify((err as Error).message)); }}/>}
  </section>;
}

function AddAccountModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const mutate = useStore(s => s.mutate);
  const [name, setName] = useState(''), [secret, setSecret] = useState(''), [category, setCategory] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await mutate('twoFactor:create', { accountName: name.trim(), secret, category: category.trim() || 'Other' }, []);
      onAdded();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }
  return <Modal title="Add an authenticator account" onClose={onClose}><form onSubmit={submit}><div className="form-body">
    <label className="form-label">Account name<input value={name} onChange={e => setName(e.target.value)} required maxLength={120} placeholder="e.g. GitHub"/></label>
    <label className="form-label">Category <span>(optional)</span><input value={category} onChange={e => setCategory(e.target.value)} maxLength={60} placeholder="e.g. Work"/></label>
    <label className="form-label">Base32 secret<input type="password" autoComplete="off" value={secret} onChange={e => setSecret(e.target.value)} required placeholder="Your authenticator setup key"/></label>
    <p className="view-footnote">Supports SHA-1, 6-digit codes, 30-second periods.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
  </div><div className="modal-footer"><span>Encrypted before it is stored</span><button className="button primary" type="submit" disabled={busy}>{busy ? 'Adding...' : 'Add account'}</button></div></form></Modal>;
}
