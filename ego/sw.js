/* EGO Master: the field app opens with no signal (17 Oct, R2b). Network first for every page file, so a phone with signal
   always gets the newest build (and the update notice still compares build stamps); with no signal the last copy answers.
   The API is never touched here: entries made offline wait in the field app's own queue. Build fb88d55fa3. */
const CACHE = 'ego-field-fb88d55fa3';
const SHELL = ['./', 'index.html', 'tokens.css?v=fb88d55fa3', 'styles.css?v=fb88d55fa3', 'live.css?v=fb88d55fa3', 'field.css?v=fb88d55fa3', 'boot.js?v=fb88d55fa3', 'schema.js?v=fb88d55fa3', 'field.js?v=fb88d55fa3',
  'icons.svg', 'field.webmanifest', 'field-180.png', 'field-192.png', 'field-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ego-field-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok && !u.searchParams.has('nv')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); } return res; })
    .catch(() => caches.match(r).then(hit => hit || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
