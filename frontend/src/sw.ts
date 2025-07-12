/**
 * Service Worker for Adaptive Learning Platform
 * Advanced PWA features with intelligent caching and offline support
 * EbroValley Digital - PWA Excellence
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope;
declare const clients: Clients;

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cache version for manual cache invalidation
const CACHE_VERSION = 'v1.2.0';

// Cache names
const CACHE_NAMES = {
  api: `api-cache-${CACHE_VERSION}`,
  analytics: `analytics-cache-${CACHE_VERSION}`,
  assets: `assets-cache-${CACHE_VERSION}`,
  fonts: `fonts-cache-${CACHE_VERSION}`,
  images: `images-cache-${CACHE_VERSION}`,
  offline: `offline-cache-${CACHE_VERSION}`
};

// Background sync for offline actions
const bgSync = new BackgroundSyncPlugin('offline-actions', {
  maxRetentionTime: 24 * 60 // 24 hours
});

// API calls - Network First with offline fallback
registerRoute(
  /^https:\/\/api\.ebrovalley\.digital\/.*/i,
  new NetworkFirst({
    cacheName: CACHE_NAMES.api,
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        purgeOnQuotaError: true
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200, 206]
      }),
      bgSync
    ]
  })
);

// Analytics - Stale While Revalidate for better UX
registerRoute(
  /\/api\/analytics\/.*/i,
  new StaleWhileRevalidate({
    cacheName: CACHE_NAMES.analytics,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 4, // 4 hours
        purgeOnQuotaError: true
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
);

// Google Fonts - Cache First (long-term cache)
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: CACHE_NAMES.fonts,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        purgeOnQuotaError: true
      })
    ]
  })
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: CACHE_NAMES.fonts,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        purgeOnQuotaError: true
      })
    ]
  })
);

// Images - Cache First with intelligent management
registerRoute(
  /\.(png|jpg|jpeg|gif|svg|webp|avif|ico)(\?.*)?$/i,
  new CacheFirst({
    cacheName: CACHE_NAMES.images,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 300,
        maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
        purgeOnQuotaError: true
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
);

// CDN resources
registerRoute(
  /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
  new CacheFirst({
    cacheName: CACHE_NAMES.assets,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        purgeOnQuotaError: true
      })
    ]
  })
);

// Navigation requests - Network First with offline fallback
const navigationRoute = new NavigationRoute(
  new NetworkFirst({
    cacheName: CACHE_NAMES.offline,
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
);

registerRoute(navigationRoute);

// Handle offline fallback for navigation
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html') || 
               caches.match('/') ||
               new Response(
                 '<!DOCTYPE html><html><head><title>Sin conexión</title></head><body><h1>Sin conexión a Internet</h1><p>Por favor, verifica tu conexión e intenta nuevamente.</p></body></html>',
                 { headers: { 'Content-Type': 'text/html' } }
               );
      })
    );
  }
});

// Handle share target
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/share') && event.request.method === 'POST') {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const title = formData.get('title') as string;
        const text = formData.get('text') as string;
        const url = formData.get('url') as string;
        
        // Store shared content for later processing
        const sharedContent = { title, text, url, timestamp: Date.now() };
        
        // Store in IndexedDB for processing when app is opened
        await storeSharedContent(sharedContent);
        
        return Response.redirect('/?shared=true');
      })()
    );
  }
});

// Background message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_CLEAR') {
    clearAllCaches();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    updateCache(event.data.urls);
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    image: data.image,
    vibrate: [200, 100, 200],
    data: data.data,
    actions: [
      {
        action: 'open',
        title: 'Abrir aplicación',
        icon: '/pwa-192x192.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/pwa-192x192.png'
      }
    ],
    requireInteraction: true,
    silent: false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cleanup-cache') {
    event.waitUntil(cleanupExpiredCache());
  }
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

// Helper functions
async function storeSharedContent(content: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(['shared'], 'readwrite');
    await tx.objectStore('shared').add(content);
  } catch (error) {
    console.error('Error storing shared content:', error);
  }
}

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EduLearnDB', 1);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('shared')) {
        db.createObjectStore('shared', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('offline')) {
        db.createObjectStore('offline', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function clearAllCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

async function updateCache(urls: string[]): Promise<void> {
  const cache = await caches.open(CACHE_NAMES.assets);
  await cache.addAll(urls);
}

async function cleanupExpiredCache(): Promise<void> {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    if (!Object.values(CACHE_NAMES).includes(cacheName)) {
      await caches.delete(cacheName);
    }
  }
}

async function syncOfflineData(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(['offline'], 'readonly');
    const store = tx.objectStore('offline');
    const request = store.getAll();
    
    request.onsuccess = async () => {
      const offlineData = request.result;
      
      for (const data of offlineData) {
        try {
          await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          
          // Remove synced data
          const deleteTx = db.transaction(['offline'], 'readwrite');
          await deleteTx.objectStore('offline').delete(data.id);
        } catch (error) {
          console.error('Sync failed for:', data.id, error);
        }
      }
    };
  } catch (error) {
    console.error('Offline data sync error:', error);
  }
}

// Install event
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      cleanupExpiredCache()
    ])
  );
});

console.log('🚀 Service Worker loaded - EbroValley Digital PWA v' + CACHE_VERSION);