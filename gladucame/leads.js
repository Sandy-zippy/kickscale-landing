/* Glad U Came demo . B2: Inbox, Leads board, lead record, New lead dialog (Speak fills it), duplicate flag,
   Excel sample + upload. Loads after screens.js and before app.js; it replaces the B1 Inbox and Leads lists. */
(function () {
  'use strict';
  var S = window.GUC_SCREENS, d = document, G = function () { return window.GUC_APP; };
  var STAGES = ['New', 'Contacted', 'Discovery call', 'Proposal sent', 'Negotiation', 'Won', 'Lost / Nurture'];
  var CHI = { whatsapp: 'brand-whatsapp', instagram: 'brand-instagram', gmail: 'brand-gmail', web: 'world-www', meta: 'brand-meta' };
  var NEEDS = { whatsapp: 'one shared WhatsApp Business number on Meta', instagram: 'Meta App Review for Instagram messages', gmail: 'a Google sign-in for the agency mailbox',
    web: 'one line of code on the gladucame.in form', meta: 'access to the Glad U Came Facebook page' };
  var LOST = ['Budget moved to next quarter', 'Went with another agency', 'No reply after 3 follow-ups', 'Timing: check in later', 'Not a fit for us', 'Other'];
  var SOURCES = ['whatsapp', 'instagram', 'gmail', 'web', 'meta'];
  var lakh = function (v) { return '₹' + (+v || 0).toFixed(1) + 'L'; };
  var ch = function (A, k) { return '<span class="ch" data-ch="' + k + '"><span class="ch-ico">' + A.ico(CHI[k]) + '</span>' + A.CHN[k] + '</span>'; };
  var digits = function (s) { return String(s || '').replace(/\D/g, '').slice(-10); };
  var handle = function (s) { s = String(s || '').trim().toLowerCase().replace(/^@/, ''); return s ? '@' + s : ''; };
  var initials = function (s) { return String(s).replace(/^@/, '').split(/[\s.]+/).map(function (w) { return w[0] || ''; }).join('').slice(0, 2).toUpperCase(); };

  /* who sees which leads: Founder all, a head their own + their team's, a member their own */
  function leadsFor(A) {
    var u = A.me(), L = A.D().leads;
    if (u.role === 'Founder') return L;
    if (u.role === 'Department head') return L.filter(function (l) { return l.owner === u.id || A.P[l.owner].head === u.id; });
    if (u.role === 'Team member') return L.filter(function (l) { return l.owner === u.id; });
    return [];
  }
  /* a lead whose mobile or Instagram handle is already on file */
  function findDup(A, x, skip) {
    var m = digits(x.mobile), h = handle(x.insta), e = String(x.email || '').trim().toLowerCase(), hit = null;
    A.D().leads.some(function (l) {
      if (l.id === skip) return false;
      if (m.length === 10 && digits(l.mobile) === m) { hit = { id: l.id, by: 'Mobile' }; return true; }
      if (h && handle(l.insta) === h) { hit = { id: l.id, by: 'Instagram handle' }; return true; }
      if (e && String(l.email || '').trim().toLowerCase() === e) { hit = { id: l.id, by: 'Email' }; return true; }
      return false;
    });
    return hit;
  }
  var leadById = function (A, id) { return A.D().leads.filter(function (l) { return l.id === id; })[0]; };
  function lhist(A, l, what) { l.history.push({ at: A.now(), who: A.ME(), what: what }); }
  function dupChip(A, l) {
    if (!l.dup) return '';
    var o = leadById(A, l.dup.id);
    return '<span class="chip chip--amber" data-dup>' + A.ico('alert-triangle') + l.dup.by + ' already on file' + (o ? ': <a href="#/lead/' + o.id + '" data-dup-link>' + A.esc(o.brand) + '</a>' : '') + '</span>';
  }

  /* ---------------- Inbox ---------------- */
  var IB = { open: '', q: '', ch: '', who: '', date: '', from_d: '', to_d: '' };
  function convsFor(A) {
    var u = A.me();
    return A.D().inbox.filter(function (c) {
      if (u.role === 'Founder') return true;
      if (!c.assigned || c.assigned === u.id) return true;
      return u.role === 'Department head' && A.P[c.assigned] && A.P[c.assigned].head === u.id;
    });
  }
  var lastAt = function (c) { return c.msgs[c.msgs.length - 1].at; };
  function convPass(A, c) {
    var last = c.msgs[c.msgs.length - 1];
    if (IB.q && (c.name + ' ' + c.biz + ' ' + c.handle + ' ' + last.text).toLowerCase().indexOf(IB.q.toLowerCase()) < 0) return false;
    if (IB.ch && c.ch !== IB.ch) return false;
    if (IB.who === 'none' && c.assigned) return false;
    if (IB.who === 'me' && c.assigned !== A.ME()) return false;
    if (IB.who && IB.who !== 'none' && IB.who !== 'me' && c.assigned !== IB.who) return false;
    return datePass(A, IB, lastAt(c).slice(0, 10));
  }
  function datePass(A, F, day) {
    if (!F.date) return true;
    var n = A.daysBetween(A.TODAY, day);
    if (F.date === 'today') return n === 0;
    if (F.date === 'week') return n >= -6 && n <= 6;
    if (F.date === 'month') return day.slice(0, 7) === A.TODAY.slice(0, 7);
    if (F.date === '30') return n >= -30 && n <= 0;
    if (F.date === 'custom') return !((F.from_d && day < F.from_d) || (F.to_d && day > F.to_d));
    return true;
  }
  function ago(A, iso) {
    var m = Math.round((new Date(A.now()) - new Date(iso)) / 60000);
    if (m < 1) return 'now'; if (m < 60) return m + ' min'; if (m < 60 * 24 && iso.slice(0, 10) === A.TODAY) return Math.round(m / 60) + ' h';
    return A.dayWord(iso);
  }
  function selF(A, attr, name, label, opts, cur) {
    return A.sel(name, label, opts, cur).replace(/data-tf=/g, attr + '=');
  }
  S.inbox = function (A) {
    var all = convsFor(A), list = all.filter(function (c) { return convPass(A, c); }).sort(function (a, b) { return lastAt(a) < lastAt(b) ? 1 : -1; });
    var unread = all.filter(function (c) { return !c.read; }).length;
    var people = A.ORDER.filter(function (x) { return all.some(function (c) { return c.assigned === x; }); });
    var F = '<div class="filters"><label class="search"><span class="sr-only">Search conversations</span>' + A.ico('search') + '<input class="input" data-ibf="q" value="' + A.esc(IB.q) + '" placeholder="Search name, brand, message"></label>' +
      selF(A, 'data-ibf', 'ch', 'Channel', [['', 'Channel: all']].concat(SOURCES.map(function (k) { return [k, A.CHN[k]]; })), IB.ch) +
      selF(A, 'data-ibf', 'who', 'Assigned to', [['', 'Assigned: anyone'], ['me', 'Me'], ['none', 'Not assigned']].concat(people.map(function (x) { return [x, A.P[x].name]; })), IB.who) +
      selF(A, 'data-ibf', 'any', 'Pick any field', [['', '+ Any field'], 'Brand', 'Linked lead', 'Handle'], '') + A.dateFilter(IB).replace(/data-tf=/g, 'data-ibf=') + '</div>';
    var strip = '<div class="ch-strip" data-channels>' + SOURCES.map(function (k) {
      return '<span class="ch-state">' + ch(A, k) + '<span>Sample conversations. Connects in the build: needs ' + NEEDS[k] + '.</span></span>'; }).join('') + '</div>';
    var rows = list.length ? list.map(function (c) {
      var last = c.msgs[c.msgs.length - 1], l = c.lead && leadById(A, c.lead);
      return '<div class="lrow inbox-row' + (c.read ? '' : ' is-unread') + '" style="--cols:128px minmax(0,1fr) auto;cursor:pointer" data-conv="' + c.id + '" data-do="ibopen"' + (IB.open === c.id ? ' aria-selected="true"' : '') + '>' + ch(A, c.ch) +
        '<div style="min-width:0"><div class="inbox-top"><b>' + A.esc(c.name) + '</b><span class="faint" style="font-size:var(--fs-12)">' + A.esc(c.biz || c.handle) + '</span>' + (l ? '<span class="chip chip--mint">Lead</span>' : '') + '</div><div class="msg-snip">' + A.esc(last.kind === 'note' ? 'Internal note: ' + last.text : last.text) + '</div></div>' +
        '<div class="inbox-side"><time>' + ago(A, last.at) + '</time>' + (c.assigned ? A.avatar(c.assigned) : '<span class="chip">Not assigned</span>') + '</div></div>'; }).join('')
      : '<div class="card empty"><span class="empty-art">' + A.ico('inbox') + '</span><h2 class="h-sec">No conversations on this filter</h2><p>Clear a filter to see the rest.</p><button class="btn btn--next" type="button" data-do="ibclear">Clear filters</button></div>';
    var open = IB.open && all.filter(function (c) { return c.id === IB.open; })[0];
    return '<section class="record inbox-wrap"><section class="card card--flush" data-inbox><div style="padding:var(--s-4) var(--s-4) var(--s-3);display:flex;flex-direction:column;gap:var(--s-3)">' +
      '<div class="page-head"><h1 class="h-page">Inbox</h1><span class="chip">' + unread + ' unread</span><span class="chip">Sample data</span></div>' + F + strip + '</div>' +
      '<div class="list" style="border-top:1px solid var(--line)">' + rows + '</div><div class="list-foot"><span>' + list.length + ' of ' + all.length + ' conversations</span></div></section>' +
      (open ? convPane(A, open) : '<aside class="thread" aria-label="Conversation"><div class="card empty"><span class="empty-art">' + A.ico('messages') + '</span><h2 class="h-sec">Pick a conversation</h2><p>Open one to reply, assign it, add an internal note, or turn it into a lead or a task.</p></div></aside>') + '</section>';
  };
  function convPane(A, c) {
    var l = c.lead && leadById(A, c.lead), who = A.assignable();
    var msgs = c.msgs.map(function (m) {
      if (m.kind === 'them') return '<div class="msg"><span class="av av--c">' + A.esc(initials(c.name)) + '</span><div><div class="msg-top"><b>' + A.esc(c.name) + '</b><time>' + A.dayWord(m.at) + ', ' + A.clock(m.at) + '</time></div><p class="msg-text">' + A.esc(m.text) + '</p></div></div>';
      var note = m.kind === 'note', smp = m.sample ? '<span class="chip chip--blue">Sample reply: goes out from the ' + window.GUC_SENDER[c.ch] + ' in the build</span>' : '';
      return '<div class="msg' + (note ? ' msg--note' : '') + '">' + A.avatar(m.who) + '<div><div class="msg-top"><b>' + A.esc(A.P[m.who].name) + '</b>' + (note ? '<span class="chip chip--amber">Internal note, the brand never sees it</span>' : '') + smp +
        '<time>' + A.dayWord(m.at) + ', ' + A.clock(m.at) + '</time></div><p class="msg-text">' + A.esc(m.text).replace(/@(\w+)/g, '<span class="mention">@$1</span>') + '</p></div></div>';
    }).join('');
    return '<aside class="thread conv" aria-label="Conversation" data-conv="' + c.id + '"><div class="thread-head"><div style="min-width:0"><h2 class="h-sec">' + A.esc(c.name) + '</h2><span class="faint" style="font-size:var(--fs-12)">' + A.esc(c.handle) + (c.biz ? ' . ' + A.esc(c.biz) : '') + '</span></div>' + ch(A, c.ch) + '</div>' +
      '<div class="conv-acts">' + (l ? '<a class="btn btn--sm" href="#/lead/' + l.id + '">' + A.ico('layout-kanban') + 'Open lead: ' + A.esc(l.brand) + '</a>'
        : '<button class="btn btn--sm btn--next" type="button" data-do="tolead" data-c="' + c.id + '">' + A.ico('layout-kanban') + 'Turn into lead</button>') +
      '<button class="btn btn--sm" type="button" data-do="totask" data-c="' + c.id + '">' + A.ico('square-check') + 'Turn into task</button>' +
      '<label class="sr-only" for="ib-assign">Assign to</label><select class="select" id="ib-assign" data-ib-assign="' + c.id + '"><option value="">' + (c.assigned ? 'Assigned: ' + A.esc(A.P[c.assigned].name) : 'Assign to a person') + '</option>' +
      who.filter(function (x) { return x !== c.assigned; }).map(function (x) { return '<option value="' + x + '">' + A.esc(A.P[x].name) + (x === A.ME() ? ' (me)' : '') + '</option>'; }).join('') + '</select></div>' +
      '<div class="msgs">' + msgs + '</div>' +
      '<div class="composer composer--reply" data-reply><label class="label" for="ib-reply">Reply to ' + A.esc(c.name) + '</label><textarea class="input textarea composer-box" id="ib-reply" rows="2" placeholder="Write to ' + A.esc(c.name) + ' on ' + A.CHN[c.ch] + '"></textarea>' +
      '<div class="composer-row"><button class="btn btn--sm btn--ghost" type="button" data-do="speakbox" data-box="ib-reply">' + A.ico('microphone') + 'Speak</button><span class="faint" style="font-size:var(--fs-11)">Sample here. In the build it goes out from the ' + window.GUC_SENDER[c.ch] + '.</span><span class="spacer"></span>' +
      '<button class="btn btn--sm btn--next" type="button" data-do="ibreply" data-c="' + c.id + '">' + A.ico('send') + 'Send reply</button></div></div>' +
      '<div class="composer composer--note" data-note><label class="label" for="ib-note">Internal note, the brand never sees it</label><textarea class="input textarea composer-box" id="ib-note" rows="1" placeholder="Note for the team, type @ to mention"></textarea>' +
      '<div class="composer-row"><span class="spacer"></span>' +
      '<button class="btn btn--sm btn--solid" type="button" data-do="ibnote" data-c="' + c.id + '">' + A.ico('send') + 'Add note</button></div></div></aside>';
  }

  /* ---------------- New lead dialog (Speak fills it) ---------------- */
  function sampleSentence(A, pre) {
    var u = A.me(), give = u.role === 'Founder' ? 'Ishaan' : u.role === 'Department head' ? A.first(A.teamOf(u.id)[0] || u.id) : A.first(u.id);
    return 'New lead, ' + ((pre && pre.brand) || 'Leaf and Loaf Bakery') + ', contact ' + ((pre && pre.contact) || 'Pooja Rane') + ', mobile ' + ((pre && pre.mobile) || '98765 43210').replace(/^\+91\s*/, '') +
      ', influencer campaign, give it to ' + give + ', follow up tomorrow';
  }
  function leadDialog(A, pre) {
    pre = pre || {};
    var who = A.assignable(), v = function (k) { return A.esc(pre[k] || ''); };
    var opt = function (list, cur, lab) { return list.map(function (o) { var val = typeof o === 'string' ? o : o[0], l = typeof o === 'string' ? o : o[1]; return '<option value="' + A.esc(val) + '"' + (val === cur ? ' selected' : '') + '>' + A.esc(l) + '</option>'; }).join(''); };
    return '<dialog class="dialog" id="dlg-lead" aria-label="New lead" data-parse="lead"' + (pre.conv ? ' data-conv="' + pre.conv + '"' : '') + '><form method="dialog" data-form="lead">' +
      '<div class="dialog-head"><h2 class="h-page">New lead</h2>' + A.micBtn() + '<button class="btn btn--icon btn--ghost" type="button" aria-label="Close" data-do="close">' + A.ico('x') + '</button></div>' +
      '<div class="dialog-body"><div class="speak-strip">' + A.ico('microphone', 'i--sm') + '<span>Try: <q>' + A.esc(sampleSentence(A, pre)) + '</q></span></div>' +
      (pre.conv ? '<p class="f-help">From the ' + A.CHN[pre.src] + ' chat with ' + v('contact') + '. Check the fields, then save.</p>' : '') +
      '<div class="f-row"><div class="f"><label for="nl-brand">Brand <em>*</em></label><input class="input" id="nl-brand" name="brand" value="' + v('brand') + '" placeholder="e.g. Leaf & Loaf Bakery"></div>' +
      '<div class="f"><label for="nl-contact">Contact name <em>*</em></label><input class="input" id="nl-contact" name="contact" value="' + v('contact') + '"></div></div>' +
      '<div class="f-row"><div class="f"><label for="nl-mobile">Mobile</label><input class="input" id="nl-mobile" name="mobile" inputmode="tel" value="' + v('mobile') + '" placeholder="+91 98765 43210"></div>' +
      '<div class="f"><label for="nl-insta">Instagram handle</label><input class="input" id="nl-insta" name="insta" value="' + v('insta') + '" placeholder="@brandname"></div></div>' +
      '<div class="f-help" id="nl-dup" role="status"></div>' +
      '<div class="f"><label for="nl-owner">Owner <em>*</em></label><select class="select" id="nl-owner" name="owner"><option value="">Pick a person</option>' + opt(who.map(function (x) { return [x, A.P[x].name + (x === A.ME() ? ' (me)' : '')]; }), pre.owner) + '</select></div>' +
      '<details class="more-f"' + (pre.conv ? ' open' : '') + '><summary>More details</summary>' +
      '<div class="f-row"><div class="f"><label for="nl-src">Source</label><select class="select" id="nl-src" name="src">' + opt(SOURCES.map(function (k) { return [k, A.CHN[k]]; }), pre.src || 'whatsapp') + '</select></div>' +
      '<div class="f"><label for="nl-email">Email</label><input class="input" id="nl-email" name="email" type="email" value="' + v('email') + '"></div></div>' +
      '<div class="f-row"><div class="f"><label for="nl-int">Interested in</label><select class="select" id="nl-int" name="interest"><option value="">Not known yet</option>' + opt(A.TPL, pre.interest) + '</select></div>' +
      '<div class="f"><label for="nl-val">Likely value, ₹ lakh</label><input class="input" id="nl-val" name="value" type="number" min="0" step="0.1" value="' + v('value') + '"></div></div>' +
      '<div class="f-row"><div class="f"><label for="nl-next">Next follow-up</label><input class="input" id="nl-next" name="next" type="date" value="' + (pre.next || A.addDays(A.TODAY + 'T00:00', 1).slice(0, 10)) + '"></div>' +
      '<div class="f"><label for="nl-note">First note</label><input class="input" id="nl-note" name="note" value="' + v('note') + '"></div></div></details>' +
      '<p class="f-err" id="nl-err" role="alert"></p></div>' +
      '<div class="dialog-foot"><span class="mic-hint">Speak fills the fields. You check, then save.</span><button class="btn btn--ghost" type="button" data-do="close">Cancel</button>' +
      '<button class="btn btn--next" type="submit">' + A.ico('check') + 'Save lead</button></div></form></dialog>';
  }
  function openLead(A, pre) {
    var old = d.getElementById('dlg-lead'); if (old) old.remove();
    d.body.insertAdjacentHTML('beforeend', leadDialog(A, pre));
    var dl = d.getElementById('dlg-lead'); dl.showModal(); dupWarn(A, dl); dl.querySelector('#nl-brand').focus();
  }
  function dupWarn(A, dl) {
    var x = { mobile: dl.querySelector('[name=mobile]').value, insta: dl.querySelector('[name=insta]').value, email: dl.querySelector('[name=email]').value }, hit = findDup(A, x), box = dl.querySelector('#nl-dup');
    var l = hit && leadById(A, hit.id);
    box.innerHTML = l ? '<span class="chip chip--amber">' + A.ico('alert-triangle') + hit.by + ' already on file: <a href="#/lead/' + l.id + '" data-dup-link>' + A.esc(l.brand) + ', ' + A.esc(l.stage) + ', ' + A.esc(A.P[l.owner].name) + '</a></span> You can still save; the new lead is flagged.' : '';
  }
  function parseLead(A, text, dl) {
    var s = ' ' + text.toLowerCase().replace(/[.!?]/g, ' ') + ' ', out = {}, m;
    if ((m = text.match(/new lead,?\s*(?:from\s+)?([^,]+)/i))) out.brand = m[1].trim().replace(/\band\b/i, '&').replace(/^\w/, function (c) { return c.toUpperCase(); });
    if ((m = text.match(/contact\s+([^,]+)/i))) out.contact = m[1].trim();
    if ((m = text.replace(/[\s-]/g, '').match(/(?:\+?91)?([6-9]\d{9})/))) out.mobile = '+91 ' + m[1].slice(0, 5) + ' ' + m[1].slice(5);
    if ((m = text.match(/@[\w.]+/))) out.insta = m[0].toLowerCase();
    A.TPL.forEach(function (t) { if (s.indexOf(' ' + t.toLowerCase() + ' ') >= 0 || s.indexOf(' ' + t.toLowerCase() + ',') >= 0) out.interest = t; });
    if ((m = s.match(/(?:give it to|owner is|for) (\w+)/))) A.ORDER.forEach(function (id) { if (A.P[id].name.split(' ')[0].toLowerCase() === m[1]) out.owner = id; });
    var when = null;
    if (/ today /.test(s)) when = A.TODAY; if (/ tomorrow /.test(s)) when = A.addDays(A.TODAY + 'T00:00', 1).slice(0, 10);
    A.DAYS.forEach(function (w, i) { if (s.indexOf(' ' + w + ' ') >= 0) { var t = new Date(A.TODAY + 'T12:00'); do { t.setDate(t.getDate() + 1); } while (t.getDay() !== i); when = A.dayStr(t); } });
    if (when) out.next = when;
    if (/ lakh/.test(s) && (m = s.match(/([\d.]+) lakh/))) out.value = m[1];
    if (out.interest || out.next || out.value) { var det = dl.querySelector('details'); if (det) det.open = true; }
    var n = 0;
    Object.keys(out).forEach(function (k) {
      var el = dl.querySelector('[name="' + k + '"]'); if (!el) return;
      if (el.tagName === 'SELECT' && !Array.prototype.some.call(el.options, function (o) { return o.value === out[k]; })) return;
      el.value = out[k]; el.closest('.f').classList.add('is-filled'); n++;
    });
    dupWarn(A, dl);
    return n;
  }
  function saveLead(A, form) {
    var dl = form.closest('dialog'), v = function (n) { return form.querySelector('[name="' + n + '"]').value.trim(); }, err = form.querySelector('#nl-err'), miss = [];
    if (!v('brand')) miss.push('Brand'); if (!v('contact')) miss.push('Contact name'); if (!v('owner')) miss.push('Owner');
    if (!v('mobile') && !v('insta')) miss.push('Mobile or Instagram handle');
    if (miss.length) { err.textContent = 'Please fill: ' + miss.join(', ') + '.'; return false; }
    if (v('mobile') && digits(v('mobile')).length !== 10) { err.textContent = 'The mobile needs 10 digits.'; return false; }
    var D = A.D(), l = { id: 'L' + (++D.seqL), brand: v('brand'), contact: v('contact'), mobile: v('mobile'), insta: v('insta') ? handle(v('insta')) : '', email: v('email'), ch: v('src') || 'whatsapp',
      interest: v('interest'), value: parseFloat(v('value')) || 0, owner: v('owner'), stage: 'New', next: v('next'), created: A.now(), lost: '', thread: [], history: [] };
    l.dup = findDup(A, l);
    var conv = dl.getAttribute('data-conv') && D.inbox.filter(function (c) { return c.id === dl.getAttribute('data-conv'); })[0];
    lhist(A, l, (conv ? 'Turned into a lead from the ' + A.CHN[conv.ch] + ' chat with ' + conv.name + '. ' : 'New lead. ') + 'Owner ' + A.P[l.owner].name);
    if (l.dup) lhist(A, l, 'Flagged: ' + l.dup.by + ' already on file (' + leadById(A, l.dup.id).brand + ')');
    if (v('note')) l.thread.push({ who: A.ME(), text: v('note'), at: A.now() });
    D.leads.push(l);
    if (conv) { conv.lead = l.id; conv.read = true; if (!conv.assigned) conv.assigned = l.owner; conv.history.push({ at: A.now(), who: A.ME(), what: 'Turned into lead ' + l.brand }); }
    A.note(l.owner, A.me().name + ' gave you a new lead: ' + l.brand + (l.dup ? ' (flagged: ' + l.dup.by.toLowerCase() + ' already on file)' : ''));
    A.save(); A.render();
    A.toast('Lead saved in New' + (l.dup ? ', flagged: ' + l.dup.by.toLowerCase() + ' already on file' : '') + '. ' + A.first(l.owner) + ' owns it.', function () {
      D.leads = D.leads.filter(function (x) { return x !== l; }); if (conv) conv.lead = ''; A.save(); A.render(); });
    return true;
  }

  /* ---------------- moving a lead ---------------- */
  function moveLead(A, l, stage, reason) {
    if (!l || l.stage === stage) return;
    if (stage === 'Lost / Nurture' && !reason) return openLost(A, l);
    if (stage === 'Proposal sent' && window.GUC_APPR && !window.GUC_APPR.pricingGate(A, l)) { A.render(); return; }   /* R-15: waits for the Pricing approval */
    var from = l.stage, snap = JSON.stringify(l);
    l.stage = stage; if (reason) l.lost = reason;
    lhist(A, l, 'Moved from ' + from + ' to ' + stage + (reason ? '. Reason: ' + reason : ''));
    if (l.owner !== A.ME()) A.note(l.owner, A.me().name + ' moved ' + l.brand + ' to ' + stage + '.');
    A.save(); A.render();
    A.toast(l.brand + ' is in ' + stage + (stage === 'Won' ? '. Well done.' : '.'), function () { var o = JSON.parse(snap); Object.keys(o).forEach(function (k) { l[k] = o[k]; }); A.save(); A.render(); });
  }
  function openLost(A, l) {
    var old = d.getElementById('dlg-lost'); if (old) old.remove();
    d.body.insertAdjacentHTML('beforeend', '<dialog class="dialog" id="dlg-lost" aria-label="Why was it lost" data-parse="lost" data-lead="' + l.id + '"><form method="dialog" data-form="lost">' +
      '<div class="dialog-head"><h2 class="h-page">Why was it lost?</h2>' + A.micBtn() + '<button class="btn btn--icon btn--ghost" type="button" aria-label="Close" data-do="close">' + A.ico('x') + '</button></div>' +
      '<div class="dialog-body"><div class="speak-strip">' + A.ico('microphone', 'i--sm') + '<span>Try: <q>They went with another agency, check in after Diwali</q></span></div>' +
      '<p class="lede"><b>' + A.esc(l.brand) + '</b> moves to Lost / Nurture. A reason is needed, so the Follow-up bot knows when to check in.</p>' +
      '<div class="f"><label for="ll-why">Reason <em>*</em></label><select class="select" id="ll-why" name="why"><option value="">Pick a reason</option>' + LOST.map(function (r) { return '<option>' + r + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label for="ll-note">Anything to add</label><input class="input" id="ll-note" name="note"></div><p class="f-err" id="ll-err" role="alert"></p></div>' +
      '<div class="dialog-foot"><span class="mic-hint">Speak fills the fields. You check, then save.</span><button class="btn btn--ghost" type="button" data-do="close">Cancel</button>' +
      '<button class="btn btn--next" type="submit">' + A.ico('check') + 'Move to Lost / Nurture</button></div></form></dialog>');
    d.getElementById('dlg-lost').showModal();
  }
  function parseLost(A, text, dl) {
    var s = text.toLowerCase(), pick = /another agency/.test(s) ? LOST[1] : /budget/.test(s) ? LOST[0] : /reply/.test(s) ? LOST[2] : /later|after|check in/.test(s) ? LOST[3] : '';
    var n = 0; if (pick) { dl.querySelector('[name=why]').value = pick; dl.querySelector('[name=why]').closest('.f').classList.add('is-filled'); n++; }
    var m = text.match(/,\s*(.+)$/); if (m) { dl.querySelector('[name=note]').value = m[1]; dl.querySelector('[name=note]').closest('.f').classList.add('is-filled'); n++; }
    return n;
  }

  /* ---------------- Leads board ---------------- */
  var LF = { q: '', owner: '', src: '', date: '', from_d: '', to_d: '' }, UP = null, LOSTOPEN = false;
  function lpass(A, l) {
    if (LF.q && (l.brand + ' ' + l.contact + ' ' + l.mobile + ' ' + l.insta).toLowerCase().indexOf(LF.q.toLowerCase()) < 0) return false;
    if (LF.owner && l.owner !== LF.owner) return false;
    if (LF.src && l.ch !== LF.src) return false;
    return datePass(A, LF, (l.created || A.TODAY).slice(0, 10));
  }
  function card(A, l) {
    var won = l.stage === 'Won', lost = l.stage === 'Lost / Nurture', i = STAGES.indexOf(l.stage);
    return '<article class="bcard' + (l.dup ? ' is-dup' : '') + '" tabindex="0" draggable="true" data-lead="' + l.id + '">' +
      '<a class="bcard-title" href="#/lead/' + l.id + '">' + A.esc(l.brand) + '</a>' +
      '<span class="bcard-row">' + ch(A, l.ch) + '<span class="money">' + lakh(l.value) + '</span></span>' + dupChip(A, l) +
      (lost && l.lost ? '<span class="bcard-row">Reason: ' + A.esc(l.lost) + '</span>' : '') +
      '<span class="bcard-row">' + A.avatar(l.owner) + (l.next && !won && !lost ? followUp(A, l) : A.esc(A.P[l.owner].name)) + '</span>' +
      '<span class="bcard-acts">' + (won ? '<button class="btn btn--sm btn--next" type="button" data-do="startbrand" data-l="' + l.id + '">' + A.ico('rocket') + 'Start the brand</button>'
        : (!lost && i < 5 ? '<button class="btn btn--sm" type="button" data-do="lmove" data-l="' + l.id + '" data-to="' + STAGES[i + 1] + '">' + A.ico('arrow-right') + STAGES[i + 1] + '</button>' : '')) +
      '<button class="btn btn--sm btn--ghost" type="button" data-do="lmenu" data-l="' + l.id + '" aria-label="Move ' + A.esc(l.brand) + ' to another stage">' + A.ico('dots-vertical') + 'Move</button></span></article>';
  }
  /* follow-up words: overdue in red with the word, never colour alone */
  function followUp(A, l, bare) {
    var w = A.dayWord(l.next), lw = /^(Today|Tomorrow|Yesterday)$/.test(w) ? w.toLowerCase() : w;
    if (l.next < A.TODAY) return '<span class="t-red">Follow-up overdue, ' + lw + '</span>';
    return (bare ? '' : 'Next: follow up ') + lw;
  }
  S.leads = function (A) {
    var mine = leadsFor(A), L = mine.filter(function (l) { return lpass(A, l); });
    var owners = A.ORDER.filter(function (x) { return mine.some(function (l) { return l.owner === x; }); });
    var F = '<div class="filters"><label class="search"><span class="sr-only">Search leads</span>' + A.ico('search') + '<input class="input" data-lf2="q" value="' + A.esc(LF.q) + '" placeholder="Search brand, contact, mobile, handle"></label>' +
      selF(A, 'data-lf2', 'owner', 'Owner', [['', 'Owner: anyone']].concat(owners.map(function (x) { return [x, A.P[x].name]; })), LF.owner) +
      selF(A, 'data-lf2', 'src', 'Source', [['', 'Source: all']].concat(SOURCES.map(function (k) { return [k, A.CHN[k]]; })), LF.src) +
      selF(A, 'data-lf2', 'any', 'Pick any field', [['', '+ Any field'], 'Interested in', 'Next follow-up', 'Value'], '') + A.dateFilter(LF).replace(/data-tf=/g, 'data-lf2=') + '</div>';
    var board = '<div class="board' + (LOSTOPEN ? ' lost-open' : '') + '" data-board>' + STAGES.map(function (s) {
      var cards = L.filter(function (l) { return l.stage === s; }), sum = cards.reduce(function (a, l) { return a + (+l.value || 0); }, 0), slim = s === 'Lost / Nurture' && !LOSTOPEN;
      /* G1: Lost / Nurture sits as a slim column (count + name) that opens on click, so all 7 stages fit at 1280 */
      return '<section class="col' + (s === 'Won' ? ' col--won' : s.indexOf('Lost') === 0 ? ' col--lost' : '') + (slim ? ' col--slim' : '') + '" data-stage="' + s + '"' + (slim ? ' data-do="lostopen" role="button" tabindex="0" aria-label="Open Lost / Nurture, ' + cards.length + ' leads"' : '') + '><div class="col-head"><h3 class="h-sec">' + s + '</h3><span class="count">' + cards.length + '</span>' +
        (s === 'Lost / Nurture' && LOSTOPEN ? '<button class="btn btn--icon btn--sm btn--ghost" type="button" data-do="lostopen" aria-label="Fold Lost / Nurture">' + A.ico('chevron-right') + '</button>' : '') + '</div>' +
        '<div class="col-sum">' + (sum ? lakh(sum) : '&nbsp;') + '</div>' + cards.map(function (l) { return card(A, l); }).join('') + '</section>';
    }).join('') + '</div>';
    return '<section style="display:flex;flex-direction:column;gap:var(--s-3)" data-leads><div class="page-head"><h1 class="h-page">Leads</h1><span class="chip">' + L.length + ' of ' + mine.length + ' leads</span><span class="chip">Sample data</span><span class="spacer" style="flex:1"></span>' +
      '<button class="btn btn--sm btn--ghost" type="button" data-do="xlsample">' + A.ico('download') + 'Excel sample</button>' +
      '<label class="btn btn--sm btn--ghost">' + A.ico('upload') + 'Upload Excel<input type="file" accept=".xlsx" data-xlup hidden></label>' +
      '<button class="btn btn--next" type="button" data-do="newlead">' + A.ico('plus') + 'New lead</button></div>' + F + (UP ? upCard(A) : '') +
      '<p class="f-help">Drag a card to another stage, or tap the next stage on the card. Moving to Lost / Nurture asks for a reason.</p>' + board + '</section>';
  };

  /* ---------------- lead record ---------------- */
  var LTAB = 'details';
  S.lead = function (A) {
    var id = (location.hash.match(/^#\/lead\/(L\d+)/) || [])[1], l = id && leadById(A, id);
    if (!l || leadsFor(A).indexOf(l) < 0) return '<div class="card empty"><span class="empty-art">' + A.ico('layout-kanban') + '</span><h2 class="h-sec">This lead is not on your list</h2><p>Leads show for their owner, their department head and Maddie.</p><a class="btn btn--next" href="#/leads">Back to Leads</a></div>';
    var i = STAGES.indexOf(l.stage), lost = l.stage === 'Lost / Nurture', won = l.stage === 'Won';
    var next = won ? '<button class="btn btn--next" type="button" data-do="startbrand" data-l="' + l.id + '">' + A.ico('rocket') + 'Start the brand</button>'
      : lost ? '<button class="btn btn--next" type="button" data-do="lmove" data-l="' + l.id + '" data-to="Contacted">' + A.ico('arrow-back-up') + 'Bring back to Contacted</button>'
      : '<button class="btn btn--next" type="button" data-do="lmove" data-l="' + l.id + '" data-to="' + STAGES[i + 1] + '">' + A.ico('arrow-right') + 'Move to ' + STAGES[i + 1] + '</button>';
    var steps = '<div><div class="steps" aria-hidden="true">' + STAGES.slice(0, 6).map(function (s, k) { return '<i' + (k < i ? ' class="on"' : k === i ? ' class="now"' : '') + '></i>'; }).join('') + '</div><span class="steps-txt">' + (lost ? 'Lost / Nurture' : 'Step ' + (i + 1) + ' of 6: ' + l.stage) + '</span></div>';
    var facts = [['Owner', A.P[l.owner].name], ['Contact', l.contact], ['Mobile', l.mobile || 'Not given'], ['Instagram', l.insta || 'Not given'], ['Email', l.email || 'Not given'], ['Source', A.CHN[l.ch]],
      ['Likely value', lakh(l.value)], ['Next follow-up', l.next ? (l.next < A.TODAY && !won && !lost ? 'Overdue, ' + A.low(A.dayWord(l.next)) : A.dayWord(l.next)) : 'Not set'], ['Interested in', l.interest || 'Not known yet']].concat(lost ? [['Lost because', l.lost]] : [])
      .map(function (f) { return '<div class="fact"><span class="label">' + f[0] + '</span><b' + (/^Overdue/.test(f[1]) ? ' class="t-red"' : '') + '>' + A.esc(f[1]) + '</b></div>'; }).join('');
    var who = A.assignable().indexOf(l.owner) < 0 ? [l.owner].concat(A.assignable()) : A.assignable();
    var details = '<form class="lead-edit" data-form="leadedit" data-l="' + l.id + '"><div class="f-row"><div class="f"><label for="le-stage">Stage</label><select class="select" id="le-stage" name="stage">' + STAGES.map(function (s) { return '<option' + (s === l.stage ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label for="le-owner">Owner</label><select class="select" id="le-owner" name="owner">' + who.map(function (x) { return '<option value="' + x + '"' + (x === l.owner ? ' selected' : '') + '>' + A.esc(A.P[x].name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label for="le-next">Next follow-up</label><input class="input" id="le-next" name="next" type="date" value="' + (l.next || '') + '"></div></div>' +
      '<div><button class="btn btn--solid btn--sm" type="submit">' + A.ico('check') + 'Save changes</button></div></form>';
    var hist = '<div class="list hist">' + l.history.slice().reverse().map(function (h) {
      return '<div class="lrow" style="--cols:120px minmax(0,1fr)"><span class="label">' + A.dayWord(h.at) + ', ' + A.clock(h.at) + '</span><span>' + (h.who === 'agent' || !A.P[h.who] ? '' : A.esc(A.P[h.who].name) + ': ') + A.esc(h.what) + '</span></div>'; }).join('') + '</div>';
    return '<section class="record" data-lead-rec="' + l.id + '"><div class="card rec-head">' +
      '<div class="page-head"><a class="btn btn--sm btn--ghost" href="#/leads">' + A.ico('arrow-back-up') + 'Leads</a><span class="label">Lead . ' + A.esc(l.stage) + '</span><span class="spacer" style="flex:1"></span>' + ch(A, l.ch) + '</div>' +
      '<h1 class="h-page">' + A.esc(l.brand) + '</h1>' +
      '<p class="rec-sentence">' + A.esc(l.contact) + ' at ' + A.esc(l.brand) + (l.interest ? ' wants ' + (/^[aeiou]/i.test(l.interest) ? 'an ' : 'a ') + A.esc(l.interest.toLowerCase()) : ' came in on ' + A.CHN[l.ch]) + ', about ' + lakh(l.value) + '. ' + A.esc(A.P[l.owner].name) + ' owns it' + (l.next && !won && !lost ? ', ' + (l.next < A.TODAY ? 'follow-up overdue since ' : 'next follow-up ') + A.low(A.dayWord(l.next)) + '.' : '.') + '</p>' +
      (l.dup ? '<div>' + dupChip(A, l) + '</div>' : '') +
      '<div class="rec-next">' + next + steps + '</div><div class="facts">' + facts + '</div>' +
      '<div class="tabs" role="tablist"><button class="tab" role="tab" type="button" data-do="ltab" data-t="details" aria-selected="' + (LTAB === 'details') + '">Details</button><button class="tab" role="tab" type="button" data-do="ltab" data-t="history" aria-selected="' + (LTAB === 'history') + '">History ' + l.history.length + '</button></div>' +
      (LTAB === 'details' ? details : hist) + '</div>' +
      window.GUC_THREAD(A, l.id, { id: 'lt-msg' }) + '</section>';
  };

  /* ---------------- Excel sample + upload ---------------- */
  var EXCELJS = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
  function need(cb) {
    if (window.ExcelJS) return cb();
    var sc = d.createElement('script'); sc.src = EXCELJS; sc.onload = cb;
    sc.onerror = function () { G().toast('The Excel maker could not load. Check the internet connection.'); }; d.head.appendChild(sc);
  }
  var COLS = [['Brand', 1], ['Contact name', 1], ['Mobile', 0], ['Instagram handle', 0], ['Email', 0], ['Source', 1, 'src'], ['Owner', 1, 'owner'], ['Interested in', 0, 'tpl'], ['Likely value, ₹ lakh', 0, 'num'], ['Next follow-up', 0, 'date'], ['First note', 0]];
  function lists(A) {
    return { src: SOURCES.map(function (k) { return A.CHN[k]; }), owner: A.assignable().map(function (x) { return A.P[x].name; }), tpl: A.TPL.slice() };
  }
  function sample(A) {
    need(function () {
      var L = lists(A), wb = new window.ExcelJS.Workbook(), fill = wb.addWorksheet('Fill this'), how = wb.addWorksheet('How to fill'), li = wb.addWorksheet('Lists');
      ['src', 'owner', 'tpl'].forEach(function (k, c) { li.getCell(1, c + 1).value = k; L[k].forEach(function (v, r) { li.getCell(r + 2, c + 1).value = v; }); });
      li.state = 'hidden';
      fill.columns = COLS.map(function (c) { return { header: c[0] + (c[1] ? ' *' : ''), width: Math.max(16, c[0].length + 4) }; });
      fill.getRow(1).font = { bold: true }; fill.views = [{ state: 'frozen', ySplit: 1 }];
      COLS.forEach(function (c, i) {
        var letter = fill.getColumn(i + 1).letter, k = ['src', 'owner', 'tpl'].indexOf(c[2]);
        for (var r = 2; r <= 501; r++) {
          var cell = fill.getCell(letter + r);
          if (k >= 0) { var col = 'ABC'[k]; cell.dataValidation = { type: 'list', allowBlank: !c[1], formulae: ['Lists!$' + col + '$2:$' + col + '$' + (L[c[2]].length + 1)], showErrorMessage: true, errorTitle: 'Pick from the list', error: 'Choose a value from the dropdown.' }; }
          else if (c[2] === 'num') cell.dataValidation = { type: 'decimal', operator: 'greaterThanOrEqual', allowBlank: true, formulae: [0], showErrorMessage: true, error: 'A number, 0 or more.' };
          else if (c[2] === 'date') { cell.dataValidation = { type: 'date', operator: 'greaterThan', allowBlank: true, formulae: [new Date(2020, 0, 1)], showErrorMessage: true, error: 'A date, like 30/10/2026.' }; cell.numFmt = 'yyyy-mm-dd'; }
        }
      });
      fill.addRow(['Leaf & Loaf Bakery', 'Pooja Rane', '+91 98765 43210', '@leafandloaf', 'pooja@leafandloaf.in', 'WhatsApp', L.owner[0], 'Influencer campaign', 2, A.addDays(A.TODAY + 'T00:00', 1).slice(0, 10), 'Bandra launch next month']);
      how.getCell('A1').value = 'Glad U Came: leads sheet'; how.getCell('A1').font = { bold: true, size: 14 };
      how.getCell('A2').value = 'One row per lead. Columns with * are required, and each lead needs a mobile or an Instagram handle. Dropdowns show today\'s lists. Row 2 is an example: replace it.';
      how.getCell('A3').value = 'Upload the file on the Leads screen. Nothing saves until you check the rows and press Save. A mobile or handle already on file is flagged, not dropped.';
      wb.xlsx.writeBuffer().then(function (buf) {
        var a = d.createElement('a'); a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
        a.download = 'Glad-U-Came-leads-sheet.xlsx'; d.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 500);
      });
      A.toast('The leads sheet is downloading, with today\'s owners and sources in its dropdowns.');
    });
  }
  function cellText(v) {
    if (v == null) return '';
    if (v instanceof Date) return new Date(v.getTime() - v.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    if (typeof v === 'object') { if (v.result != null) v = v.result; else if (v.text) v = v.text; else if (v.richText) v = v.richText.map(function (r) { return r.text; }).join(''); }
    return String(v).trim();
  }
  function upload(A, el) {
    var f = el.files && el.files[0]; if (!f) return; el.value = '';
    need(function () {
      var fr = new FileReader();
      fr.onload = function (e) {
        var wb = new window.ExcelJS.Workbook();
        wb.xlsx.load(e.target.result).then(function () {
          var ws = wb.getWorksheet('Fill this') || wb.worksheets[0], rows = [];
          ws.eachRow({ includeEmpty: false }, function (row, n) { if (n === 1) return; var v = COLS.map(function (c, i) { return cellText(row.getCell(i + 1).value); }); if (v.some(Boolean)) rows.push({ n: n, v: v }); });
          checkRows(A, rows, f.name); A.render();
        }, function () { A.toast('That file could not be read. Download the Excel sample and fill it.'); });
      };
      fr.readAsArrayBuffer(f);
    });
  }
  function checkRows(A, rows, name) {
    var L = lists(A), ok = [], errs = [], seenM = {}, seenH = {};
    var byName = {}; A.assignable().forEach(function (x) { byName[A.P[x].name] = x; });
    var srcKey = {}; SOURCES.forEach(function (k) { srcKey[A.CHN[k]] = k; });
    rows.forEach(function (r) {
      var v = r.v, bad = [];
      COLS.forEach(function (c, i) { if (c[1] && !v[i]) bad.push(c[0] + ' is empty'); });
      if (!v[2] && !v[3]) bad.push('needs a mobile or an Instagram handle');
      if (v[2] && digits(v[2]).length !== 10) bad.push('the mobile needs 10 digits');
      if (v[5] && !srcKey[v[5]]) bad.push('"' + v[5] + '" is not in the source list');
      if (v[6] && !byName[v[6]]) bad.push('"' + v[6] + '" is not in the owner list');
      if (v[7] && L.tpl.indexOf(v[7]) < 0) bad.push('"' + v[7] + '" is not in the interested in list');
      if (v[8] && isNaN(Number(v[8]))) bad.push('likely value must be a number');
      if (v[9] && !/^\d{4}-\d{2}-\d{2}$/.test(v[9])) bad.push('next follow-up must be a date');
      if (bad.length) { errs.push('Row ' + r.n + ': ' + bad.join('; ') + '.'); return; }
      var x = { brand: v[0], contact: v[1], mobile: v[2], insta: v[3] ? handle(v[3]) : '', email: v[4], ch: srcKey[v[5]], owner: byName[v[6]], interest: v[7], value: Number(v[8]) || 0, next: v[9], note: v[10] };
      x.dup = findDup(A, x);
      var m = digits(x.mobile), h = x.insta;
      if (!x.dup && ((m && seenM[m]) || (h && seenH[h]))) x.dup = { id: '', by: m && seenM[m] ? 'Mobile' : 'Instagram handle', row: seenM[m] || seenH[h] };
      if (m) seenM[m] = seenM[m] || r.n; if (h) seenH[h] = seenH[h] || r.n;
      ok.push(x);
    });
    UP = { name: name, ok: ok, errs: errs };
  }
  function upCard(A) {
    var dups = UP.ok.filter(function (x) { return x.dup; }).length;
    return '<section class="card" data-upcheck><div class="card-head"><h2 class="h-sec">Check the upload: ' + A.esc(UP.name) + '</h2></div>' +
      '<p class="lede"><b>' + UP.ok.length + ' lead' + (UP.ok.length === 1 ? '' : 's') + ' ready</b>' + (dups ? ', ' + dups + ' flagged as already on file' : '') + (UP.errs.length ? ', <b class="t-red">' + UP.errs.length + ' row' + (UP.errs.length === 1 ? '' : 's') + ' to fix</b> (they do not save)' : '') + '. Nothing is saved yet.</p>' +
      (UP.errs.length ? '<ul class="up-errs">' + UP.errs.slice(0, 12).map(function (e) { return '<li>' + A.esc(e) + '</li>'; }).join('') + (UP.errs.length > 12 ? '<li>and ' + (UP.errs.length - 12) + ' more</li>' : '') + '</ul>' : '') +
      '<div style="display:flex;gap:var(--s-2)"><button class="btn btn--next" type="button" data-do="upsave"' + (UP.ok.length ? '' : ' disabled') + '>' + A.ico('check') + 'Save ' + UP.ok.length + ' leads in New</button>' +
      '<button class="btn btn--ghost" type="button" data-do="upcancel">Cancel</button></div></section>';
  }
  function upSave(A) {
    var D = A.D(), made = [];
    UP.ok.forEach(function (x) {
      var l = { id: 'L' + (++D.seqL), brand: x.brand, contact: x.contact, mobile: x.mobile, insta: x.insta, email: x.email, ch: x.ch, interest: x.interest, value: x.value, owner: x.owner, stage: 'New',
        next: x.next, created: A.now(), lost: '', thread: x.note ? [{ who: A.ME(), text: x.note, at: A.now() }] : [], history: [] };
      l.dup = x.dup && x.dup.id ? x.dup : findDup(A, l);
      lhist(A, l, 'Added from the Excel upload ' + UP.name + '. Owner ' + A.P[l.owner].name);
      if (l.dup) lhist(A, l, 'Flagged: ' + l.dup.by + ' already on file');
      D.leads.push(l); made.push(l);
    });
    var n = made.length; UP = null; A.save(); A.render();
    A.toast(n + ' leads saved in New.', function () { D.leads = D.leads.filter(function (l) { return made.indexOf(l) < 0; }); A.save(); A.render(); });
  }

  /* ---------------- actions ---------------- */
  var prevAct = S._act;
  S._act = function (act, a, A) {
    var L = function () { return leadById(A, a.getAttribute('data-l')); };
    if (act === 'ibopen') { var c = A.D().inbox.filter(function (x) { return x.id === a.getAttribute('data-conv'); })[0]; IB.open = c.id; if (!c.read) { c.read = true; A.save(); } A.render(); return; }
    if (act === 'ibclear') { IB = { open: IB.open, q: '', ch: '', who: '', date: '', from_d: '', to_d: '' }; A.render(); return; }
    if (act === 'ibnote') {
      var cv = A.D().inbox.filter(function (x) { return x.id === a.getAttribute('data-c'); })[0], box = d.getElementById('ib-note'), t = box.value.trim();
      if (!t) { box.focus(); box.setAttribute('aria-invalid', 'true'); return; }
      cv.msgs.push({ kind: 'note', who: A.ME(), text: t, at: A.now() }); cv.history.push({ at: A.now(), who: A.ME(), what: 'Internal note' });
      mentions(A, t, 'a note on the ' + A.CHN[cv.ch] + ' chat with ' + cv.name);
      A.save(); A.render(); A.toast('Internal note added. The brand does not see it.'); return;
    }
    if (act === 'tolead') {
      var cc = A.D().inbox.filter(function (x) { return x.id === a.getAttribute('data-c'); })[0], last = cc.msgs.filter(function (m) { return m.kind === 'them'; }).slice(-1)[0];
      var isH = /^@/.test(cc.handle), isM = /^\+?\d/.test(cc.handle);
      openLead(A, { conv: cc.id, src: cc.ch, brand: cc.biz, contact: /^@/.test(cc.name) ? '' : cc.name, mobile: isM ? cc.handle : '', insta: isH ? cc.handle : '', email: /@.+\./.test(cc.handle) && !isH ? cc.handle : '',
        owner: cc.assigned && A.assignable().indexOf(cc.assigned) >= 0 ? cc.assigned : '', note: last ? last.text.slice(0, 140) : '' });
      return;
    }
    if (act === 'totask') { var ct = A.D().inbox.filter(function (x) { return x.id === a.getAttribute('data-c'); })[0]; A.openNewTask({ title: 'Reply to ' + ct.name + ' on ' + A.CHN[ct.ch], link: ct.lead || '' }); return; }
    if (act === 'newlead') return openLead(A, {});
    if (act === 'lostopen') { LOSTOPEN = !LOSTOPEN; A.render(); return; }
    if (act === 'lmove') return moveLead(A, L(), a.getAttribute('data-to'));
    if (act === 'lmenu') {
      d.querySelectorAll('.pop[data-temp]').forEach(function (p) { p.remove(); });
      var l = L(), m = d.createElement('div'); m.className = 'pop'; m.setAttribute('data-temp', ''); m.setAttribute('role', 'menu');
      m.innerHTML = STAGES.filter(function (s) { return s !== l.stage; }).map(function (s) { return '<button class="menu-i" role="menuitem" type="button" data-do="lmove" data-l="' + l.id + '" data-to="' + s + '">' + A.ico('arrow-right') + s + '</button>'; }).join('');
      m.style.right = '4px'; m.style.top = '100%'; a.closest('.bcard').appendChild(m); return;
    }
    if (act === 'startbrand') { var w = L(); if (w.stage !== 'Won') return moveLead(A, w, 'Won'); lhist(A, w, 'Start the brand pressed'); A.save(); A.toast(w.brand + ' is Won and on record. ' + A.P[w.owner].name + ' and Maddie can see it on the board.'); return; }
    if (act === 'ltab') { LTAB = a.getAttribute('data-t'); A.render(); return; }
    if (act === 'ltsend') {
      var ll = L(), tb = d.getElementById('lt-msg'), tx = tb.value.trim();
      if (!tx) { tb.focus(); return; }
      ll.thread.push({ who: A.ME(), text: tx, at: A.now() }); mentions(A, tx, 'the ' + ll.brand + ' team thread');
      A.save(); A.render(); A.toast('Sent to the team thread.'); return;
    }
    if (act === 'msgtask') { var lm = L(), msg = lm.thread[+a.getAttribute('data-m')]; A.openNewTask({ title: msg.text.replace(/@\w+\s*/g, '').slice(0, 90), link: lm.id }); return; }
    if (act === 'xlsample') return sample(A);
    if (act === 'upsave') return upSave(A);
    if (act === 'upcancel') { UP = null; A.render(); return; }
    if (prevAct) prevAct(act, a, A);
  };
  function mentions(A, text, where) {
    (text.match(/@(\w+)/g) || []).forEach(function (m) { var f = m.slice(1).toLowerCase();
      A.ORDER.forEach(function (id) { if (A.P[id].name.split(' ')[0].toLowerCase() === f) A.note(id, A.me().name + ' mentioned you in ' + where + '.'); }); });
  }
  S._parse = function (kind, text, dl, A) { return kind === 'lead' ? parseLead(A, text, dl) : kind === 'lost' ? parseLost(A, text, dl) : 0; };
  S._after = function (r) { if (r === 'inbox' && IB.open) { var m = d.querySelector('.conv .msgs'); if (m) m.scrollTop = m.scrollHeight; } };

  /* filters, forms, assign, drag and drop */
  d.addEventListener('input', function (e) {
    var el = e.target, A = G(); if (!A) return;
    if (el.getAttribute('data-ibf') === 'q') { IB.q = el.value; A.render(); }
    if (el.getAttribute('data-lf2') === 'q') { LF.q = el.value; A.render(); }
    if (el.closest && el.closest('#dlg-lead') && (el.name === 'mobile' || el.name === 'insta' || el.name === 'email')) dupWarn(A, el.closest('dialog'));
  });
  d.addEventListener('change', function (e) {
    var el = e.target, A = G(); if (!A) return;
    if (el.hasAttribute('data-ibf') && el.getAttribute('data-ibf') !== 'q') { IB[el.getAttribute('data-ibf')] = el.value; A.render(); }
    if (el.hasAttribute('data-lf2') && el.getAttribute('data-lf2') !== 'q') { LF[el.getAttribute('data-lf2')] = el.value; A.render(); }
    if (el.hasAttribute('data-xlup')) upload(A, el);
    if (el.hasAttribute('data-ib-assign') && el.value) {
      var c = A.D().inbox.filter(function (x) { return x.id === el.getAttribute('data-ib-assign'); })[0], to = el.value;
      c.assigned = to; c.history.push({ at: A.now(), who: A.ME(), what: 'Assigned to ' + A.P[to].name });
      A.note(to, A.me().name + ' gave you the ' + A.CHN[c.ch] + ' chat with ' + c.name + '.'); A.save(); A.render();
      A.toast('Assigned to ' + A.P[to].name + '.');
    }
  });
  d.addEventListener('submit', function (e) {
    var f = e.target.getAttribute && e.target.getAttribute('data-form'), A = G();
    if (f === 'lead') { e.preventDefault(); e.stopImmediatePropagation(); if (saveLead(A, e.target)) e.target.closest('dialog').close(); }
    if (f === 'lost') {
      e.preventDefault(); e.stopImmediatePropagation();
      var dl = e.target.closest('dialog'), why = e.target.querySelector('[name=why]').value, nt = e.target.querySelector('[name=note]').value.trim();
      if (!why) { e.target.querySelector('#ll-err').textContent = 'Pick a reason. It is needed to move a lead to Lost / Nurture.'; return; }
      dl.close(); moveLead(A, leadById(A, dl.getAttribute('data-lead')), 'Lost / Nurture', why + (nt ? ', ' + nt : ''));
    }
    if (f === 'leadedit') {
      e.preventDefault(); e.stopImmediatePropagation();
      var l = leadById(A, e.target.getAttribute('data-l')), st = e.target.querySelector('[name=stage]').value, ow = e.target.querySelector('[name=owner]').value, nx = e.target.querySelector('[name=next]').value, ch2 = [];
      if (ow !== l.owner) { ch2.push('Owner ' + A.P[l.owner].name + ' to ' + A.P[ow].name); A.note(ow, A.me().name + ' gave you the lead ' + l.brand + '.'); l.owner = ow; }
      if (nx !== (l.next || '')) { ch2.push('Next follow-up ' + (l.next ? A.dayWord(l.next) : 'not set') + ' to ' + (nx ? A.dayWord(nx) : 'not set')); l.next = nx; }
      if (ch2.length) { lhist(A, l, ch2.join('. ')); A.save(); }
      if (st !== l.stage) return moveLead(A, l, st);
      A.render(); A.toast(ch2.length ? 'Saved. History has the change.' : 'Nothing changed.');
    }
  }, true);
  var dragId = null;
  d.addEventListener('dragstart', function (e) { var c = e.target.closest && e.target.closest('[data-lead]'); if (!c) return; dragId = c.getAttribute('data-lead'); e.dataTransfer.setData('text/plain', dragId); e.dataTransfer.effectAllowed = 'move'; });
  d.addEventListener('dragover', function (e) { if (dragId && e.target.closest && e.target.closest('[data-stage]')) e.preventDefault(); });
  d.addEventListener('drop', function (e) {
    var col = e.target.closest && e.target.closest('[data-stage]'), A = G(); if (!col || !dragId) return;
    e.preventDefault(); var id = dragId; dragId = null; moveLead(A, leadById(A, id), col.getAttribute('data-stage'));
  });
  d.addEventListener('dragend', function () { dragId = null; });
})();
