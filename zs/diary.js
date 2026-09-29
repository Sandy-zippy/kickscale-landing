/* The diary. Everything with a date on it, in one place.

   Meetings live on engagements and follow-ups live in their own list, which is
   correct for the data and useless for a person: "what am I doing on Thursday"
   is not a question either of those answers. So this reads both and puts them on
   one page.

   It shows what the cockpit knows, and says so. It is NOT a mirror of Google
   Calendar: a meeting booked from here goes into that calendar and appears here,
   but something put straight into Google does not come back. Reading the whole
   calendar would need a second OAuth flow, a token to refresh and rotate, and a
   sync that can be wrong in both directions. Saying plainly what this is beats a
   view that is silently missing half of somebody's week. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS;
  var esc = function (s) { return ZS.esc(s); };
  function D() { return G.D(); }

  /* how far ahead the list runs, in days */
  var HORIZON = 45;
  var SHOW = 'next';        /* next | week | past */

  /* ---------------- everything with a date, from both places ---------------- */

  function entries() {
    var d = D();
    var me = G.me();
    var out = [];

    (d.opportunities || []).forEach(function (o) {
      if (!ZS.canOpen(o, me, d.access)) return;
      var c = G.clientById(o.client) || {};
      (o.meetings || []).forEach(function (m) {
        out.push({
          id: m.id, what: 'meeting', kind: m.kind, mode: m.mode || 'meet',
          at: m.at, time: m.time || '', mins: m.mins_long || 60,
          who: m.who || '', where: m.where || '', link: m.link || '',
          done: !!m.done, gap: ZS.meetingGap(m),
          client: c.name || '—', clientId: o.client, opp: o.id, ref: o.ref || ''
        });
      });
    });

    (d.followups || []).forEach(function (f) {
      var o = (d.opportunities || []).filter(function (x) { return x.id === f.opp; })[0];
      /* a follow-up on an engagement nobody may open is not theirs to see */
      if (o && !ZS.canOpen(o, me, d.access)) return;
      var c = G.clientById(f.client) || {};
      out.push({
        id: f.id, what: 'followup', kind: f.method || 'Call', mode: 'followup',
        at: f.due, time: '', mins: 0,
        who: '', where: '', link: '',
        done: !!f.done, gap: '',
        note: f.note || '',
        client: c.name || '—', clientId: f.client, opp: f.opp || null,
        ref: o ? (o.ref || '') : '', owner: f.owner
      });
    });

    return out.sort(function (a, b) {
      var x = a.at + ' ' + (a.time || '99:99'), y = b.at + ' ' + (b.time || '99:99');
      return x.localeCompare(y);
    });
  }

  function dayName(iso) {
    var p = String(iso).split('-');
    var dt = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var mons = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                'August', 'September', 'October', 'November', 'December'];
    if (isNaN(dt.getTime())) return String(iso);
    return days[dt.getDay()] + ' ' + dt.getDate() + ' ' + mons[dt.getMonth()];
  }

  function relative(iso) {
    var t = ZS.today();
    if (iso === t) return 'today';
    if (iso === ZS.addDays(t, 1)) return 'tomorrow';
    var n = ZS.daysLeft(iso);
    if (n === null) return '';
    if (n < 0) return Math.abs(n) + ' days ago';
    return 'in ' + n + ' days';
  }

  /* ---------------- the screen ---------------- */

  V.diary = function () {
    var all = entries();
    var t = ZS.today();
    var horizon = ZS.addDays(t, HORIZON);

    var ahead = all.filter(function (e) { return !e.done && e.at >= t && e.at <= horizon; });
    var week = ahead.filter(function (e) { return e.at <= ZS.addDays(t, 7); });
    var past = all.filter(function (e) { return e.done || e.at < t; })
      .sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
    /* Anything booked and already behind us. It is the list worth clearing: an
       appointment nobody marked as held is an appointment nobody wrote up. */
    var owed = all.filter(function (e) { return !e.done && e.at < t; });

    var shown = SHOW === 'week' ? week : SHOW === 'past' ? past.slice(0, 60) : ahead;

    var h = '<div class="ph"><div><h1>Diary</h1>' +
      '<p>Every meeting and every follow-up the cockpit knows about, in one place. ' +
      'Booking from here puts it in your Google Calendar; something put straight into ' +
      'Google does not come back here.</p></div></div>';

    if (owed.length) {
      h += '<div class="note" style="border-color:var(--warn)"><b>' + owed.length +
        ' still open behind you.</b> Booked, the day has passed, and nobody has said ' +
        'whether it happened. Mark it held and write up what was decided, or move it.</div>';
    }

    h += '<div class="chips" style="margin-bottom:16px">' +
      [['next', 'Next ' + HORIZON + ' days', ahead.length],
       ['week', 'This week', week.length],
       ['past', 'Behind us', past.length]].map(function (c) {
        return '<button class="chip" data-act="diaryShow" data-id="' + c[0] + '" aria-pressed="' +
          (SHOW === c[0] ? 'true' : 'false') + '">' + esc(c[1]) + '<i>' + c[2] + '</i></button>';
      }).join('') + '</div>';

    if (!shown.length) {
      h += '<div class="card pad"><p class="m">' +
        (SHOW === 'past' ? 'Nothing behind us yet.'
          : 'Nothing in the diary. Open an engagement and book a meeting, or put a ' +
            'follow-up on one that has gone quiet.') +
        '</p></div>';
      return h;
    }

    /* grouped by day, because that is how a day is read */
    var byDay = {};
    shown.forEach(function (e) { (byDay[e.at] = byDay[e.at] || []).push(e); });

    h += Object.keys(byDay).sort(function (a, b) {
      return SHOW === 'past' ? b.localeCompare(a) : a.localeCompare(b);
    }).map(function (day) {
      return '<div class="dayblock">' +
        '<div class="dayhead"><b>' + esc(dayName(day)) + '</b>' +
        '<span>' + esc(relative(day)) + '</span></div>' +
        '<div class="card" style="padding:0">' +
        byDay[day].map(row).join('') + '</div></div>';
    }).join('');

    return h;
  };

  function row(e) {
    var isFollow = e.what === 'followup';
    var label = isFollow ? e.kind + ' follow-up'
      : (ZS.MEETING_MODES[e.mode] || 'Google Meet');

    return '<div class="mtrow' + (e.done ? '' : ' soon') + '">' +
      '<div class="mthead">' +
      '<b>' + esc(isFollow ? e.client : e.kind) + '</b>' +
      '<span>' + (e.time ? esc(e.time) + ' &middot; ' : '') + esc(label) +
      (isFollow ? '' : ' &middot; ' + esc(e.client)) +
      (e.ref ? ' &middot; ' + esc(e.ref) : '') + '</span>' +
      '<span class="pill ' + (e.done ? 'ok' : e.gap ? 'warn' : 'em') + '">' +
        (e.done ? 'held' : e.gap ? esc(e.gap) : 'booked') + '</span>' +
      (e.opp ? '<button class="minibtn" data-act="openOpp" data-id="' + esc(e.opp) +
               '">Open</button>' : '') +
      '</div>' +
      (e.link ? '<p class="mtmin"><a class="minibtn" href="' + esc(e.link) +
                '" target="_blank" rel="noopener">Join the Meet</a></p>' : '') +
      (e.where ? '<p class="mtmin"><b>Where</b> ' + esc(e.where) + '</p>' : '') +
      (e.note ? '<p class="mtmin">' + esc(e.note) + '</p>' : '') +
      '</div>';
  }

  Object.assign(A, {
    diaryShow: function (which) { SHOW = which; G.render(); }
  });

  /* what the overview and Jarvis can both ask for */
  G.diaryEntries = entries;
})();
