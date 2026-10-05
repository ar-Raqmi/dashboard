import { createContext, useCallback, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { ApiClient, ApiError, UNAUTHORIZED_EVENT } from '@/lib/api';
import { BrandMark } from '@/components/BrandMark';
import { Icon } from '@/components/Icon';
import { useStore } from '@/store';

export interface SessionUser { id: string; username: string }

interface AuthContextValue {
  user: SessionUser | null;
  status: 'checking' | 'signed-in' | 'signed-out';
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Holds the session; the token itself is an HttpOnly cookie the browser never exposes to JS. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue['status']>('checking');

  useEffect(() => {
    let cancelled = false;
    ApiClient.session()
      .then(res => { if (!cancelled) { setUser(res.user); setStatus('signed-in'); } })
      .catch(() => { if (!cancelled) setStatus('signed-out'); });
    const expired = () => { setUser(null); setStatus('signed-out'); useStore.getState().reset(); };
    window.addEventListener(UNAUTHORIZED_EVENT, expired);
    return () => { cancelled = true; window.removeEventListener(UNAUTHORIZED_EVENT, expired); };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await ApiClient.login(username, password);
    setUser(res.user);
    setStatus('signed-in');
  }, []);

  const logout = useCallback(async () => {
    await ApiClient.logout().catch(() => undefined);
    useStore.getState().reset();
    setUser(null);
    setStatus('signed-out');
  }, []);

  return <AuthContext.Provider value={{ user, status, login, logout }}>{children}</AuthContext.Provider>;
}

export function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState(''), [password, setPassword] = useState('');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? 'That username and password do not match.' : (err as Error).message);
      setBusy(false);
    }
  }

  return <div className="modal-backdrop" style={{ background: 'var(--bg-dim)', backdropFilter: 'none' }}>
    <div className="modal" role="dialog" aria-modal="true" aria-label="Sign in" style={{ width: 400 }}>
      <div className="modal-heading"><span className="brand flex items-center gap-2.5"><BrandMark/><span>raqmi<span className="brand-period">.</span></span></span></div>
      <form onSubmit={submit}>
        <div className="form-body">
          <p className="help-intro">Welcome back. Sign in to your workspace.</p>
          <label className="form-label">Username<input autoFocus required autoComplete="username" value={username} onChange={e => setUsername(e.target.value)}/></label>
          <label className="form-label">Password<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}/></label>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
        <div className="modal-footer"><span>Sessions last 7 days</span><button className="button primary" type="submit" disabled={busy}><Icon name="arrow" size={15}/>{busy ? 'Signing in...' : 'Sign in'}</button></div>
      </form>
    </div>
  </div>;
}
