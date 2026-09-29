/* What we sell, and the engagement export.

   An agency has no inventory. This screen is a short list of PRODUCTS, each
   with a reference code, a floor price, what it includes and a monthly target.
   It is READ-ONLY on purpose: one editor, in Settings → What we sell, so a
   price cannot be one number here and another there. It is deliberately small
   too — the money and the work live on engagements, which are scoped one at a
   time, and a products screen that grows into a catalogue is the tell that
   somebody ported a retail cockpit without thinking.

   The old file here was a used-product stock table: landed cost, reconditioning,
   ageing buckets, cover photos, "view on site". None of that is a service
   business, so none of it survived. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS;
  var esc = function (s) { return ZS.esc(s); };
  function D() { return G.D(); }

  /* ---------------- what we sell ---------------- */

  V.stock = function () {
    var a = G.acc();
    var opps = D().opportunities || [];
    var prods = G.products();

    var h = '<div class="ph"><div><h1>What we sell</h1>' +
      '<p>' + prods.length + ' line' + (prods.length === 1 ? '' : 's') +
      '. Every engagement is scoped and priced on its own &mdash; ' +
      'this is the floor, not a price list. Prices and targets are set in Settings.</p></div>' +
      (a.settings ? '<div class="right"><a class="btn alt" href="#/settings/lines">Prices &amp; targets</a></div>' : '') +
      '</div>';

    h += '<div class="prodgrid">' + prods.map(function (p) {
      var sold = opps.filter(function (o) { return o.product === p.id; });
      var won = sold.filter(function (o) { return o.outcome === 'won'; });
      var value = sold.reduce(function (x, o) { return x + ZS.oppValue(o); }, 0);
      return '<article class="card pad prodcard" data-act="openProduct" data-id="' + esc(p.id) + '">' +
        '<div class="cardhead"><h3>' + esc(p.name) + '</h3>' +
        '<span class="refchip">' + esc(p.code) + '-001…</span></div>' +
        '<p class="m">' + esc(p.blurb || '') + '</p>' +
        '<div class="ministats" style="margin-top:14px">' +
          '<div><b>' + ZS.money(p.from) + '</b><span>from</span></div>' +
          '<div><b>' + sold.length + '</b><span>engagements</span></div>' +
          '<div><b>' + won.length + '</b><span>signed</span></div>' +
          '<div><b>' + ((p.target && p.target.units) || 0) + '</b><span>target / month</span></div>' +
          '<div><b>' + (a.cost ? ZS.money(value) : '₹ ••••') + '</b><span>contracted</span></div>' +
        '</div>' +
        '<p class="hint" style="margin-top:10px">About $' + ZS.fmt(ZS.inUsd(p.from)) +
          ' at ₹' + ZS.usdRate().rate + ' to the dollar, set ' + esc(ZS.usdRate().at) +
          '. Scope decides the rest.</p>' +
        '</article>';
    }).join('') + '</div>';

    /* where the money actually comes from */
    h += '<section class="card" style="margin-top:14px"><div class="cardhead pad">' +
      '<h3>Engagements by product</h3><a class="minibtn" href="#/floor">Open the board</a></div>' +
      '<div class="scroller"><table class="tbl"><thead><tr><th>Client</th><th>Product</th>' +
      '<th>Scope</th><th>Where</th><th class="num">Fee</th></tr></thead><tbody>' +
      opps.map(function (o) {
        var c = G.clientById(o.client);
        return '<tr data-act="openDrawer" data-id="' + esc(o.id) + '">' +
          '<td><b>' + esc(c ? c.name : '—') + '</b></td>' +
          '<td>' + esc(ZS.productName(o.product)) + '</td>' +
          '<td class="scopecell">' + esc(o.scope || '—') + '</td>' +
          '<td><span class="pill ' + (o.proc ? 'ok' : 'info') + '">' +
            esc(o.proc ? o.proc.stage : o.stage) + '</span></td>' +
          '<td class="num">' + (a.cost ? ZS.money(ZS.oppValue(o)) : '₹ ••••') + '</td></tr>';
      }).join('') + '</tbody></table></div></section>';

    h += G.drawerHTML ? G.drawerHTML() : '';
    return h;
  };

  /* ---------------- one product ---------------- */

  V.product = function (id) {
    var p = ZS.productById(id);
    if (!p) return G.deny('No such product', 'Nothing by that name.');
    var a = G.acc();
    var opps = (D().opportunities || []).filter(function (o) { return o.product === id; });

    var h = '<div class="ph"><div><h1>' + esc(p.name) + '</h1>' +
      '<p>' + esc(p.blurb || '') + '</p></div>' +
      '<div class="right">' +
      (a.settings ? '<a class="btn alt" href="#/settings/lines">Edit</a> ' : '') +
      '<a class="btn alt" href="#/stock">Back to products</a></div></div>';

    h += '<div class="kpis5" style="grid-template-columns:repeat(3,1fr)">' +
      '<div class="kcard"><span class="klabel">Floor price</span><div class="krow"><b>' +
        ZS.money(p.from) + '</b></div>' +
        '<span class="kfoot">Scope decides the rest</span></div>' +
      '<div class="kcard"><span class="klabel">Engagements</span><div class="krow"><b>' +
        opps.length + '</b></div><span class="kfoot">all time</span></div>' +
      '<div class="kcard"><span class="klabel">Contracted</span><div class="krow"><b>' +
        (a.cost ? ZS.money(opps.reduce(function (x, o) { return x + ZS.oppValue(o); }, 0)) : '₹ ••••') +
        '</b></div><span class="kfoot">across every client</span></div></div>';

    h += '<section class="card" style="margin-top:14px"><div class="cardhead pad"><h3>Who we built it for</h3></div>' +
      (opps.length
        ? '<div class="scroller"><table class="tbl"><thead><tr><th>Client</th><th>Scope</th>' +
          '<th>Where</th><th class="num">Fee</th></tr></thead><tbody>' +
          opps.map(function (o) {
            var c = G.clientById(o.client);
            return '<tr data-act="openOpp" data-id="' + esc(o.id) + '">' +
              '<td><b>' + esc(c ? c.name : '—') + '</b></td>' +
              '<td class="scopecell">' + esc(o.scope || '—') + '</td>' +
              '<td><span class="pill ' + (o.proc ? 'ok' : 'info') + '">' +
                esc(o.proc ? o.proc.stage : o.stage) + '</span></td>' +
              '<td class="num">' + (a.cost ? ZS.money(ZS.oppValue(o)) : '₹ ••••') + '</td></tr>';
          }).join('') + '</tbody></table></div>'
        : '<p class="m pad">No engagement uses this product yet.</p>') + '</section>';
    return h;
  };

  /* THE ADD-A-PRODUCT FORM USED TO LIVE HERE, at #/productnew, with a name, a
     floor price and a description — no reference code and no target. A product
     added through it got neither, so every reference on it came out malformed
     and it carried no number to be measured against. There is one editor now,
     Settings → What we sell, and it asks for all five. */

  /* ---------------- the engagement export ---------------- */

  var SHEET_COLS = ['id', 'client', 'product', 'scope', 'stage', 'value',
                    'invoiced', 'paid', 'owed', 'started', 'handover_by', 'owner'];

  function rows() {
    return (D().opportunities || []).map(function (o) {
      var c = G.clientById(o.client);
      var inv = (D().invoices || []).filter(function (i) { return i.opp === o.id; });
      var paid = inv.filter(function (i) { return i.state === 'paid'; })
                    .reduce(function (a, i) { return a + i.amount; }, 0);
      var u = ZS.staffById(o.assigned_to);
      return {
        id: o.ref || o.id, client: c ? c.name : '', product: ZS.productName(o.product),
        scope: o.scope || '', stage: o.proc ? o.proc.stage : o.stage,
        value: ZS.oppValue(o),
        invoiced: inv.reduce(function (a, i) { return a + i.amount; }, 0),
        paid: paid, owed: ZS.owedOn(D().invoices || [], o.id),
        started: o.created || '',
        handover_by: (o.proc && o.proc.plan && o.proc.plan['Handover']) || '',
        owner: u ? u.name : ''
      };
    });
  }

  function csv() {
    var r = rows();
    return [SHEET_COLS.join(',')].concat(r.map(function (x) {
      return SHEET_COLS.map(function (k) {
        var v = String(x[k] == null ? '' : x[k]);
        return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(',');
    })).join('\n');
  }

  V.sheet = function (panel) {
    var r = rows();
    var h = panel === 'panel' ? '' :
      '<div class="ph"><div><h1>Engagement sheet</h1>' +
      '<p>One row per engagement. Export it, work it in a sheet, bring it back.</p></div>' +
      '<div class="right"><button class="btn alt" data-act="exportSheet">Export CSV</button></div></div>';

    h += '<div class="scroller"><table class="tbl"><thead><tr>' +
      SHEET_COLS.map(function (k) { return '<th>' + esc(k.replace(/_/g, ' ')) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + r.map(function (x) {
        return '<tr>' + SHEET_COLS.map(function (k) {
          var num = ['value', 'invoiced', 'paid', 'owed'].indexOf(k) >= 0;
          return '<td' + (num ? ' class="num"' : (k === 'scope' ? ' class="scopecell"' : '')) + '>' +
            esc(num ? ZS.money(x[k]) : x[k]) + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
    return h;
  };

  Object.assign(A, {
    exportSheet: function () {
      if (!G.acc().exportData) return G.toast('Exporting is switched off for your role.', true);
      var blob = new Blob([csv()], { type: 'text/csv' });
      var el2 = document.createElement('a');
      el2.href = URL.createObjectURL(blob);
      el2.download = 'zippyscale-engagements-' + ZS.today() + '.csv';
      el2.click();
      G.toast('Exported ' + rows().length + ' engagements.');
    }
  });

})();
