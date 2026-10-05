import { Icon } from '@/components/Icon';

export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return <div className={`toast ${message ? 'visible' : ''}`} role="status" aria-live="polite">
    {message && <><Icon name="check" size={16}/><span>{message}</span><button className="icon-button compact" aria-label="Dismiss notification" onClick={onDismiss}><Icon name="close" size={13}/></button></>}
  </div>;
}
