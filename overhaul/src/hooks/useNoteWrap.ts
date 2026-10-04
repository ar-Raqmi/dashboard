import { useSyncExternalStore } from 'react';

// Display-only preference: whether notes lay out at an 80-column measure or fill the available width.
const KEY = 'raqmi-note-wrap';
const listeners = new Set<() => void>();
let wrap80 = (() => { try { return localStorage.getItem(KEY) !== 'fluid'; } catch { return true; } })();

function setWrap80(next: boolean) {
  wrap80 = next;
  try { localStorage.setItem(KEY, next ? '80' : 'fluid'); } catch { /* Preference remains for this session. */ }
  listeners.forEach(l => l());
}

export function useNoteWrap() {
  const value = useSyncExternalStore(l => { listeners.add(l); return () => listeners.delete(l); }, () => wrap80);
  return [value, () => setWrap80(!wrap80)] as const;
}
