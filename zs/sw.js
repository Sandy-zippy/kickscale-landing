/* The phone app's service worker (29 Oct 2026). It keeps the SHELL so the
   cockpit opens like an app from the home screen, and nothing else.

   Three rules, each a decision:
   1. Never touches another origin (the API server, Google Fonts) and never
      anything under /api. Client data is never cached here.
   2. Pages are network-first. The "A new version of the cockpit is ready" notice
      compares build stamps in console.html, so a cached page would hide every
      new build. The cache is only the fallback when there is no signal.
   3. The update check itself (console.html?nv=..., cache: no-store) is not
      answered here at all, so it always sees the live file. */
/* v2 (29 Oct): v1 was live 14:04 to 14:09 by mistake; activate clears it */
var CACHE = 'zs-shell-v2';

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function skip(req, url) {
  return req.method !== 'GET' ||
    url.origin !== self.location.origin ||
    /\/api(\/|$)/.test(url.pathname) ||
    url.searchParams.has('nv') ||
    req.cache === 'no-store';
}

self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (skip(req, url)) return;

  var page = req.mode === 'navigate' || /\.html$|\/$/.test(url.pathname);
  if (page) {
    e.respondWith(fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(url.pathname, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(url.pathname).then(function (hit) { return hit || caches.match(url.pathname.replace(/\/$/, '/index.html')); });
    }));
    return;
  }

  /* app files: a ?b= stamp changes every build, so a stamped file never goes
     stale and can come straight from the cache */
  e.respondWith(caches.match(req).then(function (hit) {
    var net = fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    });
    if (hit && url.searchParams.has('b')) return hit;
    return hit ? (net.catch(function () { return hit; }), hit) : net;
  }));
});
