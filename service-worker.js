// Service Worker for JemsPantry
// Enables offline-first functionality and caches assets

const CACHE_VERSION = 'jemspantry-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/JP_logo.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('Service Worker: Caching assets');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.error('Failed to cache assets:', err);
        // Don't fail install if some assets can't be cached
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Network first strategy: try network, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const cacheResponse = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, cacheResponse);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('Service Worker: Serving from cache:', event.request.url);
            return cachedResponse;
          }
          // Return offline page if available
          return caches.match('/index.html');
        });
      })
  );
});

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker: Script loaded');
