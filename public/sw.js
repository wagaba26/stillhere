const CACHE_NAME = "stillhere-shell-v1";
const PROFILE_PATH = "/business/rwenzori-harvest";
const PRECACHE_PATHS = [PROFILE_PATH, "/offline", "/manifest.webmanifest", "/icon.svg"];

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
          if (response.ok && [PROFILE_PATH, "/offline"].includes(url.pathname)) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(url.pathname, response.clone());
          }
          return response;
        })
        .catch(async () => {
          if (url.pathname === PROFILE_PATH) {
            const profile = await caches.match(PROFILE_PATH);
            if (profile) return profile;
          }
          return (await caches.match("/offline")) || Response.error();
        }),
    );
  }
});
