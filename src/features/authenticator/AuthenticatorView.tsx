import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiClient } from '@/lib/api';
import { useStore, type TwoFactorAccount, type TwoFactorList } from '@/store';
import { copyText } from '@/lib/date';
import { Icon } from '@/components/Icon';
import { ConfirmModal, Modal } from '@/components/Modal';

/** Loads the account list and keeps the current one-time code and countdown ticking. */
export function useTwoFactorCodes() {
  const [list, setList] = useState<TwoFactorList | null>(null), [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
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
  return { list, error, load, remaining, codeFor };
}

const copyCode = (code: string, notify: (message: string) => void) => void copyText(code).then(() => notify('One-time code copied')).catch(() => notify('Clipboard unavailable'));
const splitCode = (code: string | null) => code?.replace(/(\d{3})(\d{3})/, '$1 $2') || '--- ---';

/** Shown in place of a code when a stored secret does not decrypt with this deployment's key. */
const Undecryptable = () => <p className="auth-undecryptable" role="status" title="This secret was encrypted with a different key than this deployment has. No code is shown rather than a wrong one.">Cannot decrypt this secret</p>;

export function AuthenticatorView({ notify, adding, setAdding }: { notify: (message: string) => void; adding: boolean; setAdding: (open: boolean) => void }) {
  const mutate = useStore(s => s.mutate);
  const { list, error, load, remaining, codeFor } = useTwoFactorCodes();
  const [removing, setRemoving] = useState<TwoFactorAccount | null>(null), [query, setQuery] = useState('');
  const accounts = (list?.accounts ?? []).filter(a => `${a.accountName} ${a.category}`.toLowerCase().includes(query.toLowerCase()));

  return <section className="authenticator-view"><div className="section-heading"><h2>Your accounts{list && <span className="inline-count">{list.accounts.length}</span>}</h2>{list && list.accounts.length > 4 ? <div className="inline-search"><Icon name="search" size={14}/><input aria-label="Search accounts" placeholder="Find an account..." value={query} onChange={e => setQuery(e.target.value)}/></div> : <button className="button" onClick={() => setAdding(true)} disabled={list?.locked}><Icon name="plus" size={14}/>Add account</button>}</div>
    <div className="security-notice"><Icon name="shield" size={19}/><p>{list?.locked
      ? <><strong>Codes are unavailable.</strong> The encryption key (JWT_SECRET) is not configured for this deployment's environment, so stored secrets cannot be decrypted.</>
      : <><strong>Encrypted at rest.</strong> Secrets are stored encrypted and never sent to your browser; only the current one-time codes are. Keep your recovery codes somewhere safe.</>}</p></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {!list && !error && <p className="muted-note">Loading accounts...</p>}
    {list && (accounts.length ? accounts.map(account => {
      const code = codeFor(account);
      return <div className="auth-account" key={account.id}><span className="account-service-icon"><Icon name="shield" size={20}/></span><div><strong>{account.accountName}<small className="ml-2 text-[var(--muted)]">{account.category}</small></strong>{account.undecryptable ? <Undecryptable/> : <button className="auth-code" title="Copy one-time code" disabled={!code} onClick={() => code && copyCode(code, notify)}>{splitCode(code)}<Icon name="copy" size={15}/></button>}</div><span className="code-timer">{account.undecryptable ? '' : `${remaining}s`}</span><button className="icon-button" title="Remove account" aria-label={`Remove ${account.accountName}`} onClick={() => setRemoving(account)}><Icon name="trash" size={15}/></button></div>;
    }) : <div className="empty-state"><Icon name="shield" size={36}/><h3>{query ? 'No matching accounts' : 'No accounts connected'}</h3><p>{query ? 'Try another name.' : 'Add an existing authenticator setup key to generate six-digit TOTP codes.'}</p>{!query && !list.locked && <button className="button" onClick={() => setAdding(true)}>Add your first account<Icon name="plus" size={14}/></button>}</div>)}
    {adding && <AddAccountModal onClose={() => setAdding(false)} onAdded={() => { setAdding(false); notify('Account added'); void load(); }}/>}
    {removing && <ConfirmModal title="Remove this account?" message={`Codes for ${removing.accountName} will no longer be generated here. Make sure you can still sign in to that service another way.`} confirmLabel="Remove" onClose={() => setRemoving(null)} onConfirm={() => { const target = removing; setRemoving(null); void mutate('twoFactor:remove', { id: target.id }, []).then(() => { notify('Account removed'); void load(); }).catch(err => notify((err as Error).message)); }}/>}
  </section>;
}

const MINI_LIMIT = 4;

/** Compact code list for the overview. Adding and removing accounts happens on the Authenticator page. */
export function MiniAuthenticator({ notify, onOpen, onAdd }: { notify: (message: string) => void; onOpen: () => void; onAdd: () => void }) {
  const { list, error, remaining, codeFor } = useTwoFactorCodes();
  const accounts = list?.accounts ?? [];
  return <section className="mini-auth" aria-label="One-time codes"><div className="section-heading"><h2>One-time codes{list && !list.locked && accounts.length > 0 && <span className="inline-count">{accounts.length}</span>}</h2>{list && !list.locked && <button className="icon-button compact" title="Add account" aria-label="Add authenticator account" onClick={onAdd}><Icon name="plus" size={15}/></button>}</div>
    {error ? <p className="muted-note" role="alert">Codes could not be loaded. {error}</p>
      : !list ? <p className="muted-note">Loading accounts...</p>
      : list.locked ? <p className="muted-note"><strong>Codes are unavailable.</strong> The encryption key (JWT_SECRET) is not configured for this deployment's environment, so stored secrets cannot be decrypted.</p>
      : !accounts.length ? <div className="mini-auth-empty"><p className="muted-note">No accounts connected yet.</p><button className="text-button" onClick={onAdd}>Add account<Icon name="plus" size={13}/></button></div>
      : <>{accounts.slice(0, MINI_LIMIT).map(account => {
        const code = codeFor(account);
        return <div className="auth-account" key={account.id}><div><strong>{account.accountName}</strong>{account.undecryptable ? <Undecryptable/> : <button className="auth-code" title="Copy one-time code" aria-label={`Copy code for ${account.accountName}`} disabled={!code} onClick={() => code && copyCode(code, notify)}>{splitCode(code)}<Icon name="copy" size={13}/></button>}</div>{!account.undecryptable && <span className="code-timer" aria-label={`${remaining} seconds remaining`}>{remaining}s</span>}</div>;
      })}<button className="text-button mini-auth-more" onClick={onOpen}>{accounts.length > MINI_LIMIT ? `View all ${accounts.length} accounts` : 'Open authenticator'}<Icon name="right" size={13}/></button></>}
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
