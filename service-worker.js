const CACHE_VERSION = "grimoire-v0.2.0-pwa-6";
const APP_SHELL = [
  "/",
  "/Le_Grimoire_v0_2_0.html",
  "/manifest.webmanifest",
  "/css/styles.css",
  "/js/i18n.js",
  "/js/data/illustrations.js",
  "/js/data/plants.js",
  "/js/data/knowledge-profiles.js",
  "/js/data/content-en.js",
  "/js/storage/photos.js",
  "/js/ui/plant-plates.js",
  "/js/app.js",
  "/js/pwa.js",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
  "/assets/icons/icon-maskable-512.png",
  "/assets/illustrations/menthe.svg",
  "/assets/illustrations/lavande.svg",
  "/assets/illustrations/romarin.svg",
  "/assets/illustrations/rose.svg",
  "/assets/illustrations/thym.svg",
  "/assets/illustrations/persil.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if(request.method !== "GET" || url.pathname.startsWith("/api/")) return;
  if(url.origin !== self.location.origin) return;

  if(request.mode === "navigate"){
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(async () =>
          (await caches.match(request)) ||
          (await caches.match("/Le_Grimoire_v0_2_0.html"))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached =>
      cached || fetch(request).then(response => {
        if(response.ok){
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
        }
        return response;
      })
    )
  );
});
