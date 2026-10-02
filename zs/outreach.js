/* Mark's board: who he found, what he found wrong, and what he thinks we can sell.
 *
 * THE WHOLE SCREEN IS ONE ARGUMENT: a score you cannot question is a score you
 * cannot act on. So nothing here shows a number on its own. Every score opens
 * into the sentences that earned it, every fact carries the link it came from,
 * and anything Mark could not establish says so rather than scoring it zero and
 * letting you believe the market is thin.
 *
 * ⚠️ THE BROWSER DOES THE FINDING, AND THAT IS NOT A STYLE CHOICE.
 * Every OpenStreetMap mirror refuses our Cloudflare Worker — 521 and 526, which
 * are Cloudflare's own "could not reach the origin" codes — while answering the
 * same query from a browser without complaint. Overpass sends
 * `Access-Control-Allow-Origin: *`, so this page can ask it directly. That is
 * the only route that costs nothing and needs no card on file. The server then
 * reads their websites, which a browser cannot do at all.
 */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS;
  var esc = function (s) { return ZS.esc(s); };
  function D() { return G.D(); }

  var SHOW = 'pitch';      /* pitch | lookup | drafts | sent | clients | all | parked */
  var OPEN = null;
  var BUSY = false;
  var NOTE = '';

  /* What Overpass calls the things we sell to. Kept here rather than on the
     server because this is the half the browser runs. */
  var TAGS = [
    ['interior fit out', '["shop"~"interior_decoration|furniture|doityourself"]'],
    ['furniture', '["shop"="furniture"]'],
    ['car dealer', '["shop"~"car|car_repair|car_parts"]'],
    ['dental', '["amenity"="dentist"]'],
    ['clinic', '["amenity"~"clinic|doctors"]'],
    ['salon & spa', '["shop"~"beauty|hairdresser"]'],
    ['restaurant & cafe', '["amenity"~"restaurant|cafe"]'],
    ['gym', '["leisure"="fitness_centre"]'],
    ['jewellery', '["shop"="jewelry"]'],
    ['real estate', '["office"="estate_agent"]'],
    ['law firm', '["office"="lawyer"]'],
    ['accountants', '["office"="accountant"]'],
    ['travel agency', '["shop"="travel_agency"]'],
    ['school & training', '["amenity"~"school|college"]']
  ];
  var CITIES = {
    'Dubai':     [24.79, 54.89, 25.35, 55.57],
    'Abu Dhabi': [24.26, 54.27, 24.56, 54.78],
    'Sharjah':   [25.27, 55.35, 25.42, 55.59],
    'New York':  [40.48, -74.27, 40.92, -73.68],
    'Austin':    [30.09, -97.94, 30.52, -97.56],
    'Miami':     [25.70, -80.32, 25.86, -80.13]
  };

  function rows() { return (D().prospects || []).slice(); }

  /* Every message that actually left, by prospect, newest first. The server
     sends it down with the bootstrap so this screen never has to fetch before
     it can render a row. */
  function sentTo(id) {
    return (D().sends || []).filter(function (s) { return s.prospect_id === id && s.sent_at; })
      .sort(function (a, b) { return String(b.sent_at).localeCompare(String(a.sent_at)); });
  }

  function pitchable(p) {
    return ZS.worthPitching(p);
  }

  function shown() {
    var all = rows();
    if (SHOW === 'pitch') return all.filter(function (p) { return pitchable(p).length; });
    if (SHOW === 'lookup') return all.filter(function (p) { return p.needs_lookup; });
    if (SHOW === 'parked') return all.filter(function (p) { return p.stage === 'parked'; });
    if (SHOW === 'clients') return all.filter(function (p) { return p.stage === 'won' || p.client_id; });
    if (SHOW === 'sent') {
      return all.filter(function (p) { return sentTo(p.id).length || p.stage === 'sent'; });
    }
    return all;
  }

  /* ---------------- the screen ---------------- */

  V.outreach = function () {
    var all = rows();
    var list = shown().sort(function (a, b) {
      return (b.score_auto + b.score_cockpit + b.score_site) -
             (a.score_auto + a.score_cockpit + a.score_site);
    });

    var h = '<div class="ph"><div><h1>Outreach</h1>' +
      '<p>Mark finds businesses, reads their own website for what is actually broken, ' +
      'works out who to write to, and scores each one out of 5 against the three things ' +
      'we sell. Every number here opens into the reasons behind it.</p></div>' +
      (G.acc().settings
        ? '<div class="right">' +
          ((D().sends || []).some(function (x) {
              return (x.sent_at && !x.replied_at) || (x.gmail_draft_id && !x.sent_at && !x.discarded_at);
            })
            ? '<button class="btn alt" data-act="markReplies">Check Gmail</button>'
            : '') +
          '<button class="btn" data-act="markFind">Find more</button></div>'
        : '') +
      '</div>';

    if (NOTE) h += '<div class="note">' + esc(NOTE) + '</div>';

    h += brief();

    var counts = {
      pitch: all.filter(function (p) { return pitchable(p).length; }).length,
      lookup: all.filter(function (p) { return p.needs_lookup; }).length,
      drafts: ZS.draftsOf(D()).length,
      sent: all.filter(function (p) { return sentTo(p.id).length || p.stage === 'sent'; }).length,
      clients: all.filter(function (p) { return p.stage === 'won' || p.client_id; }).length,
      all: all.length,
      parked: all.filter(function (p) { return p.stage === 'parked'; }).length
    };
    h += '<div class="chips" style="margin-bottom:16px">' +
      /* ⚠️ "Parked" is not a shelf any more. The only rows on it are businesses
         that asked not to be contacted, so the chip says that rather than a word
         that sounds like a decision somebody might undo. */
      [['pitch', 'Worth writing to'], ['lookup', 'Need a name'], ['drafts', 'Drafts'],
       ['sent', 'Written to'], ['clients', 'Became clients'], ['all', 'Everything'],
       ['parked', 'Asked not to be contacted']].map(function (c) {
        return '<button class="chip" data-act="markShow" data-id="' + c[0] + '" aria-pressed="' +
          (SHOW === c[0] ? 'true' : 'false') + '">' + esc(c[1]) +
          '<i>' + counts[c[0]] + '</i></button>';
      }).join('') + '</div>';

    if (SHOW === 'drafts') return h + draftsView();

    if (!all.length) {
      return h + '<div class="card pad"><p class="m">Nothing yet. Press <b>Find more</b> and ' +
        'pick a trade and a city. Mark looks them up on OpenStreetMap, which is free and needs ' +
        'no account, then reads each one’s website himself.</p>' +
        '<p class="hint" style="margin-top:10px">A business whose website he cannot find scores ' +
        'nothing, because every signal he has reads that website. He says so on the row rather ' +
        'than scoring it zero and letting you think the trade is not worth working.</p></div>';
    }
    if (!list.length) {
      return h + '<div class="card pad"><p class="m">Nothing on this filter.</p></div>';
    }

    h += list.map(card).join('');
    return h;
  };

  /* ---------------- what Mark learned, and what he needs ----------------

     ⚠️ THIS IS THE HALF THAT MAKES THE AGENT WORTH OWNING. A screen that only
     lists prospects is a list; a screen that says what the outcomes mean and
     what he cannot do without you is a colleague. It is also the part Bhargav
     asked for in those words: teach me, do not just report to me.

     ⚠️ AND IT NEVER SHOWS A RATE WITHOUT THE N. Below eight messages it says
     how many more are needed instead of a percentage of four, because a number
     that moves twenty points on one reply is worse than no number. */
  function brief() {
    var b = ZS.outreachBrief(D());
    var st = b.stats;
    if (!st.sent && !b.needs.length) return '';

    var h = '<div class="card pad" style="margin-bottom:14px">' +
      '<div class="cardhead"><h3>What I have learned so far</h3>' +
      '<span class="hint">' + esc(ZS.niceDate(b.at)) + '</span></div>';

    if (st.sent) {
      h += '<div class="chips" style="margin:8px 0 2px">' +
        '<span class="pill dim">' + st.sent + ' sent</span>' +
        '<span class="pill ' + (st.replied ? 'ok' : 'dim') + '">' + st.replied + ' replied</span>' +
        (st.meetings ? '<span class="pill em">' + st.meetings + ' named a time</span>' : '') +
        (st.stopped ? '<span class="pill bad">' + st.stopped + ' asked to be left alone</span>' : '') +
        '</div>' +
        /* ⚠️ opens are not here and must never be. Apple Mail Privacy Protection
           fetches every image on delivery, so an open is attention-shaped noise. */
        '<p class="hint">Replies, not opens. An open is counted by a mail app ' +
        'fetching an image, not by anybody reading anything.</p>';
    }

    if (b.change) {
      h += '<div class="note" style="margin-top:10px;border-color:var(--warn)">' +
        '<b>The one thing to change.</b> ' + esc(b.change.what) +
        '<p class="mtmin">' + esc(b.change.evidence) + '</p>' +
        (b.change.change
          ? '<p class="hint">I have put this in the queue as a proposal. It does not ' +
            'take effect until you approve it, and I cannot approve my own.</p>'
          : '') +
        '</div>';
    }

    if (b.lessons.length) {
      h += '<ul class="ledger" style="margin-top:10px">' + b.lessons.map(function (l) {
        return '<li><span>' + esc(l.what) + (l.sure ? '' : ' <i>(watching)</i>') +
          '</span><b>' + esc(l.evidence) + '</b></li>';
      }).join('') + '</ul>';
    }

    if (b.needs.length) {
      h += '<p class="eyebrow" style="margin-top:14px">What I need from you</p>' +
        b.needs.map(function (n) {
          return '<div class="mtrow"><div class="mthead">' +
            '<b>' + esc(n.what) + '</b>' +
            '<button class="minibtn" data-act="goto" data-id="' + esc(n.where) + '">Go</button>' +
            '</div><p class="mtmin">' + esc(n.why) + '</p></div>';
        }).join('');
    }

    if (b.playbook.updated) {
      h += '<p class="hint" style="margin-top:12px">I lead with <b>' +
        esc(b.playbook.lead[0]) + '</b> first, changed on ' +
        esc(ZS.niceDate(b.playbook.updated)) + ' because you approved it' +
        (b.playbook.avoid.length
          ? '. I leave ' + esc(b.playbook.avoid.join(', ')) + ' alone.'
          : '.') + '</p>';
    }
    return h + '</div>';
  }

  function scorePill(label, n, bar) {
    var tone = n >= 4 ? 'ok' : n >= bar ? 'warn' : 'dim';
    return '<span class="pill ' + tone + '">' + esc(label) + ' ' + n + '/5</span>';
  }

  function card(p) {
    var open = OPEN === p.id;
    var best = pitchable(p);
    var src = p.sources || {};
    var who = p.contact_name
      ? esc(p.contact_name) + (p.contact_title ? ' <span>' + esc(p.contact_title) + '</span>' : '')
      : '<span class="pill warn">nobody named yet</span>';

    var h = '<div class="card pad" style="margin-bottom:12px">' +
      '<div class="cardhead"><h3>' + esc(p.name) + '</h3>' +
      '<span class="hint">' + esc(p.city || '') +
      (p.reviews ? ' &middot; ' + p.reviews + ' reviews' : '') + '</span></div>' +

      '<div class="chips" style="margin:8px 0 10px">' +
        scorePill('Automations', p.score_auto || 0, ZS.PITCH_BAR) +
        scorePill('Cockpit', p.score_cockpit || 0, ZS.PITCH_BAR) +
        scorePill('Website', p.score_site || 0, ZS.PITCH_BAR) +
        (best.length
          ? '<span class="pill em">worth writing to</span>'
          : '<span class="pill dim">nothing to say yet</span>') +
      '</div>' +

      '<ul class="ledger">' +
        li('Who to write to', who) +
        li('Website', p.website
            ? '<a href="' + esc(p.website) + '" target="_blank" rel="noopener">' +
              esc(p.website) + '</a>' +
              (src.website_via ? ' <span class="hint">' + esc(src.website_via) + '</span>' : '')
            : (p.site_unknown
                ? '<span class="hint">not recorded, and a search did not find one. ' +
                  'Scored as unknown rather than as "they have none".</span>'
                : '<b>None at all</b>')) +
        li('Email', p.email ? esc(p.email) : '<span class="hint">not published on their site</span>') +
      '</ul>';

    /* ⚠️ WHAT HAPPENED AFTER IT WENT, ON THE ROW. A prospect written to a week
       ago looked identical to one nobody had touched, which is how the same
       business gets a second cold email. The reply itself is here rather than
       behind a click, because it is the only sentence on this card that was
       written by them. */
    var gone = sentTo(p.id);
    if (gone.length) {
      var last = gone[0];
      h += '<div class="note" style="margin-top:10px">' +
        '<b>Written to on ' + esc(ZS.niceDate(String(last.sent_at).slice(0, 10))) + '.</b> ' +
        esc(last.subject || '') +
        (last.replied_at
          ? '<p class="mtmin" style="margin-top:8px"><span class="pill ' +
            (last.sentiment === 'positive' ? 'ok' : last.sentiment === 'negative' ? 'bad' : 'dim') +
            '">' + esc(last.sentiment || 'replied') + '</span>' +
            (last.meeting ? ' <span class="pill em">a time was named</span>' : '') +
            '</p><p class="mtmin">' + esc(String(last.reply_text || '').slice(0, 600)) + '</p>'
          : '<p class="mtmin">No answer yet. Mark checks the thread when you press ' +
            '<b>Read the replies</b>.</p>') +
        (gone.length > 1 ? '<p class="hint">' + gone.length + ' messages in all.</p>' : '') +
        '</div>';
    }

    /* ⚠️ THE ROW THAT NEEDS A HUMAN SAYS WHAT IT NEEDS AND LINKS STRAIGHT TO IT.
       A prospect nobody could name is still a prospect. Dropping it would quietly
       shrink the list for a reason nobody could see. */
    if (p.needs_lookup && src.person) {
      h += '<div class="note" style="margin-top:10px"><b>Mark could not name anybody here.</b> ' +
        '<a href="' + esc(src.person) + '" target="_blank" rel="noopener">Open the search</a>, ' +
        'then put the name in below. One click, and the row becomes workable.' +
        '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
        '<input id="nm-' + esc(p.id) + '" placeholder="Their name" style="flex:1;min-width:140px">' +
        '<input id="ti-' + esc(p.id) + '" placeholder="Their title" style="flex:1;min-width:140px">' +
        '<button class="minibtn" data-act="markName" data-id="' + esc(p.id) + '">Save it</button>' +
        '</div></div>';
    }

    /* ⚠️ WHAT WAS SAID TO THEM, ON THE ROW. A business Mark found and a business
       somebody has spoken to look identical without this, and the second one is
       not a cold prospect any more. It is the same log as on a client, and it
       moves onto the client record the moment they become one. */
    h += comms(p);

    var done = p.stage === 'won' || !!p.client_id;
    var stopped = p.stage === 'parked';

    h += '<div style="display:flex;gap:9px;margin-top:12px;flex-wrap:wrap">' +
      '<button class="minibtn" data-act="markOpen" data-id="' + esc(p.id) + '">' +
      (open ? 'Hide the reasons' : 'Why these scores?') + '</button>' +
      (src.listing ? '<a class="minibtn" href="' + esc(src.listing) +
        '" target="_blank" rel="noopener">Where he found them</a>' : '') +
      (stopped || done || sentTo(p.id).length ? ''
        : draftFor(p.id)
          ? '<button class="btn alt" data-act="markShow" data-id="drafts">See the draft</button>'
          : (p.email && ZS.leadOptions(p).length
              ? '<button class="btn" data-act="markCompose" data-id="' + esc(p.id) + '">Compose email</button>'
              : '')) +
      (stopped || done ? ''
        : '<button class="minibtn" data-act="markLog" data-id="' + esc(p.id) +
          '">Log a conversation</button>') +
      /* ⚠️ WE HAVE WRITTEN TO THEM. Mark sets this himself when he sends, but
         most of these go out by hand long before that is wired up, and a row
         that cannot be marked is a row somebody writes to twice. */
      (!done && !stopped && p.stage !== 'sent' && p.stage !== 'replied'
        ? '<button class="minibtn" data-act="markWritten" data-id="' + esc(p.id) +
          '">Written to them</button>' : '') +
      (!done && !stopped
        ? '<button class="btn alt" data-act="markToClient" data-id="' + esc(p.id) +
          '">Add to clients</button>' : '') +
      (done
        ? '<a class="minibtn" href="#/client/' + esc(p.client_id || '') + '">Open the client</a>'
        : '') +
      '</div>';

    if (open) h += reasons(p);
    return h + '</div>';
  }

  /* ---------------- what has been said to them ---------------- */

  function comms(p) {
    var list = ZS.commsOf(p);
    if (!list.length) return '';
    return '<div class="card" style="margin-top:12px;padding:0;background:var(--ink)">' +
      list.slice(0, 6).map(function (m) {
        var who = ZS.staffById(m.by);
        return '<div class="mtrow"><div class="mthead">' +
          '<b>' + esc(m.channel) + '</b>' +
          '<span>' + esc(ZS.niceDate(m.at)) + (who ? ' &middot; ' + esc(who.name) : '') + '</span>' +
          (G.acc().clients
            ? '<button class="xbtn" data-act="markDropComm" data-id="' + esc(p.id + '|' + m.id) +
              '" title="Remove" aria-label="Remove">&times;</button>' : '') +
          '</div>' +
          '<p class="mtmin" style="white-space:pre-wrap">' + esc(m.note) + '</p></div>';
      }).join('') +
      (list.length > 6 ? '<p class="hint" style="padding:8px 13px">' + (list.length - 6) +
        ' older, kept on the record.</p>' : '') +
      '</div>';
  }

  function li(k, v) { return '<li><span>' + esc(k) + '</span><b>' + v + '</b></li>'; }

  /* Every score, opened up. This is the part that makes the number arguable, and
     a number nobody can argue with is a number nobody should act on. */
  function reasons(p) {
    var sig = p.signals || {};
    var NAMES = { automations: 'AI Automations', cockpit: 'Agentic Cockpit', website: 'Website' };
    var SCORE = { automations: p.score_auto, cockpit: p.score_cockpit, website: p.score_site };

    var h = '<div class="card" style="margin-top:12px;padding:12px;background:var(--ink)">';
    Object.keys(NAMES).forEach(function (k) {
      var hits = sig[k] || [];
      h += '<p class="eyebrow" style="margin-top:8px">' + esc(NAMES[k]) +
        ' <span class="pill ' + ((SCORE[k] || 0) >= ZS.PITCH_BAR ? 'warn' : 'dim') + '">' +
        (SCORE[k] || 0) + ' of 5</span></p>';
      h += hits.length
        ? '<ul class="ledger">' + hits.map(function (x) {
            return '<li><span>' + esc(x.say) + '</span><b>' + esc(x.evidence) + '</b></li>';
          }).join('') + '</ul>'
        : '<p class="hint" style="margin:4px 0 0">Nothing fired. Either there is nothing to ' +
          'fix here, or Mark could not read enough to tell.</p>';
    });

    if ((p.findings || []).length) {
      h += '<p class="eyebrow" style="margin-top:14px">What is actually broken</p><ul class="ledger">' +
        p.findings.map(function (f) {
          return '<li><span>' + esc(f.what) + '</span><b>' + esc(f.evidence || '') + '</b></li>';
        }).join('') + '</ul>' +
        '<p class="hint" style="margin-top:8px">These are the only things Mark may put in a ' +
        'subject line. He cannot write one from a problem he has not verified, which is both ' +
        'why the real ones work and why they are lawful.</p>';
    }
    return h + '</div>';
  }

  /* ---------------- finding ---------------- */

  A.markShow = function (which) { SHOW = which; G.render(); };

  /* Reading the answers. It is a button rather than a timer: it reads his Gmail,
     and something that reads a mailbox on a schedule nobody asked for is the
     kind of thing people switch off. */
  A.markReplies = function () {
    if (!G.acc().settings) return G.toast('Reading the mailbox is the owner\u2019s.', true);
    if (!(window.API && API.signedIn())) {
      return G.toast('Not signed in to the server, and the replies are read through it.', true);
    }
    if (BUSY) return;
    BUSY = true;
    G.toast('Looking at the threads\u2026');
    API.readReplies().then(function (out) {
      BUSY = false;
      NOTE = (out.sentFromGmail ? out.sentFromGmail + ' draft' + (out.sentFromGmail === 1 ? '' : 's') +
               ' you sent from Gmail now read as written to. ' : '') +
        (out.replies
        ? out.replies + ' repl' + (out.replies === 1 ? 'y' : 'ies') + ' came back' +
          (out.stopped ? ', and ' + out.stopped + ' asked never to be written to again. ' +
            'Those are parked and Mark will not touch them.' : '.')
        : 'Nothing new on ' + out.checked + ' thread(s).');
      if (G.pullNow) G.pullNow().catch(function () { G.render(); }); else G.render();
    }).catch(function (e) {
      BUSY = false;
      G.toast((e && e.message) || 'Google would not answer.', true);
    });
  };
  A.markOpen = function (id) { OPEN = OPEN === id ? null : id; G.render(); };

  A.markFind = function () {
    if (!G.acc().settings) return G.toast('Running a search is the owner’s.', true);
    G.modal('What should Mark look for?',
      'He looks them up on OpenStreetMap, which is free and needs no account, then reads each ' +
      'one’s own website himself. Twenty at a time, because the free sources he uses are ' +
      'shared and he paces himself out of courtesy.',
      '<form id="markfind">' +
      '<div class="f" style="margin-bottom:12px"><label for="mk-cat">Trade</label>' +
      '<select id="mk-cat" name="cat">' + TAGS.map(function (t) {
        return '<option value="' + esc(t[0]) + '">' + esc(t[0]) + '</option>';
      }).join('') + '</select></div>' +
      '<div class="f" style="margin-bottom:12px"><label for="mk-city">City</label>' +
      '<select id="mk-city" name="city">' + Object.keys(CITIES).map(function (c) {
        return '<option value="' + esc(c) + '">' + esc(c) + '</option>';
      }).join('') + '</select></div>' +
      '<p class="hint">Dubai first. The three American cities are the 20% test, so the data ' +
      'decides which market is worth the effort rather than an opinion.</p>' +
      '<div style="display:flex;gap:10px;margin-top:14px">' +
      '<button class="btn" type="submit">Go and look</button>' +
      '<button class="btn alt" type="button" data-act="closeModal">Not now</button></div></form>');
  };

  /* ⚠️ OVERPASS IS A FREE SERVICE ON DONATED HARDWARE. It answers 406 to a
     browser-looking user agent and refuses our Worker outright, so this is the
     one call the page makes itself, with a plain agent, and it tries the mirrors
     rather than assuming the first one is up. */
  var MIRRORS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter'
  ];

  function askOverpass(tag, box, limit) {
    var q = '[out:json][timeout:25];(nwr' + tag + '(' + box.join(',') + ')["name"];);out center ' + limit + ';';
    var tried = 0;
    function next() {
      if (tried >= MIRRORS.length) {
        return Promise.reject(new Error('No OpenStreetMap mirror would answer. It is a free ' +
          'shared service; give it a minute and try again.'));
      }
      var host = MIRRORS[tried++];
      return fetch(host + '?data=' + encodeURIComponent(q))
        .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
        .catch(next);
    }
    return next();
  }

  document.addEventListener('submit', function (e) {
    if (!e.target || e.target.id !== 'markfind') return;
    e.preventDefault();
    if (BUSY) return;
    var cat = document.getElementById('mk-cat').value;
    var city = document.getElementById('mk-city').value;
    var tag = (TAGS.filter(function (t) { return t[0] === cat; })[0] || [])[1];
    var box = CITIES[city];
    var dm = document.getElementById('modal'); if (dm && dm.open) dm.close();
    if (!tag || !box) return G.toast('Mark has no map tag for that one yet.', true);

    BUSY = true;
    NOTE = 'Mark is looking for ' + cat + ' in ' + city + '. He reads each one’s website, ' +
           'so this takes a minute or two.';
    G.render();

    askOverpass(tag, box, 20).then(function (out) {
      var places = (out.elements || []).map(function (el) {
        var t = el.tags || {};
        return {
          place_id: 'osm:' + el.type + '/' + el.id,
          name: t.name || '',
          address: [t['addr:street'], t['addr:city'] || city].filter(Boolean).join(', '),
          website: t.website || t['contact:website'] || '',
          phone: t.phone || t['contact:phone'] || '',
          source: 'https://www.openstreetmap.org/' + el.type + '/' + el.id
        };
      }).filter(function (p) { return p.name; });

      if (!places.length) {
        BUSY = false;
        NOTE = 'OpenStreetMap has nothing listed for ' + cat + ' in ' + city + '. That is a ' +
               'gap in the map, not in the market.';
        return G.render();
      }
      return API.findProspects({
        category: cat, city: city,
        country: ['New York', 'Austin', 'Miami'].indexOf(city) >= 0 ? 'US' : 'AE',
        places: places
      }).then(function (r) {
        BUSY = false;
        NOTE = 'Mark looked at ' + r.looked + ' and wrote ' + r.written + ' to the board' +
          (r.blocked ? '. ' + r.blocked + ' need a name looked up by hand.' : '.');
        return G.pullNow ? G.pullNow() : G.render();
      });
    }).catch(function (err) {
      BUSY = false;
      NOTE = 'That did not work: ' + (err.message || 'no reason given');
      G.render();
    });
  });

  /* The one click that turns an unnamed row into a workable one. */
  A.markName = function (id) {
    var nm = document.getElementById('nm-' + id);
    var ti = document.getElementById('ti-' + id);
    var name = nm ? String(nm.value || '').trim() : '';
    if (!name) return G.toast('Put their name in first.', true);
    API.saveProspect({ id: id, contact_name: name,
                       contact_title: ti ? String(ti.value || '').trim() : '',
                       contact_level: 'owner', needs_lookup: false })
      .then(function () {
        G.toast(name + ' saved.');
        return G.pullNow ? G.pullNow() : G.render();
      })
      .catch(function (e) { G.toast((e && e.message) || 'That did not save.', true); });
  };

  /* ⚠️ "PARK IT" IS GONE. It was a manual shelf that meant nothing in particular,
     and a row on it looked the same as a row somebody had decided about.

     The `parked` STAGE survives for exactly one thing: somebody who has asked
     not to be contacted. That is set by the reply reader, never by a button, and
     it must stay, because writing to them again after they asked you not to is
     the one mistake here with a lawyer attached. */

  function byId(id) {
    return (D().prospects || []).filter(function (x) { return x.id === id; })[0] || null;
  }
  function saveRow(p, patch, said) {
    Object.keys(patch).forEach(function (k) { p[k] = patch[k]; });
    G.save();
    G.render();
    if (!(window.API && API.signedIn())) return;
    API.saveProspect(Object.assign({ id: p.id }, patch))
      .then(function () { if (said) G.toast(said); })
      .catch(function (e) { G.toast((e && e.message) || 'That did not reach the server.', true); });
  }

  /* ---- we have written to them ---- */
  /* ⚠️ ONE CLICK USED TO DO THIS, with no question and no record. Build Craft read
     "sent" on 2 Oct and nobody had written to them. Now it asks, and the server
     leaves a send row, so "written to" always has something behind it. */
  A.markWritten = function (id) {
    if (!G.acc().clients) return;
    var p = byId(id);
    if (!p) return;
    if (!confirm('Did you already email ' + p.name + ' yourself, outside Mark?\n\n' +
                 'Mark will treat them as written to and never draft them a cold email.')) return;
    if (!(window.API && API.signedIn())) return G.toast('Not signed in to the server.', true);
    API.markByHand(p.id).then(function () {
      G.toast('Recorded: written to by hand.');
      if (G.pullNow) G.pullNow().catch(function () { G.render(); }); else G.render();
    }).catch(function (e) { G.toast((e && e.message) || 'That did not reach the server.', true); });
  };

  /* ================= COMPOSE WITH MARK, AND THE DRAFTS =================

     ⚠️ BHARGAV PICKS WHAT TO PITCH, NOT MARK (2 Oct 2026). Mark has read their site
     and can say what he saw; which of the three to put in front of a stranger is
     the owner's call. So Compose ASKS: what to pitch, what to open with, anything
     to say in his own words. Then Mark writes it, and it waits here, readable in
     full, until Bhargav approves it into his own Gmail Drafts and sends it there. */

  var SERVICE_NAME = { website: 'A new website', cockpit: 'An Agentic Cockpit', automations: 'Automations' };

  function draftFor(pid) {
    return ZS.draftsOf(D()).filter(function (x) { return x.prospect_id === pid; })[0] || null;
  }
  function servicesOf(row) {
    var v = row.services;
    if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { v = []; } }
    return (v || []).map(function (x) { return typeof x === 'string' ? x : x && x.key; }).filter(Boolean);
  }

  A.markCompose = function (id) {
    if (!G.acc().settings) return G.toast('Writing to prospects is the owner\u2019s.', true);
    var p = byId(id);
    if (!p) return;
    var leads = ZS.leadOptions(p);
    var scores = { automations: p.score_auto, cockpit: p.score_cockpit, website: p.score_site };
    G.modal('Compose an email', p.name + (p.email ? ' \u00b7 ' + p.email : ''),
      '<form id="composeform" data-id="' + esc(p.id) + '">' +
      '<p class="m" style="margin-top:0">I have read their site. Tell me what to pitch and what ' +
      'to say, and I will write it. Nothing leaves until you approve it into your Gmail Drafts.</p>' +
      '<div class="f" style="margin-bottom:14px"><label>What are we pitching?</label>' +
        ['website', 'cockpit', 'automations'].map(function (k) {
          return '<label class="cpick"><input type="checkbox" name="svc" value="' + k + '"> ' +
            '<b>' + esc(SERVICE_NAME[k]) + '</b> <span class="hint">from ' + esc(ZS.priceIn(k, p.country)) +
            ' \u00b7 my read: ' + (scores[k] || 0) + '/5</span></label>';
        }).join('') + '</div>' +
      '<div class="f" style="margin-bottom:14px"><label for="cp-lead">Open with</label>' +
        '<select id="cp-lead" name="lead">' + leads.map(function (f) {
          return '<option value="' + esc(f.id) + '">' + esc(f.line) + '</option>';
        }).join('') + '</select>' +
        '<p class="hint">Only things I checked on their own site. The subject line is built from this.</p></div>' +
      '<div class="f" style="margin-bottom:6px"><label for="cp-notes">Anything you want in it? ' +
        '<em>optional, it goes in exactly as you write it</em></label>' +
        '<textarea id="cp-notes" name="notes" rows="4" placeholder="' +
        'e.g. We can have the first version live in three weeks. One we built for a retailer: zippyscale.in/vaarahi' +
        '"></textarea></div>' +
      '<p class="err" id="cp-err"></p>' +
      '<div style="display:flex;gap:10px;margin-top:12px">' +
      '<button class="btn" type="submit">Draft it</button>' +
      '<button class="btn alt" type="button" data-act="closeModal">Cancel</button></div></form>');
  };

  document.addEventListener('submit', function (e) {
    if (!e.target || e.target.id !== 'composeform') return;
    e.preventDefault();
    var p = byId(e.target.dataset.id);
    if (!p) return;
    var fd = new FormData(e.target);
    var err = document.getElementById('cp-err');
    var picks = fd.getAll('svc').map(function (k) { return { key: k }; });
    if (!picks.length) { if (err) err.textContent = 'Pick at least one thing to pitch.'; return; }
    var book = ZS.playbookOf(D());
    var lead = String(fd.get('lead') || '');
    var email = ZS.draftEmail(p, picks, G.me(), [lead].concat(book.lead || []), fd.get('notes'));
    if (!email) { if (err) err.textContent = 'There is nothing checkable on their site to open with.'; return; }
    if (!(window.API && API.signedIn())) { if (err) err.textContent = 'Not signed in to the server.'; return; }
    API.saveDraft({ prospect: p.id, subject: email.subject, text: email.text,
                    finding: email.finding.id, services: picks.map(function (x) { return x.key; }) })
      .then(function () {
        var m = document.getElementById('modal'); if (m && m.open) m.close();
        SHOW = 'drafts';
        G.toast('Drafted. Read it on the Drafts tab.');
        if (G.pullNow) G.pullNow().catch(function () { G.render(); }); else G.render();
      })
      .catch(function (x) { if (err) err.textContent = (x && x.message) || 'That did not save.'; });
  });

  function draftsView() {
    var list = ZS.draftsOf(D()).sort(function (a, b) {
      return String(b.drafted_at || '').localeCompare(String(a.drafted_at || ''));
    });
    if (!list.length) {
      return '<div class="card pad"><p class="m">No drafts yet. Open a business on ' +
        '<b>Worth writing to</b> and press <b>Compose email</b>. I will ask you what to pitch.</p></div>';
    }
    return list.map(function (d) {
      var p = byId(d.prospect_id) || { name: d.prospect_name || 'A prospect', email: '' };
      var inGmail = !!d.gmail_draft_id;
      var lines = String(d.body || '').split('\n').length;
      return '<div class="card pad draftcard" style="margin-bottom:12px">' +
        '<div class="cardhead"><h3>' + esc(p.name) + '</h3>' +
          '<span class="pill ' + (inGmail ? 'ok' : 'dim') + '">' +
          (inGmail ? 'In your Gmail Drafts' : 'Drafted here, not in Gmail yet') + '</span></div>' +
        '<p class="hint" style="margin:2px 0 10px">To ' + esc(p.contact_name ? p.contact_name + ' <' + p.email + '>' : p.email || '') +
          ' \u00b7 pitching ' + esc(servicesOf(d).map(function (k) { return SERVICE_NAME[k] || k; }).join(', ') || 'nothing named') + '</p>' +
        (inGmail
          ? '<p style="margin:0 0 6px"><b>' + esc(d.subject) + '</b></p>' +
            '<div class="draftbody">' + esc(d.body) + '</div>' +
            '<div style="display:flex;gap:9px;margin-top:12px;flex-wrap:wrap">' +
              '<a class="btn" href="https://mail.google.com/mail/u/0/#drafts" target="_blank" rel="noopener">Open Gmail Drafts</a>' +
              '<button class="btn alt" data-act="markReplies">I sent it: check Gmail</button>' +
              '<button class="minibtn" data-act="markDraftDiscard" data-id="' + esc(d.id) + '">Discard (deletes it in Gmail too)</button></div>'
          : '<div class="f" style="margin-bottom:8px"><label for="ds-' + esc(d.id) + '">Subject</label>' +
              '<input id="ds-' + esc(d.id) + '" value="' + esc(d.subject) + '"></div>' +
            '<div class="f"><label for="db-' + esc(d.id) + '">The email</label>' +
              '<textarea id="db-' + esc(d.id) + '" rows="' + Math.min(Math.max(lines + 1, 10), 26) + '">' +
              esc(d.body) + '</textarea></div>' +
            '<p class="err" id="de-' + esc(d.id) + '"></p>' +
            '<div style="display:flex;gap:9px;margin-top:10px;flex-wrap:wrap">' +
              '<button class="btn" data-act="markDraftGmail" data-id="' + esc(d.id) + '">Approve: put it in my Gmail Drafts</button>' +
              '<button class="btn alt" data-act="markDraftSave" data-id="' + esc(d.id) + '">Save my edits</button>' +
              '<button class="minibtn" data-act="markDraftDiscard" data-id="' + esc(d.id) + '">Discard</button></div>') +
        '</div>';
    }).join('');
  }

  function draftRow(id) {
    return (D().sends || []).filter(function (x) { return x.id === id; })[0] || null;
  }
  function draftEdits(d) {
    var su = document.getElementById('ds-' + d.id), bo = document.getElementById('db-' + d.id);
    return { subject: su ? su.value : d.subject, text: bo ? bo.value : d.body };
  }
  function saveEdits(d) {
    var e = draftEdits(d);
    if (e.subject === d.subject && e.text === d.body) return Promise.resolve();
    return API.saveDraft({ id: d.id, prospect: d.prospect_id, subject: e.subject, text: e.text,
                           finding: d.finding_id, services: servicesOf(d) });
  }
  function draftFail(d, x) {
    var el = document.getElementById('de-' + d.id);
    var msg = (x && x.message) || 'That did not reach the server.';
    if (el) el.textContent = msg; else G.toast(msg, true);
  }

  A.markDraftSave = function (id) {
    var d = draftRow(id);
    if (!d) return;
    saveEdits(d).then(function () {
      G.toast('Saved.');
      if (G.pullNow) G.pullNow().catch(function () { G.render(); }); else G.render();
    }).catch(function (x) { draftFail(d, x); });
  };

  /* ⚠️ APPROVE PUTS IT IN HIS GMAIL DRAFTS. IT DOES NOT SEND. He presses Send in
     Gmail; "Check Gmail" (and the 08:47 run) notices, and only then does the
     business read "written to", on the time he actually sent it. */
  A.markDraftGmail = function (id) {
    var d = draftRow(id);
    if (!d || BUSY) return;
    BUSY = true;
    saveEdits(d).then(function () { return API.draftToGmail(d.id, d.prospect_id); })
      .then(function () {
        BUSY = false;
        G.toast('It is in your Gmail Drafts. Open Gmail, read it once more, press Send.');
        if (G.pullNow) G.pullNow().catch(function () { G.render(); }); else G.render();
      })
      .catch(function (x) { BUSY = false; draftFail(d, x); });
  };

  A.markDraftDiscard = function (id) {
    var d = draftRow(id);
    if (!d) return;
    if (!confirm(d.gmail_draft_id ? 'Discard this draft? It is deleted from your Gmail Drafts too.'
                                  : 'Discard this draft?')) return;
    API.discardDraft(d.id, d.prospect_id).then(function () {
      G.toast('Discarded.');
      if (G.pullNow) G.pullNow().catch(function () { G.render(); }); else G.render();
    }).catch(function (x) { draftFail(d, x); });
  };

  /* ---- logging a conversation, the same log as on a client ---- */
  A.markLog = function (id) {
    if (!G.acc().clients) return;
    var p = byId(id);
    if (!p) return;
    G.modal('Log a conversation', p.name,
      '<form id="pcommform" data-id="' + esc(p.id) + '">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:12px">' +
      '<div class="f"><label for="pc-at">When it happened</label>' +
        '<input id="pc-at" name="at" type="date" value="' + ZS.today() + '" max="' +
        ZS.today() + '"></div>' +
      '<div class="f"><label for="pc-ch">How</label><select id="pc-ch" name="channel">' +
        ZS.FOLLOW_METHODS.map(function (m) { return '<option>' + esc(m) + '</option>'; }).join('') +
      '</select></div></div>' +
      '<div class="f" style="margin-bottom:12px"><label for="pc-note">What was said</label>' +
        '<textarea id="pc-note" name="note" rows="4" placeholder="' +
        'Rang the office. They are rebuilding the site themselves and asked what we would ' +
        'charge to take it over.' + '"></textarea></div>' +
      '<p class="hint">This moves onto their client record if they become one, so nothing ' +
      'said before they signed is lost.</p>' +
      '<p class="err" id="pc-err"></p>' +
      '<div style="display:flex;gap:10px;margin-top:12px">' +
      '<button class="btn" type="submit">Log it</button>' +
      '<button class="btn alt" type="button" data-act="closeModal">Cancel</button></div></form>');
  };

  A.markDropComm = function (arg) {
    if (!G.acc().clients) return;
    var q = String(arg).split('|');
    var p = byId(q[0]);
    if (!p) return;
    if (!confirm('Remove this entry?')) return;
    var out = ZS.dropComm(p, q[1]);
    if (out.error) return G.toast(out.error, true);
    saveRow(p, { comms: p.comms || [] }, 'Removed.');
  };

  /* ---- they want to work with us ----

     ⚠️ A CLIENT RECORD ONLY, which is Bhargav's call and the right one: a
     prospect who says yes has a company and a person, and almost never a product
     and a fee yet. The engagement gets opened from the client record when there
     is something real to put on it, rather than dropping a half-empty deal onto
     the board that nobody is working.

     The source is set to Mark so the question "what is the outreach actually
     bringing in" has an answer later, and every conversation logged against the
     prospect moves across. */
  A.markToClient = function (id) {
    if (!G.acc().clients) return G.toast('Client records are the owner\u2019s.', true);
    var p = byId(id);
    if (!p) return;

    var out = ZS.upsertClient(D().clients, {
      name: p.name,
      type: 'lead',
      source: 'mark',
      sector: p.category || '',
      website: p.website || '',
      email: p.email || '',
      assigned_to: D().session,
      contact_name: p.contact_name || '',
      designation: p.contact_title || '',
      address: { line1: '', area: '', city: p.city || '', state: '',
                 country: p.country === 'US' ? 'United States'
                        : p.country === 'AE' ? 'United Arab Emirates' : 'India', pin: '' }
    });
    if (out.error) return G.toast(out.error, true);
    var c = out.client;

    /* ⚠️ THE HISTORY MOVES WITH THEM. This is the one moment where losing it
       would hurt most: everything said before they signed is the context for
       everything said after. Appended rather than replaced, in case the company
       was already on file. */
    c.comms = (c.comms || []).concat(ZS.commsOf(p));
    c.last_touch = ZS.today();
    if (window.API) API.touch('clients', c);

    saveRow(p, { stage: 'won', client_id: c.id });
    G.log('client_add', p.name + ' came in through the outreach and is now a client' +
          (out.created ? '' : ' (folded into the one already on file)'),
          { client: c.id });
    G.save();
    G.toast(out.created ? 'Added to clients. Open an engagement when there is one.'
                        : 'They were already on file. The conversations moved across.');
    G.go('#/client/' + c.id);
  };

  document.addEventListener('submit', function (e) {
    if (!e.target || e.target.id !== 'pcommform') return;
    e.preventDefault();
    if (!G.acc().clients) return;
    var p = byId(e.target.dataset.id);
    if (!p) return;
    var fd = new FormData(e.target);
    var out = ZS.addComm(p, { at: fd.get('at') || ZS.today(), channel: fd.get('channel'),
                              note: fd.get('note'), by: D().session });
    if (out.error) {
      var err = document.getElementById('pc-err');
      if (err) err.textContent = out.error;
      return;
    }
    var m = document.getElementById('modal'); if (m && m.open) m.close();
    G.log('follow_log', p.name + ' \u2014 ' + out.comm.channel + ': ' +
          out.comm.note.slice(0, 90));
    saveRow(p, { comms: p.comms }, 'Logged.');
  });

  G.markProspects = rows;
})();
