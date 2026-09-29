// Service worker: permite abrir la app sin señal (en terreno).
// Red primero para tener siempre la última versión; si no hay red, caché.
var CACHE = 'necropsias-v1';
var BASE = ['./', 'index.html', 'app.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(BASE); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(function(r){
    if (r.ok && (e.request.url.indexOf(self.location.origin) === 0 || e.request.url.indexOf('cdnjs') >= 0)){
      var copia = r.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, copia); });
    }
    return r;
  }).catch(function(){ return caches.match(e.request, { ignoreSearch:true }); }));
});
