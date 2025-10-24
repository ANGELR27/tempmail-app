// Service Worker para PWA
const CACHE_NAME = 'tempmail-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/mail.svg'
];

// Instalar el service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Activar el service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar desde caché o hacer fetch
        return response || fetch(event.request);
      })
  );
});

// Escuchar mensajes para mostrar notificaciones
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, badge, tag, data } = event.data.payload;
    
    self.registration.showNotification(title, {
      body,
      icon: icon || '/mail.svg',
      badge: badge || '/mail.svg',
      tag,
      data,
      vibrate: [200, 100, 200],
      requireInteraction: true
    });
  }
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
