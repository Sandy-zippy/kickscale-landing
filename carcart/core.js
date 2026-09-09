/* Car Cart demo — pure logic. No DOM here, so it can be unit-tested in node. */
(function (root) {
  'use strict';

  var fmt = function (n) { return n == null ? '—' : Number(n).toLocaleString('en-IN'); };

  var money = function (n) {
    if (n == null) return '—';
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
    if (n >= 100000) return '₹' + (n / 100000).toFixed(2) + ' L';
    return '₹' + fmt(n);
  };

  var DEFAULTS = function () {
    return { make: '', model: '', variant: '', year: '', q: '', sort: 'price-desc',
             price: 38000000, emi: 700000, km: 160000,
             fuel: [], tx: [], body: [], hideSold: true };
  };

  var LIMITS = { price: 38000000, emi: 700000, km: 160000 };

  function matches(c, S) {
    if (S.make && c.make !== S.make) return false;
    if (S.model && c.model !== S.model) return false;
    if (S.variant && c.variant !== S.variant) return false;
    if (S.year && String(c.year) !== String(S.year)) return false;
    if (c.price > S.price) return false;
    if (c.emi > S.emi) return false;
    if (c.km != null && c.km > S.km) return false;
    if (S.fuel.length && S.fuel.indexOf(c.fuel) < 0) return false;
    if (S.tx.length && S.tx.indexOf(c.transmission) < 0) return false;
    if (S.body.length && S.body.indexOf(c.body_type) < 0) return false;
    if (S.hideSold && c.availability !== 'Available') return false;
    if (S.q) {
      var hay = [c.make, c.model, c.variant, c.year, c.fuel, c.transmission, c.stock_id]
        .join(' ').toLowerCase();
      var words = S.q.toLowerCase().split(/\s+/).filter(Boolean);
      for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) < 0) return false;
    }
    return true;
  }

  var SORTS = {
    'price-desc': function (a, b) { return b.price - a.price; },
    'price-asc':  function (a, b) { return a.price - b.price; },
    'year-desc':  function (a, b) { return (b.year || 0) - (a.year || 0); },
    'km-asc':     function (a, b) { return (a.km == null ? 9e9 : a.km) - (b.km == null ? 9e9 : b.km); },
    'new-first':  function (a, b) { return a.days_listed - b.days_listed; }
  };

  /* Normalise a raw record once, so every consumer sees the same shape. */
  function prepare(c) {
    var d = c.demo || {};
    var sc = scoreRecord(c);
    return Object.assign({}, c, {
      score: sc, completeness: sc.pct,
      availability: d.availability || 'Available',
      name: (c.make || '') + ' ' + (c.model || ''),
      landed: d.landed_cost, floor: d.floor_price, margin: d.margin,
      marginpc: c.price ? (d.margin / c.price * 100) : 0,
      days: c.days_listed,
      holding: c.days_listed * Math.round((d.landed_cost || 0) * 0.00035)
    });
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* One catalogue card. Returns an HTML string; never empty. */
  function cardHTML(c, wished) {
    var av = c.availability;
    var badges = '';
    if (av !== 'Available') badges += '<span class="tag ' + esc(av.toLowerCase()) + '">' + esc(av) + '</span>';

    /* Public card carries nothing internal: no ageing, no data-quality flags.
       A missing field is simply left out rather than announced to the buyer. */
    var specs = [c.year, c.km != null ? fmt(c.km) + ' km' : null, c.fuel, c.transmission]
      .filter(function (v) { return v !== null && v !== undefined && v !== ''; })
      .map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');

    var variant = (c.variant && c.variant !== c.model) ? '<p class="c-var">' + esc(c.variant) + '</p>' : '';

    return '' +
      '<article class="card" data-id="' + esc(c.stock_id) + '" tabindex="0" role="button">' +
        '<div class="c-img">' +
          '<img loading="lazy" src="img/cover/' + esc(c.stock_id) + '_00.jpg" alt="' + esc(c.name) + '">' +
          '<div class="c-tags">' + badges + '</div>' +
          '<span class="c-count">' + c.n_photos + '</span>' +
          '<button class="heart" type="button" data-wish="' + esc(c.stock_id) + '" aria-pressed="' +
            (wished ? 'true' : 'false') + '" aria-label="Save ' + esc(c.name) + ' to wishlist">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5 4.2 12.9a4.7 4.7 0 0 1 6.6-6.7l1.2 1.1 1.2-1.1a4.7 4.7 0 1 1 6.6 6.7Z"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="c-body">' +
          '<h3 class="c-name">' + esc(c.name) + '</h3>' + variant +
          '<p class="c-price">' + money(c.price) + '</p>' +
          '<p class="c-emi">from ₹' + fmt(c.emi) + ' per month</p>' +
          '<ul class="c-spec">' + specs + '</ul>' +
        '</div>' +
      '</article>';
  }

  function ageBucket(days) {
    if (days <= 30) return ['0–30 days', 'ok'];
    if (days <= 60) return ['31–60 days', 'ok'];
    if (days <= 90) return ['61–90 days', 'warn'];
    return ['over 90 days', 'bad'];
  }

  /* Options for one cascade level, counted against everything chosen above it. */
  function cascadeOptions(cars, S, level) {
    var pool = cars.filter(function (c) {
      if (level >= 1 && S.make && c.make !== S.make) return false;
      if (level >= 2 && S.model && c.model !== S.model) return false;
      if (level >= 3 && S.variant && c.variant !== S.variant) return false;
      return true;
    });
    var key = ['make', 'model', 'variant', 'year'][level];
    var counts = {};
    pool.forEach(function (c) {
      var v = c[key];
      if (v === null || v === undefined || v === '') return;
      counts[v] = (counts[v] || 0) + 1;
    });
    return Object.keys(counts).sort(function (a, b) {
      return a.localeCompare(b, undefined, { numeric: true });
    }).map(function (v) { return [v, counts[v]]; });
  }


  /* ---------------- customer accounts & wishlist ----------------
     Demo storage: one JSON blob. Pass any {getItem,setItem} store so this
     stays testable outside a browser. Name + mobile only — no password,
     which is what a walk-in customer will actually complete on a phone. */

  var STORE_KEY = 'carcart_demo_v1';

  function normMobile(m){ return String(m||'').replace(/\D/g,'').slice(-10); }
  function validMobile(m){ return /^[6-9]\d{9}$/.test(normMobile(m)); }
  function validName(n){ return String(n||'').trim().length >= 2; }

  function loadStore(storage){
    try {
      var raw = storage.getItem(STORE_KEY);
      var d = raw ? JSON.parse(raw) : null;
      if (!d || typeof d !== 'object' || !d.users) return { users: {}, current: null };
      if (!d.hasOwnProperty('current')) d.current = null;
      return d;
    } catch (e) { return { users: {}, current: null }; }
  }
  function saveStore(storage, store){
    try { storage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) {}
    return store;
  }

  /* Sign up and sign in are the same action: the mobile number is the identity. */
  function signIn(store, name, mobile, when){
    if (!validName(name)) return { error: 'Please enter your full name.' };
    if (!validMobile(mobile)) return { error: 'Enter a 10-digit Indian mobile number.' };
    var id = normMobile(mobile);
    var u = store.users[id];
    if (!u) u = store.users[id] = { mobile: id, name: String(name).trim(), wishlist: [], joined: when || null, seed: false };
    else u.name = String(name).trim();
    u.lastSeen = when || null;
    store.current = id;
    return { user: u };
  }
  function signOut(store){ store.current = null; return store; }
  function currentUser(store){ return store.current ? store.users[store.current] || null : null; }

  function toggleWish(store, stockId){
    var u = currentUser(store);
    if (!u) return { error: 'signin' };
    var i = u.wishlist.indexOf(stockId);
    if (i < 0) u.wishlist.push(stockId); else u.wishlist.splice(i, 1);
    return { user: u, saved: i < 0 };
  }
  function isWished(store, stockId){
    var u = currentUser(store);
    return !!(u && u.wishlist.indexOf(stockId) >= 0);
  }

  /* How many customers saved each car — drives the console's Saves column. */
  function saveCounts(store){
    var out = {};
    Object.keys(store.users).forEach(function (id) {
      store.users[id].wishlist.forEach(function (s) { out[s] = (out[s] || 0) + 1; });
    });
    return out;
  }

  /* Everyone who wishlisted one car — the console's follow-up list. */
  function customersWhoSaved(store, stockId){
    return Object.keys(store.users).map(function (id) { return store.users[id]; })
      .filter(function (u) { return u.wishlist.indexOf(stockId) >= 0; })
      .map(function (u) { return { name: u.name, mobile: u.mobile, seed: !!u.seed,
                                   joined: u.joined || null, also: u.wishlist.length - 1 }; })
      .sort(function (a, b) { return b.also - a.also; });
  }

  /* One row per customer for the console, richest wishlist first. */
  function customerRows(store, cars){
    var byId = {};
    cars.forEach(function (c) { byId[c.stock_id] = c; });
    return Object.keys(store.users).map(function (id) {
      var u = store.users[id];
      var items = u.wishlist.map(function (s) { return byId[s]; }).filter(Boolean);
      var value = items.reduce(function (a, c) { return a + (c.price || 0); }, 0);
      return { mobile: u.mobile, name: u.name, seed: !!u.seed, joined: u.joined || null,
               count: items.length, value: value, cars: items };
    }).sort(function (a, b) { return b.count - a.count || b.value - a.value; });
  }

  /* Plausible sample customers so the console is not empty at first look. */
  var SEED = [
    ['Rahul Mehta',        '9848012345', ['CC-358','CC-374','CC-377'], '2026-08-24'],
    ['Anjali Reddy',       '9700045612', ['CC-371','CC-382'],          '2026-08-29'],
    ['Imran Qureshi',      '7075390011', ['CC-298','CC-395','CC-374','CC-358'], '2026-09-01'],
    ['Sridhar Varma',      '9885567890', ['CC-383'],                   '2026-09-03'],
    ['Priya Nair',         '6302588190', ['CC-381','CC-314','CC-375'], '2026-09-05'],
    ['Vikram Chowdary',    '9391122334', ['CC-391','CC-389'],          '2026-09-06']
  ];
  function seedStore(store){
    SEED.forEach(function (s) {
      var id = normMobile(s[1]);
      if (!store.users[id]) store.users[id] = { mobile: id, name: s[0], wishlist: s[2].slice(), joined: s[3], seed: true };
    });
    return store;
  }


  /* ---------------- record completeness ----------------
     Measured field by field against the public fields in the sales guide, so
     the score moves when a record actually differs. Returns the missing list
     too — a bare percentage nobody can act on is just a decoration. */

  function nonEmpty(v){ return !(v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)); }

  var GUIDE_FIELDS = [
    ['Stock number',        function(c){ return nonEmpty(c.stock_id); }],
    ['Make',                function(c){ return nonEmpty(c.make); }],
    ['Model',               function(c){ return nonEmpty(c.model); }],
    ['Variant',             function(c){ return nonEmpty(c.variant) && c.variant !== c.model; }],
    ['Manufacture year',    function(){ return false; }],
    ['Registration year',   function(c){ return nonEmpty(c.year); }],
    ['Registration number', function(){ return false; }],
    ['Body style',          function(c){ return nonEmpty(c.body_type); }],
    ['Exterior colour',     function(c){ return nonEmpty(c.colour); }],
    ['Interior colour',     function(){ return false; }],

    ['Fuel type',           function(c){ return nonEmpty(c.fuel); }],
    ['Engine capacity',     function(c){ return nonEmpty(c.engine_cc); }],
    ['Cylinders',           function(c){ return nonEmpty(c.cylinders); }],
    ['Power (BHP)',         function(){ return false; }],
    ['Torque (Nm)',         function(){ return false; }],
    ['Transmission',        function(c){ return nonEmpty(c.transmission); }],
    ['Number of gears',     function(){ return false; }],
    ['Drive type',          function(c){ return nonEmpty(c.drivetrain); }],
    ['Emission norm',       function(){ return false; }],
    ['Mileage (km/l)',      function(){ return false; }],

    ['Doors',               function(c){ return nonEmpty(c.doors); }],
    ['Width',               function(){ return false; }],
    ['Height',              function(){ return false; }],
    ['Wheelbase',           function(){ return false; }],
    ['Ground clearance',    function(){ return false; }],
    ['Boot space',          function(){ return false; }],
    ['Fuel tank',           function(){ return false; }],

    ['Kilometres driven',   function(c){ return nonEmpty(c.km); }],
    ['Number of owners',    function(){ return false; }],
    ['Inspection score',    function(){ return false; }],
    ['Accident-free',       function(){ return false; }],
    ['Service history',     function(){ return false; }],
    ['Insurance',           function(){ return false; }],
    ['Warranty',            function(){ return false; }],
    ['RC status',           function(){ return false; }],
    ['Tyre condition',      function(){ return false; }],
    ['Number of keys',      function(){ return false; }],
    ['Damage map',          function(){ return false; }],

    ['Feature list',        function(c){ return nonEmpty(c.features); }],

    ['Listed price',        function(c){ return nonEmpty(c.price) && c.price > 0; }],
    ['Offer price',         function(){ return false; }],
    ['EMI',                 function(){ return false; }],
    ['Finance available',   function(){ return false; }],
    ['RTO transfer cost',   function(){ return false; }],
    ['Booking amount',      function(){ return false; }],

    ['Availability status', function(){ return false; }],
    ['Showroom / branch',   function(){ return false; }],

    ['At least 10 photos',  function(c){ return (c.n_photos || 0) >= 10; }],
    ['Walkaround video',    function(){ return false; }],
    ['360° exterior',       function(){ return false; }],
    ['360° interior',       function(){ return false; }],
    ['Odometer photograph', function(){ return false; }]
  ];

  function scoreRecord(c){
    var present = [], missing = [];
    GUIDE_FIELDS.forEach(function(f){
      var ok = false;
      try { ok = !!f[1](c); } catch (e) { ok = false; }
      (ok ? present : missing).push(f[0]);
    });
    return { total: GUIDE_FIELDS.length, present: present.length,
             missing: missing, presentList: present,
             pct: Math.round(100 * present.length / GUIDE_FIELDS.length) };
  }

  var api = { fmt: fmt, money: money, DEFAULTS: DEFAULTS, LIMITS: LIMITS, matches: matches,
              SORTS: SORTS, prepare: prepare, cardHTML: cardHTML, ageBucket: ageBucket,
              cascadeOptions: cascadeOptions, esc: esc,
              STORE_KEY: STORE_KEY, normMobile: normMobile, validMobile: validMobile, validName: validName,
              loadStore: loadStore, saveStore: saveStore, signIn: signIn, signOut: signOut,
              currentUser: currentUser, toggleWish: toggleWish, isWished: isWished,
              saveCounts: saveCounts, customerRows: customerRows, customersWhoSaved: customersWhoSaved, seedStore: seedStore,
              GUIDE_FIELDS: GUIDE_FIELDS, scoreRecord: scoreRecord };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CC = api;
})(typeof self !== 'undefined' ? self : this);
