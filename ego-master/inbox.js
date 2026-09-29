'use strict';
/* Inbox: every WhatsApp, Instagram, Facebook, email and website-chat conversation in one place.
   Follows the division switch and the viewer's access, links each conversation to its dealer / lead / architect,
   and suggests a reply. WhatsApp outside Meta's 24-hour window can only be answered with an approved template. */

const CH = {
  whatsapp: ['WhatsApp', 'ok'], instagram: ['Instagram', 'warn'], facebook: ['Facebook', 'info'], email: ['Email', 'plain'], website: ['Website chat', 'plain'],
};
const chBadge = c => `<span class="badge ${CH[c][1]}">${CH[c][0]}</span>`;
const WA_TEMPLATES = ['Follow-up: we tried to reach you about your enquiry', 'Order update: your order status has changed', 'Visit booking: pick a time for a free home visit'];
const ARCH_ = byId(D.architect);

// Access: a conversation is visible if its record is. Unknown senders: whole-division roles, or whoever it is assigned to.
const seeConvo = c => {
  if (!c || acc().scope === 'dealer') return false;
  const w = c.who;
  if (w.kind === 'dealer') return !!DL[w.id] && seeDealer(DL[w.id]);
  if (w.kind === 'lead') return !!LEAD[w.id] && seeLead(LEAD[w.id]);
  if (w.kind === 'architect') return scopeOk('retail', () => ARCH_[w.id] && ARCH_[w.id].owner === EM.meId);
  return scopeOk(c.division, () => c.assigned === EM.meId);
};
const inDiv = c => EM.div === 'both' || c.division === EM.div;
const convos = () => D.conversation.filter(c => seeConvo(c) && inDiv(c)).sort((a, b) => b.last_at.localeCompare(a.last_at));
EM.navBadge ||= {};
EM.navBadge.inbox = () => D.conversation.filter(c => c.unread && seeConvo(c) && inDiv(c)).length;

const lastIn = c => c.messages.filter(m => m.dir === 'in').slice(-1)[0];
const waClosed = c => c.channel === 'whatsapp' && lastIn(c) && (NOW - dt(lastIn(c).at)) / 36e5 > 24;
const recordLink = c => {
  const w = c.who;
  if (w.kind === 'dealer') return `<a href="#/dealer/${w.id}">Open dealer</a>`;
  if (w.kind === 'lead') return `<a href="#/lead/${w.id}">Open lead</a>`;
  if (w.kind === 'architect') return `<a href="#/architect/${w.id}">Open architect</a>`;
  return c.division === 'wholesale'
    ? `<button class="btn sm" data-act="ib-dealer" data-t="${c.id}">+ Add as dealer</button>`
    : `<button class="btn sm" data-act="ib-lead" data-t="${c.id}">+ Create lead</button>`;
};

