/* Agentic Cockpit — Corporate Gifting edition. Pure logic, no DOM, so it runs
   under node for the tests. Namespace GC.

   The machinery (roles and access, follow-ups, note scoring, date ranges,
   targets, automations) is the Car Cart / Vaarahi library with the vocabulary
   moved to gifting. What is new here: a Company above the person, products
   derived from the catalogue engine, quantity-band pricing with GST, the
   compliance check, and a second board for orders. Everything client-specific
   is read from the tenant profile (tenant.js), never written as a literal. */
(function (root) {
  'use strict';

  var BASE = (typeof module !== 'undefined' && module.exports) ? require('./tenant.js') : root.TENANT;
  var T = clone(BASE);

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* Settings -> Business profile writes overrides; this folds them over the
     tenant file. Arrays replace, objects merge one level deep. */
  function configure(over) {
    T = clone(BASE);
    Object.keys(over || {}).forEach(function (k) {
      var v = over[k];
      if (v === null || v === undefined) return;
      if (typeof v === 'object' && !Array.isArray(v) && typeof T[k] === 'object' && !Array.isArray(T[k]))
        T[k] = Object.assign({}, T[k], v);
      else T[k] = v;
    });
    api.T = T;
    return T;
  }

  /* ---------------- small helpers ---------------- */

  var fmt = function (n) { return n == null || isNaN(n) ? '—' : Number(n).toLocaleString('en-IN'); };
  function money(n) {
    if (n == null || isNaN(n)) return '—';
    var neg = n < 0; n = Math.abs(n);
    var s = n >= 10000000 ? '₹' + (n / 10000000).toFixed(2) + ' Cr'
          : n >= 100000 ? '₹' + (n / 100000).toFixed(2) + ' L'
          : '₹' + fmt(Math.round(n));
    return neg ? '−' + s : s;
  }
  function rupees(n) { return n == null || isNaN(n) ? '—' : '₹' + fmt(Math.round(n)); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function parseISO(s) {
    var p = String(s || '').slice(0, 10).split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  var NOW = null;                         // tests pin the clock; the app leaves it null
  function setNow(s) { NOW = s || null; }
  function today() { return NOW || iso(new Date()); }
  function addDays(s, n) { var d = parseISO(s || today()); d.setDate(d.getDate() + n); return iso(d); }
  function daysBetween(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }
  function nonEmpty(v) { return !(v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)); }
  function uid(p) { return p + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }

  /* Deterministic 0..1 from a string, so derived demo figures (cost, vendor
     rating) are identical on every load without being stored. */
  function hash01(s) {
    var h = 2166136261;
    s = String(s);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ((h >>> 0) % 100000) / 100000;
  }


  /* ================= ROLES AND ACCESS =================
     One accessor, one row filter, two maskers. Lists filter, detail pages
     block, figures mask, nav hides. Denial is a polite card, never a 403. */

  var CAPS = [
    ['cost',        'Cost & margins',     'Vendor cost, margin % and profit on every product, quote and order.'],
    ['clients',     'Client records',     'Open companies, contacts, the inbox and the sales board.'],
    ['seeMobile',   'Client mobiles',     'See full phone numbers instead of the last four digits.'],
    ['catalogue',   'Edit products',      'Change product fields, add products, import price lists.'],
    ['vendors',     'Vendors & sourcing', 'Vendor records, RFQs, reverse auctions, awarding.'],
    ['orders',      'Orders board',       'Production, branding, QC and dispatch.'],
    ['money',       'Invoices & payments','Raise invoices and record payments.'],
    ['agents',      'Approve agent work', 'Approve, edit or reject what the agents propose.'],
    ['automations', 'Build automations',  'Create and edit automation rules.'],
    ['exportData',  'Export data',        'Download client, product or order data as a file.'],
    ['targets',     'Set targets',        'Set the monthly targets each person carries.'],
    ['reports',     'Team reports',       'See everyone\'s numbers, not just their own.'],
    ['settings',    'Settings',           'Business profile, roles, pipelines, agents, compliance.'],
    ['passwords',   'Passwords',          'See and reset other people\'s sign-in passwords.']
  ];
  var CAP_KEYS = CAPS.map(function (c) { return c[0]; });

  var SCOPES = { own: 'Only their own', branch: 'Their office', company: 'Everyone' };

  function row(scope, on) {
    var o = { scope: scope };
    CAP_KEYS.forEach(function (k) { o[k] = on.indexOf(k) >= 0; });
    return o;
  }
  var ALL = CAP_KEYS.slice();
  var ACCESS_DEFAULT = {
    owner:    row('company', ALL),
    head:     row('company', ['cost', 'clients', 'seeMobile', 'catalogue', 'vendors', 'orders', 'agents', 'automations', 'exportData', 'targets', 'reports']),
    am:       row('own',     ['clients', 'seeMobile', 'orders', 'agents']),
    sourcing: row('company', ['cost', 'catalogue', 'vendors', 'orders', 'agents']),
    ops:      row('company', ['clients', 'orders', 'vendors', 'agents']),
    accounts: row('company', ['cost', 'clients', 'orders', 'money', 'exportData', 'reports'])
  };
  var NO_ACCESS = row('own', []);

  function defaultAccess() { return clone(ACCESS_DEFAULT); }
  function acc(user, access) {
    if (!user) return Object.assign({}, NO_ACCESS);
    return (access && access[user.role]) || ACCESS_DEFAULT[user.role] || NO_ACCESS;
  }
  function inScope(r, user, access) {
    if (!user || !r) return false;
    var a = acc(user, access);
    if (a.scope === 'company') return true;
    if (a.scope === 'branch') return !r.branch || r.branch === user.branch;
    return r.assigned_to === user.id;
  }
  function canOpen(r, user, access) { return inScope(r, user, access) || !r.assigned_to; }
  function maskMobile(m, user, access) {
    if (!m) return '—';
    return acc(user, access).seeMobile ? m : '••••••' + String(m).slice(-4);
  }
  /* Masking is a display rule in the demo. On a server the column is simply
     not in the response for these roles — see README. */
  function maskCost(v, user, access) { return acc(user, access).cost ? money(v) : '₹ ••••'; }

  var STAFF = clone(T.staff);
  function setStaff(list) { if (list && list.length) STAFF = list; return STAFF; }
  function staffList() { return STAFF; }
  function staffById(id) { return STAFF.filter(function (u) { return u.id === id; })[0] || null; }
  function staffByRole(r) { return STAFF.filter(function (u) { return u.role === r; }); }
  function staffName(id) { var u = staffById(id); return u ? u.name : 'Unassigned'; }
  function authenticate(login, pass) {
    return STAFF.filter(function (x) {
      return x.login === String(login || '').trim().toLowerCase() && x.pass === pass;
    })[0] || null;
  }

  /* Two rules that are deliberately NOT capabilities: nobody sets their own
     password, and only the owner touches the owner's row. */
  var SENIOR_ROLES = ['owner'];
  function canSetPass(actor, target, access) {
    if (!actor || !target) return false;
    if (actor.role === 'owner') return true;
    if (!acc(actor, access).passwords) return false;
    if (target.role === 'owner') return false;
    return target.id !== actor.id;
  }
  function canSetRole(actor, target, role, access) {
    if (!actor || !target) return false;
    if (!acc(actor, access).settings) return false;
    if (actor.role === 'owner') return true;
    if (target.id === actor.id || target.role === 'owner') return false;
    if (role && SENIOR_ROLES.indexOf(role) >= 0) return false;
    return true;
  }
  function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim()); }
  function validPass(p) { return String(p || '').trim().length >= 6; }
  function branchName(branches, id) {
    var b = (branches || []).filter(function (x) { return x.id === id; })[0];
    return b ? b.name : '—';
  }


  /* ================= PRODUCTS =================
     The catalogue engine generates ~1 lakh products deterministically. That is
     far too big for localStorage, so nothing about a product is stored unless
     somebody changed it: the store keeps an overlay of edits keyed by id, and
     every figure the demo invents (cost, GST, branding) is DERIVED from the id,
     identical on every load, and marked own:false so it never flatters the
     completeness score. */

  /* Per category (engine order): GST %, HSN, branding methods, cost ratio band. */
  var CAT_META = [
    { gst: 18, hsn: '3303', brand: ['Sleeve print', 'Box printing'] },                  // Perfume
    { gst: 18, hsn: '8518', brand: ['Laser engraving', 'UV print', 'Pad print'] },       // Electronics
    { gst: 12, hsn: '6105', brand: ['Embroidery', 'Screen print', 'DTF print'] },        // Apparel
    { gst: 18, hsn: '4202', brand: ['Embroidery', 'Screen print', 'Metal badge'] },      // Bags
    { gst: 18, hsn: '9608', brand: ['Laser engraving', 'Debossing', 'Foil stamping'] },  // Stationery
    { gst: 18, hsn: '9617', brand: ['Laser engraving', 'Screen print', 'Sublimation'] }, // Drinkware
    { gst: 12, hsn: '7418', brand: ['Laser engraving', 'Box printing'] },                // Home
    { gst: 12, hsn: '0801', brand: ['Box printing', 'Sleeve print', 'Greeting card'] },   // Gourmet
    { gst: 18, hsn: '3304', brand: ['Box printing', 'Sleeve print'] },                   // Wellness
    { gst: 18, hsn: '9505', brand: ['Box printing', 'Greeting card', 'Ribbon & tag'] },   // Hampers
    { gst: 18, hsn: '7013', brand: ['Laser engraving', 'Sand blasting'] },               // Awards
    { gst: 18, hsn: '9102', brand: ['Dial print', 'Laser engraving', 'Box printing'] }   // Watches
  ];

  function catMeta(ci) { return CAT_META[ci] || { gst: 18, hsn: '9999', brand: [] }; }

  /* One product, as every screen sees it. `edit` is the overlay for this id. */
  function product(item, db, edit) {
    if (!item) return null;
    var e = edit || {};
    var cm = catMeta(item.cat);
    var h = hash01(item.id);
    var price = e.price != null ? Number(e.price) : item.price;
    var ratio = 0.6 + h * 0.2;                                     // cost is 60–80% of list
    var cost = e.cost != null ? Number(e.cost) : Math.round(price * ratio);
    var v = db && db.vendors[item.vendor];
    var p = {
      id: item.id, raw: item,
      name: e.name || item.name,
      cat: item.cat, category: db ? db.cats[item.cat].name : '',
      vendor: item.vendor, vendorName: v ? v.name : '—',
      price: price, cost: cost, margin: price - cost,
      marginPct: price ? Math.round(100 * (price - cost) / price) : 0,
      moq: e.moq != null ? Number(e.moq) : item.moq,
      lead: e.lead != null ? Number(e.lead) : item.lead,
      stock: e.stock != null ? Number(e.stock) : item.stock,
      gst: e.gst != null ? Number(e.gst) : cm.gst,
      hsn: e.hsn || cm.hsn,
      branding: e.branding || (item.attr.indexOf(1) >= 0 ? cm.brand.slice(0, 2 + (h > 0.5 ? 1 : 0)) : []),
      brandable: item.attr.indexOf(1) >= 0,
      sample: e.sample != null ? !!e.sample : item.attr.indexOf(5) >= 0,
      ucpmp: item.attr.indexOf(6) >= 0,
      premium: item.attr.indexOf(0) >= 0,
      eco: item.attr.indexOf(2) >= 0,
      occ: item.occ, rec: item.rec, attr: item.attr, pack: item.pack,
      mat: item.mat, color: item.color, hue: item.hue,
      desc: e.desc || '', image: e.image || null,
      validTill: e.validTill || null,
      extra: e.extra || {}
    };
    p.bands = priceBands(p);
    return p;
  }

  /* Quantity bands off the list price — the thing buyers ask first. */
  function priceBands(p) {
    return [[p.moq, p.price], [p.moq * 4, Math.round(p.price * 0.95)], [p.moq * 10, Math.round(p.price * 0.9)]];
  }
  function unitPrice(p, qty) {
    var b = p.bands, out = b[0][1];
    for (var i = 0; i < b.length; i++) if (qty >= b[i][0]) out = b[i][1];
    return out;
  }

  /* The field registry. own:true = something Royale's own Excel carries today
     (SKU, name, description, vendor, category, price, image); the rest is what
     a B2B buyer asks for, and in the demo is modelled — so it is own:false. */
  var FIELDS = [
    { key: 'name',      label: 'Product name',   group: 'Identity',    type: 'text',     own: true },
    { key: 'category',  label: 'Category',       group: 'Identity',    type: 'derived',  own: true },
    { key: 'desc',      label: 'Description',    group: 'Identity',    type: 'textarea', own: true },
    { key: 'color',     label: 'Colour',         group: 'Identity',    type: 'derived',  own: false },
    { key: 'mat',       label: 'Material',       group: 'Identity',    type: 'derived',  own: false },
    { key: 'price',     label: 'List price (₹)', group: 'Pricing',     type: 'number',   own: true },
    { key: 'cost',      label: 'Vendor cost (₹)',group: 'Pricing',     type: 'number',   own: false, secret: true },
    { key: 'validTill', label: 'Price valid till', group: 'Pricing',   type: 'date',     own: false },
    { key: 'vendorName',label: 'Vendor',         group: 'Supply',      type: 'derived',  own: true },
    { key: 'moq',       label: 'MOQ (pieces)',   group: 'Supply',      type: 'number',   own: false },
    { key: 'lead',      label: 'Lead time (days)', group: 'Supply',    type: 'number',   own: false },
    { key: 'stock',     label: 'Ready stock',    group: 'Supply',      type: 'number',   own: false },
    { key: 'sample',    label: 'Sample in office', group: 'Supply',    type: 'select', options: ['Yes', 'No'], own: false },
    { key: 'branding',  label: 'Branding methods', group: 'Branding',  type: 'derived',  own: false },
    { key: 'print_area',label: 'Print area',     group: 'Branding',    type: 'text',     own: false },
    { key: 'mockup',    label: 'Logo mockup',    group: 'Branding',    type: 'image',    own: false },
    { key: 'occ',       label: 'Occasions',      group: 'Suitability', type: 'derived',  own: false },
    { key: 'rec',       label: 'Recipients',     group: 'Suitability', type: 'derived',  own: false },
    { key: 'ucpmp',     label: 'UCPMP-safe',     group: 'Suitability', type: 'derived',  own: false },
    { key: 'pack',      label: 'Pack types',     group: 'Packaging',   type: 'derived',  own: false },
    { key: 'dims',      label: 'Box dimensions', group: 'Packaging',   type: 'text',     own: false },
    { key: 'weight',    label: 'Weight (g)',     group: 'Packaging',   type: 'number',   own: false },
    { key: 'image',     label: 'Product photo',  group: 'Media',       type: 'image',    own: true },
    { key: 'hsn',       label: 'HSN code',       group: 'Tax',         type: 'text',     own: false },
    { key: 'gst',       label: 'GST rate (%)',   group: 'Tax',         type: 'select', options: ['5', '12', '18', '28'], own: false }
  ];
  function fieldByKey(k) { return FIELDS.filter(function (f) { return f.key === k; })[0] || null; }
  function fieldValue(p, f) {
    if (p.extra && nonEmpty(p.extra[f.key])) return p.extra[f.key];
    var v = p[f.key];
    if (typeof v === 'boolean') return v ? 'Yes' : null;
    return v;
  }
  /* Completeness counts only what a person actually entered or Royale already
     holds. Demo-modelled values do not count until somebody confirms them. */
  function scoreRecord(p, edit) {
    var e = edit || {};
    var missing = [];
    var present = FIELDS.filter(function (f) {
      var real = f.type === 'derived' ? nonEmpty(fieldValue(p, f)) : f.key === 'image' ? nonEmpty(e.image) : f.own ? nonEmpty(fieldValue(p, f)) && !(f.key === 'desc' && !p.desc)
                       : nonEmpty(e[f.key]) || nonEmpty((e.extra || {})[f.key]);
      if (!real) missing.push(f.label);
      return real;
    }).length;
    return { present: present, total: FIELDS.length, missing: missing, pct: Math.round(100 * present / FIELDS.length) };
  }
  /* Validates and returns the patch for the overlay; the app stores it. */
  function setField(p, key, value) {
    var f = fieldByKey(key);
    if (!f) return { error: 'No such field.' };
    if (f.type === 'derived') return { error: f.label + ' is worked out from other data.' };
    var v = value;
    if (f.type === 'number') {
      if (value === '' || value === null) v = null;
      else { v = Number(value); if (isNaN(v) || v < 0) return { error: f.label + ' must be a number.' }; }
    }
    if (f.type === 'select' && key === 'sample') v = value === 'Yes';
    if (f.type === 'select' && key === 'gst') v = Number(value);
    var before = fieldValue(p, f);
    var direct = ['name', 'desc', 'price', 'cost', 'validTill', 'moq', 'lead', 'stock', 'sample', 'hsn', 'gst', 'image'];
    var patch = {};
    if (direct.indexOf(key) >= 0) patch[key] = v;
    else { patch.extra = {}; patch.extra[key] = v; }
    return { field: f, before: before, after: v, patch: patch };
  }


  /* ================= VENDORS ================= */

  var CITIES = ['Mumbai', 'Bhiwandi', 'Delhi NCR', 'Surat', 'Ahmedabad', 'Bengaluru', 'Pune', 'Jaipur', 'Ludhiana', 'Chennai'];
  function vendorMeta(vi, v, edit) {
    var h = hash01('v' + vi), h2 = hash01('w' + vi);
    var e = edit || {};
    return {
      vi: vi, name: v ? v.name : '—', cat: v ? v.cat : 0, brand: !!(v && v.brand),
      rating: e.rating != null ? e.rating : Math.round((3.2 + h * 1.7) * 10) / 10,
      ontime: e.ontime != null ? e.ontime : Math.round(72 + h2 * 26),
      city: e.city || CITIES[Math.floor(h2 * CITIES.length)],
      whatsapp: e.whatsapp || ('98' + String(Math.floor(10000000 + h * 89999999))),
      priceListAge: e.priceListAge != null ? e.priceListAge : Math.floor(h2 * 140),
      contact: e.contact || (v && v.brand ? 'Institutional sales desk' : 'Proprietor'),
      terms: e.terms || (h > 0.5 ? '50% advance, balance on delivery' : '30 days credit')
    };
  }
  /* One number for "how much do we trust them", used to rank RFQ invitees. */
  function vendorScore(m) { return Math.round((m.rating / 5) * 60 + (m.ontime / 100) * 40); }


  /* ================= COMPANIES AND CONTACTS =================
     In B2B gifting the buyer is not the payer and neither is the approver, so
     the company sits above the people and every deal hangs off the company. A
     contact's mobile is still the identity for a person. */

  function normMobile(m) { return String(m || '').replace(/\D/g, '').slice(-10); }
  function validMobile(m) { return /^[6-9]\d{9}$/.test(normMobile(m)); }
  function normName(n) {
    return String(n || '').toLowerCase().replace(/\b(pvt|private|ltd|limited|llp|inc|co|company|the)\b\.?/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function newCompany(o) {
    o = o || {};
    return {
      id: o.id || uid('co'), name: String(o.name || '').trim(),
      industry: o.industry || '', city: o.city || 'Mumbai', gstin: o.gstin || '',
      pharma: !!o.pharma, source: o.source || 'email',
      assigned_to: o.assigned_to || null, branch: o.branch || 'b1',
      consent: o.consent !== false, created: o.created || today(), last_touch: o.last_touch || today(),
      dates: o.dates || [],          // [{label, date}] — Diwali order, foundation day...
      notes: o.notes || [], tierOverride: o.tierOverride || null
    };
  }
  function newContact(o) {
    o = o || {};
    return {
      id: o.id || uid('ct'), company: o.company || null,
      name: String(o.name || '').trim(), mobile: normMobile(o.mobile), email: o.email || '',
      role: o.role || 'Buyer', primary: !!o.primary, created: o.created || today()
    };
  }
  var CONTACT_ROLES = ['Buyer', 'Approver', 'Payer', 'HR / Admin', 'Procurement', 'Founder / CXO'];

  function findCompany(companies, name) {
    var n = normName(name);
    if (!n) return null;
    return companies.filter(function (c) {
      var m = normName(c.name);
      return m === n || (n.length > 4 && (m.indexOf(n) === 0 || n.indexOf(m) === 0));
    })[0] || null;
  }
  function findContact(contacts, mobile, email) {
    var m = normMobile(mobile), e = String(email || '').toLowerCase();
    return contacts.filter(function (c) {
      return (m && c.mobile === m) || (e && c.email && c.email.toLowerCase() === e);
    })[0] || null;
  }
  /* Everything that creates a client funnels through here, so one company is
     never two records and one mobile is never two people. */
  function upsertClient(D, o) {
    if (!o.company || String(o.company).trim().length < 2) return { error: 'Which company is this for?' };
    if (!o.name || String(o.name).trim().length < 2) return { error: 'Please enter the contact\'s name.' };
    if (o.mobile && !validMobile(o.mobile)) return { error: 'Enter a 10-digit Indian mobile number.' };
    if (!o.mobile && !validEmail(o.email)) return { error: 'Give a mobile or an email so we can reach them.' };
    var co = findCompany(D.companies, o.company), made = false;
    if (!co) {
      co = newCompany({ name: o.company, industry: o.industry, city: o.city, pharma: o.pharma,
                        source: o.source, assigned_to: o.assigned_to, branch: o.branch });
      D.companies.push(co); made = true;
    } else co.last_touch = today();
    var ct = findContact(D.contacts, o.mobile, o.email);
    if (!ct) {
      ct = newContact({ company: co.id, name: o.name, mobile: o.mobile, email: o.email, role: o.role,
                        primary: !D.contacts.some(function (x) { return x.company === co.id; }) });
      D.contacts.push(ct);
    } else {
      if (o.name.length > ct.name.length) ct.name = o.name;
      if (!ct.email && o.email) ct.email = o.email;
    }
    return { company: co, contact: ct, created: made };
  }

  /* Derived, never stored: twelve-month spend decides the tier. */
  function companySpend(co, orders, days) {
    var from = addDays(today(), -(days || 365));
    return (orders || []).filter(function (o) { return o.company === co.id && o.created >= from; })
      .reduce(function (a, o) { return a + (o.value || 0); }, 0);
  }
  function companyTier(co, orders, opps) {
    if (co.tierOverride) return co.tierOverride;
    var s = companySpend(co, orders);
    if (s >= T.tiers.strategic) return 'Strategic';
    if (s >= T.tiers.key) return 'Key account';
    if (s > 0 || (orders || []).some(function (o) { return o.company === co.id; })) return 'Active';
    return 'Prospect';
  }
  var TIER_BAND = { 'Strategic': 'em', 'Key account': 'ok', 'Active': 'info', 'Prospect': 'dim' };


  /* ================= THE SALES BOARD =================
     An opportunity is one gifting requirement. A company that did Diwali last
     year and onboarding kits this month has one record and two opportunities.
     The brief is structured, the shortlist is lines, and marks move upwards
     only as the stage moves. */

  var CLOSED = ['Won', 'Lost'];
  function openStages() { return T.stages; }
  function allStages() { return T.stages.concat(CLOSED); }
  function isOpen(o) { return !!o && CLOSED.indexOf(o.stage) < 0; }

  var MARKS = { shortlisted: 'Shortlisted', sample_sent: 'Sample sent', quoted: 'Quoted', approved: 'Approved', rejected: 'Rejected' };
  var MARK_RANK = { shortlisted: 1, sample_sent: 2, quoted: 3, approved: 4 };
  var STAGE_MARK = { 'Sampling': 'sample_sent', 'Quote sent': 'quoted', 'PO received': 'approved' };

  function newBrief(b) {
    b = b || {};
    return {
      text: b.text || '', occasion: b.occasion || '', recipients: b.recipients || '',
      qty: b.qty || null, budgetMin: b.budgetMin || null, budgetMax: b.budgetMax || null,
      deadline: b.deadline || null, cities: b.cities || [], branding: b.branding || '',
      ucpmp: !!b.ucpmp, notes: b.notes || ''
    };
  }
  function newOpp(o) {
    o = o || {};
    return {
      id: o.id || uid('op'), company: o.company || null, contact: o.contact || null,
      title: o.title || 'New requirement', stage: o.stage || T.stages[0],
      brief: newBrief(o.brief), lines: o.lines || [],   // [{pid, qty, mark, branding, note}]
      quotes: o.quotes || [], samples: o.samples || [],
      assigned_to: o.assigned_to || null, branch: o.branch || 'b1', source: o.source || 'email',
      created: o.created || today(), updated: o.updated || today(),
      closed: o.closed || null, outcome: o.outcome || null, lost_reason: o.lost_reason || null,
      order: o.order || null, po_no: o.po_no || null, notes: o.notes || []
    };
  }
  function lineOf(opp, pid) { return (opp.lines || []).filter(function (l) { return l.pid === pid; })[0] || null; }
  function inPlay(opp) { return (opp.lines || []).filter(function (l) { return l.mark !== 'rejected'; }); }
  function addLine(opp, pid, qty) {
    var l = lineOf(opp, pid);
    if (l) { if (l.mark === 'rejected') l.mark = 'shortlisted'; return l; }
    l = { pid: pid, qty: qty || opp.brief.qty || null, mark: 'shortlisted', branding: '', note: '' };
    opp.lines.push(l); opp.updated = today();
    return l;
  }
  function markLine(opp, pid, mark) {
    if (!MARKS[mark]) return { error: 'Unknown mark.' };
    var l = lineOf(opp, pid);
    if (!l) return { error: 'That product is not on this requirement.' };
    l.mark = mark; opp.updated = today();
    return { line: l };
  }
  function pipelineByStage(opps, filterFn) {
    var out = {};
    T.stages.forEach(function (s) { out[s] = []; });
    (opps || []).forEach(function (o) {
      if (!isOpen(o) || (filterFn && !filterFn(o))) return;
      out[out[o.stage] ? o.stage : T.stages[0]].push(o);   // an unknown stage parks at rung 0
    });
    return out;
  }
  function moveOpp(opp, stage) {
    if (allStages().indexOf(stage) < 0) return { error: 'Unknown stage.' };
    if (stage === 'Won') return { error: 'Close it as won with the PO number, so the order opens.' };
    if (T.needsItem.indexOf(stage) >= 0 && !inPlay(opp).length)
      return { error: 'Shortlist at least one product first — "' + stage + '" is about specific products.' };
    opp.stage = stage; opp.updated = today();
    if (stage === 'Lost') { opp.closed = today(); opp.outcome = 'lost'; } else { opp.closed = null; opp.outcome = null; }
    var want = STAGE_MARK[stage], moved = [];
    if (want) inPlay(opp).forEach(function (l) {
      if ((MARK_RANK[l.mark] || 0) < MARK_RANK[want]) { l.mark = want; moved.push(l.pid); }
    });
    return { opp: opp, marks: moved };
  }
  function loseOpp(opp, reason) {
    if (!reason) return { error: 'Pick a reason — it is what the lost report is built from.' };
    opp.stage = 'Lost'; opp.outcome = 'lost'; opp.lost_reason = reason; opp.closed = today(); opp.updated = today();
    return { opp: opp };
  }
  function oppValue(opp, getProduct) {
    var q = lastQuote(opp);
    if (q) return q.total;
    return inPlay(opp).reduce(function (a, l) {
      var p = getProduct(l.pid);
      return a + (p ? unitPrice(p, l.qty || p.moq) * (l.qty || opp.brief.qty || p.moq) : 0);
    }, 0);
  }


  /* ================= QUOTES, GST AND COMPLIANCE ================= */

  /* A quote is a frozen copy of the lines at a price. Each send is a version,
     so "what did we quote them on Tuesday" always has an answer. */
  function buildQuote(opp, getProduct, opts) {
    opts = opts || {};
    var lines = inPlay(opp).map(function (l) {
      var p = getProduct(l.pid);
      if (!p) return null;
      var qty = l.qty || opp.brief.qty || p.moq;
      var unit = l.unit != null ? l.unit : unitPrice(p, qty);
      var brandCost = l.branding ? Math.round(unit * 0.06) : 0;          // branding add-on, illustrative
      var taxable = (unit + brandCost) * qty;
      var gst = Math.round(taxable * p.gst / 100);
      var cost = (p.cost + Math.round(brandCost * 0.6)) * qty;
      return { pid: p.id, name: p.name, vendor: p.vendorName, qty: qty, unit: unit, branding: l.branding || '',
               brandCost: brandCost, gstRate: p.gst, hsn: p.hsn, taxable: taxable, gst: gst,
               total: taxable + gst, cost: cost, margin: taxable - cost, moq: p.moq, lead: p.lead,
               ucpmp: p.ucpmp, cat: p.cat };
    }).filter(Boolean);
    var sum = function (k) { return lines.reduce(function (a, l) { return a + l[k]; }, 0); };
    var taxable = sum('taxable'), cost = sum('cost');
    return {
      v: (opp.quotes || []).length + 1, at: today(), by: opts.by || null, status: 'draft',
      lines: lines, taxable: taxable, gst: sum('gst'), total: taxable + sum('gst'),
      cost: cost, margin: taxable - cost, marginPct: taxable ? Math.round(100 * (taxable - cost) / taxable) : 0,
      validTill: addDays(today(), 15)
    };
  }
  function lastQuote(opp) { var q = opp.quotes || []; return q.length ? q[q.length - 1] : null; }

  /* The check that runs before anything priced goes out. A block stops the
     send; a warning is shown and can be overridden by someone with cost access. */
  function compliance(quote, opp, company, rules) {
    rules = rules || T.rules;
    var blocks = [], warns = [];
    var doctors = (company && company.pharma) || opp.brief.ucpmp || /doctor|hcp|physician/i.test(opp.brief.recipients || '');
    (quote.lines || []).forEach(function (l) {
      var perHead = l.unit + l.brandCost;
      if (doctors && perHead > rules.ucpmpCap)
        blocks.push(l.name + ' is ₹' + fmt(perHead) + ' per doctor — UCPMP caps a gift to a healthcare professional at ₹' + fmt(rules.ucpmpCap) + '.');
      else if (doctors && !l.ucpmp)
        blocks.push(l.name + ' is not a professional-use item, which UCPMP requires for gifts to doctors.');
      if (l.qty < l.moq) warns.push(l.name + ': ' + l.qty + ' pieces is under the vendor MOQ of ' + l.moq + '.');
      var meta = catMeta(l.cat);
      if (l.gstRate !== meta.gst) warns.push(l.name + ': GST ' + l.gstRate + '% does not match the usual ' + meta.gst + '% for HSN ' + l.hsn + '.');
      if (opp.brief.deadline && daysBetween(today(), opp.brief.deadline) < l.lead + (rules.bufferDays || 0))
        warns.push(l.name + ': lead time ' + l.lead + ' days does not fit the ' + opp.brief.deadline + ' deadline with buffer.');
    });
    if (quote.lines && quote.lines.length && quote.marginPct < rules.marginFloor)
      blocks.push('Margin is ' + quote.marginPct + '%, under the ' + rules.marginFloor + '% floor — the owner has to approve this price.');
    if (!(quote.lines || []).length) blocks.push('The quote has no lines.');
    return { ok: !blocks.length, blocks: blocks, warns: warns, doctors: !!doctors };
  }


  /* ================= ORDERS — the second board =================
     After the PO, different people do different work on a clock. It is its own
     record so ops can own it, but it points back at the opportunity. */

  function newOrder(o) {
    o = o || {};
    return {
      id: o.id || uid('or'), no: o.no || null, opp: o.opp || null, company: o.company || null,
      contact: o.contact || null, title: o.title || '', po_no: o.po_no || '',
      stage: o.stage || T.orderStages[0], lines: o.lines || [], value: o.value || 0, cost: o.cost || 0,
      deadline: o.deadline || null, created: o.created || today(), updated: o.updated || today(),
      assigned_to: o.assigned_to || null, branch: o.branch || 'b1',
      vendorPOs: o.vendorPOs || [],       // [{id, vendor, vendorName, pids, eta, status: placed|received|late}]
      artwork: o.artwork || { status: 'pending', sent: null, approved: null, file: '' },
      qc: o.qc || { status: 'pending', note: '' },
      dispatches: o.dispatches || [],     // [{city, qty, status, awb, at}]
      invoice: o.invoice || null, paid: o.paid || null,
      token: o.token || uid('t').slice(-8),
      history: o.history || [], picks: o.picks || null
    };
  }
  var ORDER_NEEDS = {
    'Vendor POs placed': function (o) { return o.vendorPOs.length ? null : 'Place at least one vendor PO first.'; },
    'Branding': function (o) { return o.artwork.status === 'approved' ? null : 'The client has not approved the artwork yet.'; },
    'Dispatched': function (o) { return o.qc.status === 'passed' ? null : 'QC has not passed.'; },
    'Invoiced': function (o) { return o.dispatches.length && o.dispatches.every(function (d) { return d.status === 'delivered'; }) ? null : 'Not every location has taken delivery.'; },
    'Paid': function (o) { return o.invoice ? null : 'Raise the invoice first.'; }
  };
  function moveOrder(order, stage, by) {
    var i = T.orderStages.indexOf(stage);
    if (i < 0) return { error: 'Unknown stage.' };
    var cur = T.orderStages.indexOf(order.stage);
    if (i > cur) {
      for (var k = cur + 1; k <= i; k++) {
        var need = ORDER_NEEDS[T.orderStages[k]];
        var why = need && need(order);
        if (why) return { error: T.orderStages[k] + ': ' + why };
      }
    }
    order.stage = stage; order.updated = today();
    order.history.push({ stage: stage, at: today(), by: by || null });
    return { order: order };
  }
  function orderOpen(o) { return o.stage !== 'Paid'; }
  function winOpp(opp, poNo, getProduct, by) {
    if (!String(poNo || '').trim()) return { error: 'Enter the client\'s PO number.' };
    if (!inPlay(opp).length) return { error: 'Nothing is in play on this requirement.' };
    var q = lastQuote(opp) || buildQuote(opp, getProduct);
    opp.stage = 'Won'; opp.outcome = 'won'; opp.closed = today(); opp.updated = today(); opp.po_no = poNo;
    var order = newOrder({ opp: opp.id, company: opp.company, contact: opp.contact, title: opp.title,
      po_no: poNo, lines: q.lines, value: q.total, cost: q.cost, deadline: opp.brief.deadline,
      assigned_to: opp.assigned_to, branch: opp.branch });
    order.history.push({ stage: order.stage, at: today(), by: by || null });
    opp.order = order.id;
    return { opp: opp, order: order };
  }
  /* What is going wrong on an order, most urgent first. The Order-watch agent
     reads this; so does the board. */
  function orderRisks(o, rules) {
    rules = rules || T.rules;
    var out = [], t = today();
    if (!orderOpen(o)) return out;
    if (o.deadline && t > o.deadline && T.orderStages.indexOf(o.stage) < T.orderStages.indexOf('Delivered'))
      out.push({ sev: 'bad', text: 'Past the client deadline (' + o.deadline + ') and not delivered.' });
    o.vendorPOs.forEach(function (v) {
      if (v.status === 'received') return;
      if (o.deadline && v.eta && daysBetween(v.eta, o.deadline) < rules.bufferDays)
        out.push({ sev: v.eta > o.deadline ? 'bad' : 'warn', vendor: v.vendor,
          text: v.vendorName + ' promises ' + v.eta + ' — ' + (v.eta > o.deadline ? 'after' : 'within ' + rules.bufferDays + ' days of') + ' the ' + o.deadline + ' deadline.' });
      else if (v.eta && t > v.eta) out.push({ sev: 'warn', vendor: v.vendor, text: v.vendorName + ' is late — goods were due ' + v.eta + '.' });
    });
    if (o.artwork.status === 'sent' && o.artwork.sent && daysBetween(o.artwork.sent, t) >= 2)
      out.push({ sev: 'warn', text: 'Artwork with the client for ' + daysBetween(o.artwork.sent, t) + ' days, not approved.' });
    if (o.artwork.status === 'pending' && T.orderStages.indexOf(o.stage) >= 2)
      out.push({ sev: 'warn', text: 'Artwork not even sent, and goods are already in.' });
    if (o.qc.status === 'failed') out.push({ sev: 'bad', text: 'QC failed: ' + (o.qc.note || 'no note') + '.' });
    if (o.invoice && !o.paid && daysBetween(o.invoice.at, t) > 30)
      out.push({ sev: 'warn', text: 'Invoice ' + o.invoice.no + ' unpaid for ' + daysBetween(o.invoice.at, t) + ' days.' });
    return out;
  }


  /* ================= FOLLOW-UPS AND NOTE SCORING =================
     Logging a conversation writes two things: what was said, and the next one
     booked. A deal with nothing booked is how deals die quietly. */

  var FOLLOW_METHODS = ['Call', 'WhatsApp', 'Email', 'Meeting', 'Sample drop'];
  var FOLLOW_OUTCOMES = ['Going well — still keen', 'Waiting on internal approval', 'Asked for a better price',
    'Wants more options', 'Comparing with another vendor', 'Could not reach them', 'Cooling off — at risk', 'Ready to send PO'];
  var AT_RISK = ['Cooling off — at risk', 'Comparing with another vendor', 'Could not reach them'];

  function newFollow(o) {
    o = o || {};
    return { id: o.id || uid('f'), opp: o.opp || null, company: o.company || null, owner: o.owner || null,
             due: o.due || today(), method: o.method || 'Call', note: o.note || '', outcome: o.outcome || null,
             done: !!o.done, done_at: o.done_at || null, created: o.created || today(), by: o.by || null,
             auto: !!o.auto };
  }
  function openFollows(list) { return (list || []).filter(function (f) { return !f.done; }); }
  function isOverdue(f) { return !f.done && String(f.due) < today(); }
  function isDueToday(f) { return !f.done && String(f.due) === today(); }
  function nextFollow(list, oppId) {
    return (list || []).filter(function (f) { return f.opp === oppId && !f.done; })
      .sort(function (a, b) { return String(a.due).localeCompare(String(b.due)); })[0] || null;
  }
  function atRisk(list, oppId) {
    var d = (list || []).filter(function (f) { return f.opp === oppId && f.done && f.outcome; })
      .sort(function (a, b) { return String(b.done_at).localeCompare(String(a.done_at)); })[0];
    return !!(d && AT_RISK.indexOf(d.outcome) >= 0);
  }
  function needsAttention(opps, follows) {
    return (opps || []).filter(isOpen).filter(function (o) {
      var n = nextFollow(follows, o.id);
      return !n || isOverdue(n);
    });
  }

  /* Transparent on purpose: the UI shows which marks were earned. */
  var NOTE_RULES = [
    ['Enough detail to be useful', 2, function (t) {
      var w = t.trim().split(/\s+/).filter(Boolean).length; return w >= 25 ? 2 : w >= 12 ? 1 : 0; }],
    ['Names the product discussed', 2, function (t, ctx) {
      if ((ctx.names || []).some(function (n) { return n && t.toLowerCase().indexOf(String(n).toLowerCase().split(',')[0]) >= 0; })) return 2;
      return /\b(hamper|kit|bottle|pen|diary|bag|speaker|watch|box|sample|product)\b/i.test(t) ? 1 : 0; }],
    ['Records a number — price, quantity, date', 1, function (t) {
      return /\d[\d,.]*\s*(pcs|pieces|units|k\b|l\b|lakh|%|₹)|₹\s*\d|\b\d{2,}\b/i.test(t) ? 1 : 0; }],
    ['Captures what the client said or wants', 2, function (t) {
      return /\b(said|wants|asked|prefers|worried|liked|needs|budget|approval|approved|compare|objection|feedback|concern)\b/i.test(t) ? 2 : 0; }],
    ['Sets up a clear next step', 2, function (t) {
      return /\b(will|next|follow up|send|share|call back|revert|confirm|tomorrow|monday|tuesday|wednesday|thursday|friday|week|by)\b/i.test(t) ? 2 : 0; }],
    ['An outcome was chosen', 1, function (t, ctx) { return ctx.outcome ? 1 : 0; }]
  ];
  function scoreNote(text, ctx) {
    ctx = ctx || {};
    var t = String(text || '');
    var marks = NOTE_RULES.map(function (r) {
      var got = 0;
      if (t.trim()) { try { got = Math.min(r[1], r[2](t, ctx) || 0); } catch (e) { got = 0; } }
      return { label: r[0], got: got, max: r[1] };
    });
    var score = marks.reduce(function (a, m) { return a + m.got; }, 0);
    return { score: score, max: 10, marks: marks, band: score >= 8 ? 'ok' : score >= 5 ? 'warn' : 'bad',
      verdict: !t.trim() ? 'Nothing was written down.' : score >= 8 ? 'A proper record of the conversation.'
             : score >= 5 ? 'Usable, but thin in places.' : 'Too vague for anyone else to act on.' };
  }
  function noteAverage(follows, userId) {
    var done = (follows || []).filter(function (f) { return f.done && f.note && !f.auto && (!userId || (f.by || f.owner) === userId); });
    if (!done.length) return null;
    return Math.round(10 * done.reduce(function (a, f) { return a + scoreNote(f.note, { outcome: f.outcome }).score; }, 0) / done.length) / 10;
  }


  /* ================= DATE RANGES AND TARGETS ================= */

  var RANGES = [['today', 'Today'], ['week', 'This week'], ['month', 'This month'], ['last', 'Last month'],
                ['quarter', 'This quarter'], ['year', 'This year'], ['all', 'All time'], ['custom', 'Custom…']];
  function rangeDates(key, from, to) {
    var d = parseISO(today()), y = d.getFullYear(), m = d.getMonth();
    switch (key) {
      case 'today': return [iso(d), iso(d)];
      case 'week': return [iso(new Date(y, m, d.getDate() - (d.getDay() + 6) % 7)), iso(d)];
      case 'month': return [iso(new Date(y, m, 1)), iso(d)];
      case 'last': return [iso(new Date(y, m - 1, 1)), iso(new Date(y, m, 0))];
      case 'quarter': return [iso(new Date(y, Math.floor(m / 3) * 3, 1)), iso(d)];
      case 'year': return [iso(new Date(y, 0, 1)), iso(d)];
      case 'custom': return [from || '1970-01-01', to || iso(d)];
      default: return ['1970-01-01', '2999-12-31'];
    }
  }
  function rangeLabel(r) {
    if (r.key === 'custom') return r.from + ' to ' + r.to;
    if (r.key === 'all') return 'All time';
    var n = RANGES.filter(function (x) { return x[0] === r.key; })[0];
    return (n ? n[1] : r.key) + ' (' + r.from + ' to ' + r.to + ')';
  }
  function inRange(s, r) {
    if (!s) return false;
    if (!r || r.key === 'all') return true;
    s = String(s).slice(0, 10);
    return s >= r.from && s <= r.to;
  }
  /* Months in a window, by the real length of the closing month. */
  function monthsIn(r) {
    if (!r || r.key === 'all') return 12;
    var a = parseISO(r.from), b = parseISO(r.to);
    var months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    var dim = new Date(b.getFullYear(), b.getMonth() + 1, 0).getDate();
    return Math.max(0.03, months + (b.getDate() - a.getDate() + 1) / dim);
  }
  function targetProgress(orders, userId, target, r) {
    var rows = (orders || []).filter(function (o) { return (!userId || o.assigned_to === userId) && inRange(o.created, r); });
    var value = rows.reduce(function (a, o) { return a + (o.value || 0); }, 0);
    var mul = monthsIn(r);
    var tO = (target && target.orders || 0) * mul, tV = (target && target.value || 0) * mul;
    var judgeable = tO >= 1;           // a window too short to owe a whole order says nothing
    return { orders: rows.length, value: value, targetOrders: Math.round(tO), targetValue: Math.round(tV),
             ordersPct: judgeable ? Math.round(100 * rows.length / tO) : null,
             valuePct: judgeable && tV ? Math.round(100 * value / tV) : null,
             tooShort: !judgeable && !!(target && target.orders), rows: rows };
  }
  function band(pct) { return pct == null ? 'dim' : pct >= 100 ? 'ok' : pct >= 70 ? 'warn' : 'bad'; }


  /* ================= AUTOMATIONS =================
     Audience -> When -> Only if -> Then, the GHL shape the team knows. One
     client-facing step makes the whole rule client-facing. Test is a dry run. */

  var TRIGGERS = {
    new_enquiry:   { label: 'A new enquiry arrives',               group: 'Enquiry', cfg: { channel: ['any', 'Email', 'WhatsApp', 'Website form', 'IndiaMART'] } },
    form_submit:   { label: 'The website form is submitted',       group: 'Enquiry', cfg: {} },
    wa_reply:      { label: 'A client replies on WhatsApp',        group: 'Enquiry', cfg: {} },
    brief_captured:{ label: 'A brief is captured',                 group: 'Sales',   cfg: {} },
    quote_sent:    { label: 'A quote is sent',                     group: 'Sales',   cfg: {} },
    quote_stale:   { label: 'A quote is unanswered for',           group: 'Sales',   cfg: { days: 'number' } },
    sample_delivered: { label: 'A sample is delivered',            group: 'Sales',   cfg: {} },
    deal_lost:     { label: 'A requirement is marked lost',        group: 'Sales',   cfg: {} },
    po_received:   { label: 'A PO is received',                    group: 'Orders',  cfg: {} },
    vendor_delay:  { label: 'A vendor date slips past the deadline buffer', group: 'Orders', cfg: {} },
    artwork_pending: { label: 'Artwork is unapproved for',         group: 'Orders',  cfg: { days: 'number' } },
    qc_failed:     { label: 'QC fails',                            group: 'Orders',  cfg: {} },
    dispatched:    { label: 'An order is dispatched',              group: 'Orders',  cfg: {} },
    delivered:     { label: 'An order is delivered',               group: 'Orders',  cfg: {} },
    invoice_overdue: { label: 'An invoice is unpaid for',          group: 'Money',   cfg: { days: 'number' } },
    payment_received: { label: 'A payment is received',           group: 'Money',   cfg: {} },
    reorder_due:   { label: 'Last year\'s order date is coming up in', group: 'Clients', cfg: { days: 'number' } },
    company_date:  { label: 'A company date is coming up (foundation day, event)', group: 'Clients', cfg: { days: 'number' } },
    tier_change:   { label: 'A company changes tier',              group: 'Clients', cfg: {} },
    issue_opened:  { label: 'A client issue is opened',            group: 'Clients', cfg: {} },
    vendor_pricelist: { label: 'A vendor price list is older than', group: 'Catalogue', cfg: { days: 'number' } },
    no_contact:    { label: 'An open requirement goes untouched for', group: 'Team', cfg: { days: 'number' } },
    behind_target: { label: 'The team is behind target by',        group: 'Team',    cfg: { pct: 'number' } },
    schedule:      { label: 'Every day at',                        group: 'Team',    cfg: { at: 'time' } }
  };
  var ACTS = {
    run_agent:     { label: 'Run an agent',                        kind: 'internal', cfg: { agent: 'agent' } },
    notify_person: { label: 'Notify one person',                   kind: 'internal', cfg: { who: 'staff', text: 'text' } },
    notify_role:   { label: 'Notify everyone in a role',           kind: 'internal', cfg: { role: 'role', text: 'text' } },
    followup:      { label: 'Put a follow-up on the account manager', kind: 'internal', cfg: { due_in_days: 'number', text: 'text' } },
    assign:        { label: 'Assign the company',                  kind: 'internal', cfg: { who: 'staff' } },
    open_issue:    { label: 'Open a client issue',                 kind: 'internal', cfg: { text: 'text' } },
    wait:          { label: 'Wait',                                kind: 'internal', cfg: { hours: 'number' } },
    wa_template:   { label: 'Send an approved WhatsApp template',  kind: 'client',   cfg: { template: 'template' } },
    email:         { label: 'Send an email',                       kind: 'client',   cfg: { text: 'text' } },
    portal_update: { label: 'Post an update to the client portal', kind: 'client',   cfg: { text: 'text' } },
    audience:      { label: 'Add to a campaign audience',          kind: 'client',   cfg: { name: 'text' } }
  };
  function autoKind(a) {
    return (a.actions || []).some(function (x) { return ACTS[x.type] && ACTS[x.type].kind === 'client'; }) ? 'client' : 'internal';
  }
  /* Who a client-facing rule would reach today. Counting only. Consent is
     required, and an open issue pauses marketing for that company. */
  function audienceOf(a, D) {
    if (autoKind(a) === 'internal') return [];
    return (D.companies || []).filter(function (c) {
      if (!c.consent) return false;
      if ((D.issues || []).some(function (i) { return i.company === c.id && i.status !== 'resolved'; })) return false;
      var tier = companyTier(c, D.orders, D.opps);
      if ((a.tiers || []).length && a.tiers.indexOf(tier) < 0) return false;
      if ((a.sources || []).length && a.sources.indexOf(c.source) < 0) return false;
      if (a.pharmaOnly && !c.pharma) return false;
      return true;
    });
  }
  function validateAuto(a) {
    if (!a.name || !String(a.name).trim()) return 'Give the rule a name.';
    if (!a.trigger || !TRIGGERS[a.trigger.type]) return 'Pick what starts this rule.';
    if (!(a.actions || []).length) return 'Add at least one step.';
    if ((a.actions || []).some(function (x) { return !ACTS[x.type]; })) return 'One of the steps is not a real action.';
    if (autoKind(a) === 'client' && !(a.tiers || []).length && !(a.sources || []).length && !a.pharmaOnly)
      return 'This rule reaches clients, so choose who it goes to — or make every step internal.';
    return null;
  }
  function testAuto(a, D) {
    var err = validateAuto(a);
    if (err) return { error: err };
    return { kind: autoKind(a), audience: audienceOf(a, D).length,
             steps: a.actions.map(function (x) { return (ACTS[x.type] || {}).label || x.type; }), sent: 0 };
  }


  /* ================= CLIENT ISSUES =================
     Damaged, short or wrongly branded deliveries. Deadlines by severity, a
     three-level ladder, and an open issue pauses marketing to that company. */

  var ISSUE_KINDS = ['Damaged in transit', 'Short delivery', 'Wrong branding / logo', 'Late delivery',
                     'Wrong product', 'Invoice / GST query', 'Other'];
  var SEVERITY = { critical: 4, high: 24, medium: 48, low: 96 };      // hours to resolve
  var LADDER = ['Account manager', 'Sales Head', 'Owner'];
  function newIssue(o) {
    o = o || {};
    return { id: o.id || uid('is'), company: o.company || null, order: o.order || null, kind: o.kind || ISSUE_KINDS[0],
             severity: o.severity || 'high', status: o.status || 'open', level: o.level || 0,
             opened: o.opened || today(), resolved: o.resolved || null, text: o.text || '', log: o.log || [],
             assigned_to: o.assigned_to || null };
  }
  function issueDue(i) { return addDays(i.opened, Math.ceil((SEVERITY[i.severity] || 48) / 24)); }
  function issueOverdue(i) { return i.status !== 'resolved' && today() > issueDue(i); }


  /* ================= STORAGE ================= */

  function appKey() { return 'gc_' + T.slug + '_v1'; }
  var STORE_V = 1;

  var api = {
    T: T, configure: configure, clone: clone,
    fmt: fmt, money: money, rupees: rupees, esc: esc, iso: iso, parseISO: parseISO, today: today, setNow: setNow,
    addDays: addDays, daysBetween: daysBetween, nonEmpty: nonEmpty, uid: uid, hash01: hash01,

    CAPS: CAPS, CAP_KEYS: CAP_KEYS, SCOPES: SCOPES, ACCESS_DEFAULT: ACCESS_DEFAULT, NO_ACCESS: NO_ACCESS,
    defaultAccess: defaultAccess, acc: acc, inScope: inScope, canOpen: canOpen,
    maskMobile: maskMobile, maskCost: maskCost, canSetPass: canSetPass, canSetRole: canSetRole,
    validEmail: validEmail, validPass: validPass, SENIOR_ROLES: SENIOR_ROLES,
    setStaff: setStaff, staffList: staffList, staffById: staffById, staffByRole: staffByRole,
    staffName: staffName, authenticate: authenticate, branchName: branchName,

    CAT_META: CAT_META, catMeta: catMeta, product: product, priceBands: priceBands, unitPrice: unitPrice,
    FIELDS: FIELDS, fieldByKey: fieldByKey, fieldValue: fieldValue, scoreRecord: scoreRecord, setField: setField,
    vendorMeta: vendorMeta, vendorScore: vendorScore,

    normMobile: normMobile, validMobile: validMobile, normName: normName,
    newCompany: newCompany, newContact: newContact, CONTACT_ROLES: CONTACT_ROLES,
    findCompany: findCompany, findContact: findContact, upsertClient: upsertClient,
    companySpend: companySpend, companyTier: companyTier, TIER_BAND: TIER_BAND,

    CLOSED: CLOSED, openStages: openStages, allStages: allStages, isOpen: isOpen,
    MARKS: MARKS, MARK_RANK: MARK_RANK, STAGE_MARK: STAGE_MARK,
    newBrief: newBrief, newOpp: newOpp, lineOf: lineOf, inPlay: inPlay, addLine: addLine, markLine: markLine,
    pipelineByStage: pipelineByStage, moveOpp: moveOpp, loseOpp: loseOpp, oppValue: oppValue,
    buildQuote: buildQuote, lastQuote: lastQuote, compliance: compliance,

    newOrder: newOrder, moveOrder: moveOrder, orderOpen: orderOpen, winOpp: winOpp, orderRisks: orderRisks,
    ORDER_NEEDS: ORDER_NEEDS,

    FOLLOW_METHODS: FOLLOW_METHODS, FOLLOW_OUTCOMES: FOLLOW_OUTCOMES, AT_RISK: AT_RISK,
    newFollow: newFollow, openFollows: openFollows, isOverdue: isOverdue, isDueToday: isDueToday,
    nextFollow: nextFollow, atRisk: atRisk, needsAttention: needsAttention,
    NOTE_RULES: NOTE_RULES, scoreNote: scoreNote, noteAverage: noteAverage,

    RANGES: RANGES, rangeDates: rangeDates, rangeLabel: rangeLabel, inRange: inRange, monthsIn: monthsIn,
    targetProgress: targetProgress, band: band,

    TRIGGERS: TRIGGERS, ACTS: ACTS, autoKind: autoKind, audienceOf: audienceOf, validateAuto: validateAuto, testAuto: testAuto,

    ISSUE_KINDS: ISSUE_KINDS, SEVERITY: SEVERITY, LADDER: LADDER, newIssue: newIssue, issueDue: issueDue, issueOverdue: issueOverdue,

    appKey: appKey, STORE_V: STORE_V
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GC = api;
})(typeof self !== 'undefined' ? self : this);
