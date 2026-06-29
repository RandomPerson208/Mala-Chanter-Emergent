const CACHE_NAME = "zenmala-pwa-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./404.html",
  "./manifest.webmanifest",
  "./favicon.png",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-192.png",
  "./icon-maskable-512.png"
];

function sameOrigin(url) {
  return url.origin === self.location.origin && url.href.startsWith(self.registration.scope);
}

function canCache(response) {
  return response && response.ok && (response.type === "basic" || response.type === "cors");
}

async function putInCache(request, response) {
  if (!canCache(response)) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

async function fetchAndCache(request, cacheKey = request) {
  const response = await fetch(request);
  await putInCache(cacheKey, response);
  return response;
}

function assetUrlsFromHtml(html) {
  return [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((value) => value && !value.startsWith("http") && !value.startsWith("data:"))
    .map((value) => new URL(value, self.registration.scope))
    .filter(sameOrigin)
    .map((url) => url.href);
}

async function cacheShell() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(
    CORE_ASSETS.map((asset) => cache.add(new Request(asset, { cache: "reload" })))
  );

  const indexUrl = new URL("./index.html", self.registration.scope);
  const response = await fetch(indexUrl, { cache: "reload" });
  if (!canCache(response)) return;

  await cache.put(indexUrl.href, response.clone());
  const html = await response.text();
  const assets = [...new Set(assetUrlsFromHtml(html))];
  await Promise.allSettled(
    assets.map((asset) => cache.add(new Request(asset, { cache: "reload" })))
  );
}

self.addEventListener("message", (event) => {
  if (event.origin !== self.location.origin) return;
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("install", (event) => {
  event.waitUntil(cacheShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (!sameOrigin(url)) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetchAndCache(event.request, new URL("./index.html", self.registration.scope).href).catch(
        () => caches.match(new URL("./index.html", self.registration.scope).href)
      )
    );
    return;
  }

  const shouldFetchFresh = /\.(?:html|js|css|json|webmanifest)$/i.test(url.pathname);
  if (shouldFetchFresh) {
    event.respondWith(
      fetchAndCache(event.request).catch(() => caches.match(event.request, { ignoreSearch: true }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      const network = fetchAndCache(event.request).catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || new URL("./", self.registration.scope).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if (new URL(client.url).origin === self.location.origin) {
          if ("navigate" in client) await client.navigate(targetUrl);
          if ("focus" in client) return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
