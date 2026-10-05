import { type ReactNode } from 'react';

export function Toggle({ on, label, onChange }: { on: boolean; label: string; onChange: (next: boolean) => void }) {
  return <button className={`toggle-switch ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}><span/></button>;
}
export function Row({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return <div className="setting-row"><span><strong>{title}</strong>{hint && <small>{hint}</small>}</span>{children}</div>;
}
