const CACHE_NAME = "stillhere-shell-v2";
const PROFILE_PATH = "/business/rwenzori-harvest";
const CONTINUITY_PATH = "/recover";
const OFFLINE_DOCUMENTS = [PROFILE_PATH, CONTINUITY_PATH, "/offline"];
const PRECACHE_PATHS = [...OFFLINE_DOCUMENTS, "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(PRECACHE_PATHS.map((path) => cache.add(path))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    request.headers.get("RSC") ||
    request.headers.get("Next-Router-Prefetch")
  ) {
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }
          return response;
        });
      }),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok && OFFLINE_DOCUMENTS.includes(url.pathname)) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(url.pathname, response.clone());
          }
          return response;
        })
        .catch(async () => {
          if (OFFLINE_DOCUMENTS.includes(url.pathname)) {
            const cachedDocument = await caches.match(url.pathname);
            if (cachedDocument) return cachedDocument;
          }
          return (await caches.match("/offline")) || Response.error();
        }),
    );
  }
});
