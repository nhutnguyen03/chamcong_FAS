const CACHE_PREFIX = 'workpay-static-';
// Bump this name whenever a new offline app shell is released.
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const MAX_RUNTIME_ENTRIES = 80;
const APP_SHELL_URL = new URL('./', self.registration.scope);

function isInScope(url) {
  return url.origin === self.location.origin
    && url.pathname.startsWith(new URL(self.registration.scope).pathname);
}

function addStaticReference(reference, baseUrl, queue, seen) {
  const url = new URL(reference, baseUrl);
  if (!isInScope(url) || url.protocol !== 'http:' && url.protocol !== 'https:') return;
  url.hash = '';
  if (url.searchParams.has('t')) return;
  const key = url.href;
  if (seen.has(key)) return;
  seen.add(key);
  queue.push(url);
}

function htmlReferences(html, baseUrl, queue, seen) {
  const attributes = /\b(?:src|href)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(attributes)) {
    addStaticReference(match[1], baseUrl, queue, seen);
  }
}

async function precacheApplicationShell() {
  const cache = await caches.open(CACHE_NAME);
  const response = await fetch(APP_SHELL_URL, { cache: 'reload' });
  if (!response.ok) throw new Error(`App shell request failed (${response.status})`);
  const html = await response.clone().text();
  await cache.put(APP_SHELL_URL, response);

  const queue = [];
  const seen = new Set([APP_SHELL_URL.href]);
  htmlReferences(html, APP_SHELL_URL, queue, seen);

  while (queue.length) {
    const url = queue.shift();
    const assetResponse = await fetch(url, { cache: 'reload' });
    if (!assetResponse.ok) throw new Error(`Static asset request failed (${assetResponse.status}): ${url.pathname}`);
    await cache.put(url, assetResponse.clone());

    if (url.pathname.endsWith('.js')) {
      const source = await assetResponse.text();
      const imports = /(?:^|[;\n])\s*(?:import|export)\s+(?:[^'"]*?\s+from\s*)?['"]([^'"]+)['"]/gm;
      for (const match of source.matchAll(imports)) {
        if (match[1].startsWith('.')) addStaticReference(match[1], url, queue, seen);
      }
    } else if (url.pathname.endsWith('.css')) {
      const source = await assetResponse.text();
      const references = /url\(\s*["']?([^"')]+)["']?\s*\)/gi;
      for (const match of source.matchAll(references)) {
        if (!match[1].startsWith('data:')) addStaticReference(match[1], url, queue, seen);
      }
    } else if (url.pathname.endsWith('/manifest.json') || url.pathname === new URL('./manifest.json', self.registration.scope).pathname) {
      const manifest = await assetResponse.json();
      for (const icon of manifest.icons || []) {
        addStaticReference(icon.src, url, queue, seen);
      }
    }
  }
}

async function limitRuntimeCache(cache) {
  const keys = await cache.keys();
  const excess = keys.length - MAX_RUNTIME_ENTRIES;
  if (excess > 0) await Promise.all(keys.slice(0, excess).map(key => cache.delete(key)));
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    await precacheApplicationShell();
    if (!self.registration.active) await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames
      .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || !isInScope(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(APP_SHELL_URL, response.clone());
        }
        return response;
      } catch {
        return await caches.match(request, { ignoreSearch: true })
          || await caches.match(APP_SHELL_URL);
      }
    })());
    return;
  }

  const isStaticFile = /\.(?:m?js|css|png|jpe?g|svg|webp|ico|woff2?)$/i.test(url.pathname)
    || url.pathname === new URL('./manifest.json', self.registration.scope).pathname;
  if (!isStaticFile || url.pathname.endsWith('/service-worker.js') || url.pathname.includes('/api/')) return;
  if (url.search) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      await cache.put(request, response.clone());
      await limitRuntimeCache(cache);
    }
    return response;
  })());
});
