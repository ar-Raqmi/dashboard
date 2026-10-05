import { useEffect, useRef } from 'react';
import { useStore } from '@/store';

interface Shortcuts {
  onSearch: () => void;
  onNewTask: () => void;
  onNewNote: () => void;
  onEscape: () => void;
}

/** Ctrl/Cmd+K and Ctrl/Cmd+B work anywhere; the single-letter keys stay quiet while typing or when a dialog is open. */
export function useGlobalShortcuts(handlers: Shortcuts) {
  const latest = useRef(handlers);
  latest.current = handlers;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isTyping = /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName);
      const hasDialog = !!document.querySelector('[role="dialog"]');
      const modifier = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      const plain = !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping && !hasDialog;

      if (modifier && key === 'k' && !document.querySelector('.modal:not(.search-modal)')) { e.preventDefault(); latest.current.onSearch(); }
      else if (modifier && key === 'b' && !hasDialog) {
        e.preventDefault();
        const s = useStore.getState();
        void s.updatePreferences({ sidebarCollapsed: !s.preferences.sidebarCollapsed }).catch(() => undefined);
      }
      else if (e.key === 'Escape') latest.current.onEscape();
      else if (key === 'n' && plain) { e.preventDefault(); latest.current.onNewTask(); }
      else if (key === 'q' && plain) { e.preventDefault(); latest.current.onNewNote(); }
      else if (e.key === '/' && plain) { e.preventDefault(); latest.current.onSearch(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
}
