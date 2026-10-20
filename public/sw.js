const CACHE = "riverpilot-shell-v3";
const SHELL = ["/", "/manifest.json", "/icon.svg"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then(async (cache) => {
    await cache.addAll(SHELL);
    // Registration may happen after the first page has already fetched its JS/CSS.
    // Precache the current app shell assets so a single connected visit can reload offline.
    const html = await (await cache.match("/")).text();
    const assets = [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"?]+(?:\?[^\"]*)?)"/g)]
      .map((match) => match[1].replace(/&amp;/g, "&"));
    await Promise.allSettled([...new Set(assets)].map((asset) => cache.add(asset)));
    await self.skipWaiting();
  }));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE).then((cache) => cache.put("/", copy))); }
      return response;
    }).catch(() => caches.match("/")));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy))); }
    return response;
  })));
});
