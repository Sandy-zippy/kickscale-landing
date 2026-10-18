/* EGO Master: the field app opens with no signal (17 Oct, R2b). Network first for every page file, so a phone with signal
   always gets the newest build (and the update notice still compares build stamps); with no signal the last copy answers.
   The API is never touched here: entries made offline wait in the field app's own queue. Build c5e52153ee. */
const CACHE = 'ego-field-c5e52153ee';
const SHELL = ['./', 'index.html', 'tokens.css?v=c5e52153ee', 'styles.css?v=c5e52153ee', 'live.css?v=c5e52153ee', 'field.css?v=c5e52153ee', 'boot.js?v=c5e52153ee', 'schema.js?v=c5e52153ee', 'field.js?v=c5e52153ee',
  'icons.svg', 'field.webmanifest', 'field-180.png', 'field-192.png', 'field-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ego-field-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok && !u.searchParams.has('nv')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); } return res; })
    .catch(() => caches.match(r).then(hit => hit || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
