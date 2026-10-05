const UPDATE_CHECK_MS = 60 * 60 * 1000;

/** Registers /sw.js in production builds. The page is often already loaded when this runs, so it must not wait for a `load` that has fired. */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  const register = () => navigator.serviceWorker.register('/sw.js')
    .then(registration => { setInterval(() => void registration.update(), UPDATE_CHECK_MS); })
    .catch(err => console.error('Service worker registration failed', err));

  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
