import { useCallback, useEffect, useRef, useState } from 'react';

const VISIBLE_MS = 3500;

export function useToast() {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((next: string) => {
    setMessage(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(''), VISIBLE_MS);
  }, []);
  const fail = useCallback((err: unknown) => notify((err as Error).message), [notify]);
  const dismiss = useCallback(() => setMessage(''), []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return { message, notify, fail, dismiss };
}
