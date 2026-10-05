import { useState, type FormEvent } from 'react';
import { useStore } from '@/store';

export function PasswordGroup({ notify }: { notify: (message: string) => void }) {
  const mutate = useStore(s => s.mutate);
  const [current, setCurrent] = useState(''), [next, setNext] = useState(''), [confirm, setConfirm] = useState(''), [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (next !== confirm) { setError('The new passwords do not match.'); return; }
    try {
      await mutate('auth:changePassword', { currentPassword: current, newPassword: next }, []);
      setCurrent(''); setNext(''); setConfirm(''); setError('');
      notify('Password changed. Other sessions were signed out.');
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return <form className="settings-group" onSubmit={submit}><span className="eyebrow">SECURITY</span>
    <div className="form-grid mt-4"><label className="form-label">Current password<input type="password" required autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)}/></label><span/></div>
    <div className="form-grid"><label className="form-label">New password<input type="password" required minLength={8} autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)}/></label><label className="form-label">Confirm new password<input type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)}/></label></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="settings-data-actions"><button className="button" type="submit">Change password</button></div>
  </form>;
}
