// ============================================================
// service-worker.js — Task Manager PWA
// Стратегия: Network-First для index.html → мгновенное обновление
// При каждом коммите пользователи сразу видят обновление
// ============================================================

// Поменяй версию при каждом обновлении index.html!
const CACHE_VERSION = 'v3';
const CACHE_NAME = `task-manager-${CACHE_VERSION}`;

// Файлы для кэширования (только статика, НЕ index.html)
const STATIC_CACHE = [
    '/manifest.json',
    '/service-worker.js'
];

// -------------------------------------------------------
// INSTALL: устанавливаем SW + skipWaiting — активируемся без ожидания
// -------------------------------------------------------
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_CACHE))
            .then(() => self.skipWaiting()) // активируемся мгновенно
    );
});

// -------------------------------------------------------
// ACTIVATE: удаляем старые кэши + берём контроль над всеми вкладками
// -------------------------------------------------------
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            ))
            .then(() => self.clients.claim()) // берём контроль без перезагрузки
    );
});

// -------------------------------------------------------
// MESSAGE: получаем команду SKIP_WAITING от страницы
// -------------------------------------------------------
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// -------------------------------------------------------
// FETCH: стратегия запросов
// • index.html — NETWORK FIRST (всегда свежий с сети, fallback кэш)
// • Supabase API — пропускаем (всегда сеть)
// • Остальное — CACHE FIRST (статика)
// -------------------------------------------------------
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Пропускаем не-GET запросы
    if (event.request.method !== 'GET') return;

    // Пропускаем Supabase API — всегда сеть
    if (url.hostname.includes('supabase.co')) return;

    // Пропускаем chrome-extension и др.
    if (!url.protocol.startsWith('http')) return;

    // ★ index.html — NETWORK FIRST: всегда следим за свежей версией
    const isHtml = url.pathname === '/' ||
                   url.pathname.endsWith('.html') ||
                   url.pathname.endsWith('/index.html') ||
                   (event.request.headers.get('accept') || '').includes('text/html');

    if (isHtml) {
        event.respondWith(
            fetch(event.request, { cache: 'no-store' }) // запрещаем браузерный кэш
                .then((response) => {
                    // Сохраняем свежую версию в кэш
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
                    return response;
                })
                .catch(() =>
                    // Оффлайн: берём из кэша
                    caches.match(event.request)
                        .then((cached) => cached || caches.match('/index.html'))
                )
        );
        return;
    }

    // ★ Статика (manifest.json и др.) — CACHE FIRST
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
                }
                return response;
            });
        })
    );
});

// -------------------------------------------------------
// PUSH уведомления
// -------------------------------------------------------
self.addEventListener('push', (event) => {
    if (!event.data) return;
    const data = event.data.json();
    event.waitUntil(
        self.registration.showNotification(data.title || 'Планировщик', {
            body: data.body || '',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            data
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow('/'));
});
