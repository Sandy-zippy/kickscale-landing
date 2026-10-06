/* Discover (the original product-discovery portal, now a module) and the
   product record. A brief typed in plain English becomes the same facet
   filters a person would click; facet counts come from one pass over the
   whole catalogue. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS, esc = G.esc, E = G.E;
  var D = function () { return G.D(); };

  var S = { text: '', f: null, show: 60, sel: [], sort: 'fit', ucpmp: false };
  function blankF() { return { cat: new Set(), vendor: new Set(), occ: new Set(), rec: new Set(), pack: new Set(), attr: new Set(), min: null, max: null, qty: null, lead: null, text: [] }; }
  function F() { return S.f || (S.f = blankF()); }

  var SORTS = {
    fit: null,
    low: function (a, b) { return a.price - b.price; },
    high: function (a, b) { return b.price - a.price; },
    lead: function (a, b) { return a.lead - b.lead; }
  };

  V.discover = function () {
    var db = G.db(), f = F();
    var res = E.search(db, f);
    var rows = res.results;
    if (SORTS[S.sort]) rows = rows.slice().sort(SORTS[S.sort]);
    var h = '<div class="ph"><div><h1>Discover</h1><p>' + GC.fmt(db.items.length) + ' products from ' + GC.fmt(db.vendors.length) + ' vendors. Type the client\'s brief the way they said it.</p></div>' +
      '<div class="acts">' + (G.can('catalogue') ? '<a class="btn ghost" href="#/intake">⇪ Import a vendor price list</a>' : '') + '</div></div>';
    h += '<form class="briefbar" data-submit="brief"><input name="text" value="' + esc(S.text) + '" placeholder="e.g. Diwali gifts for 200 doctors under ₹900, logo branded, deliver in 15 days"><button class="btn">Search</button>' +
      (S.text || activeCount(f) ? '<button type="button" class="btn ghost" data-act="clearDiscover">Clear</button>' : '') + '</form>';
    if (S.text) h += '<div class="notice agent">✦ Understood: ' + understood(f) + '</div>';
    if (f.rec.has(2) && !f.attr.has(6)) h += '<div class="notice warn">⚖ Gifts to doctors fall under UCPMP 2024: professional-use items only, at most ₹' + GC.fmt(GC.T.rules.ucpmpCap) + ' each. <button class="btn sm" data-act="ucpmpOnly">Show UCPMP-safe options only</button></div>';
    h += '<div class="disc"><aside class="facets">' + facets(res.counts, f) + '</aside><div>';
    h += '<div class="between" style="margin-bottom:10px"><span class="muted"><b style="color:var(--ink)">' + GC.fmt(res.results.length) + '</b> match · ' + Math.max(1, Math.round(res.ms)) + ' ms</span>' +
      '<select data-chg="discSort" style="width:auto">' + [['fit', 'Catalogue order'], ['low', 'Price: low to high'], ['high', 'Price: high to low'], ['lead', 'Fastest lead time']].map(function (o) { return '<option value="' + o[0] + '"' + (S.sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>';
    if (S.sel.length) h += tray();
    h += rows.length ? '<div class="pgrid">' + rows.slice(0, S.show).map(function (it) { return card(G.P(it.id)); }).join('') + '</div>' +
      (rows.length > S.show ? '<p style="text-align:center;margin-top:16px"><button class="btn ghost" data-act="discMore">Show more (' + GC.fmt(rows.length - S.show) + ' left)</button></p>' : '')
      : '<div class="card">' + G.empty('Nothing matches every filter. Loosen one on the left, or ask the Curator — it relaxes the least important filters first and tells you which.') + '</div>';
    return h + '</div></div>';
  };

  function activeCount(f) { return ['cat', 'vendor', 'occ', 'rec', 'pack', 'attr'].reduce(function (a, k) { return a + f[k].size; }, 0) + (f.min != null) + (f.max != null) + (f.qty != null) + (f.lead != null); }
  function understood(f) {
    var db = G.db(), bits = [];
    if (f.cat.size) bits.push(Array.from(f.cat).map(function (i) { return db.cats[i].name; }).join(' / '));
    if (f.occ.size) bits.push(Array.from(f.occ).map(function (i) { return E.OCCASIONS[i]; }).join(', '));
    if (f.rec.size) bits.push('for ' + Array.from(f.rec).map(function (i) { return E.RECIPIENTS[i]; }).join(', '));
    if (f.min != null || f.max != null) bits.push((f.min != null ? '₹' + GC.fmt(f.min) : '') + (f.min != null && f.max != null ? '–' : f.max != null ? 'up to ' : '+') + (f.max != null ? '₹' + GC.fmt(f.max) : ''));
    if (f.qty) bits.push(GC.fmt(f.qty) + ' pcs (MOQ fits)');
    if (f.lead) bits.push('lead ≤ ' + f.lead + ' days');
    if (f.attr.size) bits.push(Array.from(f.attr).map(function (i) { return E.ATTRS[i]; }).join(' + '));
    if (f.vendor.size) bits.push(Array.from(f.vendor).map(function (i) { return db.vendors[i].name; }).join(', '));
    return esc(bits.join(' · ') || 'nothing specific — showing everything');
  }
  function facets(counts, f) {
    var db = G.db();
    var group = function (title, key, labels, top) {
      var ids = Object.keys(counts[key]).map(Number).sort(function (a, b) { return counts[key][b] - counts[key][a]; });
      if (top) ids = ids.slice(0, top);
      f[key].forEach(function (i) { if (ids.indexOf(i) < 0) ids.unshift(i); });
      return '<h5>' + title + '</h5>' + ids.map(function (i) {
        return '<label class="chk"><input type="checkbox" data-chg="facet" data-id="' + key + '|' + i + '"' + (f[key].has(i) ? ' checked' : '') + '><span>' + esc(labels(i)) + '</span><em>' + GC.fmt(counts[key][i] || 0) + '</em></label>';
      }).join('');
    };
    return '<h5>Budget per piece (₹)</h5><div class="row" style="flex-wrap:nowrap"><input type="number" placeholder="Min" data-chg="facetNum" data-id="min" value="' + (f.min != null ? f.min : '') + '"><input type="number" placeholder="Max" data-chg="facetNum" data-id="max" value="' + (f.max != null ? f.max : '') + '"></div>' +
      '<h5>Quantity & time</h5><div class="row" style="flex-wrap:nowrap"><input type="number" placeholder="Pieces" data-chg="facetNum" data-id="qty" value="' + (f.qty || '') + '"><input type="number" placeholder="Days" data-chg="facetNum" data-id="lead" value="' + (f.lead || '') + '"></div>' +
      group('Category', 'cat', function (i) { return db.cats[i].name; }) +
      group('Occasion', 'occ', function (i) { return E.OCCASIONS[i]; }) +
      group('For', 'rec', function (i) { return E.RECIPIENTS[i]; }) +
      group('Qualities', 'attr', function (i) { return E.ATTRS[i]; }) +
      group('Packing', 'pack', function (i) { return E.PACKS[i]; }) +
      group('Vendor (top 12)', 'vendor', function (i) { return db.vendors[i].name; }, 12);
  }
  function card(p) {
    var on = S.sel.indexOf(p.id) >= 0;
    var tags = (p.sample ? '<span class="pill lime">Sample in office</span>' : '') + (p.ucpmp ? '<span class="pill ok">UCPMP-safe</span>' : '') + (p.premium ? '<span class="pill em">Premium</span>' : '');
    return '<div class="pcard' + (on ? ' on' : '') + '" data-act="go" data-id="#/product/' + esc(p.id) + '"><div class="img" style="background:linear-gradient(135deg,hsl(' + p.hue + ',38%,36%),hsl(' + ((p.hue + 40) % 360) + ',50%,36%))">' + esc(p.category.charAt(0)) + '<div class="tags">' + tags + '</div></div>' +
      '<div class="body"><span class="v">' + esc(p.vendorName) + ' · ' + esc(p.category) + '</span><b>' + esc(p.name) + '</b><span class="small muted">MOQ ' + p.moq + ' · ' + p.lead + ' days' + (p.brandable ? ' · brandable' : '') + '</span>' +
      '<div class="foot"><span class="price">₹' + GC.fmt(p.price) + '</span><button class="minibtn" data-act="discPick" data-id="' + esc(p.id) + '">' + (on ? '✓ Picked' : '+ Pick') + '</button></div></div></div>';
  }
  function tray() {
    var opps = D().opps.filter(function (o) { return GC.isOpen(o) && G.inScope(o); });
    return '<div class="notice info" style="justify-content:space-between"><span><b>' + S.sel.length + ' picked.</b> Put them on a requirement:</span><span class="row">' +
      (G.can('clients') ? '<select id="trayOpp" style="width:auto;max-width:280px">' + opps.map(function (o) { var co = G.companyById(o.company); return '<option value="' + o.id + '">' + esc((co ? co.name + ' — ' : '') + o.title) + '</option>'; }).join('') + '</select>' +
      '<button class="btn sm" data-act="trayAdd">Add to requirement</button>' : '<span class="muted small">Only client-facing roles can add to a requirement.</span>') +
      '<button class="btn ghost sm" data-act="trayClear">Clear</button></span></div>';
  }

  /* ================= the product record =================
     Opened from an order or a requirement, it leads with THAT: how many are
     needed, at what price, branded how, and where the goods physically are.
     Every stock figure says where it comes from. The editable record sits
     behind "Edit details" so the page reads, rather than being a form. */

  var EDITING = {};
  function ctxOf(arg) {
    var p = String(arg || '').split('/');
    var c = { pid: p[0] };
    if (p[1] === 'order') c.order = G.orderById(p[2]);
    if (p[1] === 'opp') c.opp = G.oppById(p[2]);
    return c;
  }
  function photo(p, big) {
    if (p.image) return '<img src="' + p.image + '" alt="" style="width:' + (big ? '100%' : '44px') + ';height:' + (big ? '220px' : '44px') + ';object-fit:cover;border-radius:12px;display:block">';
    return G.thumb(p, big);
  }
  G.photo = photo;

  /* where the goods are, each figure with its source */
  function stockRows(p) {
    var d = D(), vm = GC.vendorMeta(p.vendor, G.db().vendors[p.vendor], d.vendorEdits[p.vendor]);
    var rows = [['At the vendor · ' + p.vendorName, GC.fmt(p.stock) + ' pcs', 'From their price list (' + vm.priceListAge + ' days old). Not counted by us.']];
    d.warehouses.forEach(function (w) {
      if (w.kind === 'samples') { rows.push([w.name, p.sample ? '1 sample' : 'No sample', p.sample ? 'On the shelf for client visits.' : 'Order one from the vendor if a client wants to see it.']); return; }
      var qty = (d.warehouse[p.id] || {})[w.id] || 0;
      var last = d.stockMoves.filter(function (m) { return m.pid === p.id && m.wh === w.id; }).sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); })[0];
      rows.push([w.name + ' (ours)', GC.fmt(qty) + ' pcs', last ? 'Counted at ' + (last.kind === 'GRN' ? 'goods-in' : last.kind.toLowerCase()) + ' on ' + last.at + ' · ' + last.ref : 'Nothing received here yet.']);
    });
    var res = d.orders.filter(GC.orderOpen).reduce(function (a, o) { return a + o.lines.filter(function (l) { return l.pid === p.id; }).reduce(function (x, l) { return x + l.qty; }, 0); }, 0);
    if (res) rows.push(['Promised to open orders', GC.fmt(res) + ' pcs', 'Already committed to clients.']);
    return rows;
  }
  function stockCard(p) {
    return '<div class="card"><h3>Where the stock is</h3>' + stockRows(p).map(function (r) {
      return '<div class="between" style="padding:8px 0;border-bottom:1px solid var(--line);align-items:flex-start"><span><b style="font-weight:600">' + esc(r[0]) + '</b><br><span class="small muted">' + esc(r[2]) + '</span></span><b style="white-space:nowrap">' + esc(r[1]) + '</b></div>';
    }).join('') + '</div>';
  }

  /* the order or requirement this product was opened from */
  function contextCard(p, c) {
    if (c.order) {
      var o = c.order, l = o.lines.filter(function (x) { return x.pid === p.id; })[0];
      if (!l) return '';
      var i = -1, po = null;
      o.vendorPOs.forEach(function (v, k) { if (v.pids.indexOf(p.id) >= 0) { po = v; i = k; } });
      var co = G.companyById(o.company);
      var poLine = !po ? '<span class="pill warn">No vendor PO yet</span>'
        : po.status === 'received' ? '<span class="pill ok">Received</span> ' + GC.fmt(l.qty) + ' pcs at ' + esc(po.receivedWh ? GC.branchName(D().warehouses, po.receivedWh) : 'the warehouse') + (po.receivedAt ? ' on ' + esc(po.receivedAt) : '') + ' from ' + esc(po.vendorName)
        : '<span class="pill ' + (o.deadline && po.eta > o.deadline ? 'bad' : 'info') + '">Not received</span> ' + esc(po.vendorName) + ' promises ' + esc(po.eta) + ' <button class="btn sm" data-act="poReceived" data-id="' + o.id + '|' + i + '">Mark goods received</button>';
      return '<div class="card" style="border:2px solid var(--brand);margin-bottom:14px"><p class="muted small" style="margin:0">For order <a href="#/order/' + o.id + '">' + esc(o.no) + '</a> · ' + esc(co ? co.name : '') + '</p>' +
        '<h3 style="margin:6px 0 10px">This order needs ' + GC.fmt(l.qty) + ' pcs</h3><dl class="kv">' +
        '<dt>Price on the order</dt><dd>₹' + GC.fmt(l.unit + l.brandCost) + ' each · ₹' + GC.fmt(l.total) + ' incl. GST</dd>' +
        '<dt>Branding</dt><dd>' + esc(l.branding || 'None') + '</dd>' +
        '<dt>Deliver by</dt><dd>' + esc(o.deadline || '—') + '</dd>' +
        '<dt>Goods</dt><dd>' + poLine + '</dd></dl></div>';
    }
    if (c.opp) {
      var op = c.opp, ln = GC.lineOf(op, p.id);
      if (!ln) return '';
      var qty = ln.qty || op.brief.qty || p.moq, unit = GC.unitPrice(p, qty);
      var days = op.brief.deadline ? GC.daysBetween(GC.today(), op.brief.deadline) : null;
      var co2 = G.companyById(op.company);
      return '<div class="card" style="border:2px solid var(--brand);margin-bottom:14px"><p class="muted small" style="margin:0">For <a href="#/opp/' + op.id + '">' + esc(op.title) + '</a> · ' + esc(co2 ? co2.name : '') + '</p>' +
        '<h3 style="margin:6px 0 10px">The client wants ' + GC.fmt(qty) + ' pcs</h3><dl class="kv">' +
        '<dt>Price at ' + GC.fmt(qty) + ' pcs</dt><dd>₹' + GC.fmt(unit) + ' each · ₹' + GC.fmt(unit * qty) + ' + GST ' + p.gst + '%</dd>' +
        '<dt>Status</dt><dd>' + esc(GC.MARKS[ln.mark] || ln.mark) + '</dd>' +
        '<dt>Branding</dt><dd>' + esc(ln.branding || (p.branding.length ? 'Not chosen yet' : 'Not brandable')) + '</dd>' +
        '<dt>Time</dt><dd>' + (days == null ? 'No deadline yet' : p.lead + '-day lead · deadline in ' + days + ' days · ' + (p.lead + GC.T.rules.bufferDays <= days ? 'fits' : 'tight')) + '</dd>' +
        (qty < p.moq ? '<dt>MOQ</dt><dd style="color:var(--warn)">Under the vendor minimum of ' + p.moq + '</dd>' : '') + '</dl></div>';
    }
    return '';
  }

  V.product = function (arg) {
    var c = ctxOf(arg), id = c.pid, p = G.P(id);
    if (!p) return G.deny('No such product.', 'It may have been removed from the catalogue.');
    var edit = D().productEdits[id] || {};
    var sc = GC.scoreRecord(p, edit), canEdit = G.can('catalogue'), cost = G.can('cost');
    var needQty = c.order ? (c.order.lines.filter(function (x) { return x.pid === id; })[0] || {}).qty : c.opp ? ((GC.lineOf(c.opp, id) || {}).qty || c.opp.brief.qty) : null;
    var h = '<div class="stickyhead"><div class="ph"><div class="row" style="align-items:center;gap:14px">' + photo(p) + '<div><p class="muted small" style="margin:0">' + esc(p.id) + ' · ' + esc(p.category) + ' · ' + esc(p.vendorName) + '</p><h1>' + esc(p.name) + '</h1>' +
      '<p style="margin-top:4px">' + (p.sample ? G.pill('Sample in office', 'lime') + ' ' : '') + (p.ucpmp ? G.pill('UCPMP-safe', 'ok') + ' ' : '') + (p.premium ? G.pill('Premium', 'em') + ' ' : '') + (p.brandable ? G.pill('Brandable', 'info') : G.pill('Not brandable', 'dim')) + '</p></div></div>' +
      '<div class="acts">' + (G.can('vendors') ? '<button class="btn agent" data-act="sourceProduct" data-id="' + esc(id) + '">⇄ Get fresh vendor prices</button>' : '') +
      (!c.order && !c.opp ? '<button class="btn ghost" data-act="pickOne" data-id="' + esc(id) + '">+ Pick for a requirement</button>' : '') + '</div></div>';
    h += '<div class="kpis slim">' + [['₹' + GC.fmt(p.price), 'List price'], [cost ? '₹' + GC.fmt(p.cost) : '₹ ••••', 'Vendor cost'], [cost ? p.marginPct + '%' : '••', 'Margin'],
      [GC.fmt(p.moq), 'MOQ'], [p.lead + ' days', 'Lead time'], [sc.pct + '%', 'Record complete', sc.pct >= 70 ? 'ok' : sc.pct >= 40 ? 'warn' : 'bad']].map(function (k) {
        return '<div class="kpi' + (k[2] ? ' ' + k[2] : '') + '"><b>' + k[0] + '</b><span>' + esc(k[1]) + '</span></div>';
      }).join('') + '</div></div>';

    h += '<div class="split"><div>' + contextCard(p, c);
    if (EDITING[id] && canEdit) h += editForm(p, edit);
    else {
      var E_ = G.E;
      h += '<div class="card"><div class="between"><h3>About</h3>' + (canEdit ? '<button class="minibtn" data-act="editProductToggle" data-id="' + esc(id) + '">Edit details</button>' : '') + '</div>' +
        '<p style="margin:0 0 10px">' + (p.desc ? esc(p.desc) : '<span class="muted">No description yet.</span>') + '</p><dl class="kv">' +
        kv('Colour · material', p.color + ' · ' + (p.mat.join(', ') || '—')) +
        kv('Good for', p.occ.map(function (i) { return E_.OCCASIONS[i]; }).join(', ')) +
        kv('For', p.rec.map(function (i) { return E_.RECIPIENTS[i]; }).join(', ')) +
        kv('Packed as', p.pack.map(function (i) { return E_.PACKS[i]; }).join(', ')) +
        kv('Doctors (UCPMP)', p.ucpmp ? 'Allowed — professional-use, under ₹' + GC.fmt(GC.T.rules.ucpmpCap) : 'Not for gifts to doctors') +
        kv('Tax', 'HSN ' + p.hsn + ' · GST ' + p.gst + '%') + '</dl></div>';
      h += '<div class="card" style="margin-top:14px"><h3>Branding</h3>' + (p.brandable
        ? '<p style="margin:0 0 8px">' + p.branding.map(function (b) { return G.pill(b, 'info'); }).join(' ') + '</p><dl class="kv">' + kv('Print area', (edit.extra || {}).print_area || 'Not recorded yet') + '</dl>'
        : '<p class="muted" style="margin:0">This product cannot take a logo. Choose a brandable one, or add a printed sleeve or card.</p>') +
        '<p class="small muted" style="margin:12px 0 6px">Logo mockup</p>' + imgSlot(id, 'mockup', (edit.extra || {}).mockup, 'Upload a mockup') + '</div>';
      h += '<div class="card" style="margin-top:14px"><h3>Photos</h3>' + imgSlot(id, 'image', edit.image, 'Upload a product photo') +
        '<p class="honest">Photos are resized in the browser before saving. In production they go to file storage.</p></div>';
    }
    h += '</div><div>';
    h += '<div class="card"><h3>Price by quantity</h3><table class="tbl"><tbody>' + p.bands.map(function (b, i) {
      var next = p.bands[i + 1], on = needQty != null && needQty >= b[0] && (!next || needQty < next[0]);
      return '<tr style="' + (on ? 'background:var(--brand-soft)' : '') + '"><td>' + GC.fmt(b[0]) + '+ pcs' + (on ? ' <span class="pill em">this order</span>' : '') + '</td><td class="num"><b>₹' + GC.fmt(b[1]) + '</b></td><td class="num small muted">+ GST ' + p.gst + '%</td></tr>';
    }).join('') + '</tbody></table></div>';
    h += '<div style="margin-top:14px">' + stockCard(p) + '</div>';
    h += '<div class="card" style="margin-top:14px"><h3>Missing from the record</h3>' + (sc.missing.length ? '<p class="muted small" style="margin:0">' + esc(sc.missing.filter(function (m) { var f = GC.FIELDS.filter(function (x) { return x.label === m; })[0]; return !f || f.type !== 'derived'; }).join(' · ')) + '</p><p class="honest">Figures the demo modelled (cost, MOQ, lead time, HSN) do not count until someone confirms them in Edit details.</p>' : '<p class="muted">Nothing — complete.</p>') + '</div>';
    var inOpps = D().opps.filter(function (o) { return GC.lineOf(o, id) && G.inScope(o) && (!c.opp || o.id !== c.opp.id); });
    if (inOpps.length) h += '<div class="card pad0" style="margin-top:14px"><div class="hd"><h3>Also on</h3></div>' + inOpps.map(function (o) {
      var co = G.companyById(o.company);
      return '<div class="item" data-act="go" data-id="#/opp/' + o.id + '" style="cursor:pointer"><div class="grow"><h4>' + esc(o.title) + '</h4><p>' + esc(co ? co.name : '') + ' · ' + esc(o.stage) + '</p></div></div>';
    }).join('') + '</div>';
    return h + '</div></div>';
  };

  function imgSlot(id, key, url, label) {
    var can = G.can('catalogue');
    return (url ? '<img src="' + url + '" alt="" style="max-width:100%;max-height:260px;border-radius:12px;display:block;margin-bottom:8px">' : '<div class="empty" style="border:1px dashed var(--line2);border-radius:12px;padding:22px">No image yet</div>') +
      (can ? '<label class="btn ghost sm" style="margin-top:8px;cursor:pointer">' + (url ? 'Replace' : label) + '<input type="file" accept="image/*" data-chg="uploadImg" data-id="' + esc(id) + '|' + key + '" hidden></label>' +
        (url ? ' <button class="minibtn" data-act="removeImg" data-id="' + esc(id) + '|' + key + '">Remove</button>' : '') : '');
  }

  /* the whole record, editable — only when asked for */
  function editForm(p, edit) {
    var cost = G.can('cost');
    var groups = {};
    GC.FIELDS.forEach(function (f) { if (f.type !== 'derived' && f.type !== 'image') (groups[f.group] = groups[f.group] || []).push(f); });
    return '<div class="card"><div class="between"><h3>Edit details</h3><button class="btn sm" data-act="editProductToggle" data-id="' + esc(p.id) + '">Done</button></div>' +
      '<p class="muted small">Each field saves as you leave it. Values marked <span class="pill dim">modelled</span> were estimated for the demo and do not count until you confirm them.</p>' +
      Object.keys(groups).map(function (g) {
        return '<p class="eyebrow">' + esc(g) + '</p><dl class="kv">' + groups[g].map(function (f) {
          if (f.secret && !cost) return '<dt>' + esc(f.label) + '</dt><dd>₹ ••••</dd>';
          var v = GC.fieldValue(p, f);
          var mine = GC.nonEmpty(edit[f.key]) || GC.nonEmpty((edit.extra || {})[f.key]);
          var tag = !f.own && !mine && v != null && v !== '' ? ' <span class="pill dim">modelled</span>' : '';
          var did = esc(p.id) + '|' + f.key;
          var inp = f.type === 'select' ? '<select data-chg="editField" data-id="' + did + '" style="width:auto"><option value=""></option>' + f.options.map(function (o) { return '<option' + (String(v) === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>'
            : f.type === 'textarea' ? '<textarea data-chg="editField" data-id="' + did + '" style="min-height:70px">' + esc(v || '') + '</textarea>'
            : '<input type="' + (f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text') + '" data-chg="editField" data-id="' + did + '" value="' + esc(v == null ? '' : v) + '" style="max-width:280px">';
          return '<dt>' + esc(f.label) + '</dt><dd>' + inp + tag + '</dd>';
        }).join('') + '</dl>';
      }).join('') + '</div>';
  }

  /* the pop-up: one product, the essentials, and a way into the full record */
  G.peek = function (pid, ctxPath, why) {
    var p = G.P(pid); if (!p) return;
    var cost = G.can('cost');
    G.modal(p.name, p.vendorName + ' · ' + p.category, '<div class="grid2" style="gap:16px"><div>' + photo(p, true) + '</div><div><dl class="kv">' +
      kv('List price', '₹' + GC.fmt(p.price) + ' + GST ' + p.gst + '%') + (cost ? kv('Margin', p.marginPct + '%') : '') + kv('MOQ', GC.fmt(p.moq) + ' pcs') + kv('Lead time', p.lead + ' days') +
      kv('Branding', p.brandable ? p.branding.join(', ') : 'Not brandable') + kv('Doctors (UCPMP)', p.ucpmp ? 'Allowed' : 'No') + '</dl>' +
      '<p class="small muted" style="margin:10px 0 4px">By quantity</p>' + p.bands.map(function (b) { return GC.fmt(b[0]) + '+ ₹' + GC.fmt(b[1]); }).join(' · ') + '</div></div>' +
      (why ? '<div class="notice agent" style="margin-top:14px">✦ ' + esc(why) + '</div>' : '') +
      '<p style="margin-top:16px"><button class="btn" data-act="viewProduct" data-id="' + esc(pid) + (ctxPath ? '/' + esc(ctxPath) : '') + '">View product</button></p>');
  };

  /* downscale before storing — full-size photos would fill the browser's storage */
  function shrink(file, cb) {
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 900, w = img.width, hh = img.height;
        if (w > max || hh > max) { var k = max / Math.max(w, hh); w = Math.round(w * k); hh = Math.round(hh * k); }
        var cv = document.createElement('canvas'); cv.width = w; cv.height = hh;
        cv.getContext('2d').drawImage(img, 0, 0, w, hh);
        cb(cv.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = function () { cb(null); };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  }

  function kv(k, v) { return '<dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd>'; }

  /* ================= actions ================= */

  Object.assign(A, {
    brief: function (f) {
      S.text = String(f.text || '').trim(); S.show = 60;
      S.f = S.text ? E.interpret(S.text, G.db()) : blankF();
      S.f.text = [];
      G.render();
    },
    clearDiscover: function () { S.text = ''; S.f = blankF(); S.show = 60; G.render(); },
    ucpmpOnly: function () { var f = F(); f.attr.add(6); if (f.max == null || f.max > GC.T.rules.ucpmpCap) f.max = GC.T.rules.ucpmpCap; G.render(); },
    facet: function (on, el) { var p = el.dataset.id.split('|'), s = F()[p[0]], v = +p[1]; if (on) s.add(v); else s.delete(v); S.show = 60; G.render(); },
    facetNum: function (v, el) { F()[el.dataset.id] = v === '' ? null : Number(v); S.show = 60; G.render(); },
    discSort: function (v) { S.sort = v; G.render(); },
    discMore: function () { S.show += 60; G.render(); },
    discPick: function (id) { var i = S.sel.indexOf(id); if (i >= 0) S.sel.splice(i, 1); else S.sel.push(id); G.render(); },
    trayClear: function () { S.sel = []; G.render(); },
    trayAdd: function () {
      var o = G.oppById((document.getElementById('trayOpp') || {}).value);
      if (!o) return G.toast('Pick a requirement — or open one from the Pipeline first.', 'bad');
      S.sel.forEach(function (pid) { GC.addLine(o, pid, o.brief.qty); });
      G.log('opp_line', S.sel.length + ' product(s) added from Discover to ' + o.title, { opp: o.id });
      S.sel = []; G.save(); G.toast('Added.'); G.go('#/opp/' + o.id);
    },
    pickOne: function (id) { if (S.sel.indexOf(id) < 0) S.sel.push(id); G.toast('Picked — it is in the tray on Discover.'); G.go('#/discover'); },
    peekProduct: function (id, el) { var p = String(id).split('|'); G.peek(p[0], p[1] || '', el && el.dataset.why); },
    viewProduct: function (id) { G.closeModal(); G.go('#/product/' + id); },
    editProductToggle: function (id) { EDITING[id] = !EDITING[id]; G.render(); },
    uploadImg: function (v, el) {
      var p = el.dataset.id.split('|'), f = el.files && el.files[0];
      if (!f) return;
      if (!/^image\//.test(f.type)) return G.toast('That is not an image.', 'bad');
      shrink(f, function (url) {
        if (!url) return G.toast('Could not read that image.', 'bad');
        var r = G.editProduct(p[0], p[1], url);
        G.toast(r.error ? r.error : 'Image saved.', r.error ? 'bad' : ''); G.render();
      });
    },
    removeImg: function (id) { var p = id.split('|'); G.editProduct(p[0], p[1], ''); G.render(); },
    editField: function (v, el) {
      var p = el.dataset.id.split('|');
      var r = G.editProduct(p[0], p[1], v);
      if (r.error) G.toast(r.error, 'bad'); else G.toast(r.field.label + ' saved.');
      G.render();
    },
    sourceProduct: function (id) {
      var p = G.P(id);
      G.modal('Get fresh vendor prices', p.name, '<form data-submit="startSourcing" data-id="' + esc(id) + '">' +
        G.field('Quantity', '<input type="number" name="qty" value="' + (p.moq * 4) + '">') + G.field('Needed by (optional)', '<input type="date" name="deadline">') +
        '<label class="chk"><input type="radio" name="mode" value="rfq" checked> Sealed RFQ — one price from each vendor</label><label class="chk"><input type="radio" name="mode" value="auction"> Reverse auction — three open rounds</label>' +
        '<p style="margin-top:14px"><button class="btn agent">Run the Sourcing agent</button></p></form>');
    },
    startSourcing: function (f, form) {
      var pr = G.runAgent('sourcing', { pid: form.dataset.id, qty: Math.max(1, +f.qty || 100), deadline: f.deadline || null, mode: f.mode || 'rfq' }, { manual: true });
      G.closeModal();
      if (pr) G.go('#/proposal/' + pr.id);
    }
  });
})();
