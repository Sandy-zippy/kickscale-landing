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

  /* Campaigns is everything outbound: Meta ads, and WhatsApp messages sent to
     many people at once */
  function TABS(on) {
    return '<div class="tabs">' + [['meta', 'Meta ads', '#/campaigns'], ['wa', 'WhatsApp campaigns', '#/campaigns/wa']]
      .map(function (t) {
        return '<a class="tab' + (t[0] === on ? ' on' : '') + '" href="' + t[2] + '"' +
          (t[0] === on ? ' aria-current="page"' : '') + '>' + t[1] + '</a>';
      }).join('') + '</div>';
  }

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
    if (String(arg || '').indexOf('wa') === 0) return TABS('wa') + G.waCampaignsView(String(arg).slice(3));
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

    var h = TABS('meta') + '<div class="ph"><div><h1>Campaigns</h1><p>Every Meta campaign, pulled in. ' +
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

/* WhatsApp campaigns (Meta part 3B): one approved template to many people.

   WHO is picked here, in the browser, which holds the book: by filter over the
   clients and enquiries, or from an Excel sheet. Each person goes up with the
   words that fill the template for them. The SERVER is the judge of what goes:
   approved templates only, STOP always skipped (checked again a moment before
   each message), one per number, and never past the number's daily limit. The
   numbers on the "Check and send" card come from the same rules, so what the
   card says is what the server does. */
