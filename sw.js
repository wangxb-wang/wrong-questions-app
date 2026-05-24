/* Service Worker for 错题集 PWA - Offline Support */
const CACHE_NAME = 'wrong-questions-v2';
/* Auto-detect base path from SW location (supports subdirectory deployment) */
var SW_PATH = self.location.pathname;
var BASE = SW_PATH.replace(/\/sw\.js$/, '');
var ASSETS_TO_CACHE = [
  BASE + '/wrong-questions-app.html',
  BASE + '/manifest.json',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png',
  BASE + '/apple-touch-icon.png'
];

/* Install: cache core assets */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* Activate: clean old caches */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* Fetch: cache-first for assets, network-first for data */
self.addEventListener('fetch', function(event) {
  /* Only handle GET requests */
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) {
        /* Return from cache, but fetch update in background */
        var fetchPromise = fetch(event.request).then(function(response) {
          if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        }).catch(function() { /* ignore network errors */ });
        return cached;
      }
      /* Not in cache, fetch from network */
      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200) return response;
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(function() {
        /* Offline fallback - for navigation, return the app shell */
        if (event.request.mode === 'navigate') {
          return caches.match(BASE + '/wrong-questions-app.html');
        }
        return new Response('', { status: 408 });
      });
    })
  );
});
