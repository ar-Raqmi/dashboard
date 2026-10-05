import { BrandName } from '@/features/brand/BrandName';
import { useStore } from '@/store';

export function Footer() {
  const status = useStore(s => s.status);
  const saving = useStore(s => s.saving);
  return <footer className="workspace-footer">
    <span><i className={`tiny-dot ${status === 'error' ? 'warning-dot' : ''}`}/>{saving > 0 ? 'Saving changes...' : status === 'error' ? 'Not connected to the server' : 'All changes saved'}</span>
    <span>Made for a more intentional day<span className="footer-divider">/</span><span className="footer-brand"><BrandName/></span></span>
  </footer>;
}
