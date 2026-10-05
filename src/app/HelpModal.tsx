import { Modal } from '@/components/Modal';
import { useStore } from '@/store';

const SHORTCUTS: [string, string][] = [
  ['Search your workspace', 'Ctrl / \u2318 K'], ['Collapse or expand navigation', 'Ctrl / \u2318 B'], ['Create a new task', 'N'],
  ['Capture a note', 'Q'], ['Search from anywhere', '/'], ['Close a dialog', 'Esc'],
];

export function HelpModal({ onClose }: { onClose: () => void }) {
  const prayerSource = useStore(s => s.prayer?.source);
  return <Modal title="A calmer place to get things done" onClose={onClose}>
    <div className="form-body">
      <p className="help-intro">Raqmi keeps your tasks, projects, notes, calendar, files, and one-time codes in one calm place. Everything is saved to your account as you go.</p>
      <h3 className="help-heading">A few helpful shortcuts</h3>
      <div className="shortcut-list">{SHORTCUTS.map(([label, keys]) => <div key={label}><span>{label}</span><kbd>{keys}</kbd></div>)}</div>
      <p className="help-storage">Prayer times come from {prayerSource || 'your configured provider'}; always consult your local mosque for verified times.</p>
    </div>
    <div className="modal-footer"><span>Everforest &middot; Inter &middot; JetBrains Mono</span><button className="button primary" onClick={onClose}>Back to work</button></div>
  </Modal>;
}
