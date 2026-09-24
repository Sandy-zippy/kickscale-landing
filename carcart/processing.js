/* Processing: what happens after the car is sold.

   A dealership does not finish when the customer says yes. The car has to be
   handed over, the registration has to move into the buyer's name, and the
   insurance has to follow it. Two of those run on a statutory fourteen-day
   clock from the date of sale — and if the insurance endorsement misses it,
   the new owner's own-damage cover simply is not there. That is the fact this
   screen exists to prevent.

   Processing is not a second record. It is a later phase of the same
   opportunity (`o.proc`), so the customer, the car, the price and the
   salesperson stay attached without being copied anywhere. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS;
  var esc = function (s) { return CC.esc(s); };
  var MINE = false;

  function D() { return G.D(); }
  function staffName(id) { var u = CC.staffById(id); return u ? u.name : 'Unassigned'; }

  function visible(o) {
    var me = G.me();
    if (!CC.acc(me, D().access).clients) return false;
    if (CC.acc(me, D().access).scope !== 'company' && o.assigned_to !== me.id) return false;
    if (MINE && o.assigned_to !== me.id) return false;
    return true;
  }

  function deals() { return CC.procDeals(D().opportunities || []).filter(visible); }

  /* The clock, in the words somebody would actually use. */
  function clock(o) {
    var left = CC.daysLeft(CC.procDue(o));
    var miss = CC.missingDocs(o.proc, ['new_rc', 'new_insurance']);
    if (!miss.length) return ['ok', 'transfer papers in'];
    if (left === null) return ['dim', '—'];
    if (left < 0) return ['bad', Math.abs(left) + ' day' + (Math.abs(left) === 1 ? '' : 's') + ' over the 14'];
    if (left === 0) return ['bad', 'the 14 days are up today'];
    if (left <= 4) return ['warn', left + ' day' + (left === 1 ? '' : 's') + ' left of the 14'];
    return ['dim', left + ' days left of the 14'];
  }

  /* ---------------- the board ---------------- */

  V.processing = function () {
    if (!G.acc().clients) return G.deny('Not in your view', 'Customer records are switched off for your role.');
    var live = deals();
    var cars = G.cars(), byId = {};
    cars.forEach(function (c) { byId[c.stock_id] = c; });

    var late = live.filter(function (o) { return CC.procOverdue(o); });

    var h = '<div class="ph"><div><h1>Processing</h1>' +
      '<p>Every sold car until it is properly the customer\'s. Forms 29 and 30 go to the RTO ' +
      'within <b>14 days</b> of the sale, and the insurance is endorsed within 14 days too — ' +
      'miss that one and their own-damage cover is not there.</p></div></div>';

    h += '<div class="chips" style="margin-bottom:16px">' +
      '<button class="chip" data-act="procMine" aria-pressed="' + (MINE ? 'true' : 'false') + '">Only mine</button>' +
      '<span style="margin-left:auto;font-size:12px;color:var(--dim)">' + live.length +
      ' car' + (live.length === 1 ? '' : 's') + ' in transfer</span></div>';

    if (late.length) {
      h += '<div class="card" style="border-color:var(--bad);margin-bottom:16px">' +
        '<h3 style="color:var(--bad)">' + late.length + ' past the 14 days with papers still out</h3>' +
        '<p class="m">Every day after this the customer is driving a car that is not yet theirs on paper. ' +
        late.slice(0, 8).map(function (o) {
          var c2 = G.clientById(o.client);
          return '<button class="minibtn" data-act="openOpp" data-id="' + esc(o.id) + '" style="margin:6px 5px 0 0">' +
            esc(c2 ? c2.name : 'Customer') + '</button>';
        }).join('') + '</p></div>';
    }

    h += '<div class="board pipe">' + CC.PROC_STAGES.map(function (st) {
      var rows = live.filter(function (o) { return o.proc.stage === st; });
      return '<div class="col"><h4 title="' + esc(CC.PROC_HELP[st] || '') + '">' + esc(st) +
        '<i>' + rows.length + '</i></h4>' +
        '<div class="colhelp">' + esc(CC.PROC_HELP[st] || '') + '</div>' +
        (rows.length
          ? rows.map(function (o) {
              var c = G.clientById(o.client), car = byId[o.won_car];
              var ck = clock(o);
              var pr = CC.procProgress(o);
              return '<div class="vcard" data-act="openOpp" data-id="' + esc(o.id) + '">' +
                '<b>' + esc(c ? c.name : 'Unknown') + '</b>' +
                '<span>' + esc(car ? car.make + ' ' + car.model : 'earlier stock') + '</span>' +
                '<span class="bar"><i style="width:' + pr.pct + '%"></i></span>' +
                '<span class="oppmeta"><span class="pill ' + ck[0] + '">' + esc(ck[1]) + '</span></span>' +
                '<span class="oppmeta"><span>sold ' + esc(o.closed || '—') + '</span>' +
                '<span>' + esc(staffName(o.assigned_to).split(' ')[0]) + '</span></span>' +
                '<select class="cardstage" data-procstage="' + esc(o.id) + '" ' +
                  'aria-label="Move ' + esc(c ? c.name : 'this transfer') + ' to another stage">' +
                  CC.PROC_STAGES.map(function (s2) {
                    return '<option value="' + esc(s2) + '"' + (o.proc.stage === s2 ? ' selected' : '') + '>' +
                      (s2 === o.proc.stage ? '' : 'Move to ') + esc(s2) + '</option>';
                  }).join('') + '</select>' +
                '</div>';
            }).join('')
          : '<div class="empty" style="padding:18px;font-size:12px">—</div>') +
        '</div>';
    }).join('') + '</div>';

    var done = (D().opportunities || []).filter(function (o) {
      return visible(o) && o.proc && o.proc.stage === 'Completed';
    });
    if (done.length) {
      h += '<p class="eyebrow" style="margin-top:30px">Transferred and closed</p>' +
        '<div class="scroller"><table class="tbl"><thead><tr><th>Customer</th><th>Car</th>' +
        '<th>Sold</th><th>Completed</th><th>Days taken</th><th>Salesperson</th>' +
        '</tr></thead><tbody>' + done.map(function (o) {
          var c = G.clientById(o.client), car = byId[o.won_car];
          var took = CC.daysLeft(o.proc.done, o.closed);
          return '<tr data-act="openOpp" data-id="' + esc(o.id) + '">' +
            '<td><b>' + esc(c ? c.name : '—') + '</b></td>' +
            '<td>' + esc(car ? car.make + ' ' + car.model : 'earlier stock') + '</td>' +
            '<td>' + esc(o.closed || '—') + '</td><td>' + esc(o.proc.done || '—') + '</td>' +
            '<td class="num">' + (took === null ? '—' : took) + '</td>' +
            '<td>' + esc(staffName(o.assigned_to)) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    return h;
  };

  /* ---------------- the transfer file, inside an opportunity ---------------- */

  G.procPanel = function (o, c, car) {
    if (!o || !o.proc) return '';
    var ck = clock(o), pr = CC.procProgress(o);
    var may = G.acc().clients;

    var h = '<div class="card" style="margin-bottom:18px;border-color:var(--' + ck[0] + ')">' +
      '<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap">' +
      '<div style="flex:1;min-width:220px"><h3>Transfer file</h3>' +
      '<p class="m">' + esc(CC.PROC_HELP[o.proc.stage] || '') + '</p></div>' +
      '<span class="pill ' + ck[0] + '">' + esc(ck[1]) + '</span>' +
      (may ? '<span class="stagepick"><label for="p-stage">Stage</label>' +
        '<select id="p-stage" data-procstage="' + esc(o.id) + '">' +
        CC.PROC_STAGES.map(function (s2) {
          return '<option value="' + esc(s2) + '"' + (o.proc.stage === s2 ? ' selected' : '') + '>' +
            esc(s2) + '</option>';
        }).join('') + '</select></span>' : '') +
      '</div>' +
      '<span class="bar" style="margin-top:12px"><i style="width:' + pr.pct + '%"></i></span>' +
      '<p class="hint" style="margin-top:8px">Sold ' + esc(o.closed || '—') +
        ' &middot; the RTO and the insurer both want it done by <b>' + esc(CC.procDue(o) || '—') + '</b>' +
        (o.proc.handed_over ? ' &middot; car handed over ' + esc(o.proc.handed_over) : '') + '</p>';

    h += docSection('deal', o.id, CC.docsOf(o.proc), may,
      'The buyer\'s side of the transfer. What is missing here is what is holding the stage.',
      CC.PROC_NEEDS[o.proc.stage] || []);
    h += '</div>';
    return h;
  };

  /* ---------------- documents, shared by the deal and the car ----------------

     One renderer, used by the transfer file and by the car record, so a
     document looks and behaves the same wherever it is attached. */

  G.docSection = docSection;
  function docSection(kind, holderId, docs, may, blurb, blocking) {
    var types = CC.docTypes(kind);
    var groups = [];
    types.forEach(function (t) { if (groups.indexOf(t.group) < 0) groups.push(t.group); });
    var have = {};
    docs.forEach(function (d) { (have[d.type] = have[d.type] || []).push(d); });

    var h = '<h4 class="sec" style="margin-top:18px">Documents</h4>' +
      '<p class="hint" style="margin-bottom:10px">' + esc(blurb) + '</p>';

    h += '<div class="docs">' + groups.map(function (g) {
      return '<div class="docgroup"><p class="eyebrow">' + esc(g) + '</p>' +
        types.filter(function (t) { return t.group === g; }).map(function (t) {
          var mine = have[t.key] || [];
          var need = (blocking || []).indexOf(t.key) >= 0 && !mine.length;
          return '<div class="docrow' + (need ? ' need' : '') + '">' +
            '<div class="dl"><b>' + esc(t.label) + '</b>' +
              (t.when ? '<span>' + esc(t.when) + '</span>' : '') +
              (need ? '<span class="needline">Needed before this stage can move on.</span>' : '') +
              mine.map(function (d) {
                return '<span class="docfile">' +
                  (d.data ? '<a href="' + d.data + '" target="_blank" rel="noopener">' + esc(d.name) + '</a>'
                          : esc(d.name)) +
                  ' <i>' + esc(G.fileSize(d.size)) + ' &middot; ' + esc(d.when) + '</i>' +
                  (d.data ? '' : ' <i class="nostore">recorded, file not stored in the demo</i>') +
                  (may ? ' <button class="minibtn" data-act="dropDoc" data-id="' +
                        esc(kind + '|' + holderId + '|' + d.id) + '">Remove</button>' : '') +
                  '</span>';
              }).join('') +
            '</div>' +
            (may
              ? '<label class="upl">' + (mine.length ? 'Replace' : 'Upload') +
                '<input type="file" accept="image/*,.pdf" hidden ' +
                'data-doc="' + esc(kind + '|' + holderId + '|' + t.key) + '"></label>'
              : '') +
            '</div>';
        }).join('') + '</div>';
    }).join('') + '</div>';
    return h;
  }

  /* ---------------- actions ---------------- */

  Object.assign(A, {
    procMine: function () { MINE = !MINE; G.render(); },
    dropDoc: function (key) {
      var p = String(key).split('|'), kind = p[0], holder = p[1], docId = p[2];
      if (!G.acc().clients) return;
      if (kind === 'car') {
        G.dropCarDoc(holder, docId);
        G.log('doc_remove', 'Document removed from ' + holder, { car: holder });
      } else {
        var o = (D().opportunities || []).filter(function (x) { return x.id === holder; })[0];
        if (!o || !o.proc) return;
        o.proc.docs = o.proc.docs.filter(function (d) { return d.id !== docId; });
        G.log('doc_remove', 'Document removed from the transfer file',
              { client: o.client, opp: o.id });
        G.save();
      }
      G.toast('Removed.');
      G.render();
    }
  });

  /* The stage dropdown, on the board and inside the file. Refusing names the
     missing document, so the message is a sentence rather than a shrug. */
  var prevChange = A.onChange;
  A.onChange = function (e) {
    if (prevChange) prevChange(e);
    var ps = e.target.closest ? e.target.closest('[data-procstage]') : null;
    if (ps) {
      var o = (D().opportunities || []).filter(function (x) { return x.id === ps.dataset.procstage; })[0];
      if (!o) return;
      if (!G.acc().clients) { G.render(); return; }
      var r = CC.moveProc(o, ps.value);
      if (r.error) { G.toast(r.error, true); G.render(); return; }
      G.log('proc_stage', (G.clientById(o.client) || {}).name + ' — transfer moved to ' + ps.value,
            { client: o.client, opp: o.id });
      G.save();
      G.toast(ps.value === 'Completed' ? 'Transfer complete.' : 'Moved to ' + ps.value + '.');
      G.render();
      return;
    }
    var dp = e.target.closest ? e.target.closest('[data-doc]') : null;
    if (dp) G.onDocPicked(dp);
  };

  /* A file arriving, from either place. */
  G.onDocPicked = function (input) {
    var spec = input.getAttribute('data-doc');
    if (!spec || !input.files || !input.files[0]) return;
    var p = spec.split('|'), kind = p[0], holder = p[1], type = p[2];
    if (!G.acc().clients) return;
    G.takeDoc(input.files[0], kind, type, function (doc) {
      if (kind === 'car') {
        G.addCarDoc(holder, doc);
        G.log('doc_add', CC.docLabel('car', type) + ' uploaded', { car: holder });
      } else {
        var o = (D().opportunities || []).filter(function (x) { return x.id === holder; })[0];
        if (!o) return;
        if (!o.proc) CC.startProc(o);
        o.proc.docs.push(doc);
        G.log('doc_add', CC.docLabel('deal', type) + ' uploaded',
              { client: o.client, opp: o.id });
        G.save();
      }
      G.toast(CC.docLabel(kind, type) + ' saved.');
      G.render();
    });
  };
})();
