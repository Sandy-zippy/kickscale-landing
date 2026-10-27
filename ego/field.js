'use strict';
/* EGO Master: the FIELD SALES APP (17 Oct 2026, R2a). Loaded instead of the team's app when a login's role opens
   the field app (Field Sales), the way portal.js is for dealers. Phone first, the patterns of design/CONTRACT.txt
   as they are. Today: Start my day / End my day with a selfie, the time and the GPS fix. Visits: today's Roadmap,
   Directions, Check in, how it went. Me: name, company, theme, Add to home screen, Sign out.
   R2b: + Requirement (an opportunity at once, on telesales' list), My requirements, My numbers, and weak network:
   every write is kept on the phone (IndexedDB, photos as Blobs) when there is no signal and sent in order when it
   returns, each with its own id so a send that is repeated never makes a second record. */
(function () {
  const API = window.EGOAPI.api;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const qs = s => document.querySelector(s);
  const ic = (n, cls) => `<svg class="${cls || 'fd-ic'}" aria-hidden="true"><use href="icons.svg#i-${n}"/></svg>`;
  let B = null, root = null;
  /* F2 L-1: the server refuses a Both login's lead without the switch; the field app works in wholesale unless the login is Big E */
  if (typeof window.__egoSw !== 'function') window.__egoSw = () => (B && B.user && B.user.division === 'retail' ? 'retail' : 'wholesale');
  const S = { cam: null, camErr: '', stream: null, shot: null, shotUrl: '', gps: null, confirm: null, sheet: '', busy: false, base: null, req: null, rf: 'all', ask: null, af: 'all' };
  const F = () => B.field || { visits: [], days: [], start: '10:00' };
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const ist = ts => new Date((ts ? Date.parse(ts) : Date.now()) + 5.5 * 36e5);
  const hm = ts => { const d = ist(ts); return `${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };
  const dayLong = d => { const x = new Date(d + 'T00:00:00Z'); return `${DAYS[x.getUTCDay()]}, ${x.getUTCDate()} ${MON[x.getUTCMonth()]}`; };
  const dayShort = ts => { const d = ist(ts); return `${DAYS[d.getUTCDay()].slice(0, 3)} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`; };
  const mins = n => n >= 60 ? `${Math.floor(n / 60)} h ${n % 60} min` : `${n} min`;
  const startMin = () => { const m = /^(\d{1,2}):(\d\d)$/.exec(F().start || '10:00'); return m ? +m[1] * 60 + +m[2] : 600; };
  const nowMin = () => { const d = ist(); return d.getUTCHours() * 60 + d.getUTCMinutes(); };
  const initials = n => String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const CO = { wholesale: 'EGO Premium', retail: 'Big E', both: 'EGO Premium and Big E' };
  const KIND = { distributor: ['building-warehouse', 'Distributor'], dealer: ['building-store', 'Dealer'], sub_dealer: ['building-community', 'Sub-dealer'], retailer: ['shopping-bag', 'Retailer'],
    architect: ['ruler-measure', 'Architect'], project: ['building-skyscraper', 'Project site'], prospect: ['user-plus', 'New prospect'] };
  const kind = k => `<span class="fd-kind">${ic((KIND[k] || KIND.retailer)[0])}${esc((KIND[k] || KIND.retailer)[1])}</span>`;
  const OUT_IC = { 'Order taken': 'list-check', 'Requirement taken': 'plus', 'Follow-up set': 'calendar', 'Sample given': 'square-plus', 'Not available': 'user-x', 'Shop closed': 'circle-x' };
  const att = () => F().attendance, started = () => !!(att() && att().start_at), ended = () => !!(att() && att().end_at);
  const vis = () => F().visits || [];
  const doneN = () => vis().filter(v => v.status === 'done' || v.status === 'in').length, missedV = () => vis().filter(v => v.status === 'missed');
  const nextV = () => vis().find(v => v.status === 'planned');
  const steps = () => `<div class="fd-steps">${vis().map(v => `<i class="${v.status === 'done' || v.status === 'in' ? 'done' : v.status === 'missed' ? 'missed' : nextV() && v.id === nextV().id && started() ? 'now' : ''}"></i>`).join('')}</div>`;
  /* on time, days in a row: each day started counts, a late start ends the run (a day off is no day, so it does not break it) */
  const streak = () => { let n = 0; for (const d of F().days || []) { if (!d.start_at) continue; if (d.late_min > 0) break; n++; } return n; };
  const placeOf = (lat, lng, acc, noloc) => noloc || lat == null ? 'location not shared' : `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}${acc != null ? ` · within ${acc} m` : ''}`;
  const mapUrl = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  /* ---- toast with Undo where there is one */
  function toast(html, undoN) {
    let t = qs('.fd-toast'); if (t) t.remove();
    t = document.createElement('div'); t.className = 'fd-toast'; t.setAttribute('role', 'status');
    t.innerHTML = `${ic('circle-check')}<span>${html}</span>${undoN != null ? `<button type="button" data-fa="undo" data-n="${undoN}">Undo</button>` : ''}`; (root || document.body).appendChild(t);
    clearTimeout(toast.t); toast.t = setTimeout(() => t.remove(), undoN != null ? 6000 : 3500);
  }

  /* ---- weak network (R2b). Every write from the phone goes through write(): sent at once when there is signal and
     nothing older is waiting; otherwise kept in IndexedDB (photos as Blobs) and sent in order by flush() on the
     "online" event, every 30 s and when the app opens. Each entry carries its own id (idempotency-key): the server
     takes the id before doing the work, so a send repeated after a dropped answer never makes a second record.
     What the entry does is also applied to the screen at once (op), and again over every fresh copy from the server
     until it has been sent. Entries are kept per login. */
  const Q = { items: [], bad: [], busy: false, mem: [] };
  const newKey = () => (crypto.randomUUID ? crypto.randomUUID() : [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join(''));
  let idbP = null;
  const idb = () => idbP || (idbP = new Promise(ok => { try { const r = indexedDB.open('ego-field', 1); r.onupgradeneeded = () => r.result.createObjectStore('q', { keyPath: 'n', autoIncrement: true }); r.onsuccess = () => ok(r.result); r.onerror = () => ok(null); } catch (e) { ok(null); } }));
  const store = async (mode, fn) => { const db = await idb(); if (!db) return fn(null); return new Promise((ok, bad) => { const tx = db.transaction('q', mode), st = tx.objectStore('q'); let out; const r = fn(st); if (r) r.onsuccess = () => { out = r.result; }; tx.oncomplete = () => ok(out); tx.onerror = () => bad(tx.error); }); };
  const qAll = async () => { const db = await idb(); if (!db) return Q.mem.slice(); return (await store('readonly', st => st.getAll())) || []; };
  const qAdd = async it => { const db = await idb(); if (!db) { it.n = (Q.mem.length ? Q.mem[Q.mem.length - 1].n : 0) + 1; Q.mem.push(it); return it.n; } return store('readwrite', st => st.add(it)); };
  const qDel = async n => { const db = await idb(); if (!db) { Q.mem = Q.mem.filter(x => x.n !== n); return; } return store('readwrite', st => st.delete(n)); };
  const qPut = async it => { const db = await idb(); if (!db) { Q.mem = Q.mem.map(x => x.n === it.n ? it : x); return; } return store('readwrite', st => st.put(it)); };
  /* F2 T-08: an entry the server refused (refused: its reason) stays on the phone in Q.bad, out of the sending line; a lead
     shows in Mine with the reason and opens again in its form to fix and send (the old entry goes once the new one is saved) */
  const qLoad = async () => { const all = (await qAll().catch(() => [])).filter(x => x.user === B.user.id).sort((a, b) => a.n - b.n); Q.items = all.filter(x => !x.refused); Q.bad = all.filter(x => x.refused); };
  /* what a waiting entry does to the screen until it is sent */
  function applyOp(f, op) {
    const v = op.id && (f.visits || []).find(x => x.id === op.id);
    if (op.type === 'start' && !f.attendance) f.attendance = { start_at: op.at, late_min: Math.max(0, (d => d.getUTCHours() * 60 + d.getUTCMinutes())(ist(op.at)) - startMin()), start_noloc: !op.gps, start_photo: '', end_at: '', waiting: true };
    if (op.type === 'end' && f.attendance && !f.attendance.end_at) { f.attendance.end_at = op.at; (f.visits || []).forEach(x => { if (x.status === 'planned') x.status = 'missed'; }); }
    if (op.type === 'checkin' && v && v.status === 'planned') Object.assign(v, { status: 'in', checkin_at: op.at, checkin_noloc: !op.gps, checkin_lat: op.gps && op.gps.lat, checkin_lng: op.gps && op.gps.lng, checkin_acc: op.gps && op.gps.acc, waiting: true });
    if (op.type === 'outcome' && v && (v.status === 'in' || v.status === 'done')) Object.assign(v, { status: 'done', outcome: op.outcome, note: op.note || '', extra: { ...(v.extra || {}), boxes: op.boxes, follow_on: op.follow_on }, waiting: true });
    if (op.type === 'ask') { const A = f.asks || (f.asks = { approvals: [], complaints: [] }), k = op.ghost.t === 'approval' ? 'approvals' : 'complaints'; if (!(A[k] || []).some(r => r.key === op.key)) A[k] = [{ ...op.ghost, key: op.key, waiting: true, created_at: op.at }, ...(A[k] || [])]; }
    if (op.type === 'req' && !(f.reqs || []).some(r => r.key === op.key)) f.reqs = [{ ...op.ghost, key: op.key, waiting: true, created_at: op.at }, ...(f.reqs || [])];
    if (op.type === 'lead' && !(f.leads || []).some(r => r.key === op.key)) f.leads = [{ ...op.ghost, key: op.key, waiting: !op.refused, refused: op.refused || '', qn: op.qn, created_at: op.at }, ...(f.leads || [])];   // L4
    /* T5: an SDR inspection or Give waiting to send shows at once: the dealer leaves "SDR inspection due", the lines show */
    if (op.type === 'sdr' || op.type === 'sdrgive') { const X = f.sdr || (f.sdr = { regs: [], due: [] });
      if (!(X.regs || []).some(r => r.key === op.key)) X.regs = [...(X.regs || []), ...op.ghost.map((g, i) => ({ ...g, id: g.id || `wait_${op.key}_${i}`, key: op.key, waiting: true, created_at: op.at }))];
      if (op.type === 'sdr') X.due = (X.due || []).filter(d => d.client_id !== op.cid); }
  }
  /* a fresh copy of the day from the server, with every waiting entry laid over it */
  function setField(f) { if (!f) return; S.base = JSON.parse(JSON.stringify(f)); const x = JSON.parse(JSON.stringify(f)); for (const it of Q.items) applyOp(x, it.op); for (const it of Q.bad || []) applyOp(x, { ...it.op, refused: it.refused, qn: it.n }); B.field = x; saveBoot(); }
  /* what this phone last had, so the app opens with no signal (boot.js reads it back) */
  const saveBoot = () => { clearTimeout(saveBoot.t); saveBoot.t = setTimeout(() => { try { localStorage.setItem('ego-field-boot', JSON.stringify({ ...B, field: S.base || B.field })); } catch (e) {} }, 300); };
  async function write(path, fd, op, label) {
    const key = newKey(), at = new Date().toISOString();
    fd.append('at', at); op.at = at; op.key = key;
    if (!Q.items.length && navigator.onLine !== false) {
      try { const r = await API('POST', path, fd, true, { 'idempotency-key': key }); setField(r.field); return { sent: true, r }; }
      catch (e) { if (!e.offline) throw e; }
    }
    const parts = []; for (const [k, v] of fd.entries()) parts.push([k, v, typeof v === 'string' ? null : (v.name || 'photo.jpg')]);
    const n = await qAdd({ key, path, label, parts, op, user: B.user.id, saved: at });
    await qLoad(); setField(S.base || B.field);
    if (navigator.onLine !== false) setTimeout(flush, 50);
    return { queued: true, n };
  }
  async function flush() {
    if (Q.busy || navigator.onLine === false) return;
    Q.busy = true; let sent = 0;
    try {
      await qLoad();
      for (const it of Q.items) {
        const fd = new FormData(); for (const [k, v, name] of it.parts) name ? fd.append(k, v, name) : fd.append(k, v);
        try { const r = await API('POST', it.path, fd, true, { 'idempotency-key': it.key }); await qDel(it.n); sent++; if (r.field) S.base = JSON.parse(JSON.stringify(r.field)); }
        catch (e) { if (e.offline || !e.status || e.status >= 500) break;   // the server said no: sending it again unchanged would never work
          if (it.op && it.op.type === 'lead') { await qPut({ ...it, refused: e.message || 'Refused' }); toast(`<b>Not sent: ${esc(it.label)}.</b> ${esc(e.message)} It is kept in Mine: fix it and send again.`); }
          else { await qDel(it.n); toast(`<b>Not sent: ${esc(it.label)}.</b> ${esc(e.message)}`); } }
      }
    } finally {
      Q.busy = false; await qLoad();
      if (sent) { try { const r = await API('GET', '/api/field/me'); S.base = r.field; } catch (e) {} toast(`<b>Sent: ${sent} entr${sent === 1 ? 'y' : 'ies'}</b>`); }
      setField(S.base || B.field); if (!S.cam && !S.sheet && !['req', 'lead', 'raise', 'sdr'].includes(route())) render(); else paintBanner();
    }
  }
  const banner = () => { const n = Q.items.length, off = navigator.onLine === false; return !n && !off ? '' : `<div class="fd-offline" role="status">${ic('wifi-off')}<span><b>${off ? 'No signal.' : 'Sending.'}</b> Saved on this phone, will send when signal returns.</span>${n ? `<span class="fd-pill">${n}</span>` : ''}</div>`; };
  const paintBanner = () => { const el = qs('.fd-offline'), html = banner(); if (el) { if (html) el.outerHTML = html; else el.remove(); } else if (html) { const v = qs('.fd-view'); if (v) v.insertAdjacentHTML('afterbegin', html); } };

  /* ---- top bar and bottom bar */
  const hello = () => { const h = ist().getUTCHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
  const top = (title, sub, right) => `<header class="fd-top"><div class="fd-hello"><b>${esc(title)}</b><span>${esc(sub)}</span></div>${Q.items.length ? `<span class="fd-sync">${ic('cloud-upload')}${Q.items.length} waiting</span>` : right || `<span class="fd-avatar" aria-label="${esc(B.user.name)}">${esc(initials(B.user.name))}</span>`}</header>`;
  /* the bar is exactly Today . Visits . + Requirement . My numbers . Me; an item shows once its screen works (R2b turns on the two) */
  const NAV = [['today', 'sun', 'Today', true], ['visits', 'route', 'Visits', true], ['new', 'plus', 'New', true], ['numbers', 'chart-donut-3', 'My numbers', true], ['me', 'user-circle', 'Me', true]];   // L4: + New opens the chooser (Requirement or Lead)
  const nav = on => `<nav class="fd-nav" aria-label="Field app">${NAV.filter(n => n[3]).map(([k, i, l]) => { const add = k === 'new', left = vis().filter(v => v.status === 'planned').length;
    return `<a href="#/${k}"${add ? ' data-fa="pick"' : ''} class="${add ? 'fd-add' : ''}${on === k ? ' on' : ''}"${on === k ? ' aria-current="page"' : ''}><span class="fd-ind">${ic(i)}</span>${add ? `<span><span class="fd-sr">+ </span>${l}</span>` : l}${k === 'visits' && left ? `<em class="fd-count">${left}</em>` : ''}</a>`; }).join('')}</nav>`;

  /* ---- a visit card (Today) and a visit row (Visits) */
  const checkBtn = (v, primary) => !started() ? `<button class="fd-btn" disabled>${ic('map-pin-check')}Check in</button>` : ended() ? '' : `<button class="fd-btn${primary ? ' primary' : ''}" data-fa="checkin" data-id="${v.id}">${ic('map-pin-check')}Check in</button>`;
  const dirBtn = v => `<a class="fd-btn" href="${esc(v.directions)}" target="_blank" rel="noopener">${ic('navigation')}Directions</a>`;
  const where = v => v.address || v.area || '';   // the saved address already ends with the city
  const outLine = v => [v.outcome, v.extra && v.extra.boxes != null ? `${v.extra.boxes} boxes` : '', v.extra && v.extra.follow_on ? `follow-up ${v.extra.follow_on}` : '', v.note].filter(Boolean).join(' · ');
  function visitRow(v, n) {
    const isNext = nextV() && v.id === nextV().id, st = v.status === 'done' ? 'done' : v.status === 'missed' ? 'missed' : v.status === 'in' ? 'in' : isNext ? 'next' : 'pending';
    const pill = st === 'done' ? `<span class="fd-pill ok">Done ${hm(v.checkin_at)}</span>` : st === 'missed' ? '<span class="fd-pill bad">Missed</span>' : st === 'in' ? `<span class="fd-pill ok">${ic('map-pin-check')}Checked in ${hm(v.checkin_at)}</span>` : st === 'next' ? '<span class="fd-pill ink">Next</span>' : '';
    const acts = st === 'next' || st === 'pending' ? `<div class="fd-acts">${dirBtn(v)}${checkBtn(v, st === 'next')}</div>` : st === 'in' ? `<div class="fd-acts"><button class="fd-btn primary" data-fa="sheet" data-id="${v.id}">${ic('pencil')}How did it go</button></div>${sdrBtn(v) ? `<div class="fd-acts">${sdrBtn(v)}</div>` : ''}` : st === 'done' && sdrBtn(v) ? `<div class="fd-acts">${sdrBtn(v)}</div>` : '';
    return `<li class="fd-visit is-${st}" data-visit="${v.id}"><span class="fd-n" aria-label="Visit ${n}">${st === 'done' ? ic('check') : st === 'missed' ? ic('x') : n}</span><div class="fd-body">
      <div class="fd-row between">${kind(v.kind)}${pill}</div><div class="fd-name">${esc(v.name)}</div><div class="fd-meta">${esc(where(v))}${v.mobile ? ` · <a href="tel:${esc(v.mobile)}">${esc(v.mobile)}</a>` : ''}</div>
      ${st === 'done' ? `<div class="fd-out">${esc(outLine(v))}</div>` : st === 'missed' ? `<div class="fd-out fd-meta">Not checked in by the end of the day. Your manager can see it.</div>` : ''}${acts}</div></li>`;
  }

  /* ---- + Requirement helpers */
  const REQK = { dealer: 'Dealer order', consumer: 'Homeowner', project: 'Project' };
  const KIND_OK = { distributor: ['dealer', 'project'], dealer: ['dealer', 'project'], sub_dealer: ['dealer', 'project'], architect: ['dealer', 'project'], design_firm: ['dealer', 'project'], direct: ['dealer', 'consumer', 'project'], retail: ['consumer', 'project'], project: ['project'] };
  const KIND_DEF = { distributor: 'dealer', dealer: 'dealer', sub_dealer: 'dealer', architect: 'project', design_firm: 'project', direct: 'consumer', retail: 'consumer', project: 'project' };
  const VKIND = { distributor: 'distributor', dealer: 'dealer', sub_dealer: 'sub_dealer', architect: 'architect', design_firm: 'architect', direct: 'retailer', retail: 'retailer', project: 'project' };
  const newReq = () => ({ who: 'existing', q: '', pick: null, kind: 'consumer', cats: [], sqft: '', photos: [], urls: [], card: null, cardUrl: '', name: '', mobile: '', area: '', budget: '', site: '', timeline: '', note: '', more: false, visit: '', visitName: '', err: {} });
  const reqKinds = () => { const R = S.req, retail = B.user.division === 'retail', ok = R.who === 'existing' && R.pick ? KIND_OK[R.pick.kind] || ['consumer'] : ['dealer', 'consumer', 'project'];
    return Object.entries(REQK).filter(([k]) => !(retail && k === 'dealer')).map(([k, l]) => [k, l, !ok.includes(k)]); };
  /* everything this person may pick: their dealers, architects and people, projects in view, and whoever is on their Roadmap */
  function pickables() {
    const out = [], seen = new Set(), CL = { distributor: 'Distributor', dealer: 'Dealer', sub_dealer: 'Sub-dealer', architect: 'Architect', design_firm: 'Design firm', direct: 'Person', retail: 'Retail client' };
    for (const v of vis()) if (v.client_id && !seen.has(v.client_id)) { seen.add(v.client_id); const c = (B.clients || []).find(x => x.id === v.client_id); out.push({ t: 'client', id: v.client_id, name: v.name, kind: c ? c.kind : ({ distributor: 'distributor', dealer: 'dealer', sub_dealer: 'sub_dealer', architect: 'architect' }[v.kind] || 'direct'), sub: `${(KIND[v.kind] || KIND.retailer)[1]} · ${v.area || ''}`, mobile: v.mobile || '' }); }
    for (const c of B.clients || []) if (!seen.has(c.id)) { seen.add(c.id); out.push({ t: 'client', id: c.id, name: c.name, kind: c.kind, sub: `${CL[c.kind] || ''} · ${c.city || ''}`, mobile: c.mobile || '' }); }
    for (const p of B.projects || []) out.push({ t: 'project', id: p.id, name: p.name, kind: 'project', sub: `Project site · ${p.city || ''}`, mobile: '' });
    return out;
  }
  function picksHtml() {
    const R = S.req, q = R.q.trim().toLowerCase(), all = pickables();
    const list = (q ? all.filter(x => `${x.name} ${x.sub} ${x.mobile}`.toLowerCase().includes(q)) : all).slice(0, 6);
    if (R.pick && !list.some(x => x.id === R.pick.id)) list.unshift(R.pick);
    if (!list.length) return `<div class="fd-meta">${q ? 'Nobody by that name in your view. Choose New prospect above to add them.' : 'Type a name to search your dealers, architects, people and projects.'}</div>`;
    return list.map(x => `<button type="button" class="fd-pick${R.pick && R.pick.id === x.id ? ' on' : ''}" data-fa="req-pick" data-id="${x.id}" data-t="${x.t}"><span class="fd-tile">${ic((KIND[VKIND[x.kind]] || KIND.retailer)[0])}</span><span><b>${esc(x.name)}</b><span>${esc(x.sub)}</span></span></button>`).join('');
  }
  /* the meter roll: one <i> per digit, the rest plain */
  const roll = str => `<span class="fd-roll" aria-label="${esc(str)}">${[...String(str)].map(ch => /\d/.test(ch) ? `<i style="--d:${ch}"></i>` : `<b>${esc(ch)}</b>`).join('')}</span>`;
  function reqFromVisit(id) {
    const v = vis().find(x => x.id === id); if (!v) return;
    const R = S.req = newReq(); R.visit = v.id; R.visitName = v.name;
    if (v.client_id || v.project_id) { const x = pickables().find(p => p.id === (v.client_id || v.project_id)) || { t: v.project_id ? 'project' : 'client', id: v.client_id || v.project_id, name: v.name, kind: v.project_id ? 'project' : 'direct', sub: v.area || '' }; R.pick = x; R.kind = KIND_DEF[x.kind] || 'consumer'; }
    else { R.who = 'new'; R.name = v.name; R.mobile = (v.mobile || '').replace(/^\+?91/, ''); R.area = v.area || ''; }
    if (B.user.division === 'retail' && R.kind === 'dealer') R.kind = 'consumer';
  }
  /* ---- + New lead (L4, design/leads/SPEC.txt section 5): someone who may buy later. Saved through write(), the same
     offline queue and idempotency key as a Requirement; Company, Owner at EGO (you) and Status New are set by the app. */
  const LTYPES = ['Retail', 'Wholesale', 'Project'];   // B1 26 Oct: the Category (schema LEAD_TYPES)
  const newLead = () => ({ type: '', wsas: '', firm: '', name: '', mobile: '', cats: [], timeline: '', score: '', next: '', alt: '', email: '', city: '', locality: '', area: '', value: '', budget: '', close: '', pname: '', site: '', source: 'Field visit', campaign: '', gst: '', note: '', card: null, cardUrl: '', photos: [], urls: [], more: false, err: {},
    q: '', rows: [], fst: 'short', pick: null, nc: false, role: '', rq: '', fq: '', frows: [], ffirm: null });   // L-fix: Find a person, + New contact
  /* L-fix 27 Oct (SPEC-lfix 3): Find a person from the server (the person's company and view), the picked row, + New contact */
  const LKIND = { dealer: 'building-store', distributor: 'building-store', sub_dealer: 'building-store', architect: 'ruler-measure', design_firm: 'ruler-measure' };
  let lft = 0, lseq = 0;
  function leadFind(k) { const R = S.lead, t = (k === 'fq' ? R.fq : R.q).trim(), d = t.replace(/\D/g, ''), st = k === 'fq' ? 'ffst' : 'fst', rows = k === 'fq' ? 'frows' : 'rows', paint = () => { const p = qs(k === 'fq' ? '[data-lead-fpicks]' : '[data-lead-picks]'); if (p) p.innerHTML = k === 'fq' ? leadFirmsHtml() : leadPicksHtml(); };
    clearTimeout(lft); if (t.replace(/[^\p{L}\p{M}]/gu, '').length < 2 && d.length < 3) { R[rows] = []; R[st] = 'short'; return paint(); }
    if (!navigator.onLine) { R[rows] = []; R[st] = 'off'; return paint(); }
    R[st] = 'busy'; paint();
    lft = setTimeout(async () => { const my = ++lseq; try { const r = await API('GET', `/api/leads/people?q=${encodeURIComponent(t)}${k === 'fq' ? '&firms=1' : ''}`); if (my !== lseq || S.lead !== R) return; R[rows] = (k === 'fq' ? r.firms : r.people).slice(0, 6); R[st] = R[rows].length ? 'ok' : 'none'; } catch (x) { if (my !== lseq) return; R[rows] = []; R[st] = 'fail'; } paint(); }, 200); }
  const subOf = p => [p.role, p.firm || 'Personal', p.mobile ? '+' + String(p.mobile).replace(/^\+/, '').replace(/^91(\d{5})(\d{5})$/, '$1 $2') : ''].filter(Boolean).join(' · ');
  function leadPicksHtml() { const R = S.lead;
    if (R.pick) { const p = R.pick; return `<button type="button" class="fd-pick on" data-fa="lead-pick-keep"><span class="fd-tile">${ic(LKIND[p.kind] || 'user-circle')}</span><span><b>${esc(p.name)}</b><span>${esc(p.firm ? 'Linked to ' + p.firm + ' · ' + [p.role, p.mobile].filter(Boolean).join(' · ') : 'Linked · ' + subOf(p))}</span></span></button>
      <div class="fd-row between"><span class="fd-help">Linked. Fields stay editable.</span><button type="button" class="fd-btn ghost" data-fa="lead-unlink">${ic('x')}Unlink</button></div>`; }
    const help = { short: 'Type 2 letters of a name or firm, or 3 digits of a mobile.', busy: 'Searching', off: 'No signal. Search works when signal returns. You can still add them with + New contact.', fail: 'Search is not working right now. You can still add them with + New contact.', none: 'No one matches. Add them with + New contact.' }[R.fst] || '';
    const nrow = R.fst === 'short' ? '' : `<button type="button" class="fd-pick" data-fa="lead-new"><span class="fd-tile">${ic('user-plus')}</span><span><b>+ New contact</b><span>Not found? Add them once</span></span></button>`;
    return (help ? `<span class="fd-help">${help}</span>` : '') + R.rows.map((p, i) => `<button type="button" class="fd-pick" data-fa="lead-pick" data-i="${i}"><span class="fd-tile">${ic(LKIND[p.kind] || 'user-circle')}</span><span><b>${esc(p.name)}</b><span>${esc(subOf(p))}</span></span></button>`).join('') + nrow; }
  /* F1 G4: Role is a type-to-search dropdown over the LIVE saved roles list, in its saved order */
  function leadRolesHtml() { const R = S.lead, all = (B.lists && B.lists.roles) || [], t = R.rq.trim().toLowerCase(), hit = all.filter(r => !t || r.toLowerCase().includes(t));
    return hit.slice(0, 6).map(r => `<button type="button" class="fd-pick" data-fa="lead-role" data-v="${esc(r)}"><span class="fd-tile">${ic('id-badge-2')}</span><span><b>${esc(r)}</b></span></button>`).join('') + (hit.length > 6 ? `<span class="fd-help">${hit.length - 6} more. Type to narrow.</span>` : hit.length ? '' : '<span class="fd-help">No role matches. Change the words.</span>'); }
  const clrFilled = R => { for (const k of ['name', 'mobile', 'email', 'city', 'role', 'firm', 'alt', 'locality']) if (String(R[k] || '').trim()) delete R.err[k]; };   // F1 G3: a field filled by a pick or + New contact drops its error
  function leadFirmsHtml() { const R = S.lead;
    if (R.ffirm) return `<button type="button" class="fd-pick on" data-fa="lead-ffirm-x"><span class="fd-tile">${ic(LKIND[R.ffirm.kind] || 'building-store')}</span><span><b>${esc(R.ffirm.name)}</b><span>Contact on this firm · tap to change</span></span></button>`;
    return R.frows.map((f, i) => `<button type="button" class="fd-pick" data-fa="lead-ffirm" data-i="${i}"><span class="fd-tile">${ic(LKIND[f.kind] || 'building-store')}</span><span><b>${esc(f.name)}</b><span>${esc(f.city || '')}</span></span></button>`).join('') + (R.fq.trim() ? '<span class="fd-help">New firm. It is made once, when this lead is converted.</span>' : ''); }

  const leadTyped = R => !!(R.card || R.photos.length || R.pick || R.nc || ['type', 'firm', 'name', 'mobile', 'alt', 'email', 'city', 'locality', 'value', 'note', 'q', 'pname', 'site'].some(k => String(R[k] || '').trim()));
  function leadFromVisit(id) { const v = vis().find(x => x.id === id); if (!v) return; const R = S.lead = newLead(); R.name = v.name || ''; R.mobile = (v.mobile || '').replace(/^\+?91/, ''); R.locality = v.area || ''; }
  const pickHtml = () => `<div class="fd-scrim" data-fa="pick-x"></div><div class="fd-sheet" role="dialog" aria-label="What are you adding?"><h3>What are you adding?</h3><div class="fd-pickone">
    <a href="#/req"><span class="fd-tile">${ic('list-check')}</span><span><b>New requirement</b><span>Wants to order now</span></span>${ic('chevron-right')}</a>
    <a href="#/lead" class="is-soft"><span class="fd-tile">${ic('seedling')}</span><span><b>New lead</b><span>May buy later</span></span>${ic('chevron-right')}</a></div></div>`;
  async function saveLead() {
    const R = S.lead, e = {}, mob = R.mobile.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''), alt = R.alt.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    if (!R.type) e.type = 'Pick the category: Retail, Wholesale or Project.';
    if (!R.pick && !R.nc && !R.fixN) e.find = 'Find the person, or add them with + New contact.';
    if (R.nc && !R.role) e.role = 'Pick the role';
    if (R.type === 'Wholesale' && !R.wsas) e.wsas = 'Pick Dealer or Architect.';
    if (!R.name.trim()) e.name = 'Write the contact name';
    if (!/^[6-9]\d{9}$/.test(mob)) e.mobile = 'Mobile needs 10 digits';
    if (R.type === 'Project' && !R.pname.trim()) e.pname = 'Write the project name';
    if (R.alt.trim() && !/^[6-9]\d{9}$/.test(alt)) { e.alt = 'Mobile needs 10 digits'; R.more = true; }
    R.err = e; if (Object.keys(e).length) { render(); const f = qs('.fd-field.has-err'); if (f) f.scrollIntoView({ block: 'center' }); return; }
    const fd = new FormData(), put = (k, v) => { if (String(v || '').trim()) fd.append(k, String(v).trim()); };
    put('lead_type', R.type); if (R.type === 'Wholesale') put('wholesale_as', R.wsas); if (R.type !== 'Retail') { put('firm', R.firm); put('gst', R.gst.replace(/\s/g, '').toUpperCase()); } put('contact_name', R.name); put('mobile', mob); put('alt_mobile', alt); put('email', R.email); put('city', R.city); put('locality', R.locality);
    R.cats.forEach(c => fd.append('categories', c)); put('area_sqft', R.area.replace(/[,\s]/g, '')); put('value', R.value.replace(/[,\s]/g, '')); put('budget', R.budget); put('timeline', R.timeline); put('expected_close', R.close);
    if (R.type === 'Project') { put('project_name', R.pname); put('site_location', R.site); }
    if (R.pick) { put('person_id', R.pick.person_id); put('firm_id', R.pick.firm_id); }
    if (R.nc) { fd.append('new_contact', '1'); if (R.type !== 'Retail') { if (R.ffirm) put('nc_firm_id', R.ffirm.id); else put('nc_firm_name', R.fq); } }
    put('role', R.role || (R.pick && R.pick.role) || '');
    put('score', R.score); put('source', R.source || 'Field visit'); put('campaign', R.campaign); put('notes', R.note); put('next_date', R.next);
    if (R.card) fd.append('card', R.card, R.card.name || 'card.jpg');
    R.photos.forEach((f, i) => fd.append('photo', f, f.name || `photo-${i + 1}.jpg`));
    const name = (R.type !== 'Retail' && ((R.nc && !R.ffirm ? R.fq : R.nc ? R.ffirm.name : R.firm) || '').trim()) || R.name.trim();
    R.busy = true; render();
    try {
      const w = await write('/api/field/lead', fd, { type: 'lead', ghost: { name, lead_type: R.type, wholesale_as: R.wsas, status: 'New', score: R.score, categories: R.cats.slice(), next_date: R.next, owner_name: B.user.name } }, `Lead · ${name}`);
      if (R.fixN) { await qDel(R.fixN); await qLoad(); setField(S.base || B.field); }
      R.urls.forEach(u => URL.revokeObjectURL(u)); if (R.cardUrl) URL.revokeObjectURL(R.cardUrl); S.lead = null; S.rf = 'all';
      location.hash = '#/requirements'; render();
      toast(w.queued ? '<b>Saved on this phone.</b> It will send when signal returns.' : `<b>Lead saved.</b> With ${esc(w.r.owner || B.user.name)}.`, w.queued ? w.n : undefined);
    } catch (x) { R.busy = false; R.err = x.status === 409 ? { mobile: String(x.message).replace(/\.$/, ''), dup: 1 } : { all: x.message }; render(); const f = qs('.fd-field.has-err'); if (f) f.scrollIntoView({ block: 'center' }); }
  }
  async function saveReq(el) {
    const R = S.req, e = {}, mob = R.mobile.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    if (R.who === 'existing' && !R.pick) e.who = 'Pick who this is for';
    if (R.who === 'new') { if (!R.name.trim()) e.name = 'Fill in the name'; if (!/^[6-9]\d{9}$/.test(mob)) e.mobile = 'A mobile has 10 digits'; if (!R.area.trim()) e.area = 'Fill in the area'; }
    if (reqKinds().some(([k, , off]) => k === R.kind && off) || !REQK[R.kind]) e.kind = 'Choose what it is';
    if (!R.cats.length) e.cat = 'Choose at least one category';
    const sq = R.sqft.replace(/[,\s]/g, ''); if (sq && !(Number(sq) > 0)) e.sqft = 'sq ft is a number';
    const bud = R.budget.replace(/[,\s]/g, ''); if (bud && !(Number(bud) >= 0)) e.budget = 'Budget is a number';
    R.err = e; if (Object.keys(e).length) { render(); const f = qs('.fd-field.has-err'); if (f) f.scrollIntoView({ block: 'center' }); return; }
    const fd = new FormData();
    fd.append('kind', R.kind); R.cats.forEach(c => fd.append('category', c)); fd.append('sq_ft', sq); fd.append('budget', bud); fd.append('site', R.site); fd.append('timeline', R.timeline); fd.append('note', R.note);
    if (R.visit) fd.append('visit_id', R.visit);
    if (R.who === 'existing') fd.append(R.pick.t === 'project' ? 'project_id' : 'client_id', R.pick.id); else { fd.append('name', R.name.trim()); fd.append('mobile', mob); fd.append('area', R.area.trim()); }
    if (R.who === 'new' && R.card) fd.append('card', R.card, R.card.name || 'card.jpg');
    R.photos.forEach((f, i) => fd.append('photo', f, f.name || `site-${i + 1}.jpg`));
    const name = R.who === 'existing' ? R.pick.name : R.name.trim();
    R.busy = true; render();
    try {
      const w = await write('/api/field/req', fd, { type: 'req', ghost: { c_name: name, category: R.cats.join(', '), categories: R.cats.slice(), area_sqft: sq ? Math.round(Number(sq)) : null, kind: R.kind } }, `Requirement · ${name}`);
      R.urls.forEach(u => URL.revokeObjectURL(u)); if (R.cardUrl) URL.revokeObjectURL(R.cardUrl); S.req = null; S.rf = 'all';
      location.hash = '#/requirements'; render();
      toast(w.queued ? '<b>Saved on this phone.</b> It will send when signal returns.' : `<b>Requirement saved.</b> With ${esc(w.r.owner)} in telesales.`, w.queued ? w.n : undefined);
    } catch (x) { R.busy = false; R.err = { all: x.message }; render(); }
  }

  /* ---- S2 (Bhargav 18 Oct eve): field sales RAISE an approval request or a complaint (in Me), and see only their own in My requests */
  const DEALERISH = ['distributor', 'dealer', 'sub_dealer'];
  const newAsk = t => ({ t, q: '', pick: null, what: '', amount: '', why: '', product: '', batch: '', note: '', photos: [], urls: [], err: {} });
  const askKinds = () => { const R = ((B.lists || {}).rules || {}).approvals || {}; return [...Object.entries(R).filter(([k]) => k !== 'complaint').map(([k, a]) => [k, a.label, a.unit]), ['other', 'Something else', '']]; };
  function askPicksHtml() {
    const A = S.ask, q = A.q.trim().toLowerCase(), all = pickables().filter(x => x.t === 'client' && DEALERISH.includes(x.kind));
    const list = (q ? all.filter(x => `${x.name} ${x.sub} ${x.mobile}`.toLowerCase().includes(q)) : all).slice(0, 6);
    if (A.pick && !list.some(x => x.id === A.pick.id)) list.unshift(A.pick);
    if (!list.length) return `<div class="fd-meta">${q ? 'No dealer by that name in your view.' : 'Type a name to search your dealers, distributors and sub-dealers.'}</div>`;
    return list.map(x => `<button type="button" class="fd-pick${A.pick && A.pick.id === x.id ? ' on' : ''}" data-fa="ask-pick" data-id="${x.id}"><span class="fd-tile">${ic((KIND[VKIND[x.kind]] || KIND.retailer)[0])}</span><span><b>${esc(x.name)}</b><span>${esc(x.sub)}</span></span></button>`).join('');
  }
  const asks = () => F().asks || { approvals: [], complaints: [] };
  const back = (title, sub, to) => `<header class="fd-top"><a class="fd-back" href="${to || '#/me'}" aria-label="Back">${ic('arrow-back-up')}</a><div class="fd-hello"><b>${esc(title)}</b><span>${esc(sub)}</span></div></header>`;
  async function saveAsk() {
    const A = S.ask, e = {}, ap = A.t === 'approval', k = askKinds().find(x => x[0] === A.what), amt = A.amount.replace(/[,\s₹%/-]/g, '');
    if (!A.pick) e.who = 'Pick the dealer';
    if (ap) { if (!k) e.what = 'Choose what it is for'; if (amt && !(Number(amt) >= 0)) e.amount = 'Amount is a number'; if (!A.why.trim()) e.why = 'Write why, so management can decide'; }
    else if (!A.product.trim() && !A.note.trim()) e.product = 'Write the product or what happened';
    A.err = e; if (Object.keys(e).length) { render(); const f = qs('.fd-field.has-err'); if (f) f.scrollIntoView({ block: 'center' }); return; }
    const fd = new FormData(); fd.append('client_id', A.pick.id);
    if (ap) { fd.append('kind', A.what); fd.append('amount', amt); fd.append('reason', A.why.trim()); }
    else { fd.append('product', A.product.trim()); fd.append('batch', A.batch.trim()); fd.append('note', A.note.trim()); A.photos.forEach((f, i) => fd.append('photo', f, f.name || `complaint-${i + 1}.jpg`)); }
    const ghost = ap ? { t: 'approval', c_name: A.pick.name, label: k[1], unit: k[2], amount: amt ? Number(amt) : 0, status: 'Pending', reason: A.why.trim() } : { t: 'complaint', c_name: A.pick.name, type: A.product.trim(), batch: A.batch.trim(), photos: A.photos.length, status: '' };
    A.busy = true; render();
    try {
      const w = await write(ap ? '/api/field/approval' : '/api/field/complaint', fd, { type: 'ask', ghost }, `${ap ? 'Approval' : 'Complaint'} · ${A.pick.name}`);
      A.urls.forEach(u => URL.revokeObjectURL(u)); S.ask = null; S.af = 'all'; location.hash = '#/requests'; render();
      toast(w.queued ? '<b>Saved on this phone.</b> It will send when signal returns.' : ap ? '<b>Sent for approval.</b> Management decides.' : `<b>Complaint ${esc(w.r.ref)} sent.</b> With ${esc(w.r.owner)} in telesales.${w.r.photo_note ? ' ' + esc(w.r.photo_note) : ''}`, w.queued ? w.n : undefined);
    } catch (x) { A.busy = false; A.err = { all: x.message }; render(); }
  }

  /* ---- T5 (19 Oct): Sample Display Record (SDR) inside a dealer visit (design/CONTRACT.txt SDR, PHONE INSPECT).
     The lines, inspections and decisions come with the day (fieldMe.sdr), so the screen opens with no signal; Save
     inspection and Give displays go through write() like every other entry (the offline queue, one idempotency-key). */
  const SDRX = () => F().sdr || { regs: [], due: [], days: 30, give: false, prices: false };
  const DEALER_K = ['distributor', 'dealer', 'sub_dealer'];
  const COND = { 'Well maintained': ['good', 'circle-check'], 'Needs attention': ['attn', 'alert-triangle'], Damaged: ['dmg', 'alert-octagon'], Missing: ['miss', 'circle-dashed'] };
  const inr = n => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
  const dShort = d => { const x = new Date(d + 'T00:00:00Z'); return `${x.getUTCDate()} ${MON[x.getUTCMonth()]}`; };
  function sdrOf(cid) {
    const R = SDRX().regs || [], lines = R.filter(r => r.kind === 'display' && r.client_id === cid).map(sdrLine), checks = R.filter(r => r.kind === 'sdr_check' && r.client_id === cid);
    const act = lines.filter(l => l.status === 'Active'), latest = sdrLatest(lines, checks), due = sdrDue(lines, checks, SDRX().days || 30, F().day)[cid] || null;
    return { lines, act, latest, due, value: act.reduce((t, l) => t + (l.total || 0), 0) };
  }
  const sdrName = cid => { const c = (B.clients || []).find(x => x.id === cid), v = vis().find(x => x.client_id === cid), d = (SDRX().due || []).find(x => x.client_id === cid); return (c && c.name) || (v && v.name) || (d && d.name) || 'Dealer'; };
  const sdrVisit = (cid, vid) => vis().find(v => v.id === vid) || vis().find(v => v.client_id === cid && (v.status === 'in' || v.status === 'done')) || null;
  const sdrBtn = v => v.client_id && DEALER_K.includes(VKIND[((B.clients || []).find(c => c.id === v.client_id) || {}).kind] || v.kind) ? `<a class="fd-btn" href="#/sdr/${v.client_id}/${v.id}" data-sdr-open="${v.client_id}">${ic('presentation')}Displays (SDR)</a>` : '';
  const prodsOf = cat => { const I = B.inventory || {}, cols = new Set((I.collections || []).filter(c => c.category === cat).map(c => c.id)); return (I.products || []).filter(p => cols.has(p.collection_id)); };
  const newGline = () => ({ category: '', product_id: '', item: '', qty: '1', unit_cost: '' });
  async function saveSdr() {
    const X = S.sdr, o = sdrOf(X.cid), e = {}, lines = [];
    for (const l of o.act) { const c = X.cond[l.id]; if (!c) continue; const rem = (X.rem[l.id] || '').trim(); if (c !== 'Well maintained' && !rem) e[l.id] = 'Write what is wrong, so management can decide'; lines.push({ line: l.id, cond: c, remark: c === 'Well maintained' ? '' : rem }); }
    if (!lines.length && !Object.keys(e).length) e.all = 'Choose a condition for at least one display.';
    X.err = e; if (Object.keys(e).length) { render(); const f = qs('.fd-field.has-err') || qs('.fd-err[role=alert]'); if (f) f.scrollIntoView({ block: 'center' }); return; }
    const fd = new FormData(), v = sdrVisit(X.cid, X.vid), name = sdrName(X.cid);
    fd.append('client_id', X.cid); fd.append('on_date', F().day); if (v) fd.append('visit_id', v.id); fd.append('lines', JSON.stringify(lines));
    for (const x of lines) (X.photos[x.line] || []).forEach((f, i) => fd.append('photo_' + x.line, f, f.name || `inspection-${i + 1}.jpg`));
    const flag = lines.filter(x => x.cond !== 'Well maintained').length;
    X.busy = true; render();
    try {
      const w = await write('/api/registers/sdr/inspect', fd, { type: 'sdr', cid: X.cid, ghost: [{ kind: 'sdr_check', client_id: X.cid, on_date: F().day, owner_id: B.user.id, status: flag ? 'Needs a decision' : 'All well maintained', extra: { lines } }] }, `SDR inspection · ${name}`);
      Object.values(X.urls).flat().forEach(u => URL.revokeObjectURL(u)); S.sdr = null; history.pushState(null, '', v ? '#/visits' : '#/today'); render(); window.scrollTo(0, 0);   // no hashchange: its redraw would wipe the toast below
      toast(w.queued ? '<b>Saved on this phone.</b> It will send when signal returns.' : `<b>Inspection ${esc(w.r.check.ref)} saved.</b> ${flag ? `${flag} display${flag === 1 ? ' goes' : 's go'} to management for a decision.` : 'Every display checked is Well maintained.'}${w.r.photo_note ? ' ' + esc(w.r.photo_note) : ''}`, w.queued ? w.n : undefined);
    } catch (x) { X.busy = false; X.err = { all: x.message }; render(); }
  }
  async function saveGive() {
    const X = S.sdr, G = X.give, P = SDRX().prices, e = {}, lines = [];
    G.lines.forEach((l, i) => { const prod = (B.inventory && (B.inventory.products || []).find(p => p.id === l.product_id)) || null, q = Number(l.qty), u = Number(String(l.unit_cost).replace(/[,\s]/g, ''));
      if (!l.category) e['c' + i] = 'Choose the category'; if (!prod && !l.item.trim()) e['p' + i] = 'Choose the product or type it';
      if (!(q >= 1) || !Number.isInteger(q)) e['q' + i] = 'Qty is a whole number, 1 or more'; if (P && !(u >= 0 && String(l.unit_cost).trim() !== '')) e['u' + i] = 'Our cost per unit is compulsory';
      lines.push({ category: l.category, product_id: prod ? prod.id : '', item: prod ? prod.name : l.item.trim(), qty: q, ...(P ? { unit_cost: u } : {}) }); });
    G.err = e; if (Object.keys(e).length) { render(); const f = qs('.fd-field.has-err'); if (f) f.scrollIntoView({ block: 'center' }); return; }
    const fd = new FormData(), name = sdrName(X.cid); fd.append('client_id', X.cid); fd.append('on_date', F().day); fd.append('given_by', B.user.id); fd.append('lines', JSON.stringify(lines));
    G.photos.forEach((f, i) => fd.append('photo', f, f.name || `display-${i + 1}.jpg`));
    G.busy = true; render();
    try {
      const w = await write('/api/registers/sdr/give', fd, { type: 'sdrgive', cid: X.cid, ghost: lines.map(l => ({ kind: 'display', client_id: X.cid, item: l.item, product_id: l.product_id, on_date: F().day, status: 'Active', value: P ? l.qty * l.unit_cost : null, owner_id: B.user.id, extra: { category: l.category, qty: l.qty, unit_cost: P ? l.unit_cost : null, given_by: B.user.id } })) }, `Give displays · ${name}`);
      G.urls.forEach(u => URL.revokeObjectURL(u)); X.give = null; render();
      toast(w.queued ? '<b>Saved on this phone.</b> It will send when signal returns.' : `<b>${w.r.lines.length} display${w.r.lines.length === 1 ? '' : 's'} given to ${esc(name)}.</b>${w.r.photo_note ? ' ' + esc(w.r.photo_note) : ''}`, w.queued ? w.n : undefined);
    } catch (x) { G.busy = false; G.err = { all: x.message }; render(); }
  }

  /* ---- screens */
  const V = {
    /* #/sdr/<dealer>/<visit> (kit frame sdrInspect): what is at the dealer, Inspect each active line, Give displays */
    sdr() {
      const [, , cid, vid] = location.hash.split('/');
      if (!S.sdr || S.sdr.cid !== cid) S.sdr = { cid, vid: vid || '', cond: {}, rem: {}, photos: {}, urls: {}, err: {}, give: null };
      const X = S.sdr, o = sdrOf(cid), P = SDRX().prices, v = sdrVisit(cid, X.vid), e = X.err || {}, name = sdrName(cid);
      const head = back('Displays (SDR)', `${name} · ${v ? 'visit ' + dShort(F().day) : dShort(F().day)}`, v ? '#/visits' : '#/today');
      if (X.give) {
        const G = X.give, ge = G.err || {}, fe = k => ge[k] ? `<span class="fd-err">${esc(ge[k])}</span>` : '', tot = G.lines.reduce((t, l) => t + (Number(l.qty) || 0) * (Number(l.unit_cost) || 0), 0);
        return back('Give displays', `${name} · ${dShort(F().day)}`, `#/sdr/${cid}/${X.vid}`).replace(`href="#/sdr/${cid}/${X.vid}"`, `href="#/sdr/${cid}/${X.vid}" data-fa="sdr-give-x"`) + `<main class="fd-view"><form class="fd-form" onsubmit="return false" data-sdr-give>
          <div class="fd-meta">One product per line. Given by ${esc(B.user.name)}, today.</div>
          ${G.lines.map((l, i) => `<div class="fd-card fd-form" data-gline="${i}"><div class="fd-row between"><b>Line ${i + 1}</b>${G.lines.length > 1 ? `<button type="button" class="fd-btn" data-fa="sdr-gline-x" data-i="${i}" aria-label="Remove line ${i + 1}">${ic('x')}Remove</button>` : ''}</div>
            <div class="fd-field${ge['c' + i] ? ' has-err' : ''}"><label for="sg-c${i}">Category</label><select class="fd-input" id="sg-c${i}" data-sg="category" data-i="${i}"><option value="">Choose</option>${(B.lists.categories || []).map(c => `<option ${l.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>${fe('c' + i)}</div>
            <div class="fd-field${ge['p' + i] ? ' has-err' : ''}"><label for="sg-p${i}">Product</label><select class="fd-input" id="sg-p${i}" data-sg="product_id" data-i="${i}"><option value="">Not a design (type it below)</option>${prodsOf(l.category).map(p => `<option value="${p.id}" ${l.product_id === p.id ? 'selected' : ''}>${esc(p.name)}${p.code ? ' · ' + esc(p.code) : ''}</option>`).join('')}</select>
              ${l.product_id ? '' : `<input class="fd-input" data-sg="item" data-i="${i}" value="${esc(l.item)}" placeholder="Product (if not a design)" aria-label="Product (if not a design)" maxlength="120" style="margin-top:8px">`}${fe('p' + i)}</div>
            <div class="fd-field${ge['q' + i] ? ' has-err' : ''}"><label for="sg-q${i}">Qty</label><input class="fd-input" id="sg-q${i}" data-sg="qty" data-i="${i}" inputmode="numeric" value="${esc(l.qty)}">${fe('q' + i)}</div>
            ${P ? `<div class="fd-field${ge['u' + i] ? ' has-err' : ''}"><label for="sg-u${i}">Our cost per unit</label><div class="fd-adorn"><span class="fd-pre">₹</span><input class="fd-input" id="sg-u${i}" data-sg="unit_cost" data-i="${i}" inputmode="decimal" value="${esc(l.unit_cost)}"></div>${fe('u' + i)}<span class="fd-help" data-gtot="${i}">Total ${inr((Number(l.qty) || 0) * (Number(l.unit_cost) || 0))}</span></div>` : ''}</div>`).join('')}
          <button type="button" class="fd-btn block" data-fa="sdr-gline-add">${ic('plus')}Add line</button>
          <div class="fd-field"><span class="fd-label">Photos</span><div class="fd-photos">${G.photos.map((f, i) => `<div class="fd-thumb"><img src="${G.urls[i]}" alt="Display photo ${i + 1}"><button type="button" aria-label="Remove photo ${i + 1}" data-fa="sdr-gphoto-x" data-i="${i}">${ic('x')}</button></div>`).join('')}${G.photos.length < 10 ? `<label class="fd-photo-add">${ic('camera')}Add<input type="file" accept="image/*" capture="environment" multiple data-sdr-gfile></label>` : ''}</div></div>
          ${P ? `<div class="fd-card fd-row between" data-gsum><span>${G.lines.length} line${G.lines.length === 1 ? '' : 's'} · display value given</span><b>${inr(tot)}</b></div>` : '<div class="fd-note">' + ic('info-circle') + '<span>Our cost per unit: management fills it in.</span></div>'}
          <span class="fd-err" role="alert">${esc(ge.all || '')}</span>
          <div class="fd-savebar"><button type="button" class="fd-btn primary lg block" data-fa="sdr-give-save"${G.busy ? ' aria-busy="true" disabled' : ''}>Save displays</button></div></form></main>`;
      }
      const d = o.due, isDue = d && d.next && d.next <= F().day;
      const sum = `<div class="fd-card fd-row between" data-sdr-sum><span><b>${o.act.length} active line${o.act.length === 1 ? '' : 's'}</b><span class="fd-meta" style="display:block">${P ? `Display value ${inr(o.value)} · ` : ''}last checked ${d && d.last ? dShort(d.last) : 'not yet'}</span></span>${isDue ? `<span class="fd-pill warn" data-sdr-due-pill>${ic('clock')}Due</span>` : d && d.next ? `<span class="fd-pill">Next ${dShort(d.next)}</span>` : ''}</div>`;
      const insp = l => { const c = X.cond[l.id], flag = c && c !== 'Well maintained', lt = o.latest[l.id], urls = X.urls[l.id] || [];
        return `<div class="fd-insp${flag ? ' is-flag' : ''}" data-insp="${l.id}"><div><div class="fd-name">${esc(l.item || 'Design')}</div><div class="fd-meta">${esc([l.category, 'qty ' + l.qty, l.given_on ? 'given ' + dShort(l.given_on) : '', lt ? `last ${lt.cond}` : ''].filter(Boolean).join(' · '))}</div></div>
          <fieldset class="fd-cond" role="radiogroup"><legend>Condition</legend>${Object.entries(COND).map(([w, [k, i]]) => `<label class="${k}"><input type="radio" name="sdrc-${l.id}" value="${esc(w)}" ${c === w ? 'checked' : ''}>${ic(i)}${esc(w)}</label>`).join('')}</fieldset>
          ${flag ? `<div class="fd-field${e[l.id] ? ' has-err' : ''}"><label for="sdrr-${l.id}">Remarks <span class="fd-meta">(needed)</span></label><textarea class="fd-input" id="sdrr-${l.id}" data-sdr-rem="${l.id}" placeholder="What is wrong with it?" maxlength="1000">${esc(X.rem[l.id] || '')}</textarea>${e[l.id] ? `<span class="fd-err">${esc(e[l.id])}</span>` : ''}</div>` : ''}
          <div class="fd-photos">${(X.photos[l.id] || []).map((f, i) => `<div class="fd-thumb"><img src="${urls[i]}" alt="Photo ${i + 1} of ${esc(l.item || 'this display')}"><button type="button" aria-label="Remove photo ${i + 1}" data-fa="sdr-photo-x" data-line="${l.id}" data-i="${i}">${ic('x')}</button></div>`).join('')}<label class="fd-photo-add">${ic('camera')}Photo<input type="file" accept="image/*" capture="environment" multiple data-sdr-file="${l.id}"></label></div></div>`; };
      const give = SDRX().give ? `<button type="button" class="fd-btn block" data-fa="sdr-give">${ic('square-plus')}Give displays</button>` : '';
      /* B3 (R30): the photos already on record for this dealer (Shop, Display, Inspection photos and files on its lines), to compare with what is there now */
      const PH = (SDRX().photos || {})[cid] || [];
      const stored = PH.length ? `<div class="fd-field" data-sdr-stored><span class="fd-label">Photos on record (${PH.length})</span><div class="fd-photos">${PH.map(p => `<figure class="fd-sph" data-sdr-photo="${p.id}"><a class="fd-thumb" href="${esc(p.url)}" target="_blank" rel="noopener" aria-label="View ${esc(p.type)}, ${dShort(p.on)}"><img src="${esc(p.url)}" alt="${esc(p.type)}" loading="lazy"></a><figcaption>${esc(p.type.replace(' photo', ''))} · ${dShort(p.on)}</figcaption><span class="fd-sph-acts"><a href="${esc(p.url)}&dl=1" aria-label="Download ${esc(p.type)}">Download</a><button type="button" data-fa="sdr-pshare" data-id="${p.id}" aria-label="Share ${esc(p.type)}">${ic('share-2')}Share</button></span></figure>`).join('')}</div><span class="fd-help">Tap a photo to view it. Photos added below are kept on this dealer too.</span></div>` : '';
      return head + `<main class="fd-view">${sum}${stored}
        ${o.act.length ? o.act.filter(l => !String(l.id).startsWith('wait_')).map(insp).join('') + `<div class="fd-note">${ic('info-circle')}<span>Anything not Well maintained goes to management at once for a decision.</span></div>${give}
          <span class="fd-err" role="alert">${esc(e.all || '')}</span>
          <div class="fd-savebar"><button type="button" class="fd-btn primary lg block" data-fa="sdr-save"${X.busy ? ' aria-busy="true" disabled' : ''}>Save inspection</button></div>`
        : `<div class="fd-card"><b>No display at ${esc(name)} yet</b><div class="fd-meta" style="margin-top:6px">${SDRX().give ? 'Give displays to record what we put up here, line by line.' : 'Displays given here show once field sales or management record them.'}</div></div>${give}`}</main>`;
    },
    /* #/raise/approval and #/raise/complaint (kit frames raiseAp, raiseCmp) */
    raise() {
      const t = (location.hash.split('/')[2] || '') === 'complaint' ? 'complaint' : 'approval';
      if (!S.ask || S.ask.t !== t) S.ask = newAsk(t);
      const A = S.ask, e = A.err || {}, fe = k => e[k] ? `<span class="fd-err">${esc(e[k])}</span>` : '', k = askKinds().find(x => x[0] === A.what);
      const dealer = `<div class="fd-field${e.who ? ' has-err' : ''}"><span class="fd-label">Dealer</span><div class="fd-search">${ic('search')}<input class="fd-input" type="search" data-ask="q" value="${esc(A.q)}" aria-label="Search dealer, distributor or sub-dealer" autocomplete="off"></div><div class="fd-picks" data-ask-picks>${askPicksHtml()}</div>${fe('who')}</div>`;
      const body = t === 'approval' ? `${dealer}
        <div class="fd-field${e.what ? ' has-err' : ''}"><span class="fd-label">What for</span><div class="fd-chips" role="radiogroup">${askKinds().map(([v, l]) => `<label class="fd-chip"><input type="radio" name="fd-askk" value="${v}" ${A.what === v ? 'checked' : ''}>${esc(l)}</label>`).join('')}</div>${fe('what')}</div>
        <div class="fd-field${e.amount ? ' has-err' : ''}"><label for="fa-amt">Amount, if any</label><div class="fd-adorn">${k && k[2] === '₹' ? '<span class="fd-pre">₹</span>' : ''}<input class="fd-input" id="fa-amt" data-ask="amount" inputmode="decimal" value="${esc(A.amount)}" placeholder="Optional">${k && k[2] === '%' ? '<span class="fd-suf">%</span>' : k && k[2] === '₹' ? '<span class="fd-suf">/-</span>' : ''}</div>${fe('amount')}</div>
        <div class="fd-field${e.why ? ' has-err' : ''}"><label for="fa-why">Why</label><textarea class="fd-input" id="fa-why" data-ask="why" maxlength="500">${esc(A.why)}</textarea>${fe('why')}</div>
        <div class="fd-note">${ic('info-circle')}<span>You see the answer in My requests.</span></div>`
        : `<div class="fd-note" data-cmp-who>${ic('info-circle')}<span>${esc(CMP_WHO)}</span></div>${dealer}
        <div class="fd-field${e.product ? ' has-err' : ''}"><label for="fa-prod">Product</label><input class="fd-input" id="fa-prod" data-ask="product" value="${esc(A.product)}" maxlength="120">${fe('product')}</div>
        <div class="fd-field"><label for="fa-batch">Batch or lot</label><input class="fd-input" id="fa-batch" data-ask="batch" value="${esc(A.batch)}" maxlength="60" placeholder="On the box label, if you have it"></div>
        <div class="fd-field"><span class="fd-label">Photos</span><div class="fd-photos">${A.photos.map((f, i) => { const im = /^image\//.test(f.type || ''); return `<div class="fd-thumb${im ? '' : ' is-file'}" role="img" aria-label="Complaint photo ${i + 1}: ${esc(f.name || 'file')}">${im ? `<img src="${A.urls[i]}" alt="">` : ''}<span class="fd-fname">${esc(f.name || 'File')}</span><button type="button" aria-label="Remove photo ${i + 1}" data-fa="ask-photo-x" data-i="${i}">${ic('x')}</button></div>`; }).join('')}${A.photos.length < 10 ? `<label class="fd-photo-add">${ic('camera')}Add<input type="file" accept="image/*" capture="environment" multiple data-ask-file></label>` : ''}</div><span class="fd-help">Up to 10. They open, download and share from the complaint on the team screens.</span></div>
        <div class="fd-field"><label for="fa-note">Note</label><textarea class="fd-input" id="fa-note" data-ask="note" maxlength="2000">${esc(A.note)}</textarea></div>`;
      return back(t === 'approval' ? 'Ask for approval' : 'Report a complaint', t === 'approval' ? 'Management decides' : 'Telesales takes it from here') + `<main class="fd-view"><form class="fd-form" onsubmit="return false" data-askform="${t}">${body}
        <span class="fd-err" role="alert">${esc(e.all || '')}</span>
        <div class="fd-savebar"><button type="button" class="fd-btn primary lg block" data-fa="ask-save"${A.busy ? ' aria-busy="true" disabled' : ''}>${t === 'approval' ? 'Send for approval' : 'Send complaint'}</button></div></form></main>`;
    },
    /* #/requests (kit frame myAsks): read-only, only what this person raised */
    requests() {
      const X = asks(), done = X.done || 'Resolved', f = S.af;
      const rows = [...(X.approvals || []).map(a => ({ ...a, t: 'approval' })), ...(X.complaints || []).map(c => ({ ...c, t: 'complaint' }))].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      const cnt = { all: rows.length, approval: (X.approvals || []).length, complaint: (X.complaints || []).length }, show = rows.filter(r => f === 'all' || r.t === f);
      const pill = r => r.waiting ? `<span class="fd-pill warn">${ic('cloud-upload')}Waiting</span>`
        : r.t === 'approval' ? (r.status === 'Approved' ? `<span class="fd-pill ok">${ic('circle-check')}Approved</span>` : r.status === 'Rejected' ? '<span class="fd-pill bad">Rejected</span>' : `<span class="fd-pill warn">${ic('clock')}Waiting for approval</span>`)
        : r.status === done ? `<span class="fd-pill ok">${ic('circle-check')}${esc(r.status)}</span>` : r.status && r.status !== ((B.lists.ops || {}).complaint_statuses || ['Open'])[0] ? `<span class="fd-pill warn">${esc(r.status)}</span>` : `<span class="fd-pill">${esc(r.status || 'Open')}</span>`;
      const what = r => r.t === 'approval' ? [r.label, r.amount ? (r.unit === '%' ? r.amount + '%' : '₹' + Math.round(r.amount).toLocaleString('en-IN')) : ''].filter(Boolean).join(' · ')
        : [r.ref, r.product || r.type, r.batch ? 'batch ' + r.batch : '', r.photos ? `${r.photos} photo${r.photos === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · ');
      const last = r => r.waiting ? [ic('wifi-off'), 'Saved on this phone, will send when signal returns']
        : r.t === 'approval' ? (r.status === 'Pending' ? [ic('clock'), `Asked ${dayShort(r.created_at)}. Management decides.`] : [ic(r.status === 'Approved' ? 'circle-check' : 'circle-x'), `${r.status} by ${r.by_name || 'management'}${r.decided_at ? ' ' + dayShort(r.decided_at) : ''}${r.decision_note ? `. Reason: ${r.decision_note}` : ''}`])
        : [ic(r.status === done ? 'circle-check' : 'phone'), r.status === done && r.resolution ? `Resolved: ${r.resolution}` : `With ${r.owner_name || 'telesales'} since ${dayShort(r.created_at)}`];
      const card = r => { const l = last(r); return `<article class="fd-req" data-ask-row="${r.t}"><div class="fd-row between"><span class="fd-kind">${ic(r.t === 'approval' ? 'circle-check' : 'alert-triangle')}${r.t === 'approval' ? 'Approval' : 'Complaint'}</span>${pill(r)}</div>
        <div class="fd-name">${esc(r.c_name || '')}</div><div class="fd-what">${esc(what(r))}</div><div class="fd-last">${l[0]}<span>${esc(l[1])}</span></div></article>`; };
      return back('My requests', 'Only what you raised') + `<main class="fd-view">
        <div class="fd-filter">${[['all', 'All'], ['approval', 'Approvals'], ['complaint', 'Complaints']].map(([k, l]) => `<label class="fd-chip"><input type="radio" name="fd-af" value="${k}" ${f === k ? 'checked' : ''}>${l} ${cnt[k]}</label>`).join('')}</div>
        ${show.length ? `<div class="fd-reqs">${show.map(card).join('')}</div>` : `<div class="fd-card"><b>${rows.length ? 'None here' : 'Nothing raised yet'}</b><div class="fd-meta" style="margin-top:6px">${rows.length ? 'Pick another filter above.' : 'Ask for approval or report a complaint from Me. What happens to it shows here.'}</div></div>`}</main>`;
    },
    today() {
      const a = att(), n = vis().length, nx = nextV(), late = a && a.late_min;
      const kinds = Object.entries(vis().reduce((o, v) => (o[v.kind] = (o[v.kind] || 0) + 1, o), {})).map(([k, c]) => `${(KIND[k] || KIND.retailer)[1]} ${c}`).join(' · ');
      let hero;
      if (!started()) hero = `<div class="fd-card ink fd-hero"><span class="fd-kick">Start time ${esc(F().start)}</span><h2>Ready for the day?</h2>
        <div class="fd-facts"><span class="fd-pill">${ic('route')}${n} visit${n === 1 ? '' : 's'} on your Roadmap</span><span class="fd-pill">${ic('flame')}${streak()} day${streak() === 1 ? '' : 's'} on time</span></div>
        <button class="fd-btn on-ink lg block" data-fa="cam" data-mode="start">${ic('camera')}Start my day</button></div>`;
      else hero = `<div class="fd-card ink fd-hero"><div class="fd-row between"><span class="fd-kick">Started ${hm(a.start_at)}${a.start_noloc ? ' · location not shared' : ''}</span><span class="fd-pill">${late ? `${ic('clock-exclamation')}Late by ${late} min` : `${ic('circle-check')}On time`}</span></div>
        <h2>${doneN()} of ${n} visits done</h2>${n ? steps() : ''}
        <div class="fd-facts"><span class="fd-pill">${ic('flame')}${streak()} day${streak() === 1 ? '' : 's'} on time</span>${missedV().length ? `<span class="fd-pill">${ic('x')}${missedV().length} missed</span>` : ''}</div>
        ${ended() ? `<div class="fd-kick">Day ended ${hm(a.end_at)} · ${mins(Math.round((Date.parse(a.end_at) - Date.parse(a.start_at)) / 6e4))}</div>` : `<button class="fd-btn ghost-ink block" data-fa="cam" data-mode="end">${ic('camera')}End my day</button>`}</div>`;
      return top(`${hello()}, ${B.user.name.split(' ')[0]}`, dayLong(F().day)) + `<main class="fd-view">${hero}
        <div class="fd-sec">Today's Roadmap <a href="#/visits">See all</a></div>
        <div class="fd-card">${n ? `<div class="fd-row between"><b>${doneN()} of ${n} visits done</b>${missedV().length ? `<span class="fd-pill bad">${missedV().length} missed</span>` : ''}</div><div style="margin-top:10px">${steps()}</div><div class="fd-meta" style="margin-top:10px">${esc(kinds)}</div>`
          : '<b>No visits on your Roadmap today</b><div class="fd-meta" style="margin-top:6px">Your manager, the Owner or telesales add them. They show here as soon as they are saved.</div>'}</div>
        ${nx ? `<div class="fd-sec">Next visit</div><div class="fd-card fd-next"><div class="fd-row between">${kind(nx.kind)}<span class="fd-pill ink">${vis().indexOf(nx) + 1} of ${n}</span></div><div class="fd-name">${esc(nx.name)}</div><div class="fd-meta">${esc(where(nx))}</div>
          <div class="fd-btns">${dirBtn(nx)}${checkBtn(nx, true)}</div>${started() ? '' : '<div class="fd-meta">Start my day first, then Check in opens.</div>'}</div>` : ''}
        ${(SDRX().due || []).length ? `<div class="fd-sec">SDR inspection due</div><div class="fd-list" data-sdr-due>${SDRX().due.map(d => `<a href="#/sdr/${esc(d.client_id)}" data-sdr-due-row="${esc(d.client_id)}">${ic('presentation')}<span class="fd-grow"><b>${esc(d.name || sdrName(d.client_id))}</b><span>Due ${dShort(d.next)} · overdue ${d.overdue} day${d.overdue === 1 ? '' : 's'}${d.city ? ' · ' + esc(d.city) : ''}</span></span>${ic('chevron-right')}</a>`).join('')}</div>` : ''}</main>`;
    },
    visits() {
      const n = vis().length;
      return top('Roadmap', dayLong(F().day), `<a class="fd-sync" href="#/visits">${ic('calendar')}Today</a>`) + `<main class="fd-view">
        <div class="fd-card"><div class="fd-row between"><b>${doneN()} of ${n} done</b>${missedV().length ? `<span class="fd-pill bad">${missedV().length} missed</span>` : ''}</div>${n ? `<div style="margin-top:10px">${steps()}</div>` : ''}
          ${started() ? '' : '<div class="fd-meta" style="margin-top:10px">Start my day first, then Check in opens.</div>'}</div>
        ${n ? `<ol class="fd-visits">${vis().map((v, i) => visitRow(v, i + 1)).join('')}</ol>` : '<div class="fd-card"><b>No visits today</b><div class="fd-meta" style="margin-top:6px">Your manager, the Owner or telesales plan your Roadmap. New visits ring your bell.</div></div>'}</main>`;
    },
    /* P5 + Requirement: who, then what. Saved, it is an opportunity at once and on telesales' list */
    req() {
      const R = S.req || (S.req = newReq()), n = (F().reqs || []).length, kinds = reqKinds(), e = R.err || {};
      const fe = k => e[k] ? `<span class="fd-err">${esc(e[k])}</span>` : '';
      const seg = (name, val, opts) => `<div class="fd-seg">${opts.map(([v, l, off]) => `<label><input type="radio" name="${name}" value="${v}" ${val === v ? 'checked' : ''} ${off ? 'disabled' : ''}>${esc(l)}</label>`).join('')}</div>`;
      const who = R.who === 'new'
        ? `<div class="fd-field">${R.card ? `<div class="fd-photos"><div class="fd-thumb"><img src="${R.cardUrl}" alt="Visiting card"><button type="button" aria-label="Remove photo" data-fa="req-card-x">${ic('x')}</button></div></div>` : `<label class="fd-photo-add wide">${ic('id-badge-2')}Photo of the visiting card<input type="file" accept="image/*" capture="environment" data-req-file="card"></label>`}<span class="fd-help">Kept with the new prospect for telesales.</span></div>
          <div class="fd-field${e.name ? ' has-err' : ''}"><label for="fr-name">Name</label><input class="fd-input" id="fr-name" data-req="name" value="${esc(R.name)}" maxlength="120" autocomplete="off">${fe('name')}</div>
          <div class="fd-field${e.mobile ? ' has-err' : ''}"><label for="fr-mob">Mobile</label><div class="fd-adorn"><span class="fd-pre">+91</span><input class="fd-input" id="fr-mob" data-req="mobile" type="tel" inputmode="tel" value="${esc(R.mobile)}" maxlength="14"></div>${fe('mobile')}</div>
          <div class="fd-field${e.area ? ' has-err' : ''}"><label for="fr-area">Area</label><input class="fd-input" id="fr-area" data-req="area" value="${esc(R.area)}" maxlength="120">${fe('area')}</div>`
        : `<div class="fd-field${e.who ? ' has-err' : ''}"><div class="fd-search">${ic('search')}<input class="fd-input" type="search" data-req="q" value="${esc(R.q)}" aria-label="Search dealer, architect, person or project" autocomplete="off"></div><div class="fd-picks" data-picks>${picksHtml()}</div>${fe('who')}</div>`;
      return top('New Requirement', 'Saved straight to telesales', `<a class="fd-sync" href="#/requirements">${ic('list-check')}Mine ${n}</a>`) + `<main class="fd-view"><form class="fd-form" onsubmit="return false" data-reqform>
        ${R.visit ? `<div class="fd-meta">${ic('map-pin-check')} From your visit to ${esc(R.visitName)}</div>` : ''}
        <div class="fd-field"><span class="fd-label">Who</span>${seg('fd-who', R.who, [['existing', 'Existing'], ['new', 'New prospect']])}</div>
        ${who}
        <div class="fd-field${e.kind ? ' has-err' : ''}"><span class="fd-label">What it is</span>${seg('fd-kind', R.kind, kinds)}${fe('kind')}</div>
        <div class="fd-field${e.cat ? ' has-err' : ''}"><label for="fr-cat">Category</label>${MSEL.html({ name: 'fd-cats', id: 'fr-cat', opts: B.lists.categories || [], sel: R.cats, phone: true })}<span class="fd-help">Pick every category the site needs.</span>${e.cat ? `<span class="msel-err" role="alert">${ic('alert-triangle')}${esc(e.cat)}</span>` : ''}</div>
        <div class="fd-field${e.sqft ? ' has-err' : ''}"><label for="fr-sq">Area</label><div class="fd-adorn"><input class="fd-input" id="fr-sq" data-req="sqft" inputmode="numeric" value="${esc(R.sqft)}"><span class="fd-suf">sq ft</span></div>${fe('sqft')}<div data-req-boxes>${reqBoxes(R)}</div></div>
        <div class="fd-field"><span class="fd-label">Site photos</span><div class="fd-photos">${R.photos.map((f, i) => `<div class="fd-thumb"><img src="${R.urls[i]}" alt="Site photo ${i + 1}"><button type="button" aria-label="Remove photo" data-fa="req-photo-x" data-i="${i}">${ic('x')}</button></div>`).join('')}<label class="fd-photo-add">${ic('camera')}Add<input type="file" accept="image/*" capture="environment" multiple data-req-file="photos"></label></div></div>
        <details class="fd-more"${R.more ? ' open' : ''}><summary>More details: budget, site, timeline${ic('chevron-down')}</summary><div class="fd-form">
          <div class="fd-field${e.budget ? ' has-err' : ''}"><label for="fr-bud">Budget</label><div class="fd-adorn"><span class="fd-pre">₹</span><input class="fd-input" id="fr-bud" data-req="budget" inputmode="numeric" value="${esc(R.budget)}"><span class="fd-suf">/-</span></div>${fe('budget')}</div>
          <div class="fd-field"><label for="fr-site">Site</label><input class="fd-input" id="fr-site" data-req="site" value="${esc(R.site)}" maxlength="300"></div>
          <div class="fd-field"><span class="fd-label">Timeline</span><div class="fd-chips">${['This month', '1 to 3 months', 'Later'].map(t => `<label class="fd-chip"><input type="radio" name="fd-tl" value="${t}" ${R.timeline === t ? 'checked' : ''}>${t}</label>`).join('')}</div></div>
          <div class="fd-field"><label for="fr-note">Note</label><textarea class="fd-input" id="fr-note" data-req="note" placeholder="Optional" maxlength="2000">${esc(R.note)}</textarea></div></div></details>
        <span class="fd-err" role="alert">${esc(e.all || '')}</span>
        <div class="fd-savebar"><button type="button" class="fd-btn primary lg block" data-fa="req-save"${R.busy ? ' aria-busy="true" disabled' : ''}>Save Requirement</button></div></form></main>`;
    },
    lead() {
      const R = S.lead || (S.lead = newLead()), e = R.err || {}, n = (F().reqs || []).length + (F().leads || []).length, L = B.lists || {};
      const fe = k => e[k] ? `<span class="fd-err">${esc(e[k])}${k === 'mobile' && e.dup ? ` <a href="#/requirements">Mine</a>` : ''}</span>` : '';
      /* SPEC-b1: Category and Wholesale as are .fd-seg radios (3 equal columns), the rest stay chips */
      const segL = (k, val, opts) => `<div class="fd-seg" role="radiogroup">${opts.map(o => `<label><input type="radio" name="fd-l${k}" data-lch="${k}" value="${esc(o)}" ${val === o ? 'checked' : ''}>${esc(o)}</label>`).join('')}</div>`;
      const chips = (k, val, opts) => `<div class="fd-chips" role="radiogroup">${opts.map(o => `<label class="fd-chip"><input type="radio" name="fd-l${k}" data-lch="${k}" value="${esc(o)}" ${val === o ? 'checked' : ''}>${esc(o)}</label>`).join('')}</div>`;
      const inp = (k, id, label, x = {}) => `<div class="fd-field${e[k] ? ' has-err' : ''}"><label for="${id}">${label}</label>${x.pre || x.suf ? '<div class="fd-adorn">' : ''}${x.pre ? `<span class="fd-pre">${x.pre}</span>` : ''}<input class="fd-input" id="${id}" data-ld="${k}" value="${esc(R[k])}"${x.type ? ` type="${x.type}"` : ''}${x.im ? ` inputmode="${x.im}"` : ''} maxlength="${x.max || 120}" autocomplete="off">${x.suf ? `<span class="fd-suf">${x.suf}</span>` : ''}${x.pre || x.suf ? '</div>' : ''}${fe(k)}</div>`;
      const opt = (list, val, first) => `<option value="">${first}</option>${list.map(o => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}`;
      /* F1 G4: the person in Bhargav's order, the same for a picked person and + New contact: Name, Mobile, Email, City, Role, Firm */
      const roleBox = `<div class="fd-field${e.role ? ' has-err' : ''}" data-lead-role><label for="fl-role">Role${R.nc ? ' *' : ''}</label>${R.role ? `<button type="button" class="fd-pick on" data-fa="lead-role-x"><span class="fd-tile">${ic('id-badge-2')}</span><span><b>${esc(R.role)}</b><span>Tap to change</span></span></button>` : `<div class="fd-search">${ic('search')}<input class="fd-input" id="fl-role" type="search" data-lq="rq" value="${esc(R.rq)}" placeholder="Type to find the role" autocomplete="off"></div><div class="fd-picks" data-lead-rpicks>${leadRolesHtml()}</div>`}${fe('role')}</div>`;
      const firmBox = R.type === 'Retail' ? '' : R.nc ? `<div class="fd-field"><span class="fd-label">Firm</span>${R.ffirm ? '' : `<div class="fd-search">${ic('search')}<input class="fd-input" type="search" data-lq="fq" value="${esc(R.fq)}" placeholder="Type a firm name" aria-label="Firm" autocomplete="off"></div>`}<div class="fd-picks" data-lead-fpicks>${leadFirmsHtml()}</div></div>` : inp('firm', 'fl-firm', 'Firm name');
      const person = inp('name', 'fl-name', 'Contact name') + inp('mobile', 'fl-mob', 'Mobile', { pre: '+91', type: 'tel', im: 'tel', max: 14 }) + inp('email', 'fl-email', 'Email', { type: 'email', im: 'email' })
        + `<div class="fd-field"><label for="fl-city">City</label><select class="fd-input" id="fl-city" data-lch="city">${opt((L.cities || []).map(c => c.city || c), R.city, 'Choose the city')}</select></div>` + roleBox + firmBox;
      const proj = R.type === 'Project' ? inp('pname', 'fl-pname', 'Project name') + inp('site', 'fl-site', 'Site location') : '';
      return top('New lead', 'Someone who may buy later', `<a class="fd-sync" href="#/requirements">${ic('list-check')}Mine ${n}</a>`) + `<main class="fd-view"><form class="fd-form" onsubmit="return false" data-leadform>
        ${R.earlier ? `<div class="fd-card" data-lead-earlier><p class="fd-help"><b>Started earlier.</b> This is the lead you began before. Carry on, or start a new one.</p><button type="button" class="fd-btn" data-fa="lead-restart">Start again</button></div>` : ''}
        <div class="fd-field">${R.card ? `<div class="fd-photos"><div class="fd-thumb"><img src="${R.cardUrl}" alt="Visiting card"><button type="button" aria-label="Remove photo" data-fa="lead-card-x">${ic('x')}</button></div></div>` : `<label class="fd-photo-add wide">${ic('id-badge-2')}Photo of the visiting card<input type="file" accept="image/*" capture="environment" data-lead-file="card"></label>`}</div>
        <div class="fd-field${e.type ? ' has-err' : ''}"><span class="fd-label">Category *</span>${segL('type', R.type, B.user.division === 'retail' ? LTYPES.filter(t => t !== 'Wholesale') : LTYPES)}${fe('type')}</div>
        ${R.type === 'Wholesale' ? `<div class="fd-field${e.wsas ? ' has-err' : ''}" data-ld-wsas><span class="fd-label">Wholesale as *</span>${segL('wsas', R.wsas, ['Dealer', 'Architect'])}${fe('wsas')}</div>` : ''}
        ${proj}
        ${R.nc ? `<div class="fd-card fd-form" data-lead-nc><div class="fd-sec">New contact <button type="button" class="fd-btn ghost" data-fa="lead-nc-x">Cancel</button></div>
          ${person}<span class="fd-help">Saved as the contact, with the lead.</span></div>`
        : `<div class="fd-field${e.find ? ' has-err' : ''}" data-find><span class="fd-label">Find a person</span>${R.pick ? '' : `<div class="fd-search">${ic('search')}<input class="fd-input" type="search" data-lq="q" value="${esc(R.q)}" placeholder="Type a name, mobile or firm" aria-label="Find a person" autocomplete="off"></div>`}<div class="fd-picks" data-lead-picks>${leadPicksHtml()}</div>${fe('find')}</div>${R.pick || R.fixN ? person : ''}`}
        <div class="fd-field"><label for="fl-cat">Interested categories</label>${MSEL.html({ name: 'fd-lcats', id: 'fl-cat', opts: L.categories || [], sel: R.cats, phone: true })}</div>
        <div class="fd-field"><span class="fd-label">Buying timeline</span>${chips('timeline', R.timeline, ['This month', '1 to 3 months', '3 to 6 months', 'Later, not sure'])}</div>
        <div class="fd-field"><span class="fd-label">Score</span>${chips('score', R.score, ['Hot', 'Warm', 'Cold'])}</div>
        <details class="fd-more"${R.more ? ' open' : ''}><summary>More: follow-up, value, notes${ic('chevron-down')}</summary><div class="fd-form">
          ${inp('next', 'fl-next', 'Next follow-up date', { type: 'date' })}
          ${R.type && R.type !== 'Retail' ? inp('gst', 'fl-gst', 'GST number', { max: 15 }) : ''}
          ${inp('alt', 'fl-alt', 'Alternate mobile', { pre: '+91', type: 'tel', im: 'tel', max: 14 })}
          ${inp('locality', 'fl-loc', 'Locality')}
          ${inp('area', 'fl-area', 'Area', { im: 'numeric', suf: 'sq ft' })}
          ${B.access && B.access.prices === false ? '' : inp('value', 'fl-val', 'Value', { im: 'numeric', pre: '₹', suf: '/-' })}
          <div class="fd-field"><span class="fd-label">Budget band</span>${chips('budget', R.budget, L.budget_bands || ['Under 2 lakh', '2 to 5 lakh', '5 to 10 lakh', 'Above 10 lakh'])}</div>
          ${inp('close', 'fl-close', 'Expected close', { type: 'date' })}
          <div class="fd-field"><label for="fl-src">Source</label><select class="fd-input" id="fl-src" data-lch="source">${opt(L.sources || ['Field visit'], R.source, 'Choose the source')}</select></div>
          ${inp('campaign', 'fl-camp', 'Campaign or ad name')}
          <div class="fd-field"><label for="fl-note">Notes</label><textarea class="fd-input" id="fl-note" data-ld="note" placeholder="Optional" maxlength="2000">${esc(R.note)}</textarea></div>
          <div class="fd-field"><span class="fd-label">Files</span><div class="fd-photos">${R.photos.map((f, i) => `<div class="fd-thumb"><img src="${R.urls[i]}" alt="Photo ${i + 1}"><button type="button" aria-label="Remove photo" data-fa="lead-photo-x" data-i="${i}">${ic('x')}</button></div>`).join('')}<label class="fd-photo-add">${ic('camera')}Add<input type="file" accept="image/*" multiple data-lead-file="photos"></label></div></div></div></details>
        <span class="fd-err" role="alert">${esc(e.all || '')}</span>
        <div class="fd-savebar"><button type="button" class="fd-btn primary lg block" data-fa="lead-save"${R.busy ? ' aria-busy="true" disabled' : ''}>Save lead</button></div></form></main>`;
    },
    /* P6 My requirements: what happened to each, newest first */
    requirements() {
      const R = F().reqs || [], LS = F().leads || [], open = r => !r.won && !r.lost, f = S.rf;
      const cnt = { all: R.length + LS.length, lead: LS.length, tele: R.filter(open).length, won: R.filter(r => r.won).length, lost: R.filter(r => r.lost).length };
      const show = f === 'lead' ? [] : R.filter(r => f === 'tele' ? open(r) : f === 'won' ? r.won : f === 'lost' ? r.lost : true);
      /* L4: a lead row (the same card, a Lead tag, no 4-step track) */
      const score = s => { const k = { Hot: 3, Warm: 2, Cold: 1 }[s]; return k ? ` · <span class="ld-score" data-s="${k}"><i></i><i></i><i></i>${esc(s)}</span>` : ''; };
      const lrow = l => { if (l.refused) return `<div class="fd-req is-lead is-refused" data-lead-row data-refused><div class="fd-row between"><span class="fd-name">${esc(l.name)}</span><span class="fd-row" style="gap:6px"><span class="fd-pill bad">${ic('alert-triangle')}Not sent</span><span class="fd-tag">${ic('seedling')}Lead</span></span></div>
          <div class="fd-last">${ic('circle-x')}<span>${esc(l.refused)}</span></div><div class="fd-acts"><button type="button" class="fd-btn primary" data-fa="lead-fix" data-n="${l.qn}">${ic('pencil')}Fix and send</button></div></div>`;
        const pill = l.waiting ? `<span class="fd-pill warn">${ic('cloud-upload')}Waiting</span>` : l.status === 'Converted' ? '<span class="fd-pill ok">Converted</span>' : l.status === 'Not interested' ? '<span class="fd-pill">Not interested</span>' : '';
        const last = l.waiting ? [ic('wifi-off'), 'Saved on this phone, will send when signal returns'] : l.status === 'Converted' ? [ic('arrow-right'), `Opportunity: ${l.opp_title || 'made'}`] : l.status === 'Not interested' ? [ic('circle-x'), `Reason: ${l.ni_reason || 'not given'}.${l.ni_detail ? ' ' + l.ni_detail : ''}`]
          : [ic('calendar'), `${l.status}, with ${l.owner_name}.${l.next_date ? ' Next follow-up ' + dayShort(l.next_date) : ' No follow-up set'}`];
        return `<div class="fd-req is-lead" data-lead-row><div class="fd-row between"><span class="fd-name">${esc(l.name)}</span><span class="fd-row" style="gap:6px">${pill}<span class="fd-tag">${ic('seedling')}Lead</span></span></div>
          <div class="fd-what">${esc([[l.lead_type, l.lead_type === 'Wholesale' ? l.wholesale_as : ''].filter(Boolean).join(', '), (l.categories || []).join(', ')].filter(Boolean).join(' · '))}${score(l.score)}</div><div class="fd-last">${last[0]}<span>${esc(last[1])}</span></div></div>`; };
      const leadsShown = f === 'all' || f === 'lead' ? LS : [];
      const row = r => { const steps = r.waiting ? 0 : r.won ? 4 : r.step || 0;
        const pill = r.waiting ? `<span class="fd-pill warn">${ic('cloud-upload')}Waiting</span>` : r.won ? `<span class="fd-pill ok">${ic('trophy')}Turned into sale</span>` : r.lost ? '<span class="fd-pill bad">Lost</span>' : `<span class="fd-pill">Step ${steps} of 4</span>`;
        const last = r.waiting ? [ic('wifi-off'), 'Saved on this phone, will send when signal returns']
          : r.won ? [ic('circle-check'), `${r.stage} ${dayShort(r.closed_at || r.created_at)}${r.won_value != null ? ` · ₹${Math.round(r.won_value).toLocaleString('en-IN')}` : ''}${r.dealer_name ? ` · ${r.dealer_name}` : ''}`]
          : r.lost ? [ic('circle-x'), `Reason: ${r.lost_reason || 'not given'}${r.lost_detail ? '. ' + r.lost_detail : ''}`]
          : [ic(r.dealer_name ? 'building-store' : 'phone'), `${r.step_label}${r.dealer_name ? `: ${r.dealer_name}` : ''}. Now at ${r.stage}, with ${r.owner_name}${r.last ? ` since ${dayShort(r.last.at)}` : ''}`];
        return `<div class="fd-req${r.won ? ' is-won' : r.lost ? ' is-lost' : ''}"><div class="fd-row between"><span class="fd-name">${esc(r.c_name)}</span>${pill}</div>
          <div class="fd-what">${esc([r.category, r.area_sqft != null ? `${Number(r.area_sqft).toLocaleString('en-IN')} sq ft` : '', REQK[r.kind] || ''].filter(Boolean).join(' · '))}</div>
          <div class="fd-track">${[0, 1, 2, 3].map(i => `<i class="${i < steps ? 'done' : ''}"></i>`).join('')}</div><div class="fd-last">${last[0]}<span>${esc(last[1])}</span></div></div>`; };
      const items = [...show.map(r => [r.created_at || '', row(r)]), ...leadsShown.map(l => [l.created_at || '', lrow(l)])].sort((a, b) => String(b[0]).localeCompare(String(a[0]))).map(x => x[1]);
      return top('Mine', 'Requirements and leads you saved', `<a class="fd-sync" href="#/new" data-fa="pick">${ic('plus')}New</a>`) + `<main class="fd-view">
        <div class="fd-filter">${[['all', 'All'], ['lead', 'Leads'], ['tele', 'With telesales'], ['won', 'Turned into sale'], ['lost', 'Lost']].map(([k, l]) => `<label class="fd-chip"><input type="radio" name="fd-rf" value="${k}" ${f === k ? 'checked' : ''}>${l} ${cnt[k]}</label>`).join('')}</div>
        ${items.length ? `<div class="fd-reqs">${items.join('')}</div>` : `<div class="fd-card"><b>${R.length + LS.length ? 'None here' : 'No Requirements yet'}</b><div class="fd-meta" style="margin-top:6px">${R.length + LS.length ? 'Pick another filter above.' : 'Save one with + New at a visit. It goes straight to telesales, and what happens to it shows here.'}</div></div>`}</main>`;
    },
    /* P7 My numbers: at most four above the fold, every one from saved records */
    numbers() {
      const N = F().numbers || {}, T = N.target, vt = vis().length, vd = doneN(), mon = MON[+F().day.slice(5, 7) - 1];
      const unit = m => m === 'value' ? '' : ' ' + m, fmt = (m, x) => (m === 'value' ? '₹' : '') + Math.round(x).toLocaleString('en-IN');
      let ring;
      if (!T) ring = `<div class="fd-card"><b>No target set yet</b><div class="fd-meta" style="margin-top:6px">Your manager or the Owner sets it in Targets. The ring shows here once it is saved.</div></div>`;
      else if (T.hidden) ring = `<div class="fd-card"><b>Your target is set in rupees only</b><div class="fd-meta" style="margin-top:6px">Your role does not show money, so the ring stays hidden. Ask your manager to add boxes to the target.</div></div>`;
      else { const p = Math.min(1, T.goal ? T.got / T.goal : 0), left = Math.max(0, T.goal - T.got);
        ring = `<a class="fd-card fd-ringcard" href="#/numbers" data-fa="board" style="text-decoration:none;color:inherit"><div class="fd-ring${T.pct >= 100 ? ' is-met' : ''}" style="--p:${p.toFixed(3)}"><svg viewBox="0 0 148 148" aria-hidden="true"><circle class="fd-track-c" cx="74" cy="74" r="62"/><circle class="fd-arc" cx="74" cy="74" r="62" pathLength="100"/></svg>
          <div class="fd-mid"><b>${roll(String(T.pct))}%</b><span>of target</span></div></div>
          <div style="display:grid;gap:6px"><span class="fd-meta" style="font-weight:600">Target this ${T.period_type === 'month' ? 'month' : T.period_type === 'quarter' ? 'quarter' : 'year'}</span><span class="fd-big" style="font-size:26px">${T.measure === 'value' ? '₹' : ''}${roll(Math.round(T.got).toLocaleString('en-IN'))}</span><span class="fd-meta">of ${fmt(T.measure, T.goal)}${unit(T.measure)}</span>
          <span class="fd-pill">${left ? `${fmt(T.measure, left)}${unit(T.measure)} to go · ${T.days_left} day${T.days_left === 1 ? '' : 's'}` : 'Target reached'}</span></div></a>`; }
      const best = (() => { let b = 0, run = 0; for (const d of (F().days || []).slice().reverse()) { if (!d.start_at) continue; run = d.late_min > 0 ? 0 : run + 1; b = Math.max(b, run); } return b; })();
      return top('My numbers', `${mon} · from saved records`) + `<main class="fd-view">${ring}
        <div class="fd-stats">
          <a class="fd-stat" href="#/visits"><span class="fd-label">${ic('route')}Visits today</span><span class="fd-big">${roll(String(vd))} <small>of ${vt}</small></span>${vt ? steps() : ''}</a>
          <a class="fd-stat" href="#/numbers" data-fa="board"><span class="fd-label">${ic('trophy')}Rank</span><span class="fd-big">${roll(String(N.rank || 0))} <small>of ${N.team_size || 0}</small></span><span class="fd-meta">This month, by ${esc(N.board_measure || 'boxes')}</span></a>
          <a class="fd-stat wide" href="#/today"><span class="fd-label">${ic('flame', 'fd-ic fd-flame')}Started on time</span><span class="fd-big">${roll(String(streak()))} <small>day${streak() === 1 ? '' : 's'} in a row</small></span><span class="fd-meta">Your best: ${best} day${best === 1 ? '' : 's'}</span></a></div>
        <div class="fd-sec">Requirements turned into sales</div>
        <a class="fd-stat" href="#/requirements"><span class="fd-big">${roll(String(N.reqs_won_month || 0))} <small>of ${N.reqs_month || 0} this month</small></span><span class="fd-meta">${N.reqs_won_sqft ? `${Math.round(N.reqs_won_sqft).toLocaleString('en-IN')} sq ft turned into sales` : 'Saved this month, and the ones that became a sale'}</span></a>
        <div class="fd-sec" id="fd-board">Field team, ${mon}</div>
        <div class="fd-card fd-board">${(N.board || []).map((p, i) => `<div class="fd-rank${p.me ? ' me' : ''}"><b>${i + 1}</b><span>${p.me ? '<b>You</b>' : esc(p.name)}</span><b>${fmt(N.board_measure, p.got)}${N.board_measure === 'value' ? '' : ' ' + esc(N.board_measure)}</b></div>`).join('')}</div>
        <div class="fd-honest">${ic('info-circle')}<span>Every number comes from your saved visits, Requirements and orders: sales are invoiced orders you own, the same rule as Targets.</span></div></main>`;
    },
    me() {
      const boss = (B.staff || []).find(s => s.id === (B.staff.find(x => x.id === B.user.id) || {}).reports_to);
      const th = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      return top('Me', `${B.access.name} · ${CO[B.user.division] || ''}`) + `<main class="fd-view">
        <div class="fd-card fd-row"><span class="fd-avatar" style="width:56px;height:56px;font-size:18px">${esc(initials(B.user.name))}</span><span class="fd-grow"><b style="font-size:18px">${esc(B.user.name)}</b><span class="fd-meta" style="display:block">${esc(CO[B.user.division] || '')}${B.user.region ? ' · ' + esc(B.user.region) : ''}${boss ? ' · Manager: ' + esc(boss.name) : ''}</span></span></div>
        <div class="fd-sec">Raise</div>
        <div class="fd-raise">
          <a href="#/raise/approval"><span class="fd-tile">${ic('circle-check')}</span><b>Ask for approval</b><span>Discount, credit or anything that needs a yes</span></a>
          <a href="#/raise/complaint"><span class="fd-tile">${ic('alert-triangle')}</span><b>Report a complaint</b><span>A dealer's problem with a product</span></a></div>
        <div class="fd-list">
          <a href="#/requests">${ic('list-check')}<span class="fd-grow"><b>My requests</b><span>${(() => { const X = asks(), w = [...(X.approvals || []).filter(a => a.waiting || a.status === 'Pending'), ...(X.complaints || []).filter(c => c.waiting || c.status !== (X.done || 'Resolved'))].length, n = (X.approvals || []).length + (X.complaints || []).length; return n ? `${w} waiting · ${n - w} answered` : 'Nothing raised yet'; })()}</span></span>${ic('chevron-right')}</a>
          <a href="#/requirements">${ic('list-check')}<span class="fd-grow"><b>My requirements</b><span>${(F().reqs || []).length} saved</span></span>${ic('chevron-right')}</a>
          <div>${ic('clock')}<span class="fd-grow"><b>Start time ${esc(F().start)}</b><span>Set by the Owner. Starting after it shows a late mark.</span></span></div>
          <div>${ic('moon')}<span class="fd-grow"><b>Theme</b></span><span class="fd-seg" style="min-width:150px"><label><input type="radio" name="fd-th" value="light" ${th === 'light' ? 'checked' : ''}>Light</label><label><input type="radio" name="fd-th" value="dark" ${th === 'dark' ? 'checked' : ''}>Dark</label></span></div>
          <a href="#" data-fa="team">${ic('layout-dashboard')}<span class="fd-grow"><b>Open the team screens</b><span>Dealers, opportunities and the rest, on a computer</span></span>${ic('chevron-right')}</a></div>
        <div class="fd-card fd-install"><div class="fd-row">${ic('device-mobile')}<b>Add to home screen</b></div>
          <ol class="fd-meta"><li>iPhone: tap Share ${ic('share-2')}, then Add to Home Screen.</li><li>Android: tap the menu, then Install app.</li></ol></div>
        <button class="fd-btn block" data-fa="out">${ic('logout')}Sign out</button></main>`;
    },
  };

  /* ---- Start my day / End my day: the camera, then the check */
  const camTitle = () => S.cam === 'start' ? 'Start my day' : 'End my day';
  function gpsTxt() { const g = S.gps; return !g ? 'Finding your location' : g.err ? 'Location not shared' : `Within ${g.acc} m`; }
  function startGps() {
    S.gps = null;
    if (!navigator.geolocation) { S.gps = { err: 'This phone gives no location.' }; return; }
    navigator.geolocation.getCurrentPosition(p => { S.gps = { lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) }; paintGps(); },
      e => { S.gps = { err: e.code === 1 ? 'Location is switched off for this site.' : 'The location could not be found.' }; paintGps(); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }
  const paintGps = () => { const el = qs('[data-gps]'); if (el) el.textContent = gpsTxt(); if (S.confirm) render(); };
  const stopCam = () => { if (S.stream) S.stream.getTracks().forEach(t => t.stop()); S.stream = null; };
  async function openCam(mode) {
    S.cam = mode; S.camErr = ''; S.confirm = null; S.shot = null; render(); startGps();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('none');
      S.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      const v = qs('.fd-cam video'); if (v) { v.srcObject = S.stream; await v.play().catch(() => {}); }
    } catch (e) { S.camErr = e && e.name === 'NotAllowedError' ? 'The camera is switched off for this site.' : 'The camera could not be opened.'; render(); }
  }
  const camHtml = () => `<div class="fd-cam" role="dialog" aria-label="${camTitle()}">
    <div class="fd-cam-top"><button class="fd-cam-x" aria-label="Close" data-fa="cam-x">${ic('x')}</button><b>${camTitle()}</b><span style="width:48px"></span></div>
    <div class="fd-cam-view">${S.camErr ? `<div class="fd-cam-hint" style="position:static;margin:auto;max-width:300px;text-align:center;display:grid;gap:14px"><b>${esc(S.camErr)}</b><span>Allow the camera for this site in the phone's settings, or take the photo with the phone camera. You can also go on without a photo: your manager sees that.</span>
        <label class="fd-btn on-ink lg">${ic('camera')}Take the photo<input type="file" accept="image/*" capture="user" data-fa-file hidden></label><button class="fd-btn ghost-ink" data-fa="nophoto">Go on without a photo</button></div>`
      : '<video autoplay playsinline muted></video><div class="fd-cam-oval"></div><div class="fd-cam-hint">Keep your face inside the oval</div>'}</div>
    <div class="fd-cam-bar">${S.camErr ? '' : '<button class="fd-shutter" aria-label="Take photo" data-fa="shoot"></button>'}
      <div class="fd-cam-facts"><span>${ic('clock')}${hm()}</span><span>${ic('map-pin')}<span data-gps>${gpsTxt()}</span></span></div></div></div>`;
  function shoot() {
    const v = qs('.fd-cam video'); if (!v || !v.videoWidth) return;
    const k = Math.min(1, 960 / Math.max(v.videoWidth, v.videoHeight)), c = document.createElement('canvas');
    c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);   // saved as the camera sees it: the mirror is only on screen
    c.toBlob(b => setShot(b), 'image/jpeg', 0.82);
  }
  function setShot(blob) { stopCam(); if (S.shotUrl) URL.revokeObjectURL(S.shotUrl); S.shot = blob; S.shotUrl = blob ? URL.createObjectURL(blob) : ''; S.confirm = { at: new Date().toISOString() }; render(); }
  function confirmHtml() {
    const at = S.confirm.at, g = S.gps, start = S.cam === 'start', lateBy = start ? Math.max(0, nowMin() - startMin()) : 0, a = att();
    const facts = start ? `<div class="fd-fact">${ic('clock')}<div><b>${hm(at)}</b><span>Time, from the phone clock</span></div></div>`
      : `<div class="fd-fact">${ic('clock')}<div><b>${mins(Math.round((Date.parse(at) - Date.parse(a.start_at)) / 6e4))}</b><span>Day length, ${hm(a.start_at)} to ${hm(at)}</span></div></div>
         <div class="fd-fact">${ic('route')}<div><b>${doneN()} of ${vis().length} visits done</b><span>${vis().filter(v => v.status === 'planned').length ? `Not checked in, turns Missed: ${esc(vis().filter(v => v.status === 'planned').map(v => v.name).join(', '))}` : 'Nothing left to check in'}</span></div></div>`;
    return `<header class="fd-top"><button class="fd-cam-x" style="background:var(--fd-card);color:var(--fd-text)" aria-label="Back" data-fa="cam-x">${ic('x')}</button><div class="fd-hello"><b>${camTitle()}</b><span>Check the photo, then confirm</span></div></header>
      <main class="fd-view">
      ${S.shotUrl ? `<div class="fd-shot"${start ? '' : ' style="aspect-ratio:4/4"'}><img src="${S.shotUrl}" alt="Your photo"><div class="fd-stamp"><span>${ic('clock')}${hm(at)} · ${dayShort(at)}</span><span>${ic('map-pin')}${g && !g.err ? `within ${g.acc} m` : 'location not shared'}</span></div></div>`
        : `<div class="fd-late">${ic('camera')}<div><b>No photo</b><span>Your manager sees that this day has no photo.</span></div></div>`}
      ${lateBy ? `<div class="fd-late">${ic('alert-triangle')}<div><b>Late by ${lateBy} min</b><span>Your start time is ${esc(F().start)}. Your manager sees the late mark.</span></div></div>` : ''}
      ${g && g.err ? `<div class="fd-late">${ic('map-pin')}<div><b>Location not shared</b><span>${esc(g.err)} The day still ${start ? 'starts' : 'ends'}, marked "location not shared".</span></div></div>` : ''}
      <div class="fd-card fd-facts-list">${facts}<div class="fd-fact">${ic('map-pin')}<div><b>${!g ? 'Finding your location' : g.err ? 'Location not shared' : `${g.lat.toFixed(4)}, ${g.lng.toFixed(4)}`}</b><span>${!g ? 'One moment' : g.err ? 'Marked for your manager' : `Location, within ${g.acc} m`}</span></div></div></div>
      <div class="fd-btns"><button class="fd-btn lg" data-fa="retake">${ic('refresh')}Retake</button><button class="fd-btn primary lg" data-fa="send"${S.busy ? ' aria-busy="true" disabled' : ''}>${ic('check')}${start ? 'Confirm' : 'End my day'}</button></div></main>`;
  }
  async function sendDay() {
    const fd = new FormData(), g = S.gps;
    if (S.shot) fd.append('photo', S.shot, 'photo.jpg');
    if (g && !g.err) { fd.append('lat', g.lat); fd.append('lng', g.lng); fd.append('acc', g.acc); }
    S.busy = true; render();
    const mode = S.cam;
    try { const w = await write('/api/field/' + mode, fd, { type: mode, gps: g && !g.err ? { lat: g.lat, lng: g.lng, acc: g.acc } : null }, mode === 'start' ? 'Start my day' : 'End my day');
      closeCam(); location.hash = '#/today'; render();
      if (w.queued) toast('<b>Saved on this phone.</b> It will send when signal returns.', w.n);
      else toast(mode === 'start' ? `<b>Day started ${hm(att().start_at)}.</b> Check in is open.` : '<b>Day ended.</b> See you tomorrow.'); }
    catch (e) { S.busy = false; render(); toast(esc(e.message)); }
  }
  const closeCam = () => { stopCam(); S.cam = null; S.confirm = null; S.shot = null; S.busy = false; if (S.shotUrl) URL.revokeObjectURL(S.shotUrl); S.shotUrl = ''; };

  /* ---- Check in, then how it went */
  const where1 = () => new Promise(ok => { if (!navigator.geolocation) return ok(null); navigator.geolocation.getCurrentPosition(p => ok({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) }), () => ok(null), { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }); });
  async function checkin(el) {
    el.setAttribute('aria-busy', 'true'); el.disabled = true;
    const g = await where1(), fd = new FormData();
    if (g) { fd.append('lat', g.lat); fd.append('lng', g.lng); fd.append('acc', g.acc); }
    const v = vis().find(x => x.id === el.dataset.id) || {};
    try { const w = await write(`/api/field/visits/${el.dataset.id}/checkin`, fd, { type: 'checkin', id: el.dataset.id, gps: g }, `Check in · ${v.name || ''}`); S.sheet = el.dataset.id; S.sheetGps = g; render(); if (w.queued) toast('<b>Checked in on this phone.</b> It will send when signal returns.', w.n); }
    catch (e) { el.removeAttribute('aria-busy'); el.disabled = false; toast(esc(e.message)); }
  }
  function sheetHtml() {
    const v = vis().find(x => x.id === S.sheet); if (!v) return '';
    const outs = B.lists.visit_outcomes || [];
    return `<div class="fd-scrim" data-fa="sheet-x"></div><div class="fd-sheet" role="dialog" aria-label="Visit outcome"><form onsubmit="return false" data-sheet="${v.id}" style="display:grid;gap:14px">
      <div class="fd-row"><span class="fd-pill ok">${ic('map-pin-check')}Checked in ${hm(v.checkin_at)}</span><span class="fd-meta">${esc(placeOf(v.checkin_lat, v.checkin_lng, v.checkin_acc, v.checkin_noloc))}</span></div>
      <h3>How did it go at ${esc(v.name)}?</h3>
      <div class="fd-choices" role="radiogroup">${outs.map(o => `<label class="fd-choice"><input type="radio" name="fd-out" value="${esc(o)}" ${v.outcome === o ? 'checked' : ''}>${ic(OUT_IC[o] || 'circle-check')}${esc(o)}</label>`).join('')}</div>
      <div class="fd-field" data-if="Order taken" hidden><label for="fd-boxes">Boxes ordered</label><div class="fd-adorn"><input class="fd-input" id="fd-boxes" inputmode="numeric"><span class="fd-suf">boxes</span></div></div>
      <div class="fd-field" data-if="Follow-up set" hidden><label for="fd-fu">Follow-up on</label><input class="fd-input" id="fd-fu" type="date"></div>
      <div class="fd-field"><label for="fd-note">Note</label><textarea class="fd-input" id="fd-note" rows="2" placeholder="Optional" maxlength="1000">${esc(v.note || '')}</textarea></div>
      <div class="fd-photos"><label class="fd-photo-add">${ic('camera')}<span data-photo-n>Photo</span><input type="file" accept="image/*" capture="environment" id="fd-vphoto"></label></div>
      <span class="fd-err" id="fd-sheet-err" role="alert"></span>
      <div class="fd-btns"><button type="button" class="fd-btn lg" data-fa="req-from" data-id="${v.id}">${ic('plus')}Requirement</button><button type="button" class="fd-btn primary lg" data-fa="outcome" data-id="${v.id}">Save</button></div></form></div>`;
  }
  async function saveOutcome(el) {
    const f = qs(`[data-sheet="${el.dataset.id}"]`), out = (f.querySelector('input[name="fd-out"]:checked') || {}).value;
    if (!out) { qs('#fd-sheet-err').textContent = 'Choose how it went.'; return; }
    const fd = new FormData(); fd.append('outcome', out); fd.append('note', qs('#fd-note').value);
    if (out === 'Order taken' && qs('#fd-boxes').value.trim()) fd.append('boxes', qs('#fd-boxes').value.replace(/[,\s]/g, ''));
    if (out === 'Follow-up set' && qs('#fd-fu').value) fd.append('follow_on', qs('#fd-fu').value);
    const ph = qs('#fd-vphoto').files[0]; if (ph) fd.append('photo', ph);
    el.setAttribute('aria-busy', 'true'); el.disabled = true;
    const v = vis().find(x => x.id === el.dataset.id) || {}, boxes = fd.get('boxes'), fon = fd.get('follow_on');
    try { const w = await write(`/api/field/visits/${el.dataset.id}/outcome`, fd, { type: 'outcome', id: el.dataset.id, outcome: out, note: fd.get('note'), boxes: boxes ? Number(boxes) : undefined, follow_on: fon || undefined }, `${out} · ${v.name || ''}`);
      S.sheet = ''; render(); toast(w.queued ? `<b>Saved on this phone:</b> ${esc(out)}` : `<b>Saved:</b> ${esc(out)}`, w.queued ? w.n : undefined); }
    catch (e) { el.removeAttribute('aria-busy'); el.disabled = false; qs('#fd-sheet-err').textContent = e.message; }
  }

  /* ---- T3 (Bhargav 19 Oct, "a pure app interface, completely"): a field person who opens EGO Field in a phone browser tab
     sees how to install it first (design/CONTRACT.txt I1). Never once installed (standalone), never on a computer. */
  const UA = navigator.userAgent || '';
  const IOS = /iPhone|iPad|iPod/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);
  const PHONE = IOS || /Android/i.test(UA);
  const standalone = () => !!((window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true);
  let instSkip = false;
  const skipped = () => { if (instSkip) return true; try { return sessionStorage.getItem('ego-inst-skip') === '1'; } catch (e) { return false; } };
  const needInstall = () => PHONE && !standalone() && !skipped();
  function instHtml() {
    const other = IOS && /CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|DuckDuckGo|YaBrowser|FBAN|FBAV|Instagram|Line\//.test(UA);
    const iosSteps = `<ol class="fd-inst-steps">
      <li><span class="fd-inst-n">1</span><div><b>Tap Share</b><p>The ${ic('share-2')} button in the Safari bar.</p><div class="fd-mock" aria-hidden="true"><span class="fd-mock-url">zippyscale.in</span><div class="fd-mock-bar">${ic('chevron-right').replace('fd-ic"', 'fd-ic" style="transform:scaleX(-1)"')}${ic('chevron-right')}<span class="fd-hl">${ic('share-2')}</span>${ic('list-check')}${ic('square-plus')}</div></div></div></li>
      <li><span class="fd-inst-n">2</span><div><b>Tap Add to Home Screen</b><p>Scroll down the list if you do not see it.</p><div class="fd-mock" aria-hidden="true"><div class="fd-mock-row dim">Add to Favourites ${ic('list-check')}</div><div class="fd-mock-row fd-hl">Add to Home Screen ${ic('square-plus')}</div></div></div></li>
      <li><span class="fd-inst-n">3</span><div><b>Tap Add</b><p>Top right. The EGO Field icon appears on your Home Screen.</p><div class="fd-mock" aria-hidden="true"><div class="fd-mock-top"><span>Cancel</span><b>Add to Home Screen</b><em class="fd-hl">Add</em></div></div></div></li></ol>`;
    const android = `<button type="button" class="fd-btn primary lg block" data-fa="inst-go">${ic('square-plus')}Install EGO Field</button><p class="fd-inst-lead" style="margin:0">Chrome asks once. Tap Install.</p>
      <details class="fd-more"${window.__egoBIP && !S.instMenu ? '' : ' open'}><summary>No Install button? Use the menu ${ic('chevron-down')}</summary><ol class="fd-inst-steps">
      <li><span class="fd-inst-n">1</span><div><b>Tap the menu</b><p>The ${ic('dots-vertical')} at the top right of Chrome.</p></div></li>
      <li><span class="fd-inst-n">2</span><div><b>Tap Install app</b><p>On some phones it says Add to Home screen.</p><div class="fd-mock" aria-hidden="true"><div class="fd-mock-row dim">New tab ${ic('plus')}</div><div class="fd-mock-row fd-hl">Install app ${ic('device-mobile')}</div></div></div></li>
      <li><span class="fd-inst-n">3</span><div><b>Tap Install</b><p>The EGO Field icon appears on your Home Screen.</p></div></li></ol></details>`;
    return `<div class="fd-inst" role="dialog" aria-labelledby="inst-h" data-inst="${IOS ? other ? 'ios-other' : 'ios' : 'android'}">
      <div class="fd-inst-app"><img src="field-192.png" alt="EGO Field icon" width="64" height="64"><span><b>EGO Field</b><span>EGO Premium field sales</span></span></div>
      <h1 id="inst-h">Install EGO Field</h1><p class="fd-inst-lead">It opens full screen like any app on your phone, without the browser bar.</p>
      ${other ? `<div class="fd-inst-warn" role="note">${ic('alert-triangle')}<b>Open it in Safari first</b><p>On iPhone, Add to Home Screen works from Safari. Copy the link, open Safari, paste it, then follow the steps.</p><button type="button" class="fd-btn" data-fa="inst-copy">${ic('copy')}Copy link</button></div>` : ''}
      ${IOS ? iosSteps : android}
      <div class="fd-inst-then">${ic('device-mobile')}<span>Then open EGO Field from your Home Screen and sign in once more.</span></div>
      <a class="fd-inst-skip" href="#/today" data-fa="inst-skip">Continue in browser for now</a></div>`;
  }

  /* ---- render */
  const route = () => { const r = (location.hash || '#/today').split('/')[1] || 'today'; return V[r] && (NAV.some(n => n[0] === r && n[3]) || ['req', 'lead', 'requirements', 'raise', 'requests', 'sdr'].includes(r)) ? r : 'today'; };
  function render() {
    if (!root) return;
    if (needInstall()) { root.innerHTML = instHtml(); return; }
    if (S.cam && !S.confirm) { if (!qs('.fd-cam') || S.camErr !== (qs('.fd-cam').dataset.err || '')) { root.innerHTML = camHtml(); qs('.fd-cam').dataset.err = S.camErr; const v = qs('.fd-cam video'); if (v && S.stream) v.srcObject = S.stream; } return; }
    if (S.confirm) { root.innerHTML = confirmHtml(); return; }
    const r = route(), keep = qs('.fd-toast [data-fa="undo"]') && qs('.fd-toast');   // a toast with Undo outlives the screen being drawn again
    root.innerHTML = V[r]().replace('<main class="fd-view">', '<main class="fd-view">' + banner()) + nav(['req', 'lead', 'requirements'].includes(r) ? 'new' : ['raise', 'requests'].includes(r) ? 'me' : r === 'sdr' ? 'visits' : r) + (S.sheet ? sheetHtml() : '') + (S.pick ? pickHtml() : '');
    if (keep) root.appendChild(keep);
  }
  const A = {
    cam: el => openCam(el.dataset.mode), 'cam-x': () => { closeCam(); render(); }, shoot, retake: () => openCam(S.cam), send: sendDay, nophoto: () => setShot(null),
    checkin, sheet: el => { S.sheet = el.dataset.id; render(); }, 'sheet-x': () => { S.sheet = ''; render(); }, outcome: saveOutcome,
    'req-from': el => { reqFromVisit(el.dataset.id); leadFromVisit(el.dataset.id); S.sheet = ''; S.pick = true; render(); },
    pick: () => { S.pick = true; render(); }, 'pick-x': () => { S.pick = false; render(); },
    'lead-fix': el => { const it = (Q.bad || []).find(x => x.n === +el.dataset.n); if (!it) return; const R = S.lead = newLead(), g = k => (it.parts.find(p => p[0] === k) || [])[1] || '';
      Object.assign(R, { type: g('lead_type'), wsas: g('wholesale_as'), firm: g('firm'), gst: g('gst'), name: g('contact_name'), mobile: g('mobile'), alt: g('alt_mobile'), email: g('email'), city: g('city'), locality: g('locality'), area: g('area_sqft'), value: g('value'), budget: g('budget'),
        timeline: g('timeline'), close: g('expected_close'), pname: g('project_name'), site: g('site_location'), score: g('score'), source: g('source') || 'Field visit', campaign: g('campaign'), note: g('notes'), next: g('next_date'),
        cats: it.parts.filter(p => p[0] === 'categories').map(p => p[1]), fixN: it.n, more: true });
      const card = it.parts.find(p => p[0] === 'card'); if (card && typeof card[1] !== 'string') { R.card = card[1]; R.cardUrl = URL.createObjectURL(card[1]); }
      for (const p of it.parts.filter(p => p[0] === 'photo' && typeof p[1] !== 'string')) { R.photos.push(p[1]); R.urls.push(URL.createObjectURL(p[1])); }
      R.err = { mobile: it.refused }; location.hash = '#/lead'; render(); },
    'lead-save': saveLead,
    'lead-restart': () => { const R = S.lead; if (R) { R.urls.forEach(u => URL.revokeObjectURL(u)); if (R.cardUrl) URL.revokeObjectURL(R.cardUrl); } S.lead = newLead(); render(); window.scrollTo(0, 0); },
    'lead-pick': el => { const R = S.lead, p = R.rows[+el.dataset.i]; if (!p) return; R.pick = p; R.name = p.name || ''; R.mobile = String(p.mobile || '').replace(/^\+91/, ''); R.alt = String(p.alt_mobile || '').replace(/^\+91/, ''); R.email = p.email || ''; R.city = p.city || ''; R.locality = p.locality || ''; R.role = p.role || ''; if (p.firm) R.firm = p.firm; delete R.err.find; clrFilled(R); render(); },
    'lead-pick-keep': () => {}, 'lead-unlink': () => { S.lead.pick = null; S.lead.fixN = S.lead.fixN || 0; S.lead.unlinked = true; render(); const i = qs('[data-lq="q"]'); if (i) i.focus(); },
    'lead-new': () => { const R = S.lead, t = R.q.trim(); R.nc = true; R.pick = null; delete R.err.find; if (t) { if (/^[\d\s+]+$/.test(t)) R.mobile = t.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''); else R.name = t; } clrFilled(R); render(); },
    'lead-role': el => { const R = S.lead; R.role = el.dataset.v; R.rq = ''; delete R.err.role; render(); }, 'lead-role-x': () => { S.lead.role = ''; render(); const i = qs('#fl-role'); if (i) i.focus(); },
    'lead-nc-x': () => { const R = S.lead; R.nc = false; R.role = ''; R.rq = ''; R.ffirm = null; R.fq = ''; render(); },
    'lead-ffirm': el => { const R = S.lead, f = R.frows[+el.dataset.i]; if (f) { R.ffirm = f; render(); } }, 'lead-ffirm-x': () => { S.lead.ffirm = null; render(); }, 'lead-photo-x': el => { const R = S.lead, i = +el.dataset.i; URL.revokeObjectURL(R.urls[i]); R.photos.splice(i, 1); R.urls.splice(i, 1); render(); },
    'lead-card-x': () => { const R = S.lead; if (R.cardUrl) URL.revokeObjectURL(R.cardUrl); R.card = null; R.cardUrl = ''; render(); },
    'req-pick': el => { const R = S.req, x = pickables().find(p => p.id === el.dataset.id); if (!x) return; R.pick = x; R.kind = KIND_DEF[x.kind] || 'consumer'; if (B.user.division === 'retail' && R.kind === 'dealer') R.kind = 'consumer'; delete R.err.who; render(); },
    'req-photo-x': el => { const R = S.req, i = +el.dataset.i; URL.revokeObjectURL(R.urls[i]); R.photos.splice(i, 1); R.urls.splice(i, 1); render(); },
    'req-card-x': () => { const R = S.req; if (R.cardUrl) URL.revokeObjectURL(R.cardUrl); R.card = null; R.cardUrl = ''; render(); },
    'req-save': saveReq,
    'ask-pick': el => { const A = S.ask, x = pickables().find(p => p.id === el.dataset.id); if (!x) return; A.pick = x; delete A.err.who; render(); },
    'ask-photo-x': el => { const A = S.ask, i = +el.dataset.i; URL.revokeObjectURL(A.urls[i]); A.photos.splice(i, 1); A.urls.splice(i, 1); render(); },
    'ask-save': saveAsk,
    'sdr-save': saveSdr, 'sdr-give-save': saveGive,
    'sdr-give': () => { S.sdr.give = { lines: [newGline()], photos: [], urls: [], err: {} }; render(); window.scrollTo(0, 0); },
    'sdr-give-x': () => { const G = S.sdr && S.sdr.give; if (G) G.urls.forEach(u => URL.revokeObjectURL(u)); if (S.sdr) S.sdr.give = null; render(); },
    'sdr-gline-add': () => { S.sdr.give.lines.push(newGline()); render(); },
    'sdr-gline-x': el => { S.sdr.give.lines.splice(+el.dataset.i, 1); S.sdr.give.err = {}; render(); },
    'sdr-gphoto-x': el => { const G = S.sdr.give, i = +el.dataset.i; URL.revokeObjectURL(G.urls[i]); G.photos.splice(i, 1); G.urls.splice(i, 1); render(); },
    'sdr-pshare': async el => { const p = Object.values(SDRX().photos || {}).flat().find(x => x.id === el.dataset.id); if (!p) return; try { if (navigator.share) await navigator.share({ title: p.type, url: p.url }); else window.open('https://wa.me/?text=' + encodeURIComponent(`${p.type}: ${p.url}`), '_blank'); } catch (e) {} },
    'sdr-photo-x': el => { const X = S.sdr, k = el.dataset.line, i = +el.dataset.i; URL.revokeObjectURL(X.urls[k][i]); X.photos[k].splice(i, 1); X.urls[k].splice(i, 1); render(); },
    board: () => { const b = qs('#fd-board'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    undo: async el => { const n = +el.dataset.n; if (!Q.items.some(x => x.n === n)) { toast('<b>Already sent.</b> It cannot be taken back here.'); return; } await qDel(n); await qLoad(); setField(S.base); render(); toast('<b>Taken back.</b> Nothing was sent.'); },
    'inst-skip': () => { instSkip = true; try { sessionStorage.setItem('ego-inst-skip', '1'); } catch (e) {} if (location.hash !== '#/today') location.hash = '#/today'; render(); },
    'inst-go': async () => { const p = window.__egoBIP; if (!p) { S.instMenu = true; render(); return; } window.__egoBIP = null; try { p.prompt(); await p.userChoice; } catch (e) {} S.instMenu = true; render(); },
    'inst-copy': () => { const u = location.origin + location.pathname; const ok = () => toast('<b>Link copied.</b> Open Safari, paste it in the address bar.');
      try { navigator.clipboard.writeText(u).then(ok, () => toast(`Copy this link: <b>${esc(u)}</b>`)); } catch (e) { toast(`Copy this link: <b>${esc(u)}</b>`); } },
    team: () => { try { sessionStorage.setItem('ego-team', '1'); } catch (e) {} location.hash = '#/home'; location.reload(); },
    out: () => { if (Q.items.length && !confirm(`${Q.items.length} entr${Q.items.length === 1 ? 'y is' : 'ies are'} still waiting to send. Signing out keeps them on this phone for your next sign-in. Sign out?`)) return; window.EGOAPI.signOut(); },
  };
  /* R4: "About N boxes with X% wastage", from THE quantity rule (qtyLine) and the category's typical box size (the middle
     of its collections' sq ft per box). Hidden when the category is not sold per sq ft or no collection has a box size. */
  const typicalBox = cat => { const xs = ((B.inventory || {}).collections || []).filter(c => c.category === cat).map(c => Number((c.extra || {}).sqft_per_box) || 0).filter(x => x > 0).sort((a, b) => a - b); return xs.length ? xs[Math.floor((xs.length - 1) / 2)] : 0; };
  /* T3 19 Oct: several categories = one area for the whole site, so no single boxes figure: it is worked out per category on the opportunity */
  const reqBoxes = R => { const sq = Number(String(R.sqft || '').replace(/[,\s]/g, '')), rules = (B.lists || {}).rules || (window.D && D.lists && D.lists.rules) || {}, w = wastageDefault(rules), cs = R.cats || [];
    if (cs.length > 1) return `<div class="fd-note">${ic('info-circle')}<span>Boxes are worked out per category on the opportunity.</span></div>`;
    const cat = cs[0]; if (!cat || !(sq > 0) || catUnit(cat, rules) !== 'sqft') return ''; const q = qtyLine({ unit: 'sqft', sqft_need: sq, wastage_pct: w, per_box: typicalBox(cat) });
    return q.error ? '' : `<span class="fd-help">About ${q.boxes.toLocaleString('en-IN')} boxes with ${w}% wastage</span>`; };
  function start(boot) {
    B = boot;
    document.body.classList.remove('gated'); document.body.classList.add('fd-on');
    if (window.VOICE) VOICE.toast = m => toast(esc(m));   /* B1: voice typing speaks through this app's own toast */
    qs('#gate').innerHTML = '';
    try { const t = localStorage.getItem('ego-theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
    /* Add to home screen: the manifest, icon and app-capable tags are static in index.html (T3, 19 Oct), so iOS reads them before any script */
    if (!root) {
      root = document.createElement('div'); root.className = 'fd'; root.id = 'fd';
      document.body.insertBefore(root, qs('#overlay'));
      document.addEventListener('click', e => { const el = e.target.closest('[data-fa]'); if (el && A[el.dataset.fa]) { e.preventDefault(); A[el.dataset.fa](el, e); } });
      document.addEventListener('change', e => {
        if (e.target.matches('[data-fa-file]')) { const f = e.target.files[0]; if (f) setShot(f); }
        if (e.target.name === 'fd-out') document.querySelectorAll('.fd-sheet [data-if]').forEach(x => { x.hidden = x.dataset.if !== e.target.value; });
        if (e.target.id === 'fd-vphoto') { const n = qs('[data-photo-n]'); if (n) n.textContent = e.target.files[0] ? '1 photo' : 'Photo'; }
        if (e.target.name === 'fd-who' && S.req) { S.req.who = e.target.value; S.req.err = {}; if (e.target.value === 'new' && S.req.kind === 'dealer' && B.user.division === 'retail') S.req.kind = 'consumer'; render(); }
        if (e.target.name === 'fd-kind' && S.req) { S.req.kind = e.target.value; delete S.req.err.kind; }
        if (e.target.name === 'fd-cats' && S.req) { S.req.cats = MSEL.val(e.target.closest('.msel')); { const h = qs('[data-req-boxes]'); if (h) h.innerHTML = reqBoxes(S.req); } if (S.req.cats.length) { delete S.req.err.cat; const f = e.target.closest('.fd-field'); if (f) { f.classList.remove('has-err'); const x = f.querySelector('.msel-err'); if (x) x.remove(); } } }
        if (e.target.name === 'fd-tl' && S.req) S.req.timeline = e.target.value;
        if (S.lead && e.target.dataset && e.target.dataset.lch) { S.lead[e.target.dataset.lch] = e.target.value; delete S.lead.err[e.target.dataset.lch]; if (e.target.dataset.lch === 'type' || e.target.dataset.lch === 'wsas') render(); }
        if (e.target.name === 'fd-lcats' && S.lead) S.lead.cats = MSEL.val(e.target.closest('.msel'));
        if (S.lead && e.target.dataset && e.target.dataset.leadFile) { const R = S.lead, fs = [...e.target.files];
          if (e.target.dataset.leadFile === 'card' && fs[0]) { if (R.cardUrl) URL.revokeObjectURL(R.cardUrl); R.card = fs[0]; R.cardUrl = URL.createObjectURL(fs[0]); }
          if (e.target.dataset.leadFile === 'photos') for (const f of fs.slice(0, 20 - R.photos.length)) { R.photos.push(f); R.urls.push(URL.createObjectURL(f)); }
          render(); }
        if (e.target.name === 'fd-rf') { S.rf = e.target.value; render(); }
        if (e.target.name === 'fd-af') { S.af = e.target.value; render(); }
        if (e.target.name === 'fd-askk' && S.ask) { S.ask.what = e.target.value; delete S.ask.err.what; render(); }
        if (e.target.matches('[data-ask-file]') && S.ask) { const A = S.ask; for (const f of [...e.target.files].slice(0, 10 - A.photos.length)) { A.photos.push(f); A.urls.push(URL.createObjectURL(f)); } render(); }
        if (e.target.dataset && e.target.dataset.reqFile && S.req) { const R = S.req, fs = [...e.target.files];
          if (e.target.dataset.reqFile === 'card' && fs[0]) { if (R.cardUrl) URL.revokeObjectURL(R.cardUrl); R.card = fs[0]; R.cardUrl = URL.createObjectURL(fs[0]); }
          if (e.target.dataset.reqFile === 'photos') for (const f of fs.slice(0, 20 - R.photos.length)) { R.photos.push(f); R.urls.push(URL.createObjectURL(f)); }
          render(); }
        if (S.sdr && e.target.name && e.target.name.startsWith('sdrc-')) { const k = e.target.name.slice(5); S.sdr.cond[k] = e.target.value; delete S.sdr.err[k]; delete S.sdr.err.all; render(); }
        if (S.sdr && e.target.dataset.sdrFile) { const X = S.sdr, k = e.target.dataset.sdrFile; X.photos[k] = X.photos[k] || []; X.urls[k] = X.urls[k] || []; for (const f of [...e.target.files].slice(0, 10 - X.photos[k].length)) { X.photos[k].push(f); X.urls[k].push(URL.createObjectURL(f)); } render(); }
        if (S.sdr && S.sdr.give && e.target.matches('[data-sdr-gfile]')) { const G = S.sdr.give; for (const f of [...e.target.files].slice(0, 10 - G.photos.length)) { G.photos.push(f); G.urls.push(URL.createObjectURL(f)); } render(); }
        if (S.sdr && S.sdr.give && e.target.tagName === 'SELECT' && e.target.dataset.sg) { const l = S.sdr.give.lines[+e.target.dataset.i]; l[e.target.dataset.sg] = e.target.value; if (e.target.dataset.sg === 'category') l.product_id = ''; render(); }
        if (e.target.name === 'fd-th') { document.documentElement.dataset.theme = e.target.value; try { localStorage.setItem('ego-theme', e.target.value); } catch (x) {} }
      });
      document.addEventListener('ego-bip', () => { if (needInstall()) render(); });
      window.addEventListener('hashchange', e => { S.sheet = '';
        /* F2 L-7: a half-filled lead left behind reopens marked "Started earlier", with Start again */
        if (S.lead && /#\/lead(\/|$)/.test(new URL(e.oldURL || location.href).hash) && route() !== 'lead' && leadTyped(S.lead)) S.lead.earlier = true; S.pick = location.hash === '#/new'; if (S.pick) history.replaceState(null, '', '#/today'); if (S.sdr && route() !== 'sdr') S.sdr = null; render(); window.scrollTo(0, 0); });
      /* typing in + Requirement is kept as it is typed, without drawing the screen again (the search redraws only its list) */
      document.addEventListener('input', e => { const d = e.target.dataset || {}; if (!S.sdr) return;
        if (d.sdrRem) { S.sdr.rem[d.sdrRem] = e.target.value; if (e.target.value.trim() && S.sdr.err[d.sdrRem]) { delete S.sdr.err[d.sdrRem]; const f = e.target.closest('.fd-field'); if (f) { f.classList.remove('has-err'); const x = f.querySelector('.fd-err'); if (x) x.remove(); } } return; }
        if (d.sg && S.sdr.give && e.target.tagName === 'INPUT') { const G = S.sdr.give, l = G.lines[+d.i]; l[d.sg] = e.target.value;
          const t = qs(`[data-gtot="${d.i}"]`); if (t) t.textContent = 'Total ' + inr((Number(l.qty) || 0) * (Number(l.unit_cost) || 0));
          const sm = qs('[data-gsum] b'); if (sm) sm.textContent = inr(G.lines.reduce((a, x) => a + (Number(x.qty) || 0) * (Number(x.unit_cost) || 0), 0)); } });
      document.addEventListener('input', e => { const a = e.target.dataset && e.target.dataset.ask; if (a && S.ask) { S.ask[a] = e.target.value; if (a === 'q') { const p = qs('[data-ask-picks]'); if (p) p.innerHTML = askPicksHtml(); } return; } });
      document.addEventListener('input', e => { const lq = e.target.dataset && e.target.dataset.lq; if (lq && S.lead) { S.lead[lq] = e.target.value; if (lq === 'rq') { const p = qs('[data-lead-rpicks]'); if (p) p.innerHTML = leadRolesHtml(); } else leadFind(lq); } });   // L-fix: Find a person and the New contact Firm box
      document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.ld; if (k && S.lead) { S.lead[k] = e.target.value; if (S.lead.err[k] && e.target.value.trim()) { delete S.lead.err[k]; const f = e.target.closest('.fd-field'); if (f) { f.classList.remove('has-err'); const x = f.querySelector('.fd-err'); if (x) x.remove(); } } } });
      document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.req; if (!k || !S.req) return; S.req[k] = e.target.value; if (k === 'sqft') { const h = qs('[data-req-boxes]'); if (h) h.innerHTML = reqBoxes(S.req); } if (k === 'q') { const p = qs('[data-picks]'); if (p) p.innerHTML = picksHtml(); } });
      /* a picked photo that will not draw shows as a file tile with its name, never a broken image */
      document.addEventListener('error', e => { const t = e.target; if (t && t.tagName === 'IMG' && t.closest && t.closest('[data-askform] .fd-thumb')) { t.closest('.fd-thumb').classList.add('is-file'); t.remove(); } }, true);
      document.addEventListener('toggle', e => { if (e.target.classList && e.target.classList.contains('fd-more')) { if (route() === 'lead' && S.lead) S.lead.more = e.target.open; else if (S.req) S.req.more = e.target.open; } }, true);
      /* weak network: send what waits when signal returns, every 30 s, and show the banner when it goes */
      window.addEventListener('online', () => { paintBanner(); flush(); });
      window.addEventListener('offline', () => paintBanner());
      setInterval(flush, 30000);
      /* the Roadmap may change on the desktop while the phone is open: read it again when the app comes back */
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !S.cam && !S.sheet && !['req', 'lead', 'raise', 'sdr'].includes(route())) API('GET', '/api/field/me').then(r => { setField(r.field); render(); }).catch(() => {}); });
      /* the app opens with no signal: a service worker keeps the page files (sw.js) */
      if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    if (!location.hash || location.hash === '#/home') history.replaceState(null, '', '#/today');
    S.base = JSON.parse(JSON.stringify(B.field || {}));
    render();
    qLoad().then(() => { setField(S.base); render(); flush(); }).catch(() => {});
  }
  window.EGOFIELD = { start, refresh: b => { B = b; setField(b.field); render(); }, flush, queue: () => Q.items.length };
})();
