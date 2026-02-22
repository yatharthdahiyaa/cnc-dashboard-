// public/sw.js — Service Worker for offline support
const CACHE_NAME = 'cnc-dashboard-v1';

// Assets to pre-cache on install
const PRECACHE_URLS = [
    '/',
    '/index.html',
];

// ─── Install: pre-cache shell ─────────────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

// ─── Activate: clean old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// ─── Fetch: network-first for API/WS, cache-first for assets ─────────────────
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    const swOrigin = self.location.origin;

    // CRITICAL: Never intercept cross-origin requests — this includes Socket.IO
    // polling requests which go to the Railway server (different origin).
    // Service Workers cannot fetch cross-origin URLs without CORS support,
    // and intercepting Socket.IO breaks the connection entirely.
    if (url.origin !== swOrigin) {
        return; // Let the browser handle it natively
    }

    // Never intercept WebSocket upgrades or API calls
    if (
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/socket.io/') ||
        url.protocol === 'ws:' ||
        url.protocol === 'wss:'
    ) {
        return;
    }

    // For navigation requests (HTML), use network-first with offline fallback
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match('/index.html'))
        );
        return;
    }

    // For static assets (JS, CSS, images), use cache-first
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            });
        })
    );
});
