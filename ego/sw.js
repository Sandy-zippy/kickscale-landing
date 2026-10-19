/* EGO Master: the field app opens with no signal (17 Oct, R2b). Network first for every page file, so a phone with signal
   always gets the newest build (and the update notice still compares build stamps); with no signal the last copy answers.
   The API is never touched here: entries made offline wait in the field app's own queue. Build 8a1f2d0c93. */
const CACHE = 'ego-field-8a1f2d0c93';
const SHELL = ['./', 'index.html', 'tokens.css?v=8a1f2d0c93', 'styles.css?v=8a1f2d0c93', 'live.css?v=8a1f2d0c93', 'field.css?v=8a1f2d0c93', 'boot.js?v=8a1f2d0c93', 'schema.js?v=8a1f2d0c93', 'msel.js?v=8a1f2d0c93', 'field.js?v=8a1f2d0c93',
  'icons.svg', 'field.webmanifest', 'field-180.png', 'field-192.png', 'field-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ego-field-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok && !u.searchParams.has('nv')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); } return res; })
    .catch(() => caches.match(r).then(hit => hit || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
