/// <reference lib="es2022" />

interface PrecacheEntry {
  url: string;
  revision: string | null;
}

interface SWExtendableEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

interface SWFetchEvent extends Event {
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
}

interface SWPushEvent extends SWExtendableEvent {
  data?: {
    json(): unknown;
    text(): string;
  } | null;
}

interface SWNotificationEvent extends SWExtendableEvent {
  notification: Notification & {
    data?: { url?: string };
    close(): void;
  };
}

interface SWWindowClient {
  url: string;
  focused?: boolean;
  focus(): Promise<SWWindowClient>;
  navigate?(url: string): Promise<SWWindowClient | null>;
}

interface SWGlobalScope {
  __WB_MANIFEST: Array<PrecacheEntry | string>;
  location: Location;
  skipWaiting(): Promise<void>;
  clients: {
    claim(): Promise<void>;
    matchAll(options?: { type?: string; includeUncontrolled?: boolean }): Promise<SWWindowClient[]>;
    openWindow(url: string): Promise<SWWindowClient | null>;
  };
  registration: ServiceWorkerRegistration;
  addEventListener(type: string, listener: (event: any) => void): void;
}

const sw = self as unknown as SWGlobalScope;
const CACHE_NAME = 'easylib-pwa-v2';
const isDevSw = sw.location.pathname.includes('dev-sw');

const injectedManifest = (self as unknown as SWGlobalScope).__WB_MANIFEST;
const rawManifest = Array.isArray(injectedManifest) ? injectedManifest : [];
const precacheUrls = rawManifest
  .map((entry) => (typeof entry === 'string' ? entry : entry?.url))
  .filter((url): url is string => Boolean(url));

sw.addEventListener('install', (event: SWExtendableEvent) => {
  event.waitUntil(
    (async () => {
      if (!isDevSw && precacheUrls.length > 0) {
        const cache = await caches.open(CACHE_NAME);
        await Promise.allSettled(
          precacheUrls.map((url) =>
            cache.add(new Request(url, { cache: 'reload' })).catch(() => undefined)
          )
        );
      }
      await sw.skipWaiting();
    })()
  );
});

sw.addEventListener('activate', (event: SWExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => (isDevSw ? true : k !== CACHE_NAME))
          .map((k) => caches.delete(k))
      );
      await sw.clients.claim();
    })()
  );
});

sw.addEventListener('message', (event: { data?: { type?: string } }) => {
  if (event.data?.type === 'SKIP_WAITING') {
    sw.skipWaiting();
  }
});

sw.addEventListener('fetch', (event: SWFetchEvent) => {
  // Never intercept network/module requests in Vite dev mode; keep SW solely for Push & lifecycle
  if (isDevSw) return;

  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== sw.location.origin) return;
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/mediapipe-wasm/')
  ) {
    return;
  }

  // Navigation requests: network first with offline cache fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResp = await fetch(req);
          if (networkResp && networkResp.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(req, networkResp.clone()).catch(() => undefined);
          }
          return networkResp;
        } catch {
          const cache = await caches.open(CACHE_NAME);
          return (
            (await cache.match('/index.html')) ||
            (await cache.match('/')) ||
            Response.error()
          );
        }
      })()
    );
    return;
  }

  // Hashed Vite assets can be served cache-first; everything else uses network-first
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        if (cached) {
          return cached;
        }
        try {
          const networkResp = await fetch(req);
          if (networkResp && networkResp.ok && networkResp.type === 'basic') {
            cache.put(req, networkResp.clone()).catch(() => undefined);
          }
          return networkResp;
        } catch {
          return Response.error();
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const networkResp = await fetch(req);
        if (networkResp && networkResp.ok && networkResp.type === 'basic') {
          cache.put(req, networkResp.clone()).catch(() => undefined);
        }
        return networkResp;
      } catch {
        const cached = await cache.match(req);
        return cached || Response.error();
      }
    })()
  );
});

// Background Push Notification Handler (fires even when app is closed)
sw.addEventListener('push', (event: SWPushEvent) => {
  let payload: {
    title?: string;
    body?: string;
    url?: string;
    tag?: string;
  } = {};

  if (event.data) {
    try {
      payload = event.data.json() as typeof payload;
    } catch {
      try {
        payload = { body: event.data.text() };
      } catch {
        payload = {};
      }
    }
  }

  const title = (payload.title || 'EasyLib — Hora de praticar Libras').slice(0, 120);
  const body = (
    payload.body || 'Mantenha sua ofensiva ativa! Faça uma lição rápida de 2 minutos.'
  ).slice(0, 300);
  const targetUrl = typeof payload.url === 'string' && payload.url.startsWith('/') ? payload.url : '/';

  const options: NotificationOptions & { vibrate?: number[] } = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: payload.tag || 'easylib-reminder',
    data: { url: targetUrl },
    vibrate: [140, 70, 140],
  };

  event.waitUntil(sw.registration.showNotification(title, options));
});

// Notification click: focus existing EasyLib window or open app
sw.addEventListener('notificationclick', (event: SWNotificationEvent) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    (async () => {
      const allClients = await sw.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus();
          if (client.navigate && new URL(client.url).pathname !== targetUrl) {
            await client.navigate(targetUrl).catch(() => undefined);
          }
          return;
        }
      }

      if (sw.clients.openWindow) {
        await sw.clients.openWindow(targetUrl);
      }
    })()
  );
});
