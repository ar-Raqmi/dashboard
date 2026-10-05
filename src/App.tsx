import { Workspace } from '@/app/Workspace';
import { BrandMark } from '@/components/BrandMark';
import { LoginScreen, OfflineScreen, useAuth } from '@/features/auth/auth';

export default function App() {
  const { status } = useAuth();
  if (status === 'checking') return <div className="modal-backdrop" style={{ background: 'var(--bg-dim)', backdropFilter: 'none' }}><span className="brand"><BrandMark/></span></div>;
  if (status === 'offline') return <OfflineScreen/>;
  if (status === 'signed-out') return <LoginScreen/>;
  return <Workspace/>;
}