EM.ibf ||= { ch: 'all', f: '' };
EM.VIEWS.inbox = id => {
  const all = convos();
  const list = all.filter(c => (EM.ibf.ch === 'all' || c.channel === EM.ibf.ch) &&
    (!EM.ibf.f || (EM.ibf.f === 'unread' && c.unread) || (EM.ibf.f === 'unassigned' && !c.assigned) || (EM.ibf.f === 'mine' && c.assigned === EM.meId)));
  const cur = list.find(c => c.id === id) || (id ? all.find(c => c.id === id) : null) || list[0];
  if (cur) cur.unread = false;
  const pill = (k, l, key) => `<button class="${(key === 'ch' ? EM.ibf.ch : EM.ibf.f) === k ? 'on' : ''}" data-inf="${k}" data-key="${key}">${l}</button>`;
  const rows = list.map(c => { const m = c.messages[c.messages.length - 1];
    return `<a class="ib-row ${cur && c.id === cur.id ? 'on' : ''}" href="#/inbox/${c.id}" data-ch="${c.channel}" data-t="${c.id}">
      <div class="row between" style="flex-wrap:nowrap"><b class="ib-name">${esc(c.who.name)}</b><span class="small muted" style="white-space:nowrap">${ago(c.last_at)}</span></div>
      <div class="row" style="gap:6px">${chBadge(c.channel)}${c.unread ? '<span class="ib-dot" aria-label="unread"></span>' : ''}${c.assigned ? '' : '<span class="badge bad">Unassigned</span>'}</div>
      <div class="small muted ib-snip">${esc(m.body)}</div></a>`; }).join('') || '<p class="muted" style="padding:14px">No conversations match.</p>';
  const thread = cur ? (() => {
    const staff = D.employee.filter(u => u.status === 'active' && (u.division === cur.division || u.division === 'both'));
    const closed = waClosed(cur);
    return `<div class="ib-head"><div class="stack-s"><div class="row">${chBadge(cur.channel)}<b>${esc(cur.who.name)}</b><span class="small muted">${esc(cur.who.handle || '')}</span></div>
        ${cur.subject ? `<div class="small"><b>Subject:</b> ${esc(cur.subject)}</div>` : ''}
        <div class="row small">${recordLink(cur)}<span class="muted">${cur.division === 'wholesale' ? 'Wholesale · EGO' : 'Retail · Big E'}</span></div></div>
        <label class="field" style="min-width:190px"><span class="small muted">Assigned to</span><select class="input" data-ib-assign="${cur.id}"><option value="">Unassigned</option>${staff.map(u => `<option value="${u.id}" ${u.id === cur.assigned ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></label></div>
      <div class="ib-thread">${cur.messages.map(m => `<div class="ib-msg ${m.dir}"><div>${esc(m.body)}</div><div class="small muted">${m.dir === 'out' ? esc(m.by) + ' · ' : ''}${dFmt(m.at)} ${tFmt(m.at)}</div></div>`).join('')}</div>
      ${cur.ai_reply && !closed ? `<div class="callout ib-ai"><span class="small"><b>AI suggestion</b> · check it before sending</span><div>${esc(cur.ai_reply)}</div><button class="btn sm" data-act="ib-use" data-t="${cur.id}">Use this reply</button></div>` : ''}
      <div class="ib-compose stack-s">
        ${closed ? `<div class="callout warn small">Last message was more than 24 hours ago. WhatsApp only allows an approved template now.</div>
          <select class="input" id="ib-tpl">${WA_TEMPLATES.map(t => `<option>${esc(t)}</option>`).join('')}</select>
          <div class="row"><button class="btn primary" data-act="ib-send-tpl" data-t="${cur.id}">Send template</button></div>`
        : `${cur.channel === 'email' ? `<input class="input" id="ib-subj" value="Re: ${esc(cur.subject || '')}" aria-label="Subject">` : ''}
          <textarea class="input" id="ib-text" rows="3" placeholder="Reply on ${CH[cur.channel][0]}" aria-label="Reply"></textarea>
          <div class="row"><button class="btn primary" data-act="ib-send" data-t="${cur.id}">Send on ${CH[cur.channel][0]}</button></div>`}
      </div>`;
  })() : '<p class="muted" style="padding:20px">Pick a conversation.</p>';
  return `<div class="stack">
    <div class="stack-s"><div class="kicker">Every channel, one place</div><h1>Inbox</h1>
      <p class="muted" style="max-width:780px">WhatsApp, Instagram, Facebook, email and website chat land here, linked to the dealer, lead or architect they came from. You see the conversations your access allows.</p></div>
    <div class="row" style="gap:10px"><div class="seg">${pill('all', 'All', 'ch')}${Object.entries(CH).map(([k, [l]]) => pill(k, l, 'ch')).join('')}</div>
      <div class="seg">${pill('', 'Everything', 'f')}${pill('unread', 'Unread', 'f')}${pill('unassigned', 'Unassigned', 'f')}${pill('mine', 'Mine', 'f')}</div></div>
    <div class="inbox"><div class="ib-list">${rows}</div><div class="ib-pane">${thread}</div></div>
    <p class="small muted">Sample conversations. In the live build these arrive from your WhatsApp Business number, Instagram and Facebook pages, email inbox and website chat.</p></div>`;
};
EM.VIEWS.inbox.title = () => 'Inbox';

document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-inf]'); if (!b) return;
  EM.ibf[b.dataset.key] = b.dataset.inf; location.hash = '#/inbox'; EM.rerender();
});
document.addEventListener('change', e => {
  const t = e.target; if (!t.dataset || t.dataset.ibAssign === undefined) return;
  const c = D.conversation.find(x => x.id === t.dataset.ibAssign); c.assigned = t.value || null;
  EM.toast(c.assigned ? `Assigned to <b>${esc(EMP[c.assigned].name)}</b>. They get a notification on the phone app.` : 'Unassigned.');
  EM.rerender();
});
const ibPush = (c, body) => { const at = stamp(); c.messages.push({ dir: 'out', at, body, by: me().name }); c.last_at = at; c.ai_reply = null; if (!c.assigned) c.assigned = EM.meId; };
EM.ACTIONS['ib-use'] = el => { const c = D.conversation.find(x => x.id === el.dataset.t); qs('#ib-text').value = c.ai_reply; qs('#ib-text').focus(); };
EM.ACTIONS['ib-send'] = el => {
  const c = D.conversation.find(x => x.id === el.dataset.t), body = qs('#ib-text').value.trim();
  if (!body) return EM.toast('Type a reply first.');
  ibPush(c, body); EM.toast(`Sent on <b>${CH[c.channel][0]}</b> to ${esc(c.who.name)}.`); EM.rerender();
};
EM.ACTIONS['ib-send-tpl'] = el => {
  const c = D.conversation.find(x => x.id === el.dataset.t); ibPush(c, '[Template] ' + qs('#ib-tpl').value);
  EM.toast('Template sent. When they reply, the 24-hour window opens again.'); EM.rerender();
};
EM.ACTIONS['ib-lead'] = el => {
  const c = D.conversation.find(x => x.id === el.dataset.t), at = stamp(), id = 'lea_new' + EM.tick;
  const l = { id, name: c.who.name, phone: /^\+?\d/.test(c.who.handle) ? c.who.handle : '', source: CH[c.channel][0], market: D.market[0].id, created: at, stage: 'New', history: [['New', at]],
    category: 'Not known yet', application: 'Not known yet', area_sqft: 0, budget: 'Not known yet', with_architect: false, company: 'co_bige', dealer: null, owner: c.assigned || EM.meId,
    ai_score: null, value: 0, lost_reason: null, demo: true, division: 'retail' };
  D.lead.unshift(l); LEAD[id] = l;
  c.who = { ...c.who, kind: 'lead', id }; c.assigned = l.owner;
  EM.toast(`<b>Lead created</b><ul><li>${esc(l.name)} · from ${esc(l.source)}</li><li>Owner ${esc(EMP[l.owner].name)}; the conversation stays linked</li></ul>`); EM.rerender();
};
EM.ACTIONS['ib-dealer'] = el => { EM.ACTIONS['dealer-add'](); EM.afterDealer = { convo: el.dataset.t }; };
