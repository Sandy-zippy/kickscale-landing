/* Shared by the three outside pages (client, employee picker, vendor). They
   read and write the same store as the cockpit, so an approval on a portal
   shows up on the console at once — in the demo that store is this browser;
   in production it is the database behind a signed link. Namespace PT. */
(function (root) {
  'use strict';
  var KEY = GC.appKey();
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  var D = load();
  if (D && D.tenant) GC.configure(D.tenant);
  var T = GC.T;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }
  function log(kind, text, refs) {
    D.activity = D.activity || [];
    D.activity.unshift(Object.assign({ id: GC.uid('l'), at: new Date().toISOString(), by: null, kind: kind, text: text }, refs || {}));
  }
  function paint() {
    var r = document.documentElement.style;
    r.setProperty('--brand', T.brand); r.setProperty('--accent', T.accent);
    document.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = T[el.dataset.t] || ''; });
  }
  function noStore(el) {
    el.innerHTML = '<div class="card"><h2>Nothing to show yet</h2><p class="muted">This demo keeps its data in your browser. Open the <a href="console.html">cockpit</a> once to load the sample story, then come back to this link.</p></div>';
  }
  /* the cockpit in another tab changed the store — start from its version */
  window.addEventListener('storage', function (e) { if (e.key === KEY) location.reload(); });
  root.PT = { D: D, T: T, save: save, log: log, paint: paint, noStore: noStore, esc: GC.esc };
})(this);
