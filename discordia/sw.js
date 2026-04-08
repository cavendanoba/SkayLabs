const CACHE_NAME = 'discordia-v1';

// Assets del shell de la app — se precargan al instalar
const PRECACHE_ASSETS = [
  './',
  './style.css',
  './app.js',
  './catalog.js',
  './cart.js',
  './config.js',
  './products.js',
  './components/filters.js',
  './components/productCard.js',
  './assets/default.png',
  './assets/logo-discordia.png',
  './assets/texto-discordia.png',
  './assets/no-stock.png',
];

// Instalar: precachear el shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activar: eliminar cachés viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first para llamadas a la API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first para todo lo demás (assets, JS, CSS, imágenes)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});
