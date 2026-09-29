/* Campaigns — where a paid lead actually came from.

   "Meta ad" is not an answer. You run several at once, and the only question
   worth asking at month end is which one paid for itself. So a paid source
   carries a campaign, and this screen is where the list lives.

   The ad accounts are NOT connected. Pulling campaigns from Meta and Google
   needs a server, an app review and an OAuth token each; until that exists you
   add them by hand and the screen says so rather than implying a sync. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS;
  var esc = function (s) { return ZS.esc(s); };
  function D() { return G.D(); }

  V.campaigns = function () {
    var a = G.acc();
    if (!a.reports) return G.deny('Not in your view', 'Campaign spend is switched off for your role.');
    var list = D().campaigns || [];

    var h = '<div class="ph"><div><h1>Campaigns</h1>' +
      '<p>Every paid lead is tagged with the campaign that brought it, so the ' +
      'source column answers <b>which ad</b> rather than just &ldquo;Meta&rdquo;.</p></div>' +
      (a.settings ? '<div class="right"><button class="btn" data-act="addCampaign">+ Add a campaign</button></div>' : '') +
      '</div>';

    /* the connections, stated honestly */
    h += '<div class="grid2" style="margin-bottom:14px">' +
      Object.keys(ZS.PLATFORMS).map(function (p) {
        var mine = ZS.campaignsFor(D(), p);
        return '<div class="card pad"><div class="cardhead"><h3>' + esc(ZS.PLATFORMS[p]) + '</h3>' +
          '<span class="pill warn">not connected</span></div>' +
          '<p class="m">' + mine.length + ' campaign' + (mine.length === 1 ? '' : 's') +
          ' added by hand. Pulling them automatically needs a server with a public URL, ' +
          (p === 'meta' ? 'a Meta app review for <b>ads_read</b>' :
           p === 'google' ? 'a Google Ads developer token' : 'a LinkedIn marketing token') +
          ', and an account connected to it.</p>' +
          '<p style="margin-top:10px"><button class="minibtn" data-act="connectAds" data-id="' + esc(p) +
          '">What connecting needs</button></p></div>';
      }).join('') + '</div>';

    h += '<section class="card"><div class="cardhead pad"><h3>The list</h3>' +
      '<span class="hint">leads and value are counted from the board, not typed in</span></div>' +
      (list.length
        ? '<div class="scroller"><table class="tbl"><thead><tr><th>Campaign</th><th>Platform</th>' +
          '<th>Status</th><th class="num">Leads</th><th class="num">Won</th>' +
          '<th class="num">Value</th><th class="num">Spend</th><th></th></tr></thead><tbody>' +
          list.map(function (c) {
            var r = ZS.campaignResults(D(), c.id);
            return '<tr>' +
              '<td><b>' + esc(c.name) + '</b>' + (c.ref ? '<span class="sub">' + esc(c.ref) + '</span>' : '') + '</td>' +
              '<td>' + esc(ZS.PLATFORMS[c.platform] || c.platform) + '</td>' +
              '<td><span class="pill ' + (c.status === 'active' ? 'ok' : 'dim') + '">' + esc(c.status) + '</span></td>' +
              '<td class="num">' + r.leads + '</td><td class="num">' + r.won + '</td>' +
              '<td class="num">' + (a.cost ? ZS.money(r.value) : '₹ ••••') + '</td>' +
              '<td class="num">' + (a.cost ? (c.spend ? ZS.money(c.spend) : '—') : '₹ ••••') + '</td>' +
              '<td>' + (a.settings ? '<button class="xbtn" data-act="dropCampaign" data-id="' + esc(c.id) +
                '" title="Remove" aria-label="Remove ' + esc(c.name) + '">&times;</button>' : '') + '</td></tr>';
          }).join('') + '</tbody></table></div>'
        : '<p class="m pad">No campaigns yet. Add the ones you are running and every paid lead can name one.</p>') +
      '</section>';
    return h;
  };

  Object.assign(A, {
    addCampaign: function () {
      if (!G.acc().settings) return;
      G.modal('Add a campaign', 'It will be on the list wherever a paid source is chosen.',
        '<form id="campform">' +
        '<div class="f" style="margin-bottom:10px"><label for="cm-name">Campaign name</label>' +
        '<input id="cm-name" name="name" required autocomplete="off" ' +
        'placeholder="exactly as it reads in the ad manager"></div>' +
        '<div class="f" style="margin-bottom:10px"><label for="cm-plat">Platform</label>' +
        '<select id="cm-plat" name="platform">' +
        Object.keys(ZS.PLATFORMS).map(function (p) {
          return '<option value="' + p + '">' + esc(ZS.PLATFORMS[p]) + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="f" style="margin-bottom:10px"><label for="cm-ref">Campaign ID <em>&mdash; optional</em></label>' +
        '<input id="cm-ref" name="ref" autocomplete="off"></div>' +
        '<div class="f"><label for="cm-spend">Spend so far</label>' +
        '<input id="cm-spend" name="spend" type="number" min="0"></div>' +
        '<p class="err" id="cm-err"></p>' +
        '<div style="display:flex;gap:10px;margin-top:14px">' +
        '<button class="btn" type="submit">Add it</button>' +
        '<button class="btn alt" type="button" data-act="closeModal">Cancel</button></div></form>');
    },
    dropCampaign: function (id) {
      if (!G.acc().settings) return;
      var used = (D().opportunities || []).filter(function (o) { return o.campaign === id; }).length;
      if (used) return G.toast(used + ' opportunit' + (used === 1 ? 'y is' : 'ies are') +
        ' tagged with it — removing it would lose where they came from.', true);
      D().campaigns = (D().campaigns || []).filter(function (c) { return c.id !== id; });
      G.save(); G.toast('Removed.'); G.render();
    },
    connectAds: function (p) {
      var needs = {
        meta: ['A server with a public HTTPS URL to receive the callback',
               'A Meta app with <b>ads_read</b> — which goes through app review',
               'The ad account linked to that app',
               'A long-lived token, refreshed on a schedule'],
        google: ['A Google Ads <b>developer token</b>, applied for and approved',
                 'An OAuth client and a refresh token per account',
                 'A server to hold the token and poll'],
        linkedin: ['A LinkedIn marketing developer application',
                   'OAuth with <b>r_ads_reporting</b>', 'A server to hold the token']
      }[p] || [];
      G.modal('Connecting ' + (ZS.PLATFORMS[p] || p), 'None of this is wired up yet.',
        '<p class="m">Campaigns are typed in by hand today, and the screen says so. ' +
        'To pull them automatically we would need:</p>' +
        '<ul class="ledger" style="margin-top:12px">' +
        needs.map(function (n) { return '<li><span>·</span><b>' + n + '</b></li>'; }).join('') +
        '</ul><p class="m" style="margin-top:14px">That is a backend project, not a setting. ' +
        'Until then, adding the campaign names by hand gets you the same reporting.</p>');
    }
  });

  var prevSubmit = A.onSubmit;
  A.onSubmit = function (e) {
    if (prevSubmit) prevSubmit(e);
    if (e.target.id !== 'campform') return;
    e.preventDefault();
    if (!G.acc().settings) return;
    var fd = new FormData(e.target);
    var name = String(fd.get('name') || '').trim();
    if (name.length < 2) { document.getElementById('cm-err').textContent = 'Give it the real name.'; return; }
    D().campaigns = D().campaigns || [];
    if (D().campaigns.some(function (c) { return c.name.toLowerCase() === name.toLowerCase(); })) {
      document.getElementById('cm-err').textContent = 'That campaign is already on the list.';
      return;
    }
    D().campaigns.push(ZS.newCampaign({ name: name, platform: fd.get('platform'),
                                        ref: fd.get('ref'), spend: Number(fd.get('spend')) || 0 }));
    G.log('auto_toggle', 'Campaign "' + name + '" added');
    G.save();
    document.getElementById('modal').close();
    G.toast(name + ' added.');
    G.render();
  };
})();
