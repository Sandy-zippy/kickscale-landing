/* The bin. Nothing is deleted; it is moved here and kept for thirty days.
 *
 * WHY THIS EXISTS. Deleting was the one action in the cockpit with no undo,
 * taken by a person who is usually sure and occasionally wrong, on a record that
 * took somebody an afternoon to fill in. Every other mistake in here costs an
 * edit. That one cost everything, permanently, with a confirmation box as the
 * only thing in the way. A bin turns the worst failure in the system into a mild
 * one, and it is the reason deleting a whole client can now be offered at all.
 *
 * WHOLE RECORDS. A binned engagement carries its own follow-ups, invoices and
 * documents inside it; a binned client carries its engagements and contacts.
 * Restoring half of something is worse than restoring none of it.
 *
 * ⚠️ THE SERVER OWNS THIS LIST, and it had to. The first version lived only in
 * the browser, and `adoptRemote()` rebuilds the store from `blank()` on every
 * pull — so the bin went back to empty every twenty seconds that anything moved,
 * while the rows were gone from D1 for good. A bin that empties itself promises
 * an undo it cannot perform. Rows now arrive with `server: true` and every button
 * here goes to the server and pulls the answer back. The local shape is kept for
 * a cockpit running with no server at all, where it is honest: nothing left the
 * browser either.
 */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS;
  var esc = function (s) { return ZS.esc(s); };
  function D() { return G.D(); }

  var KINDS = {
    client:      { label: 'Client',     icon: '◱' },
    opportunity: { label: 'Engagement', icon: '▤' },
    document:    { label: 'Document',   icon: '▦' }
  };

  V.bin = function () {
    /* Only the owner deletes, so only the owner has anything here to put back.
       Showing somebody else a list of what was removed is a way of showing them
       records their role was never meant to open. */
    if (!ZS.canDelete(G.me())) {
      return G.deny('Not in your view',
        'The bin holds records that were deleted. Only the owner can delete, and ' +
        'only the owner can put something back.');
    }

    var rows = (D().bin || []).slice();
    var h = '<div class="ph"><div><h1>Bin</h1>' +
      '<p>Everything deleted, kept for ' + ZS.BIN_DAYS + ' days and then gone for good. ' +
      'Restoring puts back the record and everything that went with it.</p></div>' +
      (rows.length
        ? '<div class="right"><button class="btn danger" data-act="binEmpty">Empty it now</button></div>'
        : '') +
      '</div>';

    if (!rows.length) {
      return h + '<div class="card pad"><p class="m">Nothing here. Anything you delete ' +
        'lands in this list, and stays for ' + ZS.BIN_DAYS + ' days.</p></div>';
    }

    var soon = rows.filter(function (r) { return ZS.binDaysLeft(r) <= 3; });
    if (soon.length) {
      h += '<div class="note" style="border-color:var(--warn)"><b>' + soon.length +
        ' going within three days.</b> After that it cannot be brought back.</div>';
    }

    h += '<div class="card" style="padding:0">' + rows.map(row).join('') + '</div>';
    return h;
  };

  /* WHAT IT TOOK WITH IT. Both shapes answer this, differently: a server row was
     counted when it was captured, a local row still holds the records themselves.
     Said plainly either way, because it is what comes back out and somebody
     should know before they press restore. */
  var PLURAL = { opportunities: 'engagement', invoices: 'invoice', followups: 'follow-up',
                 documents: 'document', contacts: 'contact', messages: 'enquiry',
                 clients: 'client' };

  function carriedWords(r) {
    var counts = {};
    if (r.server) {
      counts = r.carried || {};
      /* the record itself is not something it "took with it" */
      counts = Object.keys(counts).reduce(function (a, k) {
        if (!(k === 'clients' && r.kind === 'client') &&
            !(k === 'opportunities' && r.kind === 'opportunity') &&
            !(k === 'documents' && r.kind === 'document')) a[k] = counts[k];
        return a;
      }, {});
    } else {
      var w = r.with || {};
      ['opportunities', 'invoices', 'followups', 'messages'].forEach(function (k) {
        if ((w[k] || []).length) counts[k] = w[k].length;
      });
      if (r.kind === 'client' && r.record && typeof r.record === 'object') {
        var n = ZS.contactsOf(r.record).length;
        if (n) counts.contacts = n;
        var docs = (r.record.docs || []).length;
        if (docs) counts.documents = docs;
      }
    }
    return Object.keys(counts).map(function (k) {
      var one = PLURAL[k] || k;
      return counts[k] + ' ' + one + (counts[k] === 1 ? '' : one === 'enquiry' ? 's' : 's');
    });
  }

  function row(r) {
    var k = KINDS[r.kind] || { label: r.kind, icon: '·' };
    var left = ZS.binDaysLeft(r);
    var who = ZS.staffById(r.by);
    var carried = carriedWords(r);
    var ref = r.server ? (r.ref || '')
      : (r.record && typeof r.record === 'object' ? (r.record.ref || '') : '');
    var label = r.label ||
      (r.record && typeof r.record === 'object' ? ZS.binLabel(r.kind, r.record) : 'A record');

    return '<div class="mtrow' + (left <= 3 ? ' soon' : '') + '">' +
      '<div class="mthead">' +
      '<b>' + esc(k.icon) + ' ' + esc(label) + '</b>' +
      '<span>' + esc(k.label) +
        (ref ? ' &middot; ' + esc(ref) : '') +
        ' &middot; deleted ' + esc(String(r.at).slice(0, 10)) +
        (who ? ' by ' + esc(who.name) : '') +
        (r.server ? '' : ' &middot; this browser only') + '</span>' +
      '<span class="pill ' + (left <= 3 ? 'bad' : left <= 7 ? 'warn' : 'dim') + '">' +
        (left <= 0 ? 'going now' : left + (left === 1 ? ' day left' : ' days left')) + '</span>' +
      '<button class="minibtn" data-act="binRestore" data-id="' + esc(r.id) + '">Put it back</button>' +
      '<button class="xbtn" data-act="binDrop" data-id="' + esc(r.id) + '" ' +
      'title="Delete for good" aria-label="Delete for good">&times;</button>' +
      '</div>' +
      (carried.length
        ? '<p class="mtmin">It took ' + esc(carried.join(', ')) + ' with it, and brings them back.</p>'
        : '') +
      '</div>';
  }

  /* Is this list the server's? Then every button is a call, and what comes back
     is pulled rather than guessed at: a restore that half worked must not leave
     the screen claiming it worked. */
  function onServer(r) { return !!(r && r.server) && !!(window.API && API.signedIn()); }

  function refresh() {
    if (!(window.API && API.signedIn() && G.pullNow)) { G.render(); return; }
    G.pullNow().catch(function () { G.render(); });
  }

  function rowById(id) {
    return (D().bin || []).filter(function (x) { return x.id === id; })[0] || null;
  }

  Object.assign(A, {
    binRestore: function (id) {
      if (!ZS.canDelete(G.me())) return;
      var r = rowById(id);
      if (!r) return;

      if (onServer(r)) {
        G.toast('Putting it back…');
        API.binRestore(id).then(function () {
          G.log('data_import', 'Restored from the bin: ' + (r.label || 'a record'));
          G.save();
          G.toast('Back where it was.');
          refresh();
        }).catch(function (e) {
          G.toast((e && e.message) || 'The server would not put it back.', true);
        });
        return;
      }

      var out = ZS.binRestore(D(), id);
      if (out.error) return G.toast(out.error, true);
      G.log('data_import', 'Restored from the bin: ' + (out.restored.label || 'a record'));
      G.save();
      G.toast('Back where it was.');
      G.render();
    },

    binDrop: function (id) {
      if (!ZS.canDelete(G.me())) return;
      var r = rowById(id);
      if (!r) return;
      if (!confirm('Delete "' + (r.label || 'this') + '" for good? ' +
                   'This is the one that cannot be undone' +
                   (r.server ? ', and it deletes the files too.' : '.'))) return;

      if (onServer(r)) {
        API.binDrop(id).then(function () {
          G.log('opp_delete', 'Deleted for good from the bin: ' + (r.label || 'a record'));
          G.save();
          G.toast('Gone.');
          refresh();
        }).catch(function (e) {
          G.toast((e && e.message) || 'The server would not delete it.', true);
        });
        return;
      }

      var out = ZS.binDrop(D(), id);
      if (out.error) return G.toast(out.error, true);
      G.log('opp_delete', 'Deleted for good from the bin: ' + (out.dropped.label || 'a record'));
      G.save();
      G.toast('Gone.');
      G.render();
    },

    binEmpty: function () {
      if (!ZS.canDelete(G.me())) return;
      var rows = D().bin || [];
      var n = rows.length;
      if (!n) return;
      if (!confirm('Empty the bin? ' + n + ' item(s) go for good, and nothing comes back.')) return;

      if (onServer(rows[0])) {
        API.binEmpty().then(function (out) {
          G.log('opp_delete', 'The bin was emptied: ' + ((out && out.gone) || n) +
                ' item(s) gone for good');
          G.save();
          G.toast('Emptied.');
          refresh();
        }).catch(function (e) {
          G.toast((e && e.message) || 'The server would not empty it.', true);
        });
        return;
      }

      D().bin = [];
      G.log('opp_delete', 'The bin was emptied: ' + n + ' item(s) gone for good');
      G.save();
      G.toast('Emptied.');
      G.render();
    }
  });
})();
