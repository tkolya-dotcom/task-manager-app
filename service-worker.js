// Service Worker с быстрым обновлением
const CACHE_VERSION = 'v2'; // Увеличивайте при каждом обновлении
const CACHE_NAME = `pwa-cache-${CACHE_VERSION}`;

const HOSTNAME_WHITELIST = [
    self.location.hostname,
    'fonts.gstatic.com',
    'fonts.googleapis.com',
    'cdn.jsdelivr.net'
];

// Активация: удаляем старые кэши
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => cacheName.startsWith('pwa-cache-') && cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            );
        }).then(() => self.clients.claim())
    );
});

// Установка: пропускаем ожидание
self.addEventListener('install', event => {
    self.skipWaiting();
});

// Fetch: разные стратегии для разных типов файлов
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Проверяем whitelist
    if (HOSTNAME_WHITELIST.indexOf(url.hostname) === -1) {
        return;
    }

    // Network First для HTML (всегда свежие данные)
    if (event.request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Кэшируем успешные ответы
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache First для остальных ресурсов (JS, CSS, изображения)
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) {
                // Обновляем кэш в фоне
                fetch(event.request).then(response => {
                    if (response.ok) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, response);
                        });
                    }
                }).catch(() => {});
                return cached;
            }

            // Если нет в кэше, загружаем из сети
            return fetch(event.request).then(response => {
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            });
        })
    );
});
