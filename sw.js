const CACHE = "balance-shell-v7";
const FILES = ["./", "index.html", "styles.css?v=4", "app.js?v=5", "manifest.webmanifest", "icon.svg"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES.map((file) => new URL(file, self.registration.scope)))).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || !url.href.startsWith(self.registration.scope) || url.pathname.endsWith("/api/claude-food") || url.pathname.endsWith("/api/claude-coach")) return;
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok && url.origin === self.location.origin) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
    return response;
  }).catch(async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    throw new Error("Requested resource is unavailable offline.");
  }));
});
