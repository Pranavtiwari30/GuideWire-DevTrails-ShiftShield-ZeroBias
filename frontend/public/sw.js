const CACHE = "shiftshield-v1";
const STATIC_PREFIXES = ["/_next/static/", "/icons/"];
const PRECACHE = ["/offline.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  // Remove old caches
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Only handle same-origin or /_next requests
  if (url.origin !== self.location.origin && !url.pathname.startsWith("/_next")) {
    return; // let API calls to backend pass through unmodified
  }

  // Static assets — cache-first
  if (STATIC_PREFIXES.some((p) => url.pathname.startsWith(p))) {
    e.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // Navigation requests — network with offline fallback
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // Everything else (API calls etc.) — network only, no caching
});
