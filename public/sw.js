// Bump VERSION to drop every cache from older releases. Hashed files under /assets never change
// for a given name, so they are safe to serve from cache first; the HTML shell is network-first.
const VERSION = 'v3';
const SHELL_CACHE = `dashboard-shell-${VERSION}`;
const ASSET_CACHE = `dashboard-assets-${VERSION}`;
const PRECACHE = ['/', '/offline.html', '/favicon.svg', '/logo.png'];
const NETWORK_ONLY = ['/api/', '/sw.js'];

self.addEventListener('install', event => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

// The page that installs this worker is already loaded, so its hashed bundles never pass through
// the fetch handler. Read them out of the shell HTML, or the first offline visit would be blank.
async function precache() {
  const shell = await caches.open(SHELL_CACHE);
  await shell.addAll(PRECACHE);
  const html = await (await shell.match('/')).text();
  const bundles = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(match => match[1]);
  await (await caches.open(ASSET_CACHE)).addAll(bundles);
}

self.addEventListener('activate', event => {
  const current = [SHELL_CACHE, ASSET_CACHE];
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(name => !current.includes(name)).map(name => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  // The API is private, per-user data: never cached, never intercepted.
  if (request.method !== 'GET' || url.origin !== self.location.origin || NETWORK_ONLY.some(path => url.pathname.startsWith(path))) return;

  if (request.mode === 'navigate') return event.respondWith(networkFirstShell(request));
  if (url.pathname.startsWith('/assets/')) return event.respondWith(cacheFirst(request, ASSET_CACHE));
  event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
});

async function networkFirstShell(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put('/', response.clone());
    return response;
  } catch {
    return (await cache.match('/')) || (await cache.match('/offline.html')) || Response.error();
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const refresh = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  return hit || refresh;
}