(function () {
  'use strict';
  var G = window.GE, A = G.ACTIONS;
  var esc = function (s) { return ZS.esc(s); };
  function D() { return G.D(); }
  var n = function (x) { return Number(x || 0).toLocaleString('en-IN'); };

  var LIST = null, LIST_KEY = null;     /* the list for the Date filter in LIST_KEY */
  var PLAN = null, PLAN_AT = 0;         /* who said STOP, the limit, used today, the rate */
  var ONE = {};                          /* id -> results */
  var CHIP = 'all', Q = '';
  var WB = null;                         /* the builder, while one is open */
  var CATW = { MARKETING: 'Marketing', UTILITY: 'Utility', AUTHENTICATION: 'Authentication' };

  function api() { return window.API && API.signedIn(); }
  function plan(force) {
    if (!api()) return PLAN;
    if (!force && PLAN && Date.now() - PLAN_AT < 60000) return PLAN;
    PLAN_AT = Date.now();
    API.waPlan().then(function (p) { PLAN = p; redraw(); }).catch(function () {});
    return PLAN;
  }
  function redraw() { if (location.hash.indexOf('#/campaigns/wa') === 0) G.render(); }
  function loadList(force) {
    var r = G.range(), key = r.from + '|' + r.to;
    if (!api() || (!force && key === LIST_KEY)) return;
    LIST_KEY = key;
    API.waCampaigns(r.from, r.to).then(function (o) { LIST = (o && o.campaigns) || []; redraw(); })
      .catch(function () { LIST = LIST || []; redraw(); });
  }
  function loadOne(id) {
    if (!api()) return;
    API.waCampaign(id).then(function (o) { ONE[id] = o; redraw(); }).catch(function (e) {
      ONE[id] = { error: (e && e.message) || 'It could not be read.' }; redraw();
    });
  }
  function approved() {
    var t = G.waTemplatesNow ? G.waTemplatesNow() : null;
    return ((t && t.templates) || []).filter(function (x) { return x.status === 'APPROVED'; });
  }
  function nOf(text) {
    var m = 0;
    String(text || '').replace(/\{\{\s*(\d+)\s*\}\}/g, function (w, k) { m = Math.max(m, Number(k)); return w; });
    return m;
  }
  function when(iso) { return G.whenSaid ? G.whenSaid(iso) : String(iso || '').slice(0, 16); }
  function dayWord(d) { return d.getDate() + ' ' + d.toLocaleString('en-GB', { month: 'short' }); }

  /* ---------------- who: one person per number ---------------- */

  /* digits as WhatsApp wants them: country code first, no plus, no leading 0 */
  function toNum(dial, digits) {
    var d = String(dial || '').replace(/\D/g, '');
    var x = String(digits || '').replace(/\D/g, '').replace(/^0+/, '');
    if (!d || !x) return '';
    if (x.length > 10 && x.indexOf(d) === 0) x = x.slice(d.length);
    return ZS.validPhone(dial, x) ? d + x : '';
  }
  function personOf(c, o) {
    var ct = o ? ZS.oppContact(o, c) : ZS.primaryContact(c);
    var dial = (ct && ct.dial) || (c && c.dial) || ZS.DEFAULT_DIAL;
    var digits = (ct && ct.mobile) || (c && c.mobile) || '';
    return { name: (ct && ct.name) || (c && c.name) || '', company: c ? c.name : '', client_id: c ? c.id : null,
             to: toNum(dial, digits), raw: digits,
             ctx: { client: c, contact: ct, opp: o || null, me: G.me(),
                    invoice: o ? (D().invoices || []).filter(function (i) { return i.opp === o.id; })[0] || null : null,
                    owed: o && ZS.owedOn ? ZS.owedOn(D().invoices, o.id) : 0 } };
  }

  var FIELDS = {
    who: { label: 'Who', opts: function () { return [['clients', 'Clients'], ['enquiries', 'Enquiries']]; } },
    stage: { label: 'Stage', opts: function () { return ZS.STAGES.map(function (x) { return [x, x]; }); } },
    source: { label: 'Source', opts: function () { return Object.keys(ZS.SOURCES).map(function (k) { return [k, String(ZS.SOURCES[k]).split(' \u2014 ')[0]]; }); } },
    sector: { label: 'Sector', opts: function () {
      var seen = {};
      (D().clients || []).forEach(function (c) { if (c.sector) seen[c.sector] = 1; });
      return Object.keys(seen).sort().map(function (x) { return [x, x]; });
    } }
  };
  function condOf(f) { return (WB.conds.filter(function (c) { return c.f === f; })[0] || {}).v || ''; }

  /* the people the filter picks, before anybody is left out */
  function byFilter() {
    var who = condOf('who') || 'enquiries', stage = condOf('stage'), src = condOf('source'), sec = condOf('sector');
    var out = [];
    if (who === 'clients') {
      (D().clients || []).forEach(function (c) {
        if (sec && c.sector !== sec) return;
        var cd = String(c.created || c.since || '').slice(0, 10);
        if (cd && !G.inRange(cd)) return;
        var opps = (D().opportunities || []).filter(function (o) { return o.client === c.id; });
        if (stage && !opps.some(function (o) { return o.stage === stage; })) return;
        if (src && c.source !== src && !opps.some(function (o) { return o.source === src; })) return;
        out.push(personOf(c, opps.filter(ZS.isOpen)[0] || opps[0] || null));
      });
    } else {
      (D().opportunities || []).forEach(function (o) {
        var c = G.clientById(o.client);
        if (stage ? o.stage !== stage : !ZS.isOpen(o)) return;
        if (src && o.source !== src) return;
        if (sec && (!c || c.sector !== sec)) return;
        if (!G.inRange(String(o.created || '').slice(0, 10))) return;
        out.push(personOf(c, o));
      });
    }
    return out;
  }

  /* the words for each {{n}}: the field picked, else the fallback typed */
  function varsFor(p, t) {
    var out = [];
    for (var i = 0; i < nOf(t.body); i++) {
      var f = WB.fills[i] || { field: '', fallback: '' }, v = '';
      if (f.field && p.ctx) {
        var r = ZS.waFill('{{' + f.field + '}}', p.ctx);
        v = r.missing.length ? '' : r.text;
      }
      out.push(String(v || f.fallback || '').trim());
    }
    return out;
  }

  /* the card's ledger, by the server's own rules */
  function tally() {
    var t = tplOf(), people = WB.mode === 'excel' ? (WB.rows || []).filter(function (r) { return !r.bad; }) : byFilter();
    var stop = {}; ((PLAN && PLAN.stop) || []).forEach(function (x) { stop[x] = 1; });
    var seen = {}, k = { match: people.length, stop: 0, nonumber: 0, dup: 0, blank: 0, will: 0, list: [] };
    people.forEach(function (p) {
      var why = '';
      if (!p.to) why = 'nonumber';
      else if (stop[p.to.slice(-9)]) why = 'stop';
      else if (seen[p.to.slice(-9)]) why = 'dup';
      else if (t && varsFor(p, t).some(function (v) { return !v; })) why = 'blank';
      if (p.to) seen[p.to.slice(-9)] = 1;
      if (why) k[why]++; else k.will++;
      k.list.push({ p: p, why: why });
    });
    return k;
  }

  function tplOf() {
    if (!WB || !WB.tpl) return null;
    return approved().filter(function (x) { return x.name + '|' + x.language === WB.tpl; })[0] || null;
  }

  /* ---------------- the screens ---------------- */

  G.waCampaignsView = function (rest) {
    if (!G.acc().clients) return G.deny('Not in your view', 'WhatsApp campaigns are switched off for your role.');
    if (!api()) {
      return '<div class="card pad"><p class="m">Sign in to the server to send WhatsApp campaigns. They go out from ' +
        'the server, a few at a time, so they keep going with this page closed.</p></div>';
    }
    if (rest === 'new' || rest.indexOf('new/') === 0) return builder(rest.slice(4));
    if (rest) return results(rest);
    return list();
  };

  var STATUS = { scheduled: ['Scheduled', 'info'], sending: ['Sending', 'warn'], sent: ['Sent', 'ok'],
                 cancelled: ['Called off', 'dim'] };
  function spill(st) { var p = STATUS[st] || [st, 'dim']; return '<span class="pill ' + p[1] + '">' + p[0] + '</span>'; }

  function list() {
    loadList();
    var rows = (LIST || []).filter(function (c) {
      if (CHIP !== 'all' && c.status !== CHIP) return false;
      return !Q || (c.name + ' ' + c.template).toLowerCase().indexOf(Q) >= 0;
    });
    var cnt = function (st) { return (LIST || []).filter(function (c) { return st === 'all' || c.status === st; }).length; };
    var h = '<div class="ph"><div><h1>WhatsApp campaigns</h1><p>Messages sent to many people at once, from ' +
      '+91 99893 98484. STOP from anyone takes them off every campaign for good.</p></div>' +
      (G.acc().settings ? '<div class="right"><a class="btn" href="#/campaigns/wa/new">+ New WhatsApp campaign</a></div>' : '') +
      '</div>' + G.rangeBar();
    h += '<div class="chips" style="margin-bottom:12px">' +
      [['all', 'All'], ['scheduled', 'Scheduled'], ['sending', 'Sending'], ['sent', 'Sent'], ['cancelled', 'Called off']]
        .map(function (c) {
          return '<button class="chip" data-act="wcChip" data-id="' + c[0] + '" aria-pressed="' +
            (CHIP === c[0] ? 'true' : 'false') + '">' + c[1] + '<i>' + cnt(c[0]) + '</i></button>';
        }).join('') +
      '<input type="search" id="wcq" placeholder="Search campaigns" value="' + esc(Q) + '"></div>';
    if (LIST === null) return h + '<div class="card pad"><p class="m">Reading the campaigns…</p></div>';
    if (!rows.length) {
      return h + '<div class="card pad"><p class="m">' + (LIST.length ? 'Nothing on this filter.'
        : 'No WhatsApp campaign in these dates. ' + (G.acc().settings ? '<a href="#/campaigns/wa/new">Make the first one</a>.' : '')) + '</p></div>';
    }
    var pct = function (a, b) { return b ? ' · ' + Math.round(100 * a / b) + '%' : ''; };
    return h + '<section class="card" style="padding:0"><div class="scroller"><table class="tbl stick1"><thead><tr>' +
      '<th>Campaign</th><th>Status</th><th>Sent on</th><th class="num">People</th><th class="num">Delivered</th>' +
      '<th class="num">Read</th><th class="num">Replied</th><th class="num">Failed</th></tr></thead><tbody>' +
      rows.map(function (c) {
        return '<tr data-act="wcOpen" data-id="' + esc(c.id) + '" style="cursor:pointer"><td><b>' + esc(c.name) +
          '</b><span class="sub">' + esc(c.template) + '</span></td><td>' + spill(c.status) + '</td>' +
          '<td>' + esc(when(c.started_at || c.send_at)) + '</td><td class="num">' + n(c.people) + '</td>' +
          '<td class="num">' + n(c.delivered) + pct(c.delivered, c.sent) + '</td><td class="num">' + n(c.seen) + pct(c.seen, c.sent) +
          '</td><td class="num">' + n(c.replied) + '</td><td class="num">' + n(c.failed) + '</td></tr>';
      }).join('') + '</tbody></table></div></section>';
  }

  /* ---------------- the builder ---------------- */

  function fresh(copy) {
    var d = new Date(Date.now() + 86400000);
    WB = { mode: 'filter', conds: [{ f: 'who', v: 'enquiries' }], rows: null, bad: [], read: 0, tpl: '', fills: [],
           how: 'now', date: ZS.today ? d.toISOString().slice(0, 10) : '', time: '10:30', name: '', busy: false, err: '' };
    if (copy) {
      WB.tpl = copy.template + '|' + copy.language;
      WB.fills = (copy.fills || []).map(function (f) { return { field: f.field || '', fallback: f.fallback || '' }; });
      WB.name = copy.name + ' (again)';
      if (copy.audience && copy.audience.conds) WB.conds = copy.audience.conds.slice();
    }
  }
  function guessFills() {
    var t = tplOf();
    if (!t) { WB.fills = []; return; }
    var out = [];
    for (var i = 0; i < nOf(t.body); i++) {
      var had = WB.fills[i];
      out.push(had && (had.field || had.fallback) ? had
        : { field: (t.fills || [])[i] || ZS.waGuess(t, i), fallback: i === 0 ? 'there' : '' });
    }
    WB.fills = out;
  }

  function builder(copyId) {
    if (!G.acc().settings) return G.deny('Not in your view', 'Sending campaigns is the owner’s.');
    if (!WB) {
      var src = copyId && ONE[copyId] && ONE[copyId].campaign;
      fresh(src || null);
      guessFills();
    }
    plan();
    var tpls = approved(), t = tplOf(), k = tally();
    var p = PLAN || {}, tier = p.tier || { cap: 250, assumed: true };
    var room = tier.cap === null ? Infinity : Math.max(0, tier.cap - (p.used || 0));
    var rate = (p.rate || {})[t ? t.category : 'MARKETING'] || 0;
    var stepNow = !k.match ? 1 : !t ? 2 : 4;

    var h = '<div class="ph" style="margin-bottom:14px"><div><a class="crumb" href="#/campaigns/wa">WhatsApp campaigns</a> ' +
      '<span class="crumb-sep">/</span> <span class="crumb now asis">New campaign</span>' +
      '<h1 style="margin-top:6px">New WhatsApp campaign</h1></div></div>';
    h += '<div class="stagestrip" style="margin-bottom:16px">' +
      [['wb1', 'Who gets it'], ['wb2', 'The message'], ['wb3', 'When'], ['wb4', 'Check and send']].map(function (s, i) {
        var cls = i + 1 < stepNow ? ' done' : i + 1 === stepNow ? ' now' : '';
        return '<button class="stagebtn' + cls + '" type="button" data-act="wcStep" data-id="' + s[0] + '"><i>' + (i + 1) + '</i>' + s[1] + '</button>';
      }).join('') + '</div>';

    h += '<div class="twocol"><div>';
    /* 1 · who */
    h += '<div class="fgroup" id="wb1"><h4>1 · Who gets it</h4><div class="fbody" style="grid-template-columns:1fr">' +
      '<div class="modes">' + [['filter', 'Pick by filter'], ['excel', 'Upload an Excel']].map(function (m) {
        return '<label class="modepick"><input type="radio" name="wb-mode" value="' + m[0] + '" data-wbmode="1"' +
          (WB.mode === m[0] ? ' checked' : '') + '> ' + m[1] + '</label>'; }).join('') + '</div>';
    if (WB.mode === 'filter') {
      h += '<div>' + WB.conds.map(function (c, i) {
        return '<div class="condrow"><select class="condv" aria-label="Field" data-wbcf="' + i + '">' +
          Object.keys(FIELDS).map(function (f) {
            return '<option value="' + f + '"' + (c.f === f ? ' selected' : '') + '>' + FIELDS[f].label + '</option>'; }).join('') +
          '</select><span class="condv">is</span><select class="condv" aria-label="Value" data-wbcv="' + i + '">' +
          (c.f === 'who' ? '' : '<option value="">Any</option>') +
          FIELDS[c.f].opts().map(function (o) {
            return '<option value="' + esc(o[0]) + '"' + (c.v === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') +
          '</select>' + (i ? '<button class="xbtn" type="button" data-act="wcDropCond" data-id="' + i + '" aria-label="Remove">&times;</button>' : '<span></span>') + '</div>';
      }).join('') +
        (WB.conds.length < 4 ? '<button class="minibtn" type="button" data-act="wcAddCond">+ Add a filter</button>' : '') +
        '<div style="margin-top:10px">' + G.rangeBar('Date filter on when they came in. ' + ZS.rangeLabel(G.range())) + '</div>' +
        '<p class="countline"><span><b>' + n(k.match) + '</b> match. <b>' + n(k.stop) + '</b> said STOP and are left out.</span>' +
        '<button class="minibtn" type="button" data-act="wcSeeWho">See who</button></p></div>';
    } else {
      h += '<div class="stepbox" style="margin-top:0"><div class="scanrow" style="margin-top:0">' +
        '<button class="minibtn" type="button" data-act="wcSample">Download sample</button>' +
        '<label class="upl">Upload the Excel<input type="file" id="wb-file" accept=".xlsx" hidden></label>' +
        '<span class="hint">The sample is made now, with today’s country codes, stages and sources in its dropdowns.</span></div>' +
        (WB.rows ? '<p class="countline"><span><b>' + n(WB.read) + '</b> rows read. <b>' + n(WB.rows.filter(function (r) { return !r.bad; }).length) +
          '</b> ready.' + (WB.bad.length ? ' <b>' + WB.bad.length + '</b> need a fix: ' + esc(badWords()) + '.' : '') + '</span>' +
          (WB.bad.length ? '<button class="minibtn" type="button" data-act="wcBadOut">Download the ' + WB.bad.length + '</button>' : '') + '</p>' +
          (WB.bad.length ? '<div class="card" style="padding:0;margin-top:8px">' + WB.bad.slice(0, 8).map(function (r) {
            return '<div class="pickrow"><div class="t"><b>Row ' + r.n + ': ' + esc(r.name || 'no name') + '</b><span>' + esc(r.bad) + '</span></div></div>';
          }).join('') + (WB.bad.length > 8 ? '<p class="hint" style="padding:8px 12px;margin:0">and ' + (WB.bad.length - 8) + ' more in the download.</p>' : '') + '</div>' : '')
          : '') + '</div>';
    }
    h += '</div></div>';

    /* 2 · the message */
    h += '<div class="fgroup" id="wb2"><h4>2 · The message</h4><div class="fbody" style="grid-template-columns:1fr">' +
      '<div class="f"><label for="wb-tpl">Approved template</label><select id="wb-tpl"><option value="">Pick an approved template</option>' +
      tpls.map(function (x) {
        return '<option value="' + esc(x.name + '|' + x.language) + '"' + (WB.tpl === x.name + '|' + x.language ? ' selected' : '') + '>' +
          esc(x.name + ' · ' + (CATW[x.category] || x.category) + ' · ' + x.language) + '</option>'; }).join('') +
      '</select><span class="hint">Pending and rejected templates are not offered. <a href="#/settings/whatsapp" style="color:var(--accent)">Write a new one</a></span></div>';
    if (t && nOf(t.body)) {
      var groups = ZS.waVarGroups();
      h += '<div class="f"><label>Fill each variable</label><div class="opthead"><span>From this field</span><span>If it is empty, use</span></div><div class="opts">' +
        WB.fills.map(function (f, i) {
          return '<div class="optrow"><span class="optn">' + (i + 1) + '</span><select aria-label="Variable ' + (i + 1) + ' field" data-wbff="' + i + '">' +
            '<option value="">Nothing: always the fallback</option>' + groups.map(function (g) {
              return '<optgroup label="' + esc(g) + '">' + ZS.WA_VARS.filter(function (v) { return v.group === g; }).map(function (v) {
                return '<option value="' + v.key + '"' + (f.field === v.key ? ' selected' : '') + '>' + esc(v.label) + '</option>'; }).join('') + '</optgroup>';
            }).join('') + '</select><input aria-label="Variable ' + (i + 1) + ' if empty" data-wbfb="' + i + '" value="' + esc(f.fallback) + '" placeholder="Leave empty to skip them"></div>';
        }).join('') + '</div><span class="hint">No fallback and an empty field: that person is skipped and listed as Blank field.</span></div>';
    }
    h += '</div></div>';

    /* 3 · when */
    h += '<div class="fgroup" id="wb3"><h4>3 · When</h4><div class="fbody">' +
      '<div class="f wide" style="grid-column:1/-1"><div class="modes">' + [['now', 'Send now'], ['schedule', 'Schedule']].map(function (m) {
        return '<label class="modepick"><input type="radio" name="wb-how" value="' + m[0] + '" data-wbhow="1"' + (WB.how === m[0] ? ' checked' : '') + '> ' + m[1] + '</label>'; }).join('') + '</div></div>' +
      (WB.how === 'schedule' ? '<div class="f"><label for="wb-d">Date</label><input id="wb-d" type="date" value="' + esc(WB.date) + '"></div>' +
        '<div class="f"><label for="wb-t">Time, India</label><input id="wb-t" type="time" value="' + esc(WB.time) + '"></div>' : '') +
      '<span class="hint" style="grid-column:1/-1">Goes out at a steady pace, not all at once, so the number stays healthy.</span></div></div>';
    h += '</div>';

    /* 4 · check and send */
    var fits = k.will <= room;
    var cost = Math.round(k.will * rate);
    var startAt = WB.how === 'schedule' ? new Date(WB.date + 'T' + (WB.time || '10:30') + ':00+05:30') : new Date();
    var lock = G.waBlocked ? G.waBlocked() : null;
    var why = lock ? lock : !k.will ? 'Nobody is left to send to.' : !t ? 'Pick a template.' : String(WB.name || '').trim().length < 2 ? 'Give the campaign a name.'
      : WB.how === 'schedule' && (isNaN(startAt) || startAt.getTime() < Date.now()) ? 'Pick a date and time that has not passed.' : '';
    h += '<div class="waside" id="wb4"><section class="card pad"><div class="cardhead"><h3>4 · Check and send</h3>' +
      (lock ? '<span class="pill warn">Sending locked</span>' : fits ? '<span class="pill ok">Fits today</span>' : '<span class="pill warn">Over today’s limit</span>') + '</div>' +
      (lock ? '<p class="closed locked" data-locked="campaign" style="margin:0 0 10px">' + esc(lock) + '</p>' : '') +
      '<ul class="ledger"><li><span>' + (WB.mode === 'excel' ? 'Ready rows in the Excel' : 'Match the filter') + '</span><b>' + n(k.match) + '</b></li>' +
      '<li><span>Said STOP, left out</span><b>' + n(k.stop) + '</b></li>' +
      '<li><span>No WhatsApp number</span><b>' + n(k.nonumber) + '</b></li>' +
      (k.dup ? '<li><span>Same number twice, sent once</span><b>' + n(k.dup) + '</b></li>' : '') +
      (k.blank ? '<li><span>Blank field, no fallback</span><b>' + n(k.blank) + '</b></li>' : '') +
      '<li class="tot"><span>Will get it</span><b>' + n(k.will) + '</b></li>' +
      '<li><span>Daily limit on this number</span><b>' + (tier.cap === null ? 'no limit' : n(tier.cap) + ' new chats') + '</b></li>' +
      '<li><span>Cost, estimate</span><b>about ₹' + n(cost) + '</b></li></ul>' +
      '<p class="hint" style="margin:8px 0 12px">Estimate from Meta’s rate for ' + esc(CATW[t ? t.category : 'MARKETING'] || 'Marketing') +
      ' messages in India, ₹' + rate + ' each before GST (rate card of ' + esc((p.rate || {}).date || '1 Jan 2026') + '). The real figure is on Meta’s bill.' +
      (tier.assumed ? ' The limit of 250 is assumed until Meta reports the tier.' : '') + '</p>' +
      '<div class="f"><label for="wb-name">Campaign name</label><input id="wb-name" value="' + esc(WB.name) + '" placeholder="Proposal follow-up, Oct"></div>' +
      '<p class="err" id="wb-why"' + (why || WB.err ? '' : ' hidden') + '>' + esc(WB.err || why) + '</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn" type="button" id="wb-go" data-act="wcSend"' + G.waLock() +
      (why || WB.busy ? ' disabled' : '') + '>' + (WB.busy ? 'Saving…' : (WB.how === 'schedule' ? 'Schedule for ' : 'Send to ') + n(k.will) + ' ' + (k.will === 1 ? 'person' : 'people')) + '</button>' +
      '<button class="btn alt" type="button" data-act="wcTest"' + G.waLock() + (t && !lock ? '' : ' disabled' + (lock ? '' : ' aria-disabled="true"')) + '>Send me a test</button></div>' +
      '<p class="hint" style="margin-top:10px">STOP from anyone, at any time, takes them off every campaign for good. ' +
      'Send me a test goes to your own number only.</p></section>';
    if (!fits && room !== Infinity) {
      var d1 = startAt, d2 = new Date(startAt.getTime() + 86400000);
      h += '<div class="wbar warn" style="margin-top:12px"><span>' + n(k.will - room) + ' do not fit ' +
        (room < (tier.cap || 0) ? 'in what is left today' : 'in one day') + '. ' + n(room) + ' go on ' + dayWord(d1) + ', the other ' +
        n(k.will - room) + ' from ' + dayWord(d2) + ' at the same time, by themselves.</span></div>';
    }
    if (t) {
      var firstP = (k.list.filter(function (x) { return !x.why; })[0] || {}).p;
      h += '<div style="margin-top:12px">' + G.waPhone(t, firstP ? varsFor(firstP, t) : ((t.samples || {}).body || []), [], { short: true }) +
        '<span class="hint" style="display:block;text-align:center;margin-top:8px">' +
        (firstP ? 'The first person’s message, as it will read.' : 'With Meta’s samples until somebody is picked.') + '</span></div>';
    }
    h += '</div></div>';
    return h;
  }

  function badWords() {
    var by = {};
    WB.bad.forEach(function (r) { by[r.bad] = (by[r.bad] || 0) + 1; });
    return Object.keys(by).map(function (w) { return by[w] + ' ' + w.toLowerCase(); }).join(', ');
  }

  /* ---------------- results ---------------- */

  var FAIL = [
    [/not (a valid )?whatsapp|no whatsapp|undeliverable|131026|not in allowed list/i, 'Not on WhatsApp', 'their end',
     'The number has no WhatsApp account, or could not take it.', 'check the number on the record, or call them.'],
    [/ecosystem|healthy|marketing messages|131049/i, 'Meta held it back', 'Meta’s rule, not your message',
     'These people had many marketing messages from businesses lately, so Meta held some back.', 'nothing today. Do not resend for a few days.'],
    [/limit|spam rate|131048|130429/i, 'Over today’s limit', 'ours to plan',
     'The number reached its new chats for the day.', 'Try again tomorrow from the conversation.'],
    [/paused|disabled|removed the template/i, 'Template paused', 'Meta’s rule',
     'Meta paused or removed the template before these went.', 'copy the campaign with another approved template.'],
    [/once Meta approves/i, 'Waiting for Meta', 'Meta’s review',
     'Sending from the cockpit opens once Meta approves our WhatsApp access (submitted 18 Oct).', 'nothing to do; it opens when Meta approves.'],
    [/stopped half way/i, 'Stopped half way', 'ours',
     'The cockpit stopped in the middle of sending. It may have gone.', 'open the conversation before trying again.'],
    [/./, 'WhatsApp did not take it', 'unclear',
     'WhatsApp did not say why in a way the cockpit knows.', 'Try again from the conversation; if it fails twice, check Settings, Connections.']
  ];
  function failKind(why) { for (var i = 0; i < FAIL.length; i++) if (FAIL[i][0].test(String(why || ''))) return i; return FAIL.length - 1; }

  function results(id) {
    var o = ONE[id];
    if (!o) { loadOne(id); return '<div class="card pad"><p class="m">Reading the campaign…</p></div>'; }
    if (o.error) return '<div class="card pad"><p class="m">' + esc(o.error) + ' <a href="#/campaigns/wa">Back to the list</a></p></div>';
    var c = o.campaign, sends = o.sends || [];
    var pct = function (a) { return c.sent ? ' · ' + Math.round(100 * a / c.sent) + '%' : ''; };
    var failed = sends.filter(function (s) { return s.status === 'failed' || s.state === 'failed'; });
    var stops = sends.filter(function (s) { return s.reason === 'stop'; }).length + o.replies.filter(function (r) { return r.opted_out_at; }).length;
    var h = '<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><a class="crumb" href="#/campaigns/wa">WhatsApp campaigns</a>' +
      '<span class="crumb-sep">/</span><span class="crumb now asis">' + esc(c.name) + '</span></div>' +
      '<div class="ph"><div><h1>' + esc(c.name) + '</h1><p>' + spill(c.status) + ' ' + esc(c.template) + ' to ' + n(c.people) + ' ' +
      (c.people === 1 ? 'person' : 'people') + '. ' +
      (c.started_at ? 'Started ' + esc(when(c.started_at)) + (c.finished_at ? ', finished ' + esc(when(c.finished_at)) : '') + '. '
        : 'Goes out ' + esc(when(c.send_at)) + '. ') +
      'Figures as Meta reported them, ' + esc(when(o.at || new Date().toISOString())) + '.</p></div>' +
      '<div class="right"><button class="btn alt" data-act="wcCheck" data-id="' + esc(c.id) + '">Check Meta again</button>' +
      (G.acc().settings ? '<button class="btn alt" data-act="wcCopy" data-id="' + esc(c.id) + '">Copy as a new campaign</button>' : '') +
      (G.acc().delete && (c.status === 'sent' || c.status === 'cancelled') ? '<button class="btn alt" data-act="wcDrop" data-id="' + esc(c.id) + '">Delete</button>' : '') +
      '</div></div>';
    if (c.status === 'scheduled' || c.status === 'sending') {
      var soon = c.status === 'scheduled' && new Date(c.send_at).getTime() - Date.now() < 15000;
      h += '<div class="wbar' + (soon ? ' warn' : '') + '"><span>' + (c.status === 'sending'
        ? '<b>' + n(c.tried) + ' of ' + n(c.people) + ' sent.</b> The rest go a few at a time, with this page open or closed.'
        : soon ? '<b>Goes out in a few seconds.</b> Changed your mind?' : '<b>Scheduled for ' + esc(when(c.send_at)) + '.</b>') + '</span>' +
        (G.acc().settings ? '<button class="minibtn" data-act="wcCancel" data-id="' + esc(c.id) + '">' + (soon ? 'Undo' : 'Call it off') + '</button>' : '') + '</div>';
      setTimeout(function () { if (location.hash === '#/campaigns/wa/' + id) loadOne(id); }, soon ? 4000 : 20000);
    }
    h += '<div class="kpis" style="margin-bottom:14px">' +
      '<div class="kpi"><b class="num">' + n(c.sent) + '</b><span>Sent</span></div>' +
      '<div class="kpi"><b class="num">' + n(c.delivered) + pct(c.delivered) + '</b><span>Delivered</span></div>' +
      '<div class="kpi"><b class="num">' + n(c.seen) + pct(c.seen) + '</b><span>Read</span></div>' +
      '<div class="kpi ok"><b class="num">' + n(c.replied) + pct(c.replied) + '</b><span>Replied</span></div>' +
      '<div class="kpi' + (c.failed ? ' bad' : '') + '"><b class="num">' + n(c.failed) + '</b><span>Failed</span></div></div>';

    /* why they failed, grouped, in words */
    var groups = {};
    failed.forEach(function (s) { var k = failKind(s.fail || s.reason); (groups[k] = groups[k] || []).push(s); });
    var left = c.counts || {};
    h += '<div class="twocol"><section class="card" style="padding:0"><div class="cardhead pad"><h3>' +
      (failed.length ? 'Why ' + failed.length + ' failed' : 'Nothing failed') + '</h3>' +
      (failed.length ? '<button class="minibtn" data-act="wcFailOut" data-id="' + esc(c.id) + '">Download the ' + failed.length + '</button>' : '') + '</div>' +
      Object.keys(groups).map(function (k) {
        var f = FAIL[k];
        return '<div class="failrow"><span class="failn">' + groups[k].length + '</span><div class="t"><b>' + esc(f[1]) + '</b><span>' + esc(f[2]) +
          '</span><p class="failwhy">' + esc(f[3]) + '</p><p class="failfix"><b>Do this:</b> ' + esc(f[4]) + '</p>' +
          groups[k].slice(0, 5).map(function (s) {
            return '<p class="hint" style="margin:4px 0 0">' + esc(s.name || ('+' + s.to_num)) +
              (s.message_id ? ' <button class="minibtn" data-act="wcRetry" data-id="' + esc(c.id + '|' + s.message_id) + '">Try again</button>' : '') + '</p>';
          }).join('') + '</div></div>';
      }).join('') +
      '<p class="hint" style="margin:0;padding:12px 14px">Left out before sending: ' + esc(leftWords(left, sends)) + '.</p></section>';
    h += '<section class="card" style="padding:0"><div class="cardhead pad"><h3>' + n(o.replies.length) + ' replied</h3>' +
      '<button class="minibtn" data-act="wcInbox" data-id="' + esc(c.id) + '">Open in the Inbox</button></div>' +
      (o.replies.length ? o.replies.slice(0, 30).map(function (r) {
        var opp = r.client_id ? (D().opportunities || []).filter(function (x) { return x.client === r.client_id && ZS.isOpen(x); })[0] : null;
        var tag = r.opted_out_at ? '<span class="pill warn">Said STOP</span>' : opp ? '<span class="pill dim">Enquiry</span>'
          : r.client_id ? '<span class="pill ok">Client</span>' : '';
        return '<div class="pickrow"><div class="t"><b>' + esc(r.name || ('+' + r.to_num)) + '</b><span>“' +
          esc(String(r.said || '').slice(0, 80)) + '” · ' + esc(when(r.at)) + '</span></div>' + tag + '</div>';
      }).join('') : '<p class="m pad">No reply yet.</p>') +
      '<p class="hint" style="margin:0;padding:12px 14px">Replies sit in the Inbox tagged with this campaign. ' +
      (stops ? n(stops) + ' said STOP and never get a campaign again.' : 'Nobody has said STOP.') + '</p></section></div>';
    /* History */
    h += '<section class="card pad" style="margin-top:14px"><div class="cardhead"><h3>History</h3></div>' +
      ((o.history || []).length ? '<ul class="ledger">' + o.history.map(function (x) {
        var who = x.by_staff ? ZS.staffById(x.by_staff) : null;
        return '<li><span>' + esc(x.text) + '</span><b style="font-weight:400;white-space:nowrap">' + esc(when(x.at)) +
          (who ? ' · ' + esc(who.name.split(' ')[0]) : '') + '</b></li>';
      }).join('') + '</ul>' : '<p class="m">Nothing yet.</p>') + '</section>';
    return h;
  }
  function leftWords(c, sends) {
    var k = { stop: 0, nonumber: 0, dup: 0, blank: 0, cancelled: 0 };
    sends.forEach(function (s) { if (s.status === 'skipped' && s.reason in k) k[s.reason]++; });
    var w = [];
    if (k.stop) w.push(k.stop + ' said STOP');
    if (k.nonumber) w.push(k.nonumber + ' had no WhatsApp number');
    if (k.dup) w.push(k.dup + ' were the same number twice');
    if (k.blank) w.push(k.blank + ' had a blank field');
    if (k.cancelled) w.push(k.cancelled + ' not sent because it was called off');
    return w.join(', ') || 'nobody';
  }

  /* ---------------- Excel: the sample, made now, and the upload, checked ---------------- */

  var EXCELJS = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
  function needXL(cb) {
    if (window.ExcelJS) return cb();
    var sc = document.createElement('script'); sc.src = EXCELJS; sc.onload = cb;
    sc.onerror = function () { G.toast('The Excel maker could not load. Check the internet connection.', true); };
    document.head.appendChild(sc);
  }
  var COLS = [['Name', 1], ['Company', 0], ['Country code', 1, 'codes'], ['Mobile', 1], ['Stage', 0, 'stages'], ['Source', 0, 'sources']];
  function lists() {
    return { codes: ZS.DIAL_CODES.map(function (d) { return d[0] + ' ' + d[1]; }), stages: ZS.STAGES.slice(),
             sources: Object.keys(ZS.SOURCES).map(function (k) { return String(ZS.SOURCES[k]).split(' \u2014 ')[0]; }) };
  }
  function download(wb, name) {
    wb.xlsx.writeBuffer().then(function (buf) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 500);
    });
  }
  function sample() {
    needXL(function () {
      var L = lists(), wb = new window.ExcelJS.Workbook();
      var fill = wb.addWorksheet('Fill this'), how = wb.addWorksheet('How to fill'), ls = wb.addWorksheet('Lists');
      var keys = Object.keys(L);
      keys.forEach(function (k, i) { ls.getCell(1, i + 1).value = k; L[k].forEach(function (v, r) { ls.getCell(r + 2, i + 1).value = v; }); });
      ls.state = 'hidden';
      fill.columns = COLS.map(function (c) { return { header: c[0] + (c[1] ? ' *' : ''), width: Math.max(16, c[0].length + 6) }; });
      fill.getRow(1).font = { bold: true }; fill.views = [{ state: 'frozen', ySplit: 1 }];
      COLS.forEach(function (c, i) {
        if (!c[2]) return;
        var letter = ls.getColumn(keys.indexOf(c[2]) + 1).letter, last = L[c[2]].length + 1;
        for (var r = 2; r <= 1001; r++) {
          fill.getCell(r, i + 1).dataValidation = { type: 'list', allowBlank: !c[1], showErrorMessage: true,
            formulae: ['Lists!$' + letter + '$2:$' + letter + '$' + last], errorTitle: 'Pick from the list', error: 'Choose a value from the dropdown.' };
        }
      });
      for (var r = 2; r <= 1001; r++) fill.getCell(r, 4).numFmt = '@';
      fill.addRow(['Ravi Teja', 'Teja Motors', '+91 India', '9876543210', 'Enquiry', 'Referral']);
      how.getCell('A1').value = 'ZippyScale: people for a WhatsApp campaign'; how.getCell('A1').font = { bold: true, size: 14 };
      how.getCell('A2').value = 'One row per person. Columns with * are required. The first row is an example: replace it.';
      how.getCell('A3').value = 'Mobile: the number only, without the country code. Pick the country code from its dropdown.';
      how.getCell('A4').value = 'Made on ' + ZS.today() + ' with today’s stages and sources. If they change, download a fresh sheet.';
      how.getCell('A5').value = 'Anybody who said STOP is left out by the cockpit, whatever the sheet says.';
      how.getColumn(1).width = 100;
      download(wb, 'ZippyScale-WhatsApp-campaign-sheet.xlsx');
      G.toast('The sheet is downloading, with today’s lists in its dropdowns.');
    });
  }
  function cellText(v) {
    if (v == null) return '';
    if (typeof v === 'object') v = v.text || v.result || (v.richText ? v.richText.map(function (x) { return x.text; }).join('') : '');
    return String(v).trim();
  }
  /* each row checked against today's lists, with the reason in words */
  function checkRows(raw) {
    var L = lists(), seen = {}, rows = [], bad = [];
    raw.forEach(function (r) {
      var v = r.v, name = v[0], code = String(v[2] || '').split(' ')[0], digits = String(v[3] || '').replace(/\D/g, '');
      var why = '';
      if (!digits) why = 'No number';
      else if (!code || !ZS.DIAL_CODES.some(function (d) { return d[0] === code; })) why = 'Country code not on the list';
      else if (!toNum(code, digits)) why = 'Not a mobile for ' + code;
      else if (v[4] && L.stages.indexOf(v[4]) < 0) why = 'Stage not on today’s list';
      else if (v[5] && L.sources.indexOf(v[5]) < 0) why = 'Source not on today’s list';
      var to = why ? '' : toNum(code, digits);
      if (!why && seen[to.slice(-9)]) why = 'Same number as row ' + seen[to.slice(-9)];
      if (to) seen[to.slice(-9)] = r.n;
      /* somebody already on the book fills from their real record */
      var c = to ? (D().clients || []).filter(function (x) {
        var k = ZS.primaryContact(x), m = String((k && k.mobile) || x.mobile || '').replace(/\D/g, '');
        return m && m.slice(-9) === to.slice(-9); })[0] : null;
      var p = c ? personOf(c, (D().opportunities || []).filter(function (o) { return o.client === c.id && ZS.isOpen(o); })[0] || null)
        : { name: name, company: v[1], client_id: null, to: to,
            ctx: { client: { name: v[1], source: v[5] }, contact: { name: name }, opp: v[4] ? { stage: v[4] } : null, me: G.me() } };
      p.to = to; p.n = r.n; p.bad = why; p.raw = v;
      rows.push(p);
      if (why) bad.push({ n: r.n, name: name, bad: why, v: v });
    });
    return { rows: rows, bad: bad };
  }
  function upload(file) {
    needXL(function () {
      var fr = new FileReader();
      fr.onload = function (e) {
        var wb = new window.ExcelJS.Workbook();
        wb.xlsx.load(e.target.result).then(function () {
          var ws = wb.getWorksheet('Fill this') || wb.worksheets[0], raw = [];
          ws.eachRow({ includeEmpty: false }, function (row, i) {
            if (i === 1) return;
            var v = COLS.map(function (c, k) { return cellText(row.getCell(k + 1).value); });
            if (v.some(function (x) { return x; })) raw.push({ n: i, v: v });
          });
          var out = checkRows(raw);
          WB.read = raw.length; WB.rows = out.rows; WB.bad = out.bad;
          G.render();
        }, function () { G.toast('That file could not be read. Download the sample and fill it.', true); });
      };
      fr.readAsArrayBuffer(file);
    });
  }
  function rowsOut(name, head, rows) {
    needXL(function () {
      var wb = new window.ExcelJS.Workbook(), ws = wb.addWorksheet('Fix these');
      ws.addRow(head).font = { bold: true };
      rows.forEach(function (r) { ws.addRow(r); });
      download(wb, name);
    });
  }

  /* ---------------- actions ---------------- */

  function sendIt() {
    var t = tplOf(), k = tally();
    if (!t || !k.will || WB.busy) return;
    WB.busy = true; WB.err = ''; G.render();
    var at = WB.how === 'schedule' ? new Date(WB.date + 'T' + (WB.time || '10:30') + ':00+05:30').toISOString() : null;
    var people = k.list.map(function (x) {
      return { to: x.p.to || '', name: x.p.name || x.p.company || '', client_id: x.p.client_id || null, vars: varsFor(x.p, t) };
    });
    API.waCampaignNew({ name: String(WB.name).trim(), template: t.name, language: t.language, how: WB.how, send_at: at,
      people: people, fills: WB.fills,
      audience: WB.mode === 'excel' ? { mode: 'excel', rows: WB.read } : { mode: 'filter', conds: WB.conds, range: G.range() } })
      .then(function (r) {
        WB = null; LIST_KEY = null; delete ONE[r.id];
        G.toast(at ? 'Scheduled for ' + when(at) + '.' : 'Going out in ten seconds. Undo is on the next screen.');
        G.go('#/campaigns/wa/' + r.id);
      }).catch(function (e) {
        if (e && e.data && e.data.blocked && G.setWaBlock) G.setWaBlock(e.message);
        WB.busy = false; WB.err = (e && e.message) || 'It was not saved. Nothing was sent.'; G.render();
      });
  }

  Object.assign(A, {
    wcChip: function (k) { CHIP = k; G.render(); },
    wcOpen: function (id) { G.go('#/campaigns/wa/' + id); },
    wcStep: function (id) { var el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    wcAddCond: function () {
      var used = WB.conds.map(function (c) { return c.f; });
      var f = Object.keys(FIELDS).filter(function (x) { return used.indexOf(x) < 0; })[0];
      if (f) WB.conds.push({ f: f, v: '' });
      G.render();
    },
    wcDropCond: function (i) { WB.conds.splice(Number(i), 1); G.render(); },
    wcSeeWho: function () {
      var k = tally(), W = { stop: 'Said STOP', nonumber: 'No WhatsApp number', dup: 'Same number twice', blank: 'Blank field' };
      G.modal('Who matches', k.match + ' people. Those left out say why.', '<div class="card" style="padding:0">' +
        (k.list.length ? k.list.slice(0, 300).map(function (x) {
          return '<div class="pickrow"><div class="t"><b>' + esc(x.p.name || x.p.company || 'No name') + '</b><span>' +
            esc([x.p.company, x.p.to ? '+' + x.p.to : ''].filter(Boolean).join(' · ')) + '</span></div>' +
            (x.why ? '<span class="pill ' + (x.why === 'stop' ? 'warn' : 'dim') + '">' + W[x.why] + '</span>' : '<span class="pill ok">Gets it</span>') + '</div>';
        }).join('') : '<p class="m pad">Nobody matches.</p>') + '</div>' +
        '<div style="margin-top:12px"><button class="btn alt" type="button" data-act="closeModal">Close</button></div>');
    },
    wcSample: sample,
    wcBadOut: function () {
      rowsOut('ZippyScale-WhatsApp-rows-to-fix.xlsx', COLS.map(function (c) { return c[0]; }).concat(['What to fix']),
        WB.bad.map(function (r) { return r.v.concat([r.bad]); }));
    },
    wcSend: sendIt,
    wcTest: function () {
      var t = tplOf(); if (!t || (G.waBlocked && G.waBlocked())) return;
      var first = (tally().list.filter(function (x) { return !x.why; })[0] || {}).p || {};
      API.waTestToMe({ template: t.name, language: t.language, vars: varsFor(first, t) })
        .then(function (r) { G.toast('Test sent to +' + r.to + ', your own number.'); })
        .catch(function (e) {
          if (e && e.data && e.data.blocked && G.setWaBlock) G.setWaBlock(e.message);
          G.toast((e && e.message) || 'The test did not go.', true);
        });
    },
    wcCancel: function (id) {
      API.waCampaignCancel(id).then(function (r) {
        G.toast(r.stopped + ' not sent. The campaign is called off.'); LIST_KEY = null; loadOne(id);
      }).catch(function (e) { G.toast((e && e.message) || 'It could not be called off.', true); });
    },
    wcCheck: function (id) { loadOne(id); G.toast('Asking again.'); },
    wcCopy: function (id) { WB = null; G.go('#/campaigns/wa/new/' + id); },
    wcDrop: function (id) {
      API.waCampaignDrop(id).then(function () {
        G.toast('Deleted. It is in the Bin for 30 days.'); LIST_KEY = null; delete ONE[id]; G.go('#/campaigns/wa');
      }).catch(function (e) { G.toast((e && e.message) || 'It was not deleted.', true); });
    },
    wcInbox: function (id) { if (G.inboxCampaign) G.inboxCampaign(id); },
    wcRetry: function (arg) {
      var p = String(arg).split('|');
      API.waRetry(p[1]).then(function () { G.toast('Sent again.'); loadOne(p[0]); })
        .catch(function (e) { G.toast((e && e.message) || 'It did not go again.', true); });
    },
    wcFailOut: function (id) {
      var o = ONE[id]; if (!o) return;
      rowsOut('ZippyScale-WhatsApp-failed.xlsx', ['Name', 'Number', 'Why'], (o.sends || []).filter(function (s) {
        return s.status === 'failed' || s.state === 'failed'; }).map(function (s) {
        var f = FAIL[failKind(s.fail || s.reason)]; return [s.name || '', '+' + (s.to_num || ''), f[1] + '. ' + f[3]]; }));
    }
  });

  document.addEventListener('input', function (e) {
    var el = e.target; if (!el) return;
    if (el.id === 'wcq') { Q = String(el.value || '').toLowerCase().trim(); G.render(); return; }
    if (!WB) return;
    if (el.id === 'wb-name') {
      WB.name = el.value;
      var go = document.getElementById('wb-go'), t = tplOf(), k = tally();
      var why = (G.waBlocked && G.waBlocked()) || (!k.will ? 'Nobody is left to send to.' : !t ? 'Pick a template.' : String(WB.name || '').trim().length < 2 ? 'Give the campaign a name.' : '');
      if (go) go.disabled = !!why;
      var w = document.getElementById('wb-why'); if (w) { w.textContent = why; w.hidden = !why; }
      return;
    }
    if (el.dataset && el.dataset.wbfb !== undefined) { WB.fills[Number(el.dataset.wbfb)].fallback = el.value; return; }
  });
  document.addEventListener('change', function (e) {
    var el = e.target; if (!el || !WB) return;
    var ds = el.dataset || {};
    if (ds.wbmode) { WB.mode = el.value; G.render(); return; }
    if (ds.wbhow) { WB.how = el.value; G.render(); return; }
    if (ds.wbcf !== undefined) { WB.conds[Number(ds.wbcf)] = { f: el.value, v: el.value === 'who' ? 'enquiries' : '' }; G.render(); return; }
    if (ds.wbcv !== undefined) { WB.conds[Number(ds.wbcv)].v = el.value; G.render(); return; }
    if (ds.wbff !== undefined) { WB.fills[Number(ds.wbff)].field = el.value; G.render(); return; }
    if (ds.wbfb !== undefined) { G.render(); return; }
    if (el.id === 'wb-tpl') { WB.tpl = el.value; WB.fills = []; guessFills(); G.render(); return; }
    if (el.id === 'wb-d') { WB.date = el.value; G.render(); return; }
    if (el.id === 'wb-t') { WB.time = el.value; G.render(); return; }
    if (el.id === 'wb-file' && el.files && el.files[0]) { upload(el.files[0]); el.value = ''; }
  });
  /* leaving the builder forgets it, so New starts clean */
  window.addEventListener('hashchange', function () {
    if (location.hash.indexOf('#/campaigns/wa/new') !== 0) WB = null;
  });

  /* for the checks */
  G.waCampForTest = { tally: function () { return tally(); }, setPlan: function (p) { PLAN = p; PLAN_AT = Date.now(); },
    builder: function () { return WB; }, checkRows: checkRows, setList: function (l) { LIST = l; LIST_KEY = G.range().from + '|' + G.range().to; },
    setOne: function (id, o) { ONE[id] = o; } };
})();
