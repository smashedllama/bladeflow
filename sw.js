// BladeFlow Service Worker
// v7: wait for user opt-in (in-app "Update" banner) instead of auto-skipping,
// so a new build never silently swaps mid-session.
const CACHE = 'bf-app-v7';
const CORE = ['/', '/index.html'];

self.addEventListener('install', e => {
  // Pre-cache the shell, then stay in "waiting" until the page tells us to
  // activate (via the SKIP_WAITING message from the update banner).
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
});

// The page posts this when the user taps "Update" in the new-version banner.
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  const isNavigation = e.request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname === '/index.html';

  if (isNavigation) {
    // Network-first for HTML: always get the latest app code.
    // Falls back to cache only when offline.
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.ok) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Other same-origin assets: stale-while-revalidate
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        const networkFetch = fetch(e.request).then(res => {
          if (res && res.ok) cache.put(e.request, res.clone());
          return res;
        }).catch(() => cached);
        return cached || networkFetch;
      })
    )
  );
});
