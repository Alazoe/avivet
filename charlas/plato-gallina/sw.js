/* El plato de la gallina — funciona sin internet.
   Al cambiar index.html, subir el número de VERSION para que la tablet tome la versión nueva. */
var VERSION = "plato-gallina-v7";
var ARCHIVOS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (claves) {
    return Promise.all(claves.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

/* Primero lo guardado (rápido y sin internet); si hay internet, se actualiza en segundo plano. */
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.open(VERSION).then(function (c) {
      return c.match(e.request, { ignoreSearch: true }).then(function (guardado) {
        var red = fetch(e.request).then(function (resp) {
          if (resp && resp.ok && new URL(e.request.url).origin === self.location.origin) c.put(e.request, resp.clone());
          return resp;
        }).catch(function () { return guardado; });
        return guardado || red;
      });
    })
  );
});
