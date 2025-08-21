const CACHE_NAME = "roster-cache-v5"; // bump version
const urlsToCache = [
  "./",
  "./index.html",
  "./contacts.html",    // ✅ add contacts page
  "./style.css",
  "./script.js",
  "./contacts.js",      // ✅ add contacts script
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./offline.html"
];

// Install: cache required files (skip failing ones)
self.addEventListener("install", event => {
  self.skipWaiting(); // Activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        urlsToCache.map(url =>
          fetch(url)
            .then(response => {
              if (response.ok) return cache.put(url, response);
            })
            .catch(() => {
              console.warn("SW: Failed to cache", url);
            })
        )
      );
    })
  );
});

// Activate: clean old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );

  // Notify open clients
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then(clients => {
        clients.forEach(client =>
          client.postMessage({ type: "UPDATE_AVAILABLE" })
        );
      })
  );
});

// Fetch: stale-while-revalidate
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.ok) {
            caches.open(CACHE_NAME).then(cache =>
              cache.put(event.request, networkResponse.clone())
            );
          }
          return networkResponse;
        })
        .catch(() => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === "navigate") {
            return caches.match("./offline.html");
          }
        });

      return cachedResponse || fetchPromise;
    })
  );
});
