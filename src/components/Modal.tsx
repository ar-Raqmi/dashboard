import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

/** `keyboard` opts a dialog into raising the on-screen keyboard on touch devices (e.g. a search box the user just tapped to type in). */
export function Modal({ title, children, onClose, className = '', keyboard = false }: { title: string; children: ReactNode; onClose: () => void; className?: string; keyboard?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  // Touch devices: take focus before paint, so neither this effect's timer nor a child's `autoFocus` summons the keyboard.
  // Escape and Tab still work from the dialog itself, and screen readers still land inside it.
  const opener = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null); // read during render, before any focus moves
  useLayoutEffect(() => { if (!keyboard && window.matchMedia('(pointer: coarse)').matches) container.current?.focus(); }, [keyboard]);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const previous = opener.current;
    const oldOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => {
      const root = container.current;
      if (!root || (!keyboard && window.matchMedia('(pointer: coarse)').matches)) return;
      (root.querySelector<HTMLElement>('input, textarea, select') || root.querySelector<HTMLElement>('button'))?.focus();
    }, 40);
    const onKey = (e: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[role="dialog"]');
      if (dialogs[dialogs.length - 1] !== container.current) return;
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); }
      if (e.key === 'Tab') {
        const items = Array.from(container.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, textarea, select, a[href], [tabindex="0"]') || []).filter(el => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === container.current) { e.preventDefault(); last.focus(); return; }
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(timer); document.removeEventListener('keydown', onKey); document.body.style.overflow = oldOverflow; previous?.focus(); };
  }, []);
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div ref={container} tabIndex={-1} className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={title}><div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close"/></button></div>{children}</div></div>;
}

/** Confirmation dialog for destructive actions. */
export function ConfirmModal({ title, message, confirmLabel = 'Delete', cancelLabel = 'Keep it', onConfirm, onClose }: { title: string; message: string; confirmLabel?: string; cancelLabel?: string; onConfirm: () => void; onClose: () => void }) {
  return <Modal title={title} onClose={onClose} className="confirm-modal"><div className="form-body"><p className="confirmation-copy">{message}</p></div><div className="modal-footer"><button className="button" onClick={onClose}>{cancelLabel}</button><button className="button danger-action" onClick={onConfirm}>{confirmLabel}</button></div></Modal>;
}
