// Network-First PWA Service Worker with Offline Fallback for പൂരിപ്പിക്കൽ അപേക്ഷ ഡെസ്ക് (Poorippikkal Apekshadesk)
// Keeps PWA installability (Add to Home Screen) active while always serving fresh content when online.
const CACHE_NAME = 'apeksha-desk-pwa-v102';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/village-office-applications-malayalam.html',
  '/panchayat-kseb-applications-malayalam.html',
  '/rental-agreement-format-malayalam.html',
  '/school-mark-list-software-kerala.html',
  '/gulf-cv-biodata-maker-malayalam.html',
  '/resignation-leave-letter-malayalam.html',
  '/about-privacy-disclaimer.html',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return Promise.resolve();
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const reqUrl = new URL(event.request.url);
  if (reqUrl.pathname.startsWith('/api/')) return;

  // Network-first strategy: always fetch fresh when online, cache copy for offline use
  event.respondWith(
    fetch(event.request)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200 && reqUrl.origin === self.location.origin) {
          const cloned = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned)).catch(() => {});
        }
        return networkRes;
      })
      .catch(() =>
        caches.match(event.request).then((cachedRes) => cachedRes || caches.match('/index.html'))
      )
  );
});
