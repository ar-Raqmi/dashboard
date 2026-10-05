import { useCallback, useEffect, useState } from 'react';
import { todayKey } from '@/lib/date';
import { useStore } from '@/store';

const STALE_AFTER_MS = 60_000;
const DAY_CHECK_MS = 60_000;

/** Loads the workspace once, and quietly resyncs when the tab regains focus after a while (which also catches a new day). */
export function useWorkspaceSync(notify: (message: string) => void) {
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      const { load, loadDaily } = useStore.getState();
      await Promise.all([load(), loadDaily()]);
      if (!quiet) notify('Workspace refreshed');
    } catch (err) {
      if (!quiet) notify((err as Error).message);
    } finally {
      if (!quiet) setRefreshing(false);
    }
  }, [notify]);

  useEffect(() => {
    const { load, loadDaily } = useStore.getState();
    void load().catch(() => undefined);
    void loadDaily();
  }, []);

  useEffect(() => {
    const onFocus = () => {
      const last = useStore.getState().lastSyncedAt;
      if (!last || Date.now() - last > STALE_AFTER_MS) void refresh(true);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  // A new day (in the active time zone) changes what is due today and which prayer times apply.
  useEffect(() => {
    let day = todayKey();
    const timer = setInterval(() => {
      const next = todayKey();
      if (next !== day) { day = next; void refresh(true); }
    }, DAY_CHECK_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return { refreshing, refresh };
}
