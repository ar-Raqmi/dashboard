import { useEffect } from 'react';
import { useStore } from '@/store';

/** Keeps what lives outside React in step with the workspace: motion preference, tab title and favicon. */
export function useDocumentChrome(pageTitle: string) {
  const reducedMotionPref = useStore(s => s.preferences.reducedMotion);
  const appTitle = useStore(s => s.settings?.appTitle);
  const appLogo = useStore(s => s.settings?.appLogo) || '';
  const reducedMotion = reducedMotionPref ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => { document.documentElement.classList.toggle('reduce-motion', reducedMotion); }, [reducedMotion]);
  useEffect(() => { document.title = `${pageTitle} - ${appTitle && appTitle !== 'Dashboard' ? appTitle : 'Raqmi'}`; }, [pageTitle, appTitle]);
  useEffect(() => {
    document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]').forEach(link => {
      const original = link.dataset.defaultHref ??= link.href;
      link.href = appLogo || original;
    });
  }, [appLogo]);
}
