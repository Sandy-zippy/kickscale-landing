/* Clients, the enquiry floor, and the channel inbox.
   One client record, keyed on the mobile number, however they arrive. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS;
  var esc = function (s) { return ZS.esc(s); };

  var CQ = '', CF = '', TAB = 'wants', PICK = '';

  function D() { return G.D(); }
  var PENDING_PICK = null;
  var SCANNED = null;      /* what the last document read produced */
  function mine(list) {
    var me = G.me();
    return list.filter(function (c) { return ZS.inScope(c, me, D().access); });
  }
  function mob(c) { return ZS.maskMobile(c.mobile, G.me(), D().access); }
  function staffName(id) { var u = ZS.staffById(id); return u ? u.name : 'Unassigned'; }

  var CHANNELS = {
    whatsapp: ['WhatsApp', 'ok'], instagram: ['Instagram', 'em'],
    google: ['Google', 'info'], meta: ['Meta ad', 'info'],
    walkin: ['Enquiry', 'dim'], website: ['Website', 'dim'], referral: ['Referral', 'dim']
  };

  /* ---------------- clients ---------------- */

  V.clients = function () {
    var all = mine(D().clients), a = G.acc();
    var inWin = all.filter(function (c) { return G.inRange(c.last_touch); });
    var list = inWin.filter(function (c) {
      if (CF && ZS.clientTier(c, D().opportunities)[0] !== CF) return false;
      if (CQ) {
        var hay = [c.name, c.mobile, c.source, c.stage].join(' ').toLowerCase();
        if (hay.indexOf(CQ) < 0) return false;
      }
      return true;
    });

    var h = '<div class="ph"><div><h1>Clients</h1><p>' + all.length +
      (a.scope === 'own' ? ' assigned to you' : ' on the books') +
      ' &middot; ' + D().clients.length + ' in total</p></div>' +
      '<div class="right"><a class="btn" href="#/clientnew">+ Add a client</a></div></div>';

    if (a.scope === 'own') h += '<div class="note">You are seeing only your own clients. ' +
      'The owner sets that in Settings &rarr; Roles &amp; access.</div>';

    h += G.rangeBar(inWin.length + ' of ' + all.length + ' touched in this window');

    h += '<div class="chips" style="margin-bottom:14px">' +
      '<input id="cq" type="search" placeholder="Search name or number&hellip;" value="' + esc(CQ) + '" ' +
      'style="background:var(--coal);border:1px solid var(--line);padding:8px 12px;min-width:200px" autocomplete="off">' +
      '<button class="chip" data-act="clientStage" data-id="" aria-pressed="' + (CF ? 'false' : 'true') + '">All</button>' +
      ['Active', 'Client', 'Returning', 'Key account', 'Prospect'].map(function (t) {
        var n = inWin.filter(function (c) { return ZS.clientTier(c, D().opportunities)[0] === t; }).length;
        if (!n) return '';
        return '<button class="chip" data-act="clientStage" data-id="' + esc(t) + '" aria-pressed="' +
          (CF === t ? 'true' : 'false') + '">' + esc(t) + '<i>' + n + '</i></button>';
      }).join('') + '</div>';

    h += '<div class="scroller"><table class="tbl"><thead><tr>' +
      '<th>Client</th><th>Mobile</th><th>Standing</th><th>Open now</th><th>Bought</th>' +
      '<th>Came from</th><th>Saved</th><th>Owner</th><th>Last touch</th></tr></thead><tbody>' +
      (list.length ? list.map(function (c) {
        var ch = CHANNELS[c.source] || ['—', 'dim'];
        var tier = ZS.clientTier(c, D().opportunities);
        var open = ZS.openOppsFor(D().opportunities, c.id);
        return '<tr data-act="openClient" data-id="' + esc(c.id) + '">' +
          '<td><b>' + esc(c.name) + '</b></td>' +
          '<td>' + esc(mob(c)) + '</td>' +
          '<td><span class="pill ' + tier[1] + '">' + tier[0] + '</span></td>' +
          '<td>' + (open.length
            ? open.map(function (o) { return '<span class="pill info">' + esc(o.stage) + '</span>'; }).join(' ')
            : '<span style="color:var(--dim)">—</span>') + '</td>' +
          '<td class="num">' + (c.purchased || []).length + '</td>' +
          '<td><span class="pill ' + ch[1] + '">' + ch[0] + '</span></td>' +
          '<td class="num">' + (c.shown || []).length + '</td>' +
          '<td>' + esc(staffName(c.assigned_to)) + '</td>' +
          '<td>' + esc(c.last_touch) + '</td></tr>';
      }).join('') : '<tr><td colspan="9" class="empty">Nobody matches.</td></tr>') +
      '</tbody></table></div>';
    return h;
  };

  /* ---------------- client 360 ---------------- */

  V.client = function (id) {
    var c = G.clientById(id);
    if (!c) return G.deny('No such client', 'That record is not on the books.');
    if (!ZS.canOpen(c, G.me(), D().access))
      return G.deny('Not in your view',
        'This client belongs to ' + staffName(c.assigned_to) + '. What each role can see is set by the owner in Settings.');

    var products = G.products();
    var byId = {}; products.forEach(function (x) { byId[x.id] = x; });
    var value = ZS.clientValue(c, D().opportunities);

    var tier = ZS.clientTier(c, D().opportunities);
    var open = ZS.openOppsFor(D().opportunities, c.id);
    var h = '<div class="ph"><div><h1>' + esc(c.name) +
      (c.ref ? ' <span class="refchip">' + esc(c.ref) + '</span>' : '') + '</h1>' +
      '<p>' + esc(mob(c)) + ' &middot; ' + esc((CHANNELS[c.source] || ['—'])[0]) +
      ' &middot; ' + esc(tier[0]) + ' &middot; with ' + esc(staffName(c.assigned_to)) +
      ' &middot; ' + esc(ZS.lineName(c.product)) + '</p></div>' +
      '<div class="right">' +
      (D().access[G.me().role].seeMobile
        ? '<a class="btn ok" href="https://wa.me/91' + esc(c.mobile) + '" target="_blank" rel="noopener">WhatsApp</a>' +
          '<a class="btn alt" href="tel:' + esc(c.mobile) + '">Call</a>' : '') +
      '<button class="btn alt" data-act="assignClient" data-id="' + esc(c.id) + '">Assign</button>' +
      '<a class="btn" href="#/oppnew/' + esc(c.id) + '">+ New opportunity</a>' +
      /* Offered at all only because there is a bin behind it. Deleting a company
         takes its engagements, contacts and documents with it, and doing that
         with no way back was not a button worth having. */
      (ZS.canDelete(G.me())
        ? '<button class="btn danger" data-act="askDeleteClient" data-id="' + esc(c.id) + '">Delete</button>'
        : '') +
      '</div></div>';

    h += '<div class="kpis" style="margin-bottom:20px">' +
      kpi(open.length, 'Open opportunities') +
      kpi((c.purchased || []).length, 'Builds delivered') +
      kpi(G.acc().cost ? ZS.money((c.purchased || []).reduce(function (a2, p) { return a2 + (p.price || 0); }, 0)) : '₹ ••••', 'Spent with us') +
      kpi(G.acc().cost ? ZS.money(value) : '₹ ••••', 'Live fees') +
      '</div>';

    var tabs = [['opps', 'Engagements'], ['people', 'Contacts'], ['profile', 'Profile'],
                ['papers', 'Documents'], ['money', 'Invoices'], ['timeline', 'Timeline']];
    h += '<div class="tabs">' + tabs.map(function (t) {
      return '<button class="tab ' + (TAB === t[0] ? 'on' : '') + '" data-act="clientTab" data-id="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div>';

    if (TAB === 'opps') {
      var all = ZS.oppsFor(D().opportunities, c.id)
        .sort(function (x, y) { return String(y.created).localeCompare(String(x.created)); });
      h += '<div class="note">One person, many runs at selling to them. Live ones sit on the ' +
        'pipeline; decided ones stay here as history.</div>';
      h += all.length
        ? '<div class="card" style="padding:0">' + all.map(function (o) {
            var isLive = ZS.isOpen(o);
            var carW = o.won_line ? byId[o.won_line] : null;
            return '<div class="pickrow"><div class="t"><b>' + esc(o.title || 'Enquiry') + '</b>' +
              '<span>' + esc(o.created) + (o.closed ? ' → ' + esc(o.closed) : ' &middot; open') +
              ' &middot; ' + esc(staffName(o.assigned_to)) +
              (carW ? ' &middot; ' + esc(carW.make + ' ' + carW.model) : '') +
              (o.won_price ? ' &middot; ' + ZS.money(o.won_price) : '') + '</span></div>' +
              '<span class="pill ' + (o.outcome === 'won' ? 'ok' : o.outcome === 'lost' ? 'bad' : 'info') + '">' +
              esc(o.stage) + '</span>' +
              '<button class="minibtn" data-act="openOpp" data-id="' + esc(o.id) + '">Open</button></div>';
          }).join('') + '</div>'
        : '<div class="card"><p class="m">Nothing opened for them yet. ' +
          'Use <b>+ New opportunity</b> above.</p></div>';
    }





    /* "The client rings up wanting their RC." Every document this person has,
       across every product they have bought, in one place — because hunting through
       three opportunities for one PDF is how it gets lost. */
    if (TAB === 'papers') {
      /* The company's own papers — GST certificate, PAN, an NDA — as many files
         per slot as it takes, because these arrive as photos of photos. */
      if (G.docSection) {
        h += '<div class="card pad" style="margin-bottom:14px">' +
          G.docSection('client', c.id, c.docs || [], G.acc().clients,
            'Held for ' + c.name + ' itself. Anything filed against a build is below.', []) +
          '</div>';
      }
      var papers = [];
      ZS.oppsFor(D().opportunities, c.id).forEach(function (o) {
        ZS.docsOf(o.proc).forEach(function (d) {
          papers.push({ doc: d, opp: o, line: byId[o.won_line] });
        });
      });
      papers.sort(function (a2, b2) { return String(b2.doc.when).localeCompare(String(a2.doc.when)); });

      var pending = ZS.oppsFor(D().opportunities, c.id).filter(ZS.isProcessing);
      if (pending.length) {
        h += '<div class="card" style="border-color:var(--warn);margin-bottom:14px">' +
          '<h3 style="color:var(--warn)">' + pending.length + ' build' +
          (pending.length === 1 ? '' : 's') + ' still in delivery</h3>' +
          pending.map(function (o) {
            var car2 = byId[o.won_line];
            return '<p class="m">' + esc(ZS.productName(o.product)) +
              ' — at <b>' + esc(o.proc.stage) + '</b>, due ' + esc(ZS.procDue(o) || '—') + '. ' +
              '<button class="minibtn" data-act="openOpp" data-id="' + esc(o.id) + '">Open the file</button></p>';
          }).join('') + '</div>';
      }

      /* This roll-up used to offer View and nothing else, so the one screen built
         for "the client rings up wanting their paperwork" was the one screen
         where you could not rename or remove any of it. It carries the same
         three actions as everywhere else, pointed at the owning engagement. */
      h += papers.length
        ? '<div class="card" style="padding:0">' + papers.map(function (x) {
            var did = 'deal|' + x.opp.id + '|' + x.doc.id;
            return '<div class="pickrow"><div class="t">' +
              '<b>' + esc(x.doc.name || ZS.docLabel('deal', x.doc.type)) + '</b>' +
              '<span>' + esc(ZS.docLabel('deal', x.doc.type)) + ' &middot; ' +
                esc(ZS.productName(x.opp && x.opp.product)) +
                ' &middot; ' + esc(x.doc.when) + '</span></div>' +
              (x.doc.data
                ? '<a class="minibtn" href="' + x.doc.data + '" target="_blank" rel="noopener" ' +
                  'download="' + esc(x.doc.name) + '">Open</a>'
                : '<span class="pill dim">' + (x.doc.too_big ? 'too large to keep' : 'not stored') + '</span>') +
              (G.acc().clients
                ? '<button class="minibtn" data-act="editDoc" data-id="' + esc(did) + '">Edit</button>' +
                  '<button class="xbtn" data-act="dropDoc" data-id="' + esc(did) + '" ' +
                  'title="Remove" aria-label="Remove ' + esc(x.doc.name) + '">&times;</button>'
                : '') +
              '<button class="minibtn" data-act="openOpp" data-id="' + esc(x.opp.id) + '">Deal</button>' +
              '</div>';
          }).join('') + '</div>'
        : '<div class="card"><p class="m">Nothing filed against this client yet. ' +
          'Anything uploaded on an engagement shows up here.</p></div>';
    }

    /* Everyone we deal with at this company, in one place. */
    if (TAB === 'people') {
      var list = ZS.contactsOf(c);
      h += list.length
        ? '<div class="card" style="padding:0">' + list.map(function (ct) {
            return '<div class="pickrow"><span class="av">' +
              esc((ct.name || '?').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2)) +
              '</span><div class="t"><b>' + esc(ct.name) +
              (ct.primary ? ' <span class="pill em">main</span>' : '') + '</b>' +
              '<span>' + esc(ct.designation || 'No designation') +
              (ct.mobile ? ' &middot; ' + esc(ZS.maskMobile(ct.mobile, G.me(), D().access)) : '') +
              (ct.email ? ' &middot; ' + esc(ct.email) : '') + '</span></div>' +
              (G.acc().clients
                ? (ct.primary ? '' : '<button class="minibtn" data-act="makePrimary" data-id="' +
                    esc(c.id + '|' + ct.id) + '">Make main</button>') +
                  '<button class="xbtn" data-act="dropContact" data-id="' + esc(c.id + '|' + ct.id) +
                  '" title="Remove" aria-label="Remove ' + esc(ct.name) + '">&times;</button>'
                : '') +
              '</div>';
          }).join('') + '</div>'
        : '<div class="card"><p class="m">Nobody recorded here yet.</p></div>';
      if (G.acc().clients) {
        h += '<div class="invadd"><button class="btn alt" data-act="addContact" data-id="' +
          esc(c.id) + '">+ Add a contact</button>' +
          '<span class="hint">Three or four people at one company is normal. They all live here.</span></div>';
      }
    }

    /* The company itself — where they are, how to find them, how to bill them. */
    if (TAB === 'profile') {
      var a2 = c.address || ZS.newAddress();
      function row(k, v) {
        return '<li><span>' + esc(k) + '</span><b>' + (v || '<span class="dimtxt">not set</span>') + '</b></li>';
      }
      h += '<div class="cols" style="align-items:start"><div class="card pad">' +
        '<h3>The business</h3><ul class="ledger" style="margin-top:12px">' +
        row('They are', esc(ZS.CLIENT_TYPES[c.type] || 'Lead')) +
        row('Sector', esc(c.sector || '')) +
        row('Website', c.website ? '<a href="' + esc(c.website) + '" target="_blank" rel="noopener">' +
            esc(c.website.replace(/^https?:\/\//, '')) + '</a>' : '') +
        row('Instagram', c.instagram ? '<a href="' + esc(c.instagram.indexOf('http') === 0 ? c.instagram :
            'https://instagram.com/' + c.instagram.replace(/^@/, '')) + '" target="_blank" rel="noopener">' +
            esc(c.instagram) + '</a>' : '') +
        row('Came from', esc(ZS.SOURCES[c.source] || c.source || '')) +
        '</ul></div>' +
        '<div class="card pad"><h3>Where they are</h3><ul class="ledger" style="margin-top:12px">' +
        row('Country', esc(a2.country)) + row('State', esc(a2.state)) +
        row('City', esc(a2.city)) + row('Area', esc(a2.area)) +
        row('PIN / postcode', esc(a2.pin)) + row('Street', esc(a2.line1)) +
        '</ul></div></div>';
      h += '<div class="card pad" style="margin-top:12px"><h3>Billing</h3>' +
        '<ul class="ledger" style="margin-top:12px">' +
        row('GST number', esc(c.gst || '')) + row('Tax ID', esc(c.tax_id || '')) +
        '</ul>' +
        (G.acc().clients ? '<div class="invadd" style="margin-top:12px">' +
          '<button class="btn alt" data-act="editClient" data-id="' + esc(c.id) + '">Edit the profile</button></div>' : '') +
        '</div>';
    }

    if (TAB === 'money') {
      var mine = (D().invoices || []).filter(function (i) { return i.client === c.id; });
      var owed = mine.filter(function (i) { return i.state !== 'paid' && i.state !== 'draft'; })
                     .reduce(function (a2, i) { return a2 + i.amount; }, 0);
      h += '<div class="card"><div class="ministats">' +
        '<div><b>' + ZS.money(mine.reduce(function (a2, i) { return a2 + i.amount; }, 0)) + '</b><span>invoiced</span></div>' +
        '<div><b>' + ZS.money(mine.filter(function (i) { return i.state === 'paid'; })
                                 .reduce(function (a2, i) { return a2 + i.amount; }, 0)) + '</b><span>paid</span></div>' +
        '<div><b>' + ZS.money(owed) + '</b><span>outstanding</span></div></div></div>';
      h += mine.length
        ? '<div class="card" style="padding:0;margin-top:12px">' + mine.map(function (i) {
            return '<div class="pickrow"><div class="t"><b>' + esc(i.scope || 'Invoice ' + i.n) + '</b>' +
              '<span>raised ' + esc(i.raised) + ' &middot; due ' + esc(i.due) + '</span></div>' +
              '<span class="invamt">' + ZS.money(i.amount) + '</span>' +
              '<span class="pill ' + (i.state === 'paid' ? 'ok' : ZS.invoiceOverdue(i) ? 'bad' : 'warn') + '">' +
              esc(i.state) + '</span></div>';
          }).join('') + '</div>'
        : '<div class="card" style="margin-top:12px"><p class="m">Nothing invoiced yet.</p></div>';
    }

    if (TAB === 'timeline') {
      var events = [];
      events.push({ at: c.created, t: 'Came in from ' + (CHANNELS[c.source] || ['—'])[0] });
      (c.shown || []).forEach(function (s) {
        var line = byId[s.product_id];
        events.push({ at: s.when, t: (ZS.MARKS[s.mark] || 'Marked') + ' — ' + ZS.productName(s.product_id) });
      });
      (c.purchased || []).forEach(function (p) {
        var line = byId[p.product_id];
        events.push({ at: p.when, t: 'Signed for ' + ZS.productName(p.product_id) + ' at ' + ZS.money(p.price) });
      });
      D().messages.filter(function (m) { return m.client === c.id; }).forEach(function (m) {
        events.push({ at: m.at.slice(0, 10), t: (CHANNELS[m.channel] || ['—'])[0] + ': ' + m.body.slice(0, 90) });
      });
      /* every follow-up, so you can read the whole conversation back */
      D().followups.filter(function (f) { return f.client === c.id; }).forEach(function (f) {
        if (f.done) {
          events.push({ at: f.done_at || f.due, kind: 'follow',
            t: f.method + ' — ' + (f.note || 'no remark') + (f.outcome ? ' (' + f.outcome + ')' : ''),
            risk: ZS.AT_RISK.indexOf(f.outcome) >= 0 });
        } else {
          events.push({ at: f.due, kind: 'due',
            t: 'Follow-up due — ' + (f.note || f.method), risk: ZS.isOverdue(f) });
        }
      });
      ZS.oppsFor(D().opportunities, c.id).forEach(function (o) {
        events.push({ at: o.created, kind: 'opp', t: 'Opportunity opened — ' + (o.title || 'enquiry') });
        if (o.closed) {
          events.push({ at: o.closed, kind: 'opp',
            t: o.outcome === 'won' ? 'Won — ' + (o.title || 'enquiry') +
                 (o.won_price ? ' for ' + ZS.money(o.won_price) : '')
               : 'Lost — ' + (o.lost_reason || 'no reason recorded'),
            risk: o.outcome === 'lost' });
        }
      });
      events.sort(function (x, y) { return String(y.at).localeCompare(String(x.at)); });
      h += '<div class="card" style="padding:0">' + events.map(function (e) {
        var sev = e.risk ? 'bad' : e.kind === 'follow' ? 'warn' : 'info';
        return '<div class="finding"><span class="sev ' + sev + '"></span><div><h4>' + esc(e.at) +
          (e.kind === 'follow' ? ' <span class="pill dim">follow-up</span>' :
           e.kind === 'due' ? ' <span class="pill warn">due</span>' :
           e.kind === 'opp' ? ' <span class="pill info">opportunity</span>' : '') +
          '</h4><p>' + esc(e.t) + '</p></div></div>';
      }).join('') + '</div>';
    }
    return h;
  };

  function kpi(v, l) { return '<div class="kpi"><b>' + v + '</b><span>' + l + '</span></div>'; }
  function li(k, v) { return '<li><span>' + k + '</span><b>' + esc(v) + '</b></li>'; }

  function pickRow(line, client, addable, mark) {
    var prod = ZS.productById(line.id);
    var h = '<div class="pickrow">' +
      '<div class="t"><b>' + esc(line.model || line.title) + '</b>' +
      '<span>from ' + ZS.money(prod ? prod.from : line.price) + '</span></div>';
    if (addable) {
      h += '<button class="minibtn" data-act="wishFor" data-id="' + esc(client.id + '|' + line.id) + '">Mark interested</button>';
    } else {
      h += '<div class="marks">' + Object.keys(ZS.MARKS).map(function (m) {
        return '<button class="mk" data-m="' + m + '" aria-pressed="' + (mark === m ? 'true' : 'false') +
          '" data-act="markFor" data-id="' + esc(client.id + '|' + line.id + '|' + m) + '">' +
          esc(ZS.MARKS[m]) + '</button>';
      }).join('') + '</div>';
    }
    return h + '</div>';
  }

  /* ---------------- add a client ---------------- */

  /* ================= SHARED FIELD BUILDERS =================

     A field type is decided once and used everywhere it appears. A mobile is
     always a dial code plus digits; a designation is always the sector-filtered
     dropdown with an add. Building them inline in each form is exactly how the
     contact modal ended up with a plain text box and no country code while the
     client form had the dropdown. `check_fields.js` fails the build if a form
     renders one of these by hand. */

  function mobileField(idBase, name, dial, digits, label) {
    return '<div class="f"><label for="' + idBase + '">' + esc(label || 'Mobile') + '</label>' +
      '<div class="phonewrap">' +
      '<select id="' + idBase + '-dial" name="' + name + '_dial" aria-label="Country code">' +
        ZS.DIAL_CODES.map(function (d) {
          return '<option value="' + d[0] + '"' + (d[0] === (dial || ZS.DEFAULT_DIAL) ? ' selected' : '') +
            '>' + esc(d[0] + ' ' + d[1]) + '</option>';
        }).join('') + '</select>' +
      '<input id="' + idBase + '" name="' + name + '" inputmode="numeric" autocomplete="off" ' +
      'value="' + esc(digits || '') + '" placeholder="number only"></div></div>';
  }

  function designationField(idBase, name, value, sector) {
    var opts = ZS.designationsFor(D(), sector || '');
    return '<div class="f"><label for="' + idBase + '">Designation</label>' +
      '<div class="pickwrap"><select id="' + idBase + '" name="' + name + '" data-desig="1">' +
        '<option value="">Not set</option>' +
        opts.map(function (dg) {
          return '<option value="' + esc(dg) + '"' + (dg === value ? ' selected' : '') + '>' +
            esc(dg) + '</option>';
        }).join('') +
      '</select>' +
      '<button type="button" class="minibtn" data-act="addPick" data-id="designations|' + idBase + '" ' +
      'title="Add one that is not on the list">+</button></div></div>';
  }

  G.mobileField = mobileField;
  G.designationField = designationField;

  /* Source, and — when it is a paid one — which campaign. "Meta ad" alone
     cannot tell you which ad paid for itself. */
  function sourceField(id, name, value, label) {
    var camps = D().campaigns || [];
    return '<div class="f"><label for="' + id + '">' + esc(label || 'Source') + '</label>' +
      '<select id="' + id + '" name="' + name + '" data-source="1">' +
        Object.keys(ZS.SOURCES).map(function (k) {
          return '<option value="' + k + '"' + (k === value ? ' selected' : '') + '>' +
            esc(ZS.SOURCES[k]) + '</option>';
        }).join('') + '</select></div>' +
      '<div class="f" id="' + id + '-camp"' + (ZS.isPaid(value) ? '' : ' hidden') + '>' +
        '<label for="' + id + '-c">Campaign</label>' +
        '<div class="pickwrap"><select id="' + id + '-c" name="campaign">' +
          '<option value="">Not set</option>' +
          camps.map(function (c) {
            return '<option value="' + esc(c.id) + '" data-plat="' + esc(c.platform) + '">' +
              esc(c.name) + '</option>';
          }).join('') + '</select>' +
          '<a class="minibtn" href="#/campaigns" title="Manage campaigns">&#9881;</a></div>' +
        (camps.length ? '' : '<p class="hint">No campaigns yet — add them under Campaigns.</p>') +
      '</div>';
  }
  G.sourceField = sourceField;

  /* A picklist you can add to without leaving the form. */
  function pick(id, name, key, value, label) {
    var opts = ZS.picklist(D(), key);
    return '<div class="f"><label for="' + id + '">' + esc(label) + '</label>' +
      '<div class="pickwrap">' +
      '<select id="' + id + '" name="' + name + '">' +
        '<option value="">Not set</option>' +
        opts.map(function (o) {
          return '<option value="' + esc(o) + '"' + (o === value ? ' selected' : '') + '>' + esc(o) + '</option>';
        }).join('') +
      '</select>' +
      '<button type="button" class="minibtn" data-act="addPick" data-id="' + esc(key + '|' + id) + '" ' +
      'title="Add one that is not on the list">+</button></div></div>';
  }

  /* Re-rendering rebuilds the <select>, so the value just added has to be put
     back into it — otherwise adding a sector silently clears the field. */
  /* Fill what was read, without stamping on anything already typed. */
  function applyScan() {
    if (!SCANNED) return;
    var map = { gst: 'cl-gst', pan: 'cl-pan', ifsc: 'cl-bifsc', bank_account: 'cl-bacc',
                pin: 'cl-pin', email: 'cl-email', website: 'cl-web', instagram: 'cl-insta' };
    var filled = [];
    Object.keys(SCANNED.fields).forEach(function (k) {
      var el2 = document.getElementById(map[k]);
      if (!el2 || String(el2.value || '').trim()) return;     /* never overwrite */
      el2.value = SCANNED.fields[k];
      filled.push(k);
    });
    var note = document.getElementById('scan-note');
    if (note) {
      note.textContent = filled.length
        ? 'Filled ' + filled.join(', ') + '.' +
          (SCANNED.notes.length > 1 ? ' ' + SCANNED.notes.slice(1).join(' ') : '')
        : SCANNED.notes.join(' ');
    }
    SCANNED = null;
  }

  function renderPendingDocs() {
    var box = document.getElementById('scan-files-list');
    if (!box) return;
    box.innerHTML = PENDING_DOCS.map(function (d, i) {
      return '<div class="dfile">' +
        (d.data ? '<span class="dthumb"><img src="' + d.data + '" alt=""></span>'
                : '<span class="dthumb doc">&#9744;</span>') +
        '<span class="dmeta"><b>' + esc(d.name) + '</b><i>' + esc(G.fileSize(d.size)) + '</i></span>' +
        '<button type="button" class="xbtn" data-act="dropPendingDoc" data-id="' + i + '" ' +
        'aria-label="Remove ' + esc(d.name) + '">&times;</button></div>';
    }).join('');
  }

  function applyPendingPick() {
    if (!PENDING_PICK) return;
    var el = document.getElementById(PENDING_PICK.field);
    if (el) el.value = PENDING_PICK.value;
    PENDING_PICK = null;
  }

  /* ⚠️ "Edit client" used to go to #/clientnew?edit=<id>, and this view took no
     argument and ignored the query string entirely. So Edit opened a BLANK "Add
     a client" form, and saving it created a second record for a company you
     already had rather than changing the one you meant. Silent, and the kind of
     thing you only notice weeks later with two EGO Premiums on the list. */
  V.clientnew = function (arg) {
    if (!G.acc().clients) return G.deny('Not in your view', 'Client records are switched off for your role.');
    var ed = arg ? G.clientById(String(arg).replace(/^edit\//, '')) : null;
    if (arg && !ed) return G.deny('No such client', 'Nothing by that id.');
    var v = function (x) { return ed ? esc(x == null ? '' : x) : ''; };
    var addr = (ed && ed.address) || {};
    var bank = (ed && ed.bank) || {};
    var ct = ed ? ZS.primaryContact(ed) : null;

    var h = '<div class="ph"><div><h1>' + (ed ? 'Edit ' + esc(ed.name) : 'Add a client') + '</h1>' +
      '<p>' + (ed
        ? 'Changing the record itself. Contacts are on the client page, under Contacts.'
        : 'A client is a <b>company</b>. The people you deal with there are contacts on it &mdash; ' +
          'add as many as you need, so one business never becomes three records.') + '</p></div>' +
      '<div class="right"><a class="btn alt" href="#/client' + (ed ? 's' : 's') + '">Cancel</a></div></div>';

    /* Read it in rather than typing it out. Only on a new one: on an edit the
       values are already there and a scan would fight with them. */
    h += ed ? '' : '<div class="card pad scanbox" style="margin-bottom:14px">' +
      '<div class="cardhead"><h3>Start from their paperwork</h3>' +
      '<span class="hint">GST certificate, letterhead, a cancelled cheque</span></div>' +
      '<p class="m">Drop the files in and anything recognisable &mdash; GSTIN, PAN, IFSC, account ' +
      'number, PIN, email, website, Instagram &mdash; fills the form below. Every number is ' +
      'checked before it is used, so a wrong one is left blank rather than filled in wrong.</p>' +
      '<div class="scanrow">' +
        '<label class="btn alt">Upload documents' +
          '<input type="file" id="scan-files" multiple hidden ' +
          'accept="image/*,.pdf,.txt,.csv,.doc,.docx"></label>' +
        '<button type="button" class="btn alt" data-act="pasteScan">Paste the text instead</button>' +
        '<span class="hint" id="scan-note">Nothing read yet.</span>' +
      '</div>' +
      '<div id="scan-files-list" class="dfiles"></div>' +
      '</div>';

    h += '<form id="clientform"' + (ed ? ' data-edit="' + esc(ed.id) + '"' : '') + '><div class="fgroup"><h4>The client</h4><div class="fbody">' +
      '<div class="f"><label for="cl-name">Company name</label>' +
      '<input id="cl-name" name="name" required autocomplete="off" value="' + v(ed && ed.name) + '"></div>' +
      '<div class="f"><label for="cl-type">They are</label><select id="cl-type" name="type">' +
        Object.keys(ZS.CLIENT_TYPES).map(function (k) {
          return '<option value="' + k + '"' + (ed && ed.type === k ? ' selected' : '') + '>' +
            esc(ZS.CLIENT_TYPES[k]) + '</option>';
        }).join('') + '</select></div>' +
      pick('cl-sector', 'sector', 'sectors', (ed && ed.sector) || '', 'Sector') +
      sourceField('cl-src', 'source', (ed && ed.source) || 'referral', 'Source') +
      '<div class="f"><label for="cl-own">Owner</label><select id="cl-own" name="assigned_to">' +
        '<option value="">Unassigned</option>' +
        ZS.staffList().map(function (u) {
          return '<option value="' + u.id + '"' + (ed && ed.assigned_to === u.id ? ' selected' : '') +
            '>' + esc(u.name) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="f"><label for="cl-line">Line</label><select id="cl-line" name="product">' +
        ZS.PRODUCTS.map(function (b) {
          return '<option value="' + esc(b.id) + '"' + (ed && ed.product === b.id ? ' selected' : '') +
            '>' + esc(b.name) + '</option>'; }).join('') +
      '</select></div>' +
      '</div></div>';

    h += '<div class="fgroup"><h4>Who we deal with <em>&mdash; add the rest on their profile</em></h4><div class="fbody">' +
      '<div class="f"><label for="cl-cname">Name</label><input id="cl-cname" name="contact_name" autocomplete="off" value="' + v(ct && ct.name) + '"></div>' +
      designationField('cl-desig', 'designation', (ct && ct.designation) || '', (ed && ed.sector) || '') +
      mobileField('cl-mob', 'mobile', (ed && ed.dial) || ZS.DEFAULT_DIAL, (ed && ed.mobile) || '') +
      '<div class="f"><label for="cl-email">Email</label><input id="cl-email" name="email" type="email" autocomplete="off" value="' + v(ed && ed.email) + '"></div>' +
      '</div></div>';

    h += '<div class="fgroup"><h4>Where they are</h4><div class="fbody">' +
      pick('cl-country', 'country', 'countries', addr.country || 'India', 'Country') +
      '<div class="f"><label for="cl-state">State / province</label><input id="cl-state" name="state" autocomplete="off" value="' + v(addr.state) + '"></div>' +
      '<div class="f"><label for="cl-city">City</label><input id="cl-city" name="city" autocomplete="off" value="' + v(addr.city) + '"></div>' +
      '<div class="f"><label for="cl-area">Area</label><input id="cl-area" name="area" autocomplete="off" value="' + v(addr.area) + '"></div>' +
      '<div class="f"><label for="cl-pin">PIN / postcode</label><input id="cl-pin" name="pin" autocomplete="off" value="' + v(addr.pin) + '"></div>' +
      '<div class="f wide"><label for="cl-line1">Street address</label><input id="cl-line1" name="line1" autocomplete="off" value="' + v(addr.line1) + '"></div>' +
      '</div></div>';

    h += '<div class="fgroup"><h4>Online</h4><div class="fbody">' +
      '<div class="f"><label for="cl-web">Website</label>' +
      '<input id="cl-web" name="website" type="url" placeholder="https://" autocomplete="off" value="' + v(ed && ed.website) + '"></div>' +
      '<div class="f"><label for="cl-insta">Instagram</label>' +
      '<input id="cl-insta" name="instagram" placeholder="@handle or a link" autocomplete="off" value="' + v(ed && ed.instagram) + '"></div>' +
      '</div></div>';

    h += '<div class="fgroup"><h4>Billing &mdash; so an invoice never waits</h4><div class="fbody">' +
      '<div class="f"><label for="cl-gst">GST number</label><input id="cl-gst" name="gst" autocomplete="off" value="' + v(ed && ed.gst) + '"></div>' +
      '<div class="f"><label for="cl-tax">Tax ID <em>&mdash; outside India</em></label>' +
      '<input id="cl-tax" name="tax_id" autocomplete="off" value="' + v(ed && ed.tax_id) + '"></div>' +
      '<div class="f"><label for="cl-bholder">Account name</label>' +
      '<input id="cl-bholder" name="bank_holder" autocomplete="off" value="' + v(bank.holder) + '"></div>' +
      '<div class="f"><label for="cl-bacc">Account number</label>' +
      '<input id="cl-bacc" name="bank_account" autocomplete="off" value="' + v(bank.account) + '"></div>' +
      '<div class="f"><label for="cl-bifsc">IFSC</label>' +
      '<input id="cl-bifsc" name="bank_ifsc" autocomplete="off" value="' + v(bank.ifsc) + '"></div>' +
      '<div class="f"><label for="cl-bswift">SWIFT / IBAN <em>&mdash; outside India</em></label>' +
      '<input id="cl-bswift" name="bank_swift" autocomplete="off" value="' + v(bank.swift) + '"></div>' +
      '<div class="f"><label for="cl-bname">Bank</label>' +
      '<input id="cl-bname" name="bank_name" autocomplete="off" value="' + v(bank.name) + '"></div>' +
      '<div class="f"><label for="cl-bbranch">Branch</label>' +
      '<input id="cl-bbranch" name="bank_branch" autocomplete="off" value="' + v(bank.branch) + '"></div>' +
      '<p class="hint wide">Theirs, for refunds and for a record. Ours goes on the invoice.</p>' +
      '</div></div>';

    h += '<p class="err" id="cl-err"></p><button class="btn" type="submit">Add the client</button></form>';
    setTimeout(function () { applyPendingPick(); applyScan(); renderPendingDocs(); }, 0);
    return h;
  };

  /* The inbox moved to inbox.js, and became conversations rather than cards.
     The old screen here drew one card per message with an Approve button and a
     "what this enquiry is asking for" panel full of budgets, bodies and makes —
     car-dealer vocabulary that outlived the car dealer. A fourth message from a
     client appeared as a fourth stranger, and there was no way to reply at all. */

  /* ---------------- actions ---------------- */

  Object.assign(A, {
    /* An image needs OCR, which needs a library we do not ship or a server we
       do not have. Rather than a button that half-works, the paste box is the
       path that works today — and it is one copy from any PDF viewer. */
    dropPendingDoc: function (i) {
      PENDING_DOCS.splice(Number(i), 1);
      renderPendingDocs();
    },
    pasteScan: function () {
      G.modal('Paste the text', 'From a PDF, an email, their letterhead — anything.',
        '<form id="scanform">' +
        '<div class="f"><label for="sc-text">Text</label>' +
        '<textarea id="sc-text" name="text" rows="9" ' +
        'placeholder="Select the text in the document, copy, paste here."></textarea></div>' +
        '<p class="hint" style="margin-top:8px">GSTIN, PAN, IFSC, account number, PIN code, ' +
        'email, website and Instagram are recognised.</p>' +
        '<p class="err" id="sc-err"></p>' +
        '<div style="display:flex;gap:10px;margin-top:14px">' +
        '<button class="btn" type="submit">Read it</button>' +
        '<button class="btn alt" type="button" data-act="closeModal">Cancel</button></div></form>');
    },
    addContact: function (clientId) {
      var c = G.clientById(clientId);
      if (!c || !G.acc().clients) return;
      G.modal('Add a contact', c.name,
        '<form id="contactform" data-cid="' + esc(c.id) + '">' +
        '<div class="f" style="margin-bottom:10px"><label for="ct-name">Name</label>' +
        '<input id="ct-name" name="name" required autocomplete="off"></div>' +
        designationField('ct-desig', 'designation', '', c.sector) +
        mobileField('ct-mob', 'mobile', ZS.DEFAULT_DIAL, '') +
        '<div class="f"><label for="ct-email">Email</label>' +
        '<input id="ct-email" name="email" type="email" autocomplete="off"></div>' +
        '<p class="err" id="ct-err"></p>' +
        '<div style="display:flex;gap:10px;margin-top:14px">' +
        '<button class="btn" type="submit">Add them</button>' +
        '<button class="btn alt" type="button" data-act="closeModal">Cancel</button></div></form>');
    },
    dropContact: function (arg) {
      var p = String(arg).split('|'), c = G.clientById(p[0]);
      if (!c || !G.acc().clients) return;
      var ct = ZS.contactsOf(c).filter(function (x) { return x.id === p[1]; })[0];
      ZS.dropContact(c, p[1]);
      G.log('client_edit', (ct ? ct.name : 'A contact') + ' removed from ' + c.name, { client: c.id });
      G.save(); G.toast('Removed.'); G.render();
    },
    makePrimary: function (arg) {
      var p = String(arg).split('|'), c = G.clientById(p[0]);
      if (!c || !G.acc().clients) return;
      ZS.makePrimary(c, p[1]);
      var ct = ZS.primaryContact(c);
      G.log('client_edit', (ct ? ct.name : 'Somebody') + ' is now the main contact at ' + c.name, { client: c.id });
      G.save(); G.toast('Main contact changed.'); G.render();
    },
    editClient: function (id) { G.go('#/clientnew/edit/' + id); },
    /* "It is not on the list" is the most common reason a dropdown gets
       abandoned, so the list grows from here and remembers. */
    addPick: function (arg) {
      var p = String(arg).split('|'), key = p[0], fieldId = p[1];
      var what = key === 'countries' ? 'country' : 'sector';
      G.modal('Add a ' + what, 'It will be on the list from now on.',
        '<form id="pickform" data-key="' + esc(key) + '" data-field="' + esc(fieldId) + '">' +
        '<div class="f"><label for="pk-v">New ' + what + '</label>' +
        '<input id="pk-v" name="value" required autocomplete="off"></div>' +
        '<p class="err" id="pk-err"></p>' +
        '<div style="display:flex;gap:10px;margin-top:14px">' +
        '<button class="btn" type="submit">Add it</button>' +
        '<button class="btn alt" type="button" data-act="closeModal">Cancel</button></div></form>');
    },
    clientStage: function (s) { CF = s || ''; G.render(); },
    clientTab: function (t) { TAB = t; G.render(); },

    /* "Save for them" was a wishlist button. There is no wishlist: the only
       thing worth recording is where they stand on the line. */
    wishFor: function (arg) {
      var p = arg.split('|'), c = G.clientById(p[0]);
      if (!c) return;
      var r = ZS.addMark(c, p[1], 'interested', G.D().session);
      if (r.error) return G.toast(r.error, true);
      G.log('mark_add', c.name + ' marked interested in ' + ZS.productName(p[1]),
            { client: c.id, line: p[1] });
      G.save(); G.toast('Marked interested.'); G.render();
    },
    markFor: function (arg) {
      var p = arg.split('|'), c = G.clientById(p[0]);
      if (!c) return;
      var cur = ZS.markOf(c, p[1]);
      ZS.addMark(c, p[1], cur === p[2] ? 'interested' : p[2], G.D().session);
      G.save(); G.render();
    },
    /* An agency sells one product against a written scope, so there is nothing
       to browse. Scope is typed on the engagement, not picked off a shelf. */
    pickForClient: function (id) {
      var c = G.clientById(id);
      G.modal('Open an engagement', c ? c.name : '',
        '<p class="m">Every build is scoped on its own — there is nothing to pick from a list. ' +
        'Open an engagement and write the scope there.</p>' +
        '<p style="margin-top:14px"><a class="btn" href="#/oppnew/' + esc(id) + '" ' +
        'data-act="closeModal">Open an engagement</a></p>');
    },
    /* ---- deleting a company, and everything inside it ----

       Half a company left behind is worse than none: an engagement whose client
       has gone is an orphan every screen has to guard against, and one of them
       always forgets. So it all goes together, into the bin, and it all comes
       back together. */
    askDeleteClient: function (id) {
      var c = G.clientById(id);
      if (!c) return;
      if (!ZS.canDelete(G.me())) return G.toast('Only the owner can delete a client.', true);

      var blockers = ZS.clientBlockers(D(), c);
      if (blockers.length) {
        G.modal('Cannot delete this client', c.name,
          '<p class="m">There is a record here that should not just vanish:</p>' +
          '<ul class="ledger" style="margin-top:12px">' +
          blockers.map(function (b) { return '<li><span>·</span><b>' + esc(b) + '</b></li>'; }).join('') +
          '</ul><p class="m" style="margin-top:14px">Mark the engagement <b>Lost</b> instead, ' +
          'or set the client to <b>Past client</b>. Both keep what happened.</p>' +
          '<div style="margin-top:16px"><button class="btn alt" type="button" data-act="closeModal">Close</button></div>');
        return;
      }

      var cost = ZS.clientCost(D(), c);
      var lines = Object.keys(cost).filter(function (k) { return cost[k]; })
        .map(function (k) { return cost[k] + ' ' + k + (cost[k] === 1 ? '' : 's'); });

      G.modal('Delete this client?', c.name,
        '<p class="m">Everything below goes with them, into the bin.</p>' +
        (lines.length
          ? '<ul class="ledger" style="margin-top:12px">' + lines.map(function (l) {
              return '<li><span>·</span><b>' + esc(l) + '</b></li>'; }).join('') + '</ul>'
          : '<p class="hint" style="margin-top:8px">There is nothing else on them.</p>') +
        '<p class="m" style="margin-top:12px">It is kept for <b>' + ZS.BIN_DAYS +
        ' days</b> in the Bin and can be put back whole. After that it is gone.</p>' +
        '<form id="delclientform" data-id="' + esc(c.id) + '">' +
        '<div class="f" style="margin-top:10px"><label for="dc-confirm">Type DELETE</label>' +
        '<input id="dc-confirm" name="confirm" autocomplete="off" autocapitalize="characters" ' +
        'spellcheck="false" placeholder="DELETE"></div>' +
        '<p class="err" id="dc-err"></p>' +
        '<div style="display:flex;gap:10px;margin-top:14px">' +
        '<button class="btn danger" type="submit">Delete it</button>' +
        '<button class="btn alt" type="button" data-act="closeModal">Keep it</button></div></form>');
    },

    assignClient: function (id) {
      var c = G.clientById(id);
      var open = ZS.openOppsFor(D().opportunities, c.id);
      G.modal('Assign ' + c.name, 'Whoever owns this client sees them on their list.',
        (open.length
          ? '<p class="m" style="margin-bottom:12px">Their ' + open.length + ' open deal' +
            (open.length === 1 ? '' : 's') + ' move' + (open.length === 1 ? 's' : '') +
            ' across too, so the client and the work on the floor stay together. ' +
            'Anything already won or lost keeps the name of whoever closed it.</p>'
          : '') +
        ZS.sellers(ZS.staffList())
          .map(function (u) {
            return '<div class="pickrow"><div class="t"><b>' + esc(u.name) + '</b><span>' +
              esc(ZS.ROLES[u.role].label) + '</span></div>' +
              '<button class="minibtn" data-act="doAssign" data-id="' + esc(id + '|' + u.id) + '">Assign</button></div>';
          }).join(''));
    },
    /* Assigning the client has to carry their live work with them.

       It did not, and the effect was silent: the client appeared on the new
       owner's list while the opportunity kept its old owner (usually
       nobody), so it never showed on their floor and nobody was chasing it.
       A CLOSED opportunity is history and keeps the name of whoever actually
       closed it — reassigning those would rewrite who sold what. */
    doAssign: function (arg) {
      var p = arg.split('|'), c = G.clientById(p[0]);
      if (!c) return;
      c.assigned_to = p[1];
      var moved = ZS.openOppsFor(D().opportunities, c.id);
      moved.forEach(function (o) { o.assigned_to = p[1]; o.updated = ZS.today(); });
      G.log('client_assign', c.name + ' assigned to ' + staffName(p[1]) +
            (moved.length ? ' — ' + moved.length + ' open deal' + (moved.length === 1 ? '' : 's') +
             ' moved with them' : ''), { client: c.id });
      G.save();
      document.getElementById('modal').close();
      G.toast('Assigned to ' + staffName(p[1]) +
              (moved.length ? ', with ' + moved.length + ' open deal' + (moved.length === 1 ? '' : 's') + '.' : '.'));
      G.render();
    },

    /* There is no "log an enquiry" any more: an enquiry IS an opportunity, so
       the one path is add/pick the client and open one. */


    approveMsg: function (id) {
      var m = D().messages.filter(function (x) { return x.id === id; })[0];
      if (!m) return;
      var x = m.card.extraction;
      var r = ZS.upsertClient(D().clients, {
        name: m.from, mobile: m.mobile, source: m.channel,
                wants: { bodies: x.bodies || [], fuels: x.fuels || [], makes: x.makes || [] },
        assigned_to: leastBusy()
      });
      if (r.error) return G.toast(r.error, true);
      var c = r.client;
      m.client = c.id;
      (x.lines || []).forEach(function (s) {
        if (G.productById_view(s)) ZS.addMark(c, s, 'interested', G.D().session);
      });
      m.card.status = 'approved';
      /* An enquiry is a new run at selling to them — open one unless they
         already have a live opportunity we should be adding to. */
      var live = ZS.openOppsFor(D().opportunities, c.id)[0];
      if (!live) {
        live = ZS.newOpp({ client: c.id, assigned_to: c.assigned_to, product: c.product,
          source: m.channel, title: ((x.makes || []).join(', ') || 'Enquiry'),
          fee: x.budget ? x.budget[0] : null, fee: x.budget ? x.budget[1] : null,
          wants: { bodies: x.bodies || [], fuels: x.fuels || [], makes: x.makes || [] }, lines: (x.lines || []).filter(function (s2) { return G.productById_view(s2); }) });
        D().opportunities.push(live);
      } else {
        (x.lines || []).forEach(function (s2) {
          if (G.productById_view(s2) && live.lines.indexOf(s2) < 0) live.lines.push(s2);
        });
        live.updated = ZS.today();
      }
      D().followups.unshift(ZS.newFollow({
        opp: live ? live.id : null, client: c.id, owner: c.assigned_to, by: D().session,
        due: ZS.today(), method: m.channel === 'whatsapp' ? 'WhatsApp' : 'Call',
        note: 'Reply to their ' + (CHANNELS[m.channel] || ['—'])[0] + ' enquiry — ' +
              ((x.makes || []).join(', ') || 'general') + ', ' +
              (x.budget ? ZS.money(x.budget[1]) : 'budget unknown') + '.' }));
      G.save();
      G.log('msg_approve', (r.created ? 'Created ' : 'Updated ') + c.name + ' from a ' +
            (CHANNELS[m.channel] || ['—'])[0] + ' enquiry, assigned to ' + staffName(c.assigned_to),
            { client: c.id, opp: live ? live.id : null });
      G.toast((r.created ? 'Client created' : 'Existing client updated') + ' and assigned to ' +
              staffName(c.assigned_to) + '.');
      G.render();
    },
    dismissMsg: function (id) {
      var m = D().messages.filter(function (x) { return x.id === id; })[0];
      if (m) { m.card.status = 'dismissed';
        G.log('msg_dismiss', 'Dismissed a ' + (CHANNELS[m.channel] || ['—'])[0] + ' enquiry from ' + m.from);
        G.save(); G.render(); }
    }
  });

  function leastBusy() {
    var staff = ZS.sellers(ZS.staffList());
    var counts = staff.map(function (u) {
      return [u.id, D().clients.filter(function (c) { return c.assigned_to === u.id; }).length];
    }).sort(function (a, b) { return a[1] - b[1]; });
    return counts.length ? counts[0][0] : null;
  }

  /* ---------------- form and input plumbing ---------------- */

  /* One place that writes an edited client, so the form and the record cannot
     drift the way they did when Edit simply opened a blank Add form. */
  function saveClientEdit(c, d) {
    var name = String(d.get('name') || '').trim();
    if (!name) { document.getElementById('cl-err').textContent = 'A company needs a name.'; return; }

    var before = c.name;
    c.name = name;
    c.type = d.get('type') || c.type;
    c.sector = d.get('sector') || '';
    c.source = d.get('source') || c.source;
    c.assigned_to = d.get('assigned_to') || null;
    c.product = d.get('product') || c.product;
    c.website = d.get('website') || '';
    c.instagram = d.get('instagram') || '';
    c.gst = d.get('gst') || '';
    c.tax_id = d.get('tax_id') || '';
    c.mobile = ZS.normMobile(d.get('mobile') || '') || c.mobile;
    c.dial = d.get('mobile_dial') || c.dial;
    c.email = d.get('email') || '';
    c.bank = { holder: d.get('bank_holder') || '', account: d.get('bank_account') || '',
               ifsc: d.get('bank_ifsc') || '', swift: d.get('bank_swift') || '',
               name: d.get('bank_name') || '', branch: d.get('bank_branch') || '' };
    c.address = ZS.newAddress({ line1: d.get('line1') || '', area: d.get('area') || '',
                                city: d.get('city') || '', state: d.get('state') || '',
                                country: d.get('country') || '', pin: d.get('pin') || '' });

    /* the primary contact is on this form too, so it has to be written back */
    var cn = String(d.get('contact_name') || '').trim();
    if (cn) {
      var ct = ZS.primaryContact(c);
      if (ct) {
        ct.name = cn;
        ct.designation = d.get('designation') || ct.designation;
        ct.mobile = c.mobile; ct.email = c.email;
      } else {
        ZS.addContact(c, { name: cn, designation: d.get('designation') || '',
                           mobile: c.mobile, email: c.email, primary: true });
      }
    }
    c.last_touch = ZS.today();
    G.log('client_edit', (before !== c.name ? before + ' renamed to ' + c.name : c.name + ' edited'),
          { client: c.id });
    G.save();
    G.toast('Saved.');
    G.go('#/client/' + c.id);
  }

  var prevChange = A.onChange, prevSubmit = A.onSubmit;

  A.onChange = function (e) {
    if (prevChange) prevChange(e);
    if (e.target.id === 'cq') { CQ = e.target.value.toLowerCase().trim(); G.render(); }
  };

  /* Two fields that answer to another: the campaign box only matters for a paid
     source, and the designations depend on the sector. Both are re-derived here
     rather than on a re-render, so the rest of the form keeps what was typed. */
  /* Files dropped on the client form: read whatever we can, keep the rest, and
     attach every one of them to the client the moment it is saved. */
  var PENDING_DOCS = [];

  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'scan-files') {
      var files = Array.prototype.slice.call(e.target.files || []);
      if (!files.length) return;
      var note = document.getElementById('scan-note');
      if (note) note.textContent = 'Reading ' + files.length + ' file' + (files.length === 1 ? '' : 's') + '…';
      var left = files.length, text = '';
      files.forEach(function (f) {
        /* same as the engagement's scan box: read first, name properly when
           filing it out of Dropped in. A tidied name beats the camera's. */
        G.takeDoc(f, 'client', 'scan', function (doc) {
          if (G.tidyDocName) doc.name = G.tidyDocName(doc.name);
          PENDING_DOCS.push(doc);
        });
        if (/^text\/|\.(txt|csv)$/i.test(f.type + f.name)) {
          var r = new FileReader();
          r.onload = function () { text += '\n' + r.result; done(); };
          r.onerror = done;
          r.readAsText(f);
        } else { done(); }
        function done() {
          left--;
          if (left > 0) return;
          var res = ZS.readDocument(text);
          if (Object.keys(res.fields).length) {
            SCANNED = res;
            G.render();
          } else if (note) {
            /* say what actually happened rather than implying it failed */
            var img = files.filter(function (x) { return /^image\//.test(x.type); }).length;
            var pdf = files.filter(function (x) { return /pdf$/i.test(x.name); }).length;
            note.textContent = files.length + ' file' + (files.length === 1 ? '' : 's') +
              ' attached — they will be filed against the client.' +
              ((img || pdf)
                ? ' Reading ' + (img ? 'a photo' : 'a PDF') + ' needs OCR, which needs a server; ' +
                  'use “Paste the text instead” and the fields fill themselves.'
                : ' Nothing recognisable in them.');
          }
          renderPendingDocs();
        }
      });
      return;
    }
    var t = e.target;
    if (t && t.dataset && t.dataset.source) {
      var box = document.getElementById(t.id + '-camp');
      if (box) box.hidden = !ZS.isPaid(t.value);
      return;
    }
    if (t && t.id === 'cl-sector') {
      var dsel = document.getElementById('cl-desig');
      if (!dsel) return;
      var had = dsel.value;
      var opts = ZS.designationsFor(D(), t.value);
      dsel.innerHTML = '<option value="">Not set</option>' +
        opts.map(function (dg) {
          return '<option value="' + esc(dg) + '"' + (dg === had ? ' selected' : '') + '>' +
            esc(dg) + '</option>';
        }).join('');
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target.id === 'cq') { CQ = e.target.value.toLowerCase().trim(); G.render(); }
    if (e.target.id === 'q') { /* handled by stock.js via its own id */ }
  });

  A.onSubmit = function (e) {
    if (prevSubmit) prevSubmit(e);

    if (e.target.id === 'delclientform') {
      e.preventDefault();
      var dcId = e.target.dataset.id;
      var dcName = (G.clientById(dcId) || {}).name || '';
      if (document.getElementById('dc-confirm').value.trim() !== 'DELETE') {
        document.getElementById('dc-err').textContent = 'Type DELETE, in capitals, to confirm.';
        return;
      }
      var res = ZS.deleteClient(D(), dcId, G.me());
      if (res.error) { document.getElementById('dc-err').textContent = res.error; return; }
      var took = res.took || {};
      G.log('client_edit', 'Deleted ' + dcName + ' and everything on them \u2014 ' +
            ((took.opportunities || []).length) + ' engagement(s). In the bin for ' +
            ZS.BIN_DAYS + ' days.');
      G.save();
      var dm = document.getElementById('modal'); if (dm && dm.open) dm.close();

      /* ⚠️ OFF THE SERVER TOO, AND IN ONE CALL.
         This used to delete each engagement and then the client. Both halves
         reached the server, so the records did go, but the server captured them
         as SEPARATE bin rows: one per engagement plus a client with no work left
         under it. Putting the company back gave you an empty company, and the
         engagements had to be found and restored one at a time. The server
         cascades now, so one call takes the whole thing and one row brings it
         all back. */
      if (window.API && API.signedIn()) {
        API.dropClient(dcId)
          .then(function () {
            G.toast(dcName + ' is in the bin for ' + ZS.BIN_DAYS + ' days, and can be put back whole.');
            return G.pullNow ? G.pullNow() : null;
          })
          .catch(function (err) {
            G.toast('Removed here, but the server refused: ' + (err.message || 'no reason') +
                    '. It will come back on the next reload.', true);
          });
      } else {
        G.toast(dcName + ' is in the bin for ' + ZS.BIN_DAYS + ' days, in this browser only.');
      }
      G.go('#/clients');
      return;
    }

    var f = e.target;

    if (f.id === 'scanform') {
      e.preventDefault();
      var res = ZS.readDocument(document.getElementById('sc-text').value);
      if (!Object.keys(res.fields).length) {
        document.getElementById('sc-err').textContent = res.notes.join(' ');
        return;
      }
      document.getElementById('modal').close();
      SCANNED = res;
      G.toast(res.notes[0]);
      G.render();
      return;
    }

    if (f.id === 'contactform') {
      e.preventDefault();
      var c2 = G.clientById(f.dataset.cid);
      if (!c2) return;
      var cd = new FormData(f);
      var res = ZS.addContact(c2, { name: cd.get('name'), designation: cd.get('designation'),
                                    mobile: cd.get('mobile'), dial: cd.get('mobile_dial'),
                                    email: cd.get('email') });
      if (res.error) { document.getElementById('ct-err').textContent = res.error; return; }
      G.log('client_edit', res.contact.name + ' added as a contact at ' + c2.name, { client: c2.id });
      G.save();
      document.getElementById('modal').close();
      G.toast(res.contact.name + ' added.');
      G.render();
      return;
    }

    if (f.id === 'pickform') {
      e.preventDefault();
      var v = document.getElementById('pk-v').value;
      var res = ZS.addToPicklist(D(), f.dataset.key, v);
      if (res.error) { document.getElementById('pk-err').textContent = res.error; return; }
      G.save();
      document.getElementById('modal').close();
      /* put the new value straight into the field they were filling in */
      PENDING_PICK = { field: f.dataset.field, value: res.value };
      G.toast('"' + res.value + '" added to the list.');
      G.render();
      return;
    }

    if (f.id === 'clientform') {
      e.preventDefault();
      var d = new FormData(f);
      var r = ZS.upsertClient(D().clients, {
        name: d.get('name'),
        type: d.get('type') || 'lead',
        sector: d.get('sector') || '',
        source: d.get('source'),
        assigned_to: d.get('assigned_to') || null,
        website: d.get('website') || '',
        instagram: d.get('instagram') || '',
        gst: d.get('gst') || '',
        tax_id: d.get('tax_id') || '',
        campaign: d.get('campaign') || null,
        bank: { holder: d.get('bank_holder') || '', account: d.get('bank_account') || '',
                ifsc: d.get('bank_ifsc') || '', swift: d.get('bank_swift') || '',
                name: d.get('bank_name') || '', branch: d.get('bank_branch') || '' },
        address: { line1: d.get('line1') || '', area: d.get('area') || '',
                   city: d.get('city') || '', state: d.get('state') || '',
                   country: d.get('country') || '', pin: d.get('pin') || '' },
        contact_name: d.get('contact_name') || '',
        designation: d.get('designation') || '',
        mobile: d.get('mobile') || '',
        dial: d.get('mobile_dial') || ZS.DEFAULT_DIAL,
        email: d.get('email') || ''
      });
      if (r.error) { document.getElementById('cl-err').textContent = r.error; return; }
      r.client.product = d.get('product') || (ZS.PRODUCTS[0] || {}).id;
      if (PENDING_DOCS.length) {
        r.client.docs = (r.client.docs || []).concat(PENDING_DOCS);
        G.log('doc_add', PENDING_DOCS.length + ' document' + (PENDING_DOCS.length === 1 ? '' : 's') +
              ' filed against ' + r.client.name, { client: r.client.id });
        PENDING_DOCS = [];
      }
      G.save();
      G.log(r.created ? 'client_add' : 'client_edit',
        r.created ? r.client.name + ' added as a ' + (ZS.CLIENT_TYPES[r.client.type] || 'lead').toLowerCase()
                  : 'Added a contact at ' + r.client.name, { client: r.client.id });
      G.toast(r.created ? r.client.name + ' added.' : 'We already had them — the contact was added.');
      G.go('#/client/' + r.client.id);
      return;
    }

  };
})();
