const CACHE_VERSION = "v1";
const LOCAL_CARDS_CACHE = `tm-local-cards-${CACHE_VERSION}`;
const REMOTE_CARDS_CACHE = `tm-remote-cards-${CACHE_VERSION}`;
const APP_SHELL_CACHE = `tm-app-shell-${CACHE_VERSION}`;

const CARD_COUNT = 48;
const DEFAULT_LANGUAGE = "FR";

const buildLocalCardPath = (language, cardId) =>
  `./assets/cards/TM_GameCards_${language}-${String(cardId).padStart(2, "0")}.png`;

const localDefaultCards = Array.from({ length: CARD_COUNT }, (_, index) =>
  buildLocalCardPath(DEFAULT_LANGUAGE, index + 1)
);

const APP_SHELL_PATHS = ["./", "./index.html", "./manifest.json"];

const isCacheableResponse = (response) =>
  response && (response.ok || response.type === "opaque");

const isLocalCardRequest = (url) =>
  url.origin === self.location.origin &&
  /\/assets\/cards\/TM_GameCards_[A-Z]{2,3}-\d{2}\.png$/i.test(url.pathname);

const isRemoteCardRequest = (url) =>
  url.origin === "https://turingmachine.info" &&
  /\/images\/criteriacards\/[A-Z]{2,3}\/TM_GameCards_[A-Z]{2,3}-\d{2}\.png$/i.test(
    url.pathname
  );

const cacheFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (isCacheableResponse(networkResponse)) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (_error) {
    return new Response("", { status: 504, statusText: "Gateway Timeout" });
  }
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_PATHS)),
      caches
        .open(LOCAL_CARDS_CACHE)
        .then((cache) => cache.addAll(localDefaultCards))
        .catch(() => {
          // Local cards may be incomplete depending on deployment bundle.
        }),
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                ![LOCAL_CARDS_CACHE, REMOTE_CARDS_CACHE, APP_SHELL_CACHE].includes(key)
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (isLocalCardRequest(requestUrl)) {
    event.respondWith(cacheFirst(event.request, LOCAL_CARDS_CACHE));
    return;
  }

  if (isRemoteCardRequest(requestUrl)) {
    event.respondWith(cacheFirst(event.request, REMOTE_CARDS_CACHE));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(APP_SHELL_CACHE);
        return cache.match("./index.html");
      })
    );
  }
});

self.addEventListener("message", (event) => {
  const data = event.data || {};

  if (data.type !== "PREFETCH_REMOTE_CARDS" || !Array.isArray(data.urls)) {
    return;
  }

  event.waitUntil(
    caches.open(REMOTE_CARDS_CACHE).then(async (cache) => {
      await Promise.all(
        data.urls.map(async (url) => {
          const request = new Request(url, { mode: "no-cors" });
          const cachedResponse = await cache.match(request);

          if (cachedResponse) {
            return;
          }

          try {
            const response = await fetch(request);
            if (isCacheableResponse(response)) {
              await cache.put(request, response.clone());
            }
          } catch (_error) {
            // Ignore prefetch errors: cards still load on demand.
          }
        })
      );
    })
  );
});
