/* Vendors: scorecards, RFQs and reverse auctions, and price-list intake.
   A vendor's rating and on-time record decide who the Sourcing agent invites. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS, esc = G.esc;
  var D = function () { return G.D(); };

  var COUNT = null;
  function counts() {
    if (COUNT && COUNT.n === G.db().items.length) return COUNT.c;
    var c = {};
    G.db().items.forEach(function (it) { c[it.vendor] = (c[it.vendor] || 0) + 1; });
    COUNT = { n: G.db().items.length, c: c };
    return c;
  }
  function meta(vi) { return GC.vendorMeta(vi, G.db().vendors[vi], D().vendorEdits[vi]); }

  var VF = { q: '', cat: '', sort: 'score' };
  V.vendors = function () {
    var db = G.db(), c = counts();
    var rows = db.vendors.map(function (v, vi) { return meta(vi); }).filter(function (m) {
      if (VF.cat !== '' && String(m.cat) !== VF.cat) return false;
      return !VF.q || m.name.toLowerCase().indexOf(VF.q.toLowerCase()) >= 0;
    });
    rows.sort(VF.sort === 'stale' ? function (a, b) { return b.priceListAge - a.priceListAge; } : VF.sort === 'name' ? function (a, b) { return a.name.localeCompare(b.name); } : function (a, b) { return GC.vendorScore(b) - GC.vendorScore(a); });
    var stale = db.vendors.filter(function (v, vi) { return meta(vi).priceListAge > 90; }).length;
    var rfqs = D().rfqs;
    var h = '<div class="ph"><div><h1>Vendors</h1><p>' + db.vendors.length + ' vendors. The Sourcing agent invites the best-scoring ones in a category; you can always add anyone.</p></div>' +
      '<div class="acts">' + (G.can('catalogue') ? '<a class="btn" href="#/intake">⇪ Price-list intake</a>' : '') + '</div></div>';
    h += G.kpis([[db.vendors.length, 'Vendors'], [stale, 'Price lists older than 90 days', stale ? 'warn' : 'ok', 'Quotes built on old prices lose margin.'],
                 [rfqs.length, 'RFQs run'], [G.can('cost') ? GC.money(rfqs.reduce(function (a, r) { return a + Math.max(0, r.saving || 0); }, 0)) : '₹ ••••', 'Saved on awarded RFQs', null, 'Against each product\'s cost before the RFQ.'],
                 [D().intakeQueue.length, 'Intake rows to check', D().intakeQueue.length ? 'warn' : 'ok']]);
    if (rfqs.length) h += '<p class="eyebrow">Recent RFQs & auctions</p><div class="card pad0">' + rfqs.slice(0, 8).map(function (r) {
      var p = G.P(r.pid), w = r.bids.filter(function (b) { return b.vi === r.winner; })[0];
      return '<div class="item" data-act="go" data-id="#/rfq/' + r.id + '" style="cursor:pointer"><div class="grow"><h4>' + esc(p ? p.name : r.pid) + ' × ' + GC.fmt(r.qty) + '</h4><p>' + (r.mode === 'auction' ? 'Reverse auction' : 'RFQ') + ' · ' + r.bids.length + ' vendors · ' + esc(r.at) + (w ? ' · won by ' + esc(w.name) + ' at ' + (G.can('cost') ? '₹' + GC.fmt(r.price) : '₹ ••••') : '') + '</p></div>' + G.pill(r.status, r.status === 'awarded' ? 'ok' : 'warn') + '</div>';
    }).join('') + '</div>';
    h += '<p class="eyebrow">All vendors</p><div class="row" style="margin-bottom:12px"><input data-input="venSearch" id="venSearch" value="' + esc(VF.q) + '" placeholder="Search vendors" style="max-width:260px">' +
      '<select data-chg="venCat" style="width:auto"><option value="">Every category</option>' + db.cats.map(function (c, i) { return '<option value="' + i + '"' + (VF.cat === String(i) ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select>' +
      '<select data-chg="venSort" style="width:auto">' + [['score', 'Best score first'], ['stale', 'Oldest price list first'], ['name', 'A–Z']].map(function (o) { return '<option value="' + o[0] + '"' + (VF.sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>';
    h += '<div class="card pad0 scroller"><table class="tbl"><thead><tr><th>Vendor</th><th>Category</th><th>City</th><th class="num">Products</th><th class="num">Rating</th><th class="num">On time</th><th class="num">Score</th><th>Price list</th></tr></thead><tbody>' +
      rows.slice(0, 80).map(function (m) {
        return '<tr data-act="go" data-id="#/vendor/' + m.vi + '"><td><b>' + esc(m.name) + '</b>' + (m.brand ? '<small>brand</small>' : '<small>regional supplier</small>') + '</td><td>' + esc(db.cats[m.cat].name) + '</td><td>' + esc(m.city) + '</td>' +
          '<td class="num">' + GC.fmt(c[m.vi] || 0) + '</td><td class="num">' + m.rating + '★</td><td class="num">' + m.ontime + '%</td><td class="num"><b>' + GC.vendorScore(m) + '</b></td><td>' + G.pill(m.priceListAge + ' days old', m.priceListAge > 90 ? 'warn' : 'dim') + '</td></tr>';
      }).join('') + '</tbody></table></div>' + (rows.length > 80 ? '<p class="honest">Showing 80 of ' + rows.length + '. Search to narrow.</p>' : '') +
      '<p class="honest">Ratings, on-time records and price-list ages are modelled for the demo until Royale\'s own vendor history is loaded.</p>';
    return h;
  };

  V.vendor = function (vi) {
    vi = +vi;
    var v = G.db().vendors[vi]; if (!v) return G.deny('No such vendor.', '');
    var m = meta(vi), c = counts(), edit = G.can('vendors');
    var prods = G.db().items.filter(function (it) { return it.vendor === vi; }).slice(0, 24);
    var pos = [];
    D().orders.forEach(function (o) { o.vendorPOs.forEach(function (p) { if (p.vendor === vi) pos.push([o, p]); }); });
    var h = '<div class="ph"><div><p class="muted small">' + esc(G.db().cats[m.cat].name) + ' · ' + esc(m.city) + (m.brand ? ' · brand' : '') + '</p><h1>' + esc(m.name) + '</h1><p>' + GC.fmt(c[vi] || 0) + ' products · score ' + GC.vendorScore(m) + '/100</p></div>' +
      '<div class="acts">' + (G.can('catalogue') ? '<a class="btn" href="#/intake/' + vi + '">⇪ Read their price list</a>' : '') + '</div></div>';
    /* Vendors are generated from the catalogue rather than stored, so their people live
       in the same contacts collection as clients', keyed by vendor instead of company.
       One collection and one UI pattern beats a second half-built one. */
    var vcs = (D().contacts || []).filter(function (x) { return x.vendor === vi; });
    h += '<div class="card pad0" style="margin-top:14px"><div class="between" style="padding:12px 14px 0"><h3>People</h3>' +
      (edit ? '<button class="btn sm ghost" data-act="addVendorContact" data-id="' + vi + '">+ Contact</button>' : '') + '</div>' +
      (vcs.length ? vcs.map(function (ct) {
        return '<div class="item"><span class="av sm" style="background:var(--brand-2)">' + esc(String(ct.name || '?').charAt(0)) + '</span>' +
          '<div class="grow"><h4>' + esc(ct.name) + '</h4><p>' + esc(ct.role || '') +
          (ct.mobile ? ' · ' + esc(G.mob(ct.mobile)) : '') + (ct.email ? ' · ' + esc(ct.email) : '') + '</p></div>' +
          (edit ? '<button class="minibtn" data-act="delVendorContact" data-id="' + ct.id + '">Remove</button>' : '') + '</div>';
      }).join('') : G.empty('Nobody recorded yet. A price list is worth more when you know who to ring about it.')) + '</div>';
    h += G.kpis([[m.rating + '★', 'Rating'], [m.ontime + '%', 'On time', m.ontime < 80 ? 'warn' : 'ok'], [m.priceListAge + ' days', 'Price list age', m.priceListAge > 90 ? 'warn' : null], [pos.length, 'POs on our orders']]);
    h += '<div class="split" style="margin-top:18px"><div><div class="card pad0"><div class="hd"><h3>Products</h3><a class="small" href="#/discover">Search all in Discover →</a></div><div class="pgrid" style="padding:12px">' + prods.map(function (it) {
      var p = G.P(it.id); return '<div class="pcard" data-act="go" data-id="#/product/' + esc(p.id) + '"><div class="body"><b>' + esc(p.name) + '</b><span class="small muted">MOQ ' + p.moq + ' · ' + p.lead + ' d</span><div class="foot"><span class="price">₹' + GC.fmt(p.price) + '</span></div></div></div>';
    }).join('') + '</div></div>';
    if (pos.length) h += '<div class="card pad0" style="margin-top:14px"><div class="hd"><h3>On our orders</h3></div>' + pos.map(function (x) {
      return '<div class="item" data-act="go" data-id="#/order/' + x[0].id + '" style="cursor:pointer"><div class="grow"><h4>' + esc(x[0].no + ' · ' + x[0].title) + '</h4><p>promised ' + esc(x[1].eta) + (x[0].deadline ? ' · client deadline ' + esc(x[0].deadline) : '') + '</p></div>' + G.pill(x[1].status, x[1].status === 'received' ? 'ok' : x[0].deadline && x[1].eta > x[0].deadline ? 'bad' : 'info') + '</div>';
    }).join('') + '</div>';
    h += '</div><form class="card" data-submit="saveVendor" data-id="' + vi + '"><h3>Record</h3>' +
      G.field('Contact', '<input name="contact" value="' + esc(m.contact) + '"' + (edit ? '' : ' disabled') + '>') +
      G.field('WhatsApp', '<input name="whatsapp" value="' + esc(G.can('seeMobile') || edit ? m.whatsapp : G.mob(m.whatsapp)) + '"' + (edit ? '' : ' disabled') + '>') +
      G.field('City', '<input name="city" value="' + esc(m.city) + '"' + (edit ? '' : ' disabled') + '>') +
      G.field('Payment terms', '<input name="terms" value="' + esc(m.terms) + '"' + (edit ? '' : ' disabled') + '>') +
      '<div class="grid2" style="gap:0 12px">' + G.field('Rating (1–5)', '<input type="number" step="0.1" min="1" max="5" name="rating" value="' + m.rating + '"' + (edit ? '' : ' disabled') + '>') +
      G.field('On time %', '<input type="number" min="0" max="100" name="ontime" value="' + m.ontime + '"' + (edit ? '' : ' disabled') + '>') + '</div>' +
      (edit ? '<button class="btn">Save</button>' : '') + '<p class="honest">Vendor portal link for RFQs: <a href="vendor.html#' + vi + '" target="_blank">vendor.html#' + vi + '</a></p></form></div>';
    return h;
  };

  V.rfq = function (id) {
    var r = D().rfqs.filter(function (x) { return x.id === id; })[0];
    if (!r) return G.deny('No such RFQ.', '');
    var p = G.P(r.pid), w = r.bids.filter(function (b) { return b.vi === r.winner; })[0];
    var h = '<div class="ph"><div><p class="muted small">' + (r.mode === 'auction' ? 'Reverse auction' : 'Sealed RFQ') + ' · ' + esc(r.at) + ' · by ' + esc(GC.staffName(r.by)) + '</p><h1>' + esc(p ? p.name : r.pid) + ' × ' + GC.fmt(r.qty) + '</h1>' +
      '<p>' + (w ? 'Awarded to <b>' + esc(w.name) + '</b> at ' + (G.can('cost') ? '₹' + GC.fmt(r.price) : '₹ ••••') + '/pc, ' + r.lead + ' days' : 'Open') + '</p></div>' + (r.opp ? '<div class="acts"><a class="btn ghost" href="#/opp/' + r.opp + '">The requirement</a></div>' : '') + '</div>';
    h += '<div class="card pad0">' + G.bidsTable({ bids: r.bids, winner: r.winner }, false) + '</div>';
    if (r.rounds && r.rounds.length) h += '<p class="honest">Rounds: ' + r.rounds.map(function (x) { return 'R' + x.round + ' low ₹' + GC.fmt(x.low); }).join(' → ') + '</p>';
    return h;
  };

  V.intake = function (vi) {
    var db = G.db(), sel = vi !== '' && vi != null ? +vi : null, q = D().intakeQueue;
    var sample = 'Item Name,Rate,Min Qty,Delivery,Category\n"Steel vacuum flask 750 ml, logo engraved",540,100,6 days,Drinkware\n"Bamboo pen stand with planter",310,200,5 days,Stationery\n"Premium jute tote bag",210,500,7 days,Bags\n"Copper bottle 1 L with 2 glasses",1150,50,10 days,Home\nthing,,,';
    var h = '<div class="ph"><div><h1>Price-list intake</h1><p>Paste a vendor\'s list however they sent it. The intake agent maps the columns, tags every row, catches duplicates and says how sure it is.</p></div></div>';
    h += '<div class="split"><form class="card" data-submit="runIntake"><h3>The price list</h3>' +
      G.field('Vendor', '<select name="vendor">' + db.vendors.map(function (v, i) { return '<option value="' + i + '"' + (i === sel ? ' selected' : '') + '>' + esc(v.name) + ' — ' + esc(db.cats[v.cat].name) + '</option>'; }).join('') + '</select>') +
      G.field('Rows (CSV or copied from Excel)', '<textarea name="csv" id="intakeCsv" style="min-height:220px;font-family:ui-monospace,Menlo,monospace;font-size:12px" placeholder="Header row first"></textarea>') +
      '<div class="row"><button class="btn agent">⇪ Let the intake agent read it</button><button type="button" class="btn ghost" data-act="intakeSample">Use a sample list</button></div>' +
      '<textarea id="intakeSampleText" hidden>' + esc(sample) + '</textarea></form>';
    h += '<div><div class="card pad0"><div class="hd"><h3>Waiting for a person · ' + q.length + '</h3></div>' + (q.length ? q.map(function (r, i) {
      return '<div class="item"><div class="grow"><h4>' + esc(r.name || '(blank)') + '</h4><p>' + esc(db.vendors[r.vendor] ? db.vendors[r.vendor].name : '') + ' · ' + (r.price ? '₹' + GC.fmt(r.price) : 'no price') + ' · ' + esc(r.catName) + ' · ' + Math.round(r.conf * 100) + '% sure</p></div><button class="minibtn" data-act="queueDrop" data-id="' + i + '">Discard</button></div>';
    }).join('') : G.empty('Nothing to check.')) + '</div>' +
      '<div class="card" style="margin-top:14px"><h3>Added through intake</h3><p class="muted small">' + D().newProducts.length + ' product(s) added in this demo. They are searchable in Discover and the Curator uses them.</p></div></div></div>';
    return h;
  };

  Object.assign(A, {
    venSearch: function (v) { VF.q = v; G.render(); },
    venCat: function (v) { VF.cat = v; G.render(); },
    venSort: function (v) { VF.sort = v; G.render(); },
    saveVendor: function (f, form) {
      var vi = +form.dataset.id, e = D().vendorEdits[vi] = D().vendorEdits[vi] || {};
      ['contact', 'whatsapp', 'city', 'terms'].forEach(function (k) { if (f[k] != null && !/•/.test(f[k])) e[k] = f[k]; });
      if (f.rating) e.rating = Math.max(1, Math.min(5, +f.rating));
      if (f.ontime) e.ontime = Math.max(0, Math.min(100, +f.ontime));
      G.log('vendor_edit', 'Vendor record updated: ' + G.db().vendors[vi].name); G.save(); G.toast('Saved.'); G.render();
    },
    intakeSample: function () { document.getElementById('intakeCsv').value = document.getElementById('intakeSampleText').value; },
    runIntake: function (f) {
      if (!String(f.csv || '').trim()) return G.toast('Paste the rows first.', 'bad');
      var p = G.runAgent('intake', { csv: f.csv, vendor: +f.vendor }, { manual: true });
      if (p) G.go('#/proposal/' + p.id);
    },
    queueDrop: function (i) { D().intakeQueue.splice(+i, 1); G.save(); G.render(); }
  });

  A.addVendorContact = function (vi) {
    var v = G.db().vendors[+vi];
    if (!v) return;
    G.modal('Add a person', v.name,
      '<form data-submit="saveVendorContact" data-id="' + vi + '">' +
      G.field('Name', '<input name="name" required>') +
      G.field('Role', '<input name="role" placeholder="e.g. Sales, Dispatch, Accounts">') +
      G.field('Mobile', '<input name="mobile">') +
      G.field('Email', '<input name="email" type="email">') +
      '<div class="err" id="vcErr"></div><button class="btn">Save</button></form>');
  };

  A.saveVendorContact = function (f, form) {
    var vi = +form.dataset.id, v = G.db().vendors[vi];
    if (!v) return;
    if (!f.name || !String(f.name).trim()) {
      var e = document.getElementById('vcErr'); if (e) e.textContent = 'A name, please.';
      return;
    }
    if (f.mobile && String(f.mobile).replace(/\D/g, '').length < 10) {
      var e2 = document.getElementById('vcErr'); if (e2) e2.textContent = 'That mobile number is too short.';
      return;
    }
    D().contacts = D().contacts || [];
    D().contacts.push({ id: GC.uid('ct'), vendor: vi, name: String(f.name).trim(),
                        role: f.role || '', mobile: f.mobile || '', email: f.email || '' });
    G.log('contact_add', f.name + ' added to ' + v.name, {});
    G.save(); G.closeModal(); G.render();
  };

  A.delVendorContact = function (id) {
    var ct = (D().contacts || []).filter(function (x) { return x.id === id; })[0];
    if (!ct || !window.confirm('Remove ' + ct.name + '?')) return;
    D().contacts = D().contacts.filter(function (x) { return x.id !== id; });
    G.log('contact_del', 'Removed ' + ct.name, {});
    G.save(); G.render();
  };

})();
