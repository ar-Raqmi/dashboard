import { Workspace } from '@/app/Workspace';
import { BrandIcon } from '@/features/brand/BrandIcon';
import { LoginScreen, OfflineScreen, useAuth } from '@/features/auth/auth';

export default function App() {
  const { status } = useAuth();
  if (status === 'checking') return <div className="modal-backdrop" style={{ background: 'var(--bg-dim)', backdropFilter: 'none' }}><span className="brand"><BrandIcon/></span></div>;
  if (status === 'offline') return <OfflineScreen/>;
  if (status === 'signed-out') return <LoginScreen/>;
  return <Workspace/>;
}
