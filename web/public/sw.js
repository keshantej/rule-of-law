const CACHE = "arizona-rule-of-law-v1";

function withBasePath(path) {
  const basePath = self.location.pathname.replace(/\/sw\.js$/, "");
  return `${basePath}${path}`;
}

const ASSETS = [
  withBasePath("/presentation/"),
  withBasePath("/presentation/standalone/"),
  withBasePath("/presentation/speaker/"),
  withBasePath("/certification/"),
  withBasePath("/presenter/"),
  withBasePath("/resources/"),
  withBasePath("/toolkit/"),
  withBasePath("/downloads/arizona_rule_of_law_handout.pdf")
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).catch(() => undefined)
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request)
        .then((response) => {
          if (response.ok && event.request.url.startsWith(self.location.origin)) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(withBasePath("/presentation/")));
    })
  );
});
