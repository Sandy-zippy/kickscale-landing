/* Campaigns: what each Meta campaign spent, and what it brought onto the board.

   Meta's figures are pulled by the server, READ-ONLY, once a day at 08:47 and on
   "Refresh from Meta". They are shown as Meta reports them, before GST. Beside
   them sit the cockpit's own figures, counted from the board:
     Enquiries         engagements that came from the campaign (lead ad id, or
                       the campaign named on the engagement)
     Engagements won   won engagements, each credited to the campaign of that
                       client's FIRST enquiry (approved 17 Oct)
     Cost per enquiry  spend / enquiries
     Cost per won deal spend / engagements won
   Nothing here can create, pause or edit an ad. That stays in Meta Ads Manager.

   Campaigns added by hand still work: Google, LinkedIn, or a Meta campaign from
   before the pull. A hand one with the same name as a pulled one shows once. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS;
  var esc = function (s) { return ZS.esc(s); };
  function D() { return G.D(); }

  var META = null;          /* the server's answer for the window in KEY */
  var KEY = null;
  var BUSY = false;         /* a Refresh from Meta in flight */
  var FAILED = null;        /* when the last Refresh failed */
  var CHIP = 'all';         /* all | meta | hand | running */
  var Q = '';

  var STATUS = {
    ACTIVE: ['Running', 'ok'], PAUSED: ['Paused', 'dim'], CAMPAIGN_PAUSED: ['Paused', 'dim'],
    ADSET_PAUSED: ['Paused', 'dim'], ARCHIVED: ['Ended', 'dim'], DELETED: ['Ended', 'dim'],
    COMPLETED: ['Ended', 'dim'], IN_PROCESS: ['In review', 'info'], PENDING_REVIEW: ['In review', 'info'],
    PREAPPROVED: ['In review', 'info'], DISAPPROVED: ['Has a problem', 'bad'],
    WITH_ISSUES: ['Has a problem', 'bad'], PENDING_BILLING_INFO: ['Has a problem', 'bad']
  };
  var GOAL = { OUTCOME_LEADS: 'lead form', OUTCOME_ENGAGEMENT: 'messages', OUTCOME_TRAFFIC: 'traffic',
               OUTCOME_SALES: 'sales', OUTCOME_AWARENESS: 'awareness', OUTCOME_APP_PROMOTION: 'app' };

  function pill(st) {
    var p = STATUS[st] || [st ? String(st).toLowerCase().replace(/_/g, ' ') : 'unknown', 'dim'];
    return '<span class="pill ' + p[1] + '">' + esc(p[0]) + '</span>';
  }
  var n = function (x) { return Number(x || 0).toLocaleString('en-IN'); };

  /* "14:32 today", "yesterday 14:32", "13 Oct, 11:05" */
  function said(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return '';
    var hm = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    var day = function (x) { return x.toDateString(); };
    var now = new Date(), y = new Date(now.getTime() - 86400000);
    if (day(d) === day(now)) return hm + ' today';
    if (day(d) === day(y)) return 'yesterday ' + hm;
    return d.getDate() + ' ' + d.toLocaleString('en-GB', { month: 'short' }) + ', ' + hm;
  }
  G.whenSaid = said;

  /* the cron runs at 03:17 UTC, which is 08:47 in India */
  function nextPull() {
    var t = new Date(); t.setUTCHours(3, 17, 0, 0);
    if (t.getTime() <= Date.now()) return '08:47 tomorrow';
    return '08:47 today';
  }

  function load() {
    var r = G.range();
    var key = r.from + '|' + r.to;
    if (key === KEY || !window.API || !API.signedIn()) return;
    KEY = key;
    API.metaCampaigns(r.from, r.to).then(function (out) {
      META = out || null;
      if (location.hash.indexOf('#/campaigns') === 0) G.render();
    }).catch(function () { META = META || null; });
  }

  /* one row's numbers, Meta's and ours */
  function cells(o, enq, won, a, conv, wonVal) {
    /* whole rupees: Meta reports paise, and ₹27,510.9 reads as a typo */
    var money = function (v) { return a.cost ? ZS.money(Math.round(v || 0)) : '₹ ••••'; };
    var per = function (v, by) { return !a.cost ? '₹ ••••' : by ? ZS.money(Math.round(v / by)) : '-'; };
    return '<td class="num">' + money(o.spend) + '</td>' +
      '<td class="num">' + n(o.impressions) + '</td>' +
      '<td class="num">' + n(o.clicks) + '</td>' +
      '<td class="num">' + n(o.leads) + '</td>' +
      '<td class="num ours">' + n(enq) + '</td>' +
      '<td class="num">' + n(conv) + '</td>' +
      '<td class="num">' + n(won) + '</td>' +
      '<td class="num">' + money(wonVal) + '</td>' +
      '<td class="num">' + per(o.spend, enq) + '</td>' +
      '<td class="num">' + per(o.spend, won) + '</td>';
  }

  /* conversations a campaign's ads started (the referral on the first message) */
  function convOf(c) {
    var m = (META && META.convAd) || {};
    return (c.adsets || []).reduce(function (t, s) {
      return t + (s.ads || []).reduce(function (u, x) { return u + (m[x.id] || 0); }, 0); }, 0);
  }

  function head(first) {
    return '<thead><tr class="grp"><th></th><th></th>' +
      '<th colspan="4">As Meta reports, before GST</th>' +
      '<th colspan="6" class="ours">From the cockpit</th></tr>' +
      '<tr><th>' + first + '</th><th>Status</th><th class="num">Spend</th>' +
      '<th class="num">Impressions</th><th class="num">Clicks</th><th class="num">Meta leads</th>' +
      '<th class="num ours">Enquiries</th><th class="num">Conversations</th><th class="num">Engagements won</th>' +
      '<th class="num">Won value</th>' +
      '<th class="num">Cost per enquiry</th><th class="num">Cost per won deal</th></tr></thead>';
  }

  function matches(c) {
    if (!Q) return true;
    var hay = [c.name];
    (c.adsets || []).forEach(function (s) {
      hay.push(s.name); (s.ads || []).forEach(function (x) { hay.push(x.name); });
    });
    return hay.join(' ').toLowerCase().indexOf(Q) >= 0;
  }

  V.campaigns = function (arg) {
    var a = G.acc();
    if (!a.reports) return G.deny('Not in your view', 'Campaign spend is switched off for your role.');
    load();
    var r = G.range();
    var pulled = (META && META.campaigns) || [];
    var board = ZS.metaBoard(D(), (META && META.adCampaign) || {}, pulled, r);
    if (arg) return drill(arg, a, pulled, board, r);

    var taken = {};
    pulled.forEach(function (c) { taken[String(c.name || '').trim().toLowerCase()] = 1; });
    var hand = (D().campaigns || []).filter(function (c) {
      return !(c.platform === 'meta' && taken[String(c.name || '').trim().toLowerCase()]);
    });
    var lastOk = META && META.lastOk;

    var h = '<div class="ph"><div><h1>Campaigns</h1><p>Every Meta campaign, pulled in. ' +
      (lastOk ? 'Last pulled from Meta <b>' + esc(said(lastOk)) + '</b>, next at ' + nextPull() + '.'
              : 'Nothing pulled from Meta yet.') + '</p></div>' +
      '<div class="right">' +
      (a.settings ? '<button class="btn alt" data-act="addCampaign">+ Add a campaign</button> ' : '') +
      '<button class="btn" data-act="metaRefresh"' + (BUSY ? ' disabled' : '') + '>' +
      (BUSY ? 'Refreshing…' : 'Refresh from Meta') + '</button></div></div>';

    if (FAILED) {
      h += '<div class="wbar warn"><span><b>Meta did not answer at ' + esc(said(FAILED).replace(' today', '')) +
        '.</b> The figures are from the last pull' + (lastOk ? ', ' + esc(said(lastOk)) : '') + '.</span>' +
        '<button class="minibtn" data-act="metaRefresh">Try again</button></div>';
    }
    h += G.rangeBar();

    /* four numbers, Meta campaigns only */
    var tot = { spend: 0, leads: 0, enq: 0, won: 0 };
    pulled.forEach(function (c) {
      tot.spend += c.spend || 0; tot.leads += c.leads || 0;
      tot.enq += board.enq[c.id] || 0; tot.won += board.won[c.id] || 0;
    });
    h += '<div class="kpis" style="margin-bottom:16px">' +
      '<div class="kpi"><b class="num">' + (a.cost ? ZS.money(Math.round(tot.spend)) : '₹ ••••') + '</b>' +
        '<span>Meta spend, as Meta reports, before GST</span></div>' +
      '<div class="kpi"><b class="num">' + n(tot.leads) + '</b><span>Meta leads</span></div>' +
      '<div class="kpi"><b class="num">' + n(tot.enq) + '</b><span>Enquiries from Meta campaigns</span></div>' +
      '<div class="kpi ok"><b class="num">' + (!a.cost ? '₹ ••••' : tot.won ? ZS.money(Math.round(tot.spend / tot.won)) : 'No won deal yet') +
        '</b><span>Cost per won deal, Meta (' + n(tot.won) + ' won)</span></div></div>';

    if (!pulled.length) {
      h += '<div class="grid3" style="margin-bottom:16px"><div class="card pad"><div class="cardhead">' +
        '<h3>No campaigns from Meta yet</h3><span class="pill dim">Waiting for setup</span></div>' +
        '<p class="m">The ad account fills this list on the first Refresh from Meta, then every ' +
        'morning at 08:47. Campaigns you add by hand work today and sit on this list.</p>' +
        '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">' +
        (a.settings ? '<button class="btn alt" data-act="addCampaign">+ Add a campaign</button>' : '') +
        '<button class="minibtn" data-act="metaRefresh">Refresh from Meta</button></div></div></div>';
    }

    var running = pulled.filter(function (c) { return c.status === 'ACTIVE'; });
    var rows = CHIP === 'hand' ? [] : (CHIP === 'running' ? running : pulled);
    var handRows = (CHIP === 'meta' || CHIP === 'running') ? [] : hand;
    rows = rows.filter(matches);
    handRows = handRows.filter(function (c) { return !Q || String(c.name).toLowerCase().indexOf(Q) >= 0; });

    h += '<div class="chips" style="margin-bottom:12px">' +
      [['all', 'All campaigns', pulled.length + hand.length], ['meta', 'From Meta', pulled.length],
       ['hand', 'Added by hand', hand.length], ['running', 'Only running', running.length]]
        .map(function (c) {
          return '<button class="chip" data-act="campChip" data-id="' + c[0] + '" aria-pressed="' +
            (CHIP === c[0] ? 'true' : 'false') + '">' + c[1] + '<i>' + c[2] + '</i></button>';
        }).join('') +
      '<input type="search" id="campq" placeholder="Search campaigns" value="' + esc(Q) + '"></div>';

    var spentAny = pulled.some(function (c) { return c.spend > 0 || c.impressions > 0; });
    if (pulled.length && !spentAny && CHIP !== 'hand') {
      h += '<div class="grid3" style="margin-bottom:16px"><div class="card pad"><h3>Nothing spent ' +
        esc(ZS.rangeLabel(r)) + '</h3><p class="m" style="margin-top:6px">No campaign ran in these dates. ' +
        'Pick a wider Date filter, or Refresh from Meta if you started one today.</p>' +
        '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">' +
        '<button class="btn alt" data-act="setRange" data-id="last">Last month</button>' +
        '<button class="minibtn" data-act="metaRefresh">Refresh from Meta</button></div></div></div>';
      rows = [];
    }

    var count = rows.length + handRows.length;
    h += '<section class="card" style="padding:0"><div class="cardhead pad"><h3>' + count + ' campaign' +
      (count === 1 ? '' : 's') + '</h3><span class="hint">Meta figures as Meta reports them, before GST. ' +
      'Cockpit figures counted from the board.</span></div>';
    if (!count) {
      h += '<p class="m pad">' + (Q ? 'Nothing matches “' + esc(Q) + '”. ' +
        '<button class="chip" data-act="campClear">Clear search</button>'
        : 'Nothing on this filter.') + '</p></section>';
      return h;
    }
    h += '<div class="scroller"><table class="tbl stick1">' + head('Campaign') + '<tbody>' +
      rows.map(function (c) {
        return '<tr data-act="openCampaign" data-id="' + esc(c.id) + '" style="cursor:pointer">' +
          '<td><b>' + esc(c.name) + '</b><span class="sub">Meta · ' + esc(GOAL[c.objective] || 'campaign') +
          ' · ' + (c.adsets || []).length + ' ad set' + ((c.adsets || []).length === 1 ? '' : 's') + '</span></td>' +
          '<td>' + pill(c.status) + '</td>' + cells(c, board.enq[c.id] || 0, board.won[c.id] || 0, a,
            convOf(c), board.wonVal[c.id] || 0) + '</tr>';
      }).join('') +
      (handRows.length
        ? '<tr class="sect"><td colspan="12">Added by hand · ' + handRows.length + '</td></tr>' +
          handRows.map(function (c) {
            var enq = board.enq[c.id] || 0, won = board.won[c.id] || 0;
            var per = function (by) { return !a.cost ? '₹ ••••' : by && c.spend ? ZS.money(Math.round(c.spend / by)) : '-'; };
            return '<tr><td><b>' + esc(c.name) + '</b><span class="sub">' +
              esc(String(ZS.PLATFORMS[c.platform] || c.platform).split(' ')[0]) + ' · added by hand</span></td>' +
              '<td><span class="pill dim">By hand</span>' +
              (a.settings ? ' <button class="xbtn" data-act="dropCampaign" data-id="' + esc(c.id) +
                '" title="Remove" aria-label="Remove ' + esc(c.name) + '">&times;</button>' : '') + '</td>' +
              '<td class="num">' + (a.cost ? (c.spend ? ZS.money(c.spend) : '-') : '₹ ••••') + '</td>' +
              '<td class="byhand" colspan="3">Not pulled. Spend is the figure typed in.</td>' +
              '<td class="num ours">' + n(enq) + '</td><td class="num">-</td><td class="num">' + n(won) + '</td>' +
              '<td class="num">' + (a.cost ? ZS.money(Math.round(board.wonVal[c.id] || 0)) : '₹ ••••') + '</td>' +
              '<td class="num">' + per(enq) + '</td><td class="num">' + per(won) + '</td></tr>';
          }).join('')
        : '') +
      '</tbody></table></div></section>';
    return h;
  };

  /* one campaign opened: its ad sets, each followed by its ads */
  function drill(id, a, pulled, board, r) {
    var c = pulled.filter(function (x) { return x.id === id; })[0];
    if (!c) {
      return '<div class="ph"><div><h1>Campaigns</h1><p>' +
        (META ? 'That campaign is not in the last pull.' : 'Reading it…') + '</p></div></div>';
    }
    var sets = c.adsets || [];
    var nAds = sets.reduce(function (t, s) { return t + (s.ads || []).length; }, 0);
    var sum = function (s, m) { return (s.ads || []).reduce(function (t, x) { return t + (m[x.id] || 0); }, 0); };
    var conv = (META && META.convAd) || {};
    var h = '<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">' +
      '<a class="crumb" href="#/campaigns">Campaigns</a><span class="crumb-sep">/</span>' +
      '<span class="crumb now asis">' + esc(c.name) + '</span></div>' +
      '<div class="ph"><div><h1 style="font-size:20px">' + esc(c.name) + '</h1><p>' + pill(c.status) + ' ' +
      esc((GOAL[c.objective] || 'campaign').replace(/^./, function (x) { return x.toUpperCase(); })) + ' · ' +
      sets.length + ' ad set' + (sets.length === 1 ? '' : 's') + ', ' + nAds + ' ad' + (nAds === 1 ? '' : 's') +
      ' · ' + esc(ZS.rangeLabel(r)) + ((META && META.lastOk) ? ' · last pulled ' + esc(said(META.lastOk)) : '') +
      '</p></div><div class="right"><a class="btn alt" target="_blank" rel="noopener" ' +
      'href="https://adsmanager.facebook.com/adsmanager/manage/campaigns?selected_campaign_ids=' +
      encodeURIComponent(c.id) + '">Open in Meta Ads Manager</a></div></div>';
    h += G.rangeBar();
    h += '<section class="card" style="padding:0"><div class="scroller"><table class="tbl stick1">' +
      head('Ad set and its ads') + '<tbody>' +
      (sets.length ? sets.map(function (s) {
        var ads = s.ads || [];
        return '<tr><td><b>' + esc(s.name) + '</b><span class="sub">Ad set · ' + ads.length + ' ad' +
          (ads.length === 1 ? '' : 's') + '</span></td><td>' + pill(s.status) + '</td>' +
          cells(s, sum(s, board.enqAd), sum(s, board.wonAd), a, sum(s, conv), sum(s, board.wonValAd)) + '</tr>' +
          ads.map(function (x) {
            return '<tr class="child"><td><b>' + esc(x.name) + '</b><span class="sub">Ad</span></td>' +
              '<td>' + pill(x.status) + '</td>' +
              cells(x, board.enqAd[x.id] || 0, board.wonAd[x.id] || 0, a, conv[x.id] || 0, board.wonValAd[x.id] || 0) + '</tr>';
          }).join('');
      }).join('') : '<tr><td colspan="12">No ad sets in this campaign.</td></tr>') +
      '</tbody></table></div></section>';
    return h;
  }

  Object.assign(A, {
    campChip: function (k) { CHIP = k; G.render(); },
    campClear: function () { Q = ''; G.render(); },
    openCampaign: function (id) { G.go('#/campaigns/' + id); },
    metaRefresh: function () {
      if (BUSY) return;
      if (!window.API || !API.signedIn()) return G.toast('Sign in to the server first.', true);
      BUSY = true; G.render();
      API.metaRefresh().then(function (out) {
        BUSY = false; FAILED = null; KEY = null;
        G.toast('Refreshed. ' + ((out && out.counts) ? out.counts.campaigns + ' campaigns, ' : '') +
          said(new Date().toISOString()).replace(' today', '') + '.');
        G.render();
      }).catch(function () {
        BUSY = false; FAILED = new Date().toISOString();
        G.render();
      });
    },
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
      if (used) return G.toast(used + ' engagement' + (used === 1 ? ' is' : 's are') +
        ' tagged with it. Removing it would lose where they came from.', true);
      D().campaigns = (D().campaigns || []).filter(function (c) { return c.id !== id; });
      G.save(); G.toast('Removed.'); G.render();
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'campq') {
      Q = String(e.target.value || '').toLowerCase().trim();
      G.render();
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
                                        spend: Number(fd.get('spend')) || 0 }));
    G.log('auto_toggle', 'Campaign "' + name + '" added');
    G.save();
    document.getElementById('modal').close();
    G.toast(name + ' added.');
    G.render();
  };

  /* for the tests: put an answer in place as if the server had sent it */
  G.setMetaForTest = function (m) { META = m; KEY = G.range().from + '|' + G.range().to; };
})();
