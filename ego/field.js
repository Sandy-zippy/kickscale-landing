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
  const S = { cam: null, camErr: '', stream: null, shot: null, shotUrl: '', gps: null, confirm: null, sheet: '', busy: false, base: null, req: null, rf: 'all' };
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
  const Q = { items: [], busy: false, mem: [] };
  const newKey = () => (crypto.randomUUID ? crypto.randomUUID() : [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join(''));
  let idbP = null;
  const idb = () => idbP || (idbP = new Promise(ok => { try { const r = indexedDB.open('ego-field', 1); r.onupgradeneeded = () => r.result.createObjectStore('q', { keyPath: 'n', autoIncrement: true }); r.onsuccess = () => ok(r.result); r.onerror = () => ok(null); } catch (e) { ok(null); } }));
  const store = async (mode, fn) => { const db = await idb(); if (!db) return fn(null); return new Promise((ok, bad) => { const tx = db.transaction('q', mode), st = tx.objectStore('q'); let out; const r = fn(st); if (r) r.onsuccess = () => { out = r.result; }; tx.oncomplete = () => ok(out); tx.onerror = () => bad(tx.error); }); };
  const qAll = async () => { const db = await idb(); if (!db) return Q.mem.slice(); return (await store('readonly', st => st.getAll())) || []; };
  const qAdd = async it => { const db = await idb(); if (!db) { it.n = (Q.mem.length ? Q.mem[Q.mem.length - 1].n : 0) + 1; Q.mem.push(it); return it.n; } return store('readwrite', st => st.add(it)); };
  const qDel = async n => { const db = await idb(); if (!db) { Q.mem = Q.mem.filter(x => x.n !== n); return; } return store('readwrite', st => st.delete(n)); };
  const qLoad = async () => { Q.items = (await qAll().catch(() => [])).filter(x => x.user === B.user.id).sort((a, b) => a.n - b.n); };
  /* what a waiting entry does to the screen until it is sent */
  function applyOp(f, op) {
    const v = op.id && (f.visits || []).find(x => x.id === op.id);
    if (op.type === 'start' && !f.attendance) f.attendance = { start_at: op.at, late_min: Math.max(0, (d => d.getUTCHours() * 60 + d.getUTCMinutes())(ist(op.at)) - startMin()), start_noloc: !op.gps, start_photo: '', end_at: '', waiting: true };
    if (op.type === 'end' && f.attendance && !f.attendance.end_at) { f.attendance.end_at = op.at; (f.visits || []).forEach(x => { if (x.status === 'planned') x.status = 'missed'; }); }
    if (op.type === 'checkin' && v && v.status === 'planned') Object.assign(v, { status: 'in', checkin_at: op.at, checkin_noloc: !op.gps, checkin_lat: op.gps && op.gps.lat, checkin_lng: op.gps && op.gps.lng, checkin_acc: op.gps && op.gps.acc, waiting: true });
    if (op.type === 'outcome' && v && (v.status === 'in' || v.status === 'done')) Object.assign(v, { status: 'done', outcome: op.outcome, note: op.note || '', extra: { ...(v.extra || {}), boxes: op.boxes, follow_on: op.follow_on }, waiting: true });
    if (op.type === 'req' && !(f.reqs || []).some(r => r.key === op.key)) f.reqs = [{ ...op.ghost, key: op.key, waiting: true, created_at: op.at }, ...(f.reqs || [])];
  }
  /* a fresh copy of the day from the server, with every waiting entry laid over it */
  function setField(f) { if (!f) return; S.base = JSON.parse(JSON.stringify(f)); const x = JSON.parse(JSON.stringify(f)); for (const it of Q.items) applyOp(x, it.op); B.field = x; saveBoot(); }
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
        catch (e) { if (e.offline || !e.status || e.status >= 500) break; await qDel(it.n); toast(`<b>Not sent: ${esc(it.label)}.</b> ${esc(e.message)}`); }   // the server said no: sending it again would never work
      }
    } finally {
      Q.busy = false; await qLoad();
      if (sent) { try { const r = await API('GET', '/api/field/me'); S.base = r.field; } catch (e) {} toast(`<b>Sent: ${sent} entr${sent === 1 ? 'y' : 'ies'}</b>`); }
      setField(S.base || B.field); if (!S.cam && !S.sheet && route() !== 'req') render(); else paintBanner();
    }
  }
  const banner = () => { const n = Q.items.length, off = navigator.onLine === false; return !n && !off ? '' : `<div class="fd-offline" role="status">${ic('wifi-off')}<span><b>${off ? 'No signal.' : 'Sending.'}</b> Saved on this phone, will send when signal returns.</span>${n ? `<span class="fd-pill">${n}</span>` : ''}</div>`; };
  const paintBanner = () => { const el = qs('.fd-offline'), html = banner(); if (el) { if (html) el.outerHTML = html; else el.remove(); } else if (html) { const v = qs('.fd-view'); if (v) v.insertAdjacentHTML('afterbegin', html); } };

  /* ---- top bar and bottom bar */
  const hello = () => { const h = ist().getUTCHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
  const top = (title, sub, right) => `<header class="fd-top"><div class="fd-hello"><b>${esc(title)}</b><span>${esc(sub)}</span></div>${Q.items.length ? `<span class="fd-sync">${ic('cloud-upload')}${Q.items.length} waiting</span>` : right || `<span class="fd-avatar" aria-label="${esc(B.user.name)}">${esc(initials(B.user.name))}</span>`}</header>`;
  /* the bar is exactly Today . Visits . + Requirement . My numbers . Me; an item shows once its screen works (R2b turns on the two) */
  const NAV = [['today', 'sun', 'Today', true], ['visits', 'route', 'Visits', true], ['req', 'plus', 'Requirement', true], ['numbers', 'chart-donut-3', 'My numbers', true], ['me', 'user-circle', 'Me', true]];
  const nav = on => `<nav class="fd-nav" aria-label="Field app">${NAV.filter(n => n[3]).map(([k, i, l]) => { const add = k === 'req', left = vis().filter(v => v.status === 'planned').length;
    return `<a href="#/${k}" class="${add ? 'fd-add' : ''}${on === k ? ' on' : ''}"${on === k ? ' aria-current="page"' : ''}><span class="fd-ind">${ic(i)}</span>${add ? `<span><span class="fd-sr">+ </span>${l}</span>` : l}${k === 'visits' && left ? `<em class="fd-count">${left}</em>` : ''}</a>`; }).join('')}</nav>`;

  /* ---- a visit card (Today) and a visit row (Visits) */
  const checkBtn = (v, primary) => !started() ? `<button class="fd-btn" disabled>${ic('map-pin-check')}Check in</button>` : ended() ? '' : `<button class="fd-btn${primary ? ' primary' : ''}" data-fa="checkin" data-id="${v.id}">${ic('map-pin-check')}Check in</button>`;
  const dirBtn = v => `<a class="fd-btn" href="${esc(v.directions)}" target="_blank" rel="noopener">${ic('navigation')}Directions</a>`;
  const where = v => v.address || v.area || '';   // the saved address already ends with the city
  const outLine = v => [v.outcome, v.extra && v.extra.boxes != null ? `${v.extra.boxes} boxes` : '', v.extra && v.extra.follow_on ? `follow-up ${v.extra.follow_on}` : '', v.note].filter(Boolean).join(' · ');
  function visitRow(v, n) {
    const isNext = nextV() && v.id === nextV().id, st = v.status === 'done' ? 'done' : v.status === 'missed' ? 'missed' : v.status === 'in' ? 'in' : isNext ? 'next' : 'pending';
    const pill = st === 'done' ? `<span class="fd-pill ok">Done ${hm(v.checkin_at)}</span>` : st === 'missed' ? '<span class="fd-pill bad">Missed</span>' : st === 'in' ? `<span class="fd-pill ok">${ic('map-pin-check')}Checked in ${hm(v.checkin_at)}</span>` : st === 'next' ? '<span class="fd-pill ink">Next</span>' : '';
    const acts = st === 'next' || st === 'pending' ? `<div class="fd-acts">${dirBtn(v)}${checkBtn(v, st === 'next')}</div>` : st === 'in' ? `<div class="fd-acts"><button class="fd-btn primary" data-fa="sheet" data-id="${v.id}">${ic('pencil')}How did it go</button></div>` : '';
    return `<li class="fd-visit is-${st}" data-visit="${v.id}"><span class="fd-n" aria-label="Visit ${n}">${st === 'done' ? ic('check') : st === 'missed' ? ic('x') : n}</span><div class="fd-body">
      <div class="fd-row between">${kind(v.kind)}${pill}</div><div class="fd-name">${esc(v.name)}</div><div class="fd-meta">${esc(where(v))}${v.mobile ? ` · <a href="tel:${esc(v.mobile)}">${esc(v.mobile)}</a>` : ''}</div>
      ${st === 'done' ? `<div class="fd-out">${esc(outLine(v))}</div>` : st === 'missed' ? `<div class="fd-out fd-meta">Not checked in by the end of the day. Your manager can see it.</div>` : ''}${acts}</div></li>`;
  }

  /* ---- + Requirement helpers */
  const REQK = { dealer: 'Dealer order', consumer: 'Homeowner', project: 'Project' };
  const KIND_OK = { distributor: ['dealer', 'project'], dealer: ['dealer', 'project'], sub_dealer: ['dealer', 'project'], architect: ['dealer', 'project'], design_firm: ['dealer', 'project'], direct: ['dealer', 'consumer', 'project'], retail: ['consumer', 'project'], project: ['project'] };
  const KIND_DEF = { distributor: 'dealer', dealer: 'dealer', sub_dealer: 'dealer', architect: 'project', design_firm: 'project', direct: 'consumer', retail: 'consumer', project: 'project' };
  const VKIND = { distributor: 'distributor', dealer: 'dealer', sub_dealer: 'sub_dealer', architect: 'architect', design_firm: 'architect', direct: 'retailer', retail: 'retailer', project: 'project' };
  const newReq = () => ({ who: 'existing', q: '', pick: null, kind: 'consumer', cat: '', sqft: '', photos: [], urls: [], card: null, cardUrl: '', name: '', mobile: '', area: '', budget: '', site: '', timeline: '', note: '', more: false, visit: '', visitName: '', err: {} });
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
  async function saveReq(el) {
    const R = S.req, e = {}, mob = R.mobile.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    if (R.who === 'existing' && !R.pick) e.who = 'Pick who this is for';
    if (R.who === 'new') { if (!R.name.trim()) e.name = 'Fill in the name'; if (!/^[6-9]\d{9}$/.test(mob)) e.mobile = 'A mobile has 10 digits'; if (!R.area.trim()) e.area = 'Fill in the area'; }
    if (reqKinds().some(([k, , off]) => k === R.kind && off) || !REQK[R.kind]) e.kind = 'Choose what it is';
    if (!R.cat) e.cat = 'Choose the category';
    const sq = R.sqft.replace(/[,\s]/g, ''); if (sq && !(Number(sq) > 0)) e.sqft = 'sq ft is a number';
    const bud = R.budget.replace(/[,\s]/g, ''); if (bud && !(Number(bud) >= 0)) e.budget = 'Budget is a number';
    R.err = e; if (Object.keys(e).length) { render(); const f = qs('.fd-field.has-err'); if (f) f.scrollIntoView({ block: 'center' }); return; }
    const fd = new FormData();
    fd.append('kind', R.kind); fd.append('category', R.cat); fd.append('sq_ft', sq); fd.append('budget', bud); fd.append('site', R.site); fd.append('timeline', R.timeline); fd.append('note', R.note);
    if (R.visit) fd.append('visit_id', R.visit);
    if (R.who === 'existing') fd.append(R.pick.t === 'project' ? 'project_id' : 'client_id', R.pick.id); else { fd.append('name', R.name.trim()); fd.append('mobile', mob); fd.append('area', R.area.trim()); }
    if (R.who === 'new' && R.card) fd.append('card', R.card, R.card.name || 'card.jpg');
    R.photos.forEach((f, i) => fd.append('photo', f, f.name || `site-${i + 1}.jpg`));
    const name = R.who === 'existing' ? R.pick.name : R.name.trim();
    R.busy = true; render();
    try {
      const w = await write('/api/field/req', fd, { type: 'req', ghost: { c_name: name, category: R.cat, area_sqft: sq ? Math.round(Number(sq)) : null, kind: R.kind } }, `Requirement · ${name}`);
      R.urls.forEach(u => URL.revokeObjectURL(u)); if (R.cardUrl) URL.revokeObjectURL(R.cardUrl); S.req = null; S.rf = 'all';
      location.hash = '#/requirements'; render();
      toast(w.queued ? '<b>Saved on this phone.</b> It will send when signal returns.' : `<b>Requirement saved.</b> With ${esc(w.r.owner)} in telesales.`, w.queued ? w.n : undefined);
    } catch (x) { R.busy = false; R.err = { all: x.message }; render(); }
  }

  /* ---- screens */
  const V = {
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
          <div class="fd-btns">${dirBtn(nx)}${checkBtn(nx, true)}</div>${started() ? '' : '<div class="fd-meta">Start my day first, then Check in opens.</div>'}</div>` : ''}</main>`;
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
        <div class="fd-field${e.cat ? ' has-err' : ''}"><span class="fd-label">Category</span><div class="fd-chips" role="radiogroup">${(B.lists.categories || []).map(c => `<label class="fd-chip"><input type="radio" name="fd-cat" value="${esc(c)}" ${R.cat === c ? 'checked' : ''}>${esc(c)}</label>`).join('')}</div>${fe('cat')}</div>
        <div class="fd-field${e.sqft ? ' has-err' : ''}"><label for="fr-sq">Area</label><div class="fd-adorn"><input class="fd-input" id="fr-sq" data-req="sqft" inputmode="numeric" value="${esc(R.sqft)}"><span class="fd-suf">sq ft</span></div>${fe('sqft')}</div>
        <div class="fd-field"><span class="fd-label">Site photos</span><div class="fd-photos">${R.photos.map((f, i) => `<div class="fd-thumb"><img src="${R.urls[i]}" alt="Site photo ${i + 1}"><button type="button" aria-label="Remove photo" data-fa="req-photo-x" data-i="${i}">${ic('x')}</button></div>`).join('')}<label class="fd-photo-add">${ic('camera')}Add<input type="file" accept="image/*" capture="environment" multiple data-req-file="photos"></label></div></div>
        <details class="fd-more"${R.more ? ' open' : ''}><summary>More details: budget, site, timeline${ic('chevron-down')}</summary><div class="fd-form">
          <div class="fd-field${e.budget ? ' has-err' : ''}"><label for="fr-bud">Budget</label><div class="fd-adorn"><span class="fd-pre">₹</span><input class="fd-input" id="fr-bud" data-req="budget" inputmode="numeric" value="${esc(R.budget)}"><span class="fd-suf">/-</span></div>${fe('budget')}</div>
          <div class="fd-field"><label for="fr-site">Site</label><input class="fd-input" id="fr-site" data-req="site" value="${esc(R.site)}" maxlength="300"></div>
          <div class="fd-field"><span class="fd-label">Timeline</span><div class="fd-chips">${['This month', '1 to 3 months', 'Later'].map(t => `<label class="fd-chip"><input type="radio" name="fd-tl" value="${t}" ${R.timeline === t ? 'checked' : ''}>${t}</label>`).join('')}</div></div>
          <div class="fd-field"><label for="fr-note">Note</label><textarea class="fd-input" id="fr-note" data-req="note" placeholder="Optional" maxlength="2000">${esc(R.note)}</textarea></div></div></details>
        <span class="fd-err" role="alert">${esc(e.all || '')}</span>
        <div class="fd-savebar"><button type="button" class="fd-btn primary lg block" data-fa="req-save"${R.busy ? ' aria-busy="true" disabled' : ''}>Save Requirement</button></div></form></main>`;
    },
    /* P6 My requirements: what happened to each, newest first */
    requirements() {
      const R = F().reqs || [], open = r => !r.won && !r.lost, f = S.rf;
      const cnt = { all: R.length, tele: R.filter(open).length, won: R.filter(r => r.won).length, lost: R.filter(r => r.lost).length };
      const show = R.filter(r => f === 'tele' ? open(r) : f === 'won' ? r.won : f === 'lost' ? r.lost : true);
      const row = r => { const steps = r.waiting ? 0 : r.won ? 4 : r.step || 0;
        const pill = r.waiting ? `<span class="fd-pill warn">${ic('cloud-upload')}Waiting</span>` : r.won ? `<span class="fd-pill ok">${ic('trophy')}Turned into sale</span>` : r.lost ? '<span class="fd-pill bad">Lost</span>' : `<span class="fd-pill">Step ${steps} of 4</span>`;
        const last = r.waiting ? [ic('wifi-off'), 'Saved on this phone, will send when signal returns']
          : r.won ? [ic('circle-check'), `${r.stage} ${dayShort(r.closed_at || r.created_at)}${r.won_value != null ? ` · ₹${Math.round(r.won_value).toLocaleString('en-IN')}` : ''}${r.dealer_name ? ` · ${r.dealer_name}` : ''}`]
          : r.lost ? [ic('circle-x'), `Reason: ${r.lost_reason || 'not given'}${r.lost_detail ? '. ' + r.lost_detail : ''}`]
          : [ic(r.dealer_name ? 'building-store' : 'phone'), `${r.step_label}${r.dealer_name ? `: ${r.dealer_name}` : ''}. Now at ${r.stage}, with ${r.owner_name}${r.last ? ` since ${dayShort(r.last.at)}` : ''}`];
        return `<div class="fd-req${r.won ? ' is-won' : r.lost ? ' is-lost' : ''}"><div class="fd-row between"><span class="fd-name">${esc(r.c_name)}</span>${pill}</div>
          <div class="fd-what">${esc([r.category, r.area_sqft != null ? `${Number(r.area_sqft).toLocaleString('en-IN')} sq ft` : '', REQK[r.kind] || ''].filter(Boolean).join(' · '))}</div>
          <div class="fd-track">${[0, 1, 2, 3].map(i => `<i class="${i < steps ? 'done' : ''}"></i>`).join('')}</div><div class="fd-last">${last[0]}<span>${esc(last[1])}</span></div></div>`; };
      return top('My requirements', `${R.length} saved`, `<a class="fd-sync" href="#/req">${ic('plus')}New</a>`) + `<main class="fd-view">
        <div class="fd-filter">${[['all', 'All'], ['tele', 'With telesales'], ['won', 'Turned into sale'], ['lost', 'Lost']].map(([k, l]) => `<label class="fd-chip"><input type="radio" name="fd-rf" value="${k}" ${f === k ? 'checked' : ''}>${l} ${cnt[k]}</label>`).join('')}</div>
        ${show.length ? `<div class="fd-reqs">${show.map(row).join('')}</div>` : `<div class="fd-card"><b>${R.length ? 'None here' : 'No Requirements yet'}</b><div class="fd-meta" style="margin-top:6px">${R.length ? 'Pick another filter above.' : 'Save one with + Requirement at a visit. It goes straight to telesales, and what happens to it shows here.'}</div></div>`}</main>`;
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
        <div class="fd-list">
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
      <div class="fd-field"><label for="fd-note">Note</label><input class="fd-input" id="fd-note" placeholder="Optional" maxlength="1000" value="${esc(v.note || '')}"></div>
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

  /* ---- render */
  const route = () => { const r = (location.hash || '#/today').split('/')[1] || 'today'; return V[r] && (NAV.some(n => n[0] === r && n[3]) || r === 'requirements') ? r : 'today'; };
  function render() {
    if (!root) return;
    if (S.cam && !S.confirm) { if (!qs('.fd-cam') || S.camErr !== (qs('.fd-cam').dataset.err || '')) { root.innerHTML = camHtml(); qs('.fd-cam').dataset.err = S.camErr; const v = qs('.fd-cam video'); if (v && S.stream) v.srcObject = S.stream; } return; }
    if (S.confirm) { root.innerHTML = confirmHtml(); return; }
    const r = route(), keep = qs('.fd-toast [data-fa="undo"]') && qs('.fd-toast');   // a toast with Undo outlives the screen being drawn again
    root.innerHTML = V[r]().replace('<main class="fd-view">', '<main class="fd-view">' + banner()) + nav(r === 'requirements' ? 'req' : r) + (S.sheet ? sheetHtml() : '');
    if (keep) root.appendChild(keep);
  }
  const A = {
    cam: el => openCam(el.dataset.mode), 'cam-x': () => { closeCam(); render(); }, shoot, retake: () => openCam(S.cam), send: sendDay, nophoto: () => setShot(null),
    checkin, sheet: el => { S.sheet = el.dataset.id; render(); }, 'sheet-x': () => { S.sheet = ''; render(); }, outcome: saveOutcome,
    'req-from': el => { reqFromVisit(el.dataset.id); S.sheet = ''; location.hash = '#/req'; render(); },
    'req-pick': el => { const R = S.req, x = pickables().find(p => p.id === el.dataset.id); if (!x) return; R.pick = x; R.kind = KIND_DEF[x.kind] || 'consumer'; if (B.user.division === 'retail' && R.kind === 'dealer') R.kind = 'consumer'; delete R.err.who; render(); },
    'req-photo-x': el => { const R = S.req, i = +el.dataset.i; URL.revokeObjectURL(R.urls[i]); R.photos.splice(i, 1); R.urls.splice(i, 1); render(); },
    'req-card-x': () => { const R = S.req; if (R.cardUrl) URL.revokeObjectURL(R.cardUrl); R.card = null; R.cardUrl = ''; render(); },
    'req-save': saveReq,
    board: () => { const b = qs('#fd-board'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    undo: async el => { const n = +el.dataset.n; if (!Q.items.some(x => x.n === n)) { toast('<b>Already sent.</b> It cannot be taken back here.'); return; } await qDel(n); await qLoad(); setField(S.base); render(); toast('<b>Taken back.</b> Nothing was sent.'); },
    team: () => { try { sessionStorage.setItem('ego-team', '1'); } catch (e) {} location.hash = '#/home'; location.reload(); },
    out: () => { if (Q.items.length && !confirm(`${Q.items.length} entr${Q.items.length === 1 ? 'y is' : 'ies are'} still waiting to send. Signing out keeps them on this phone for your next sign-in. Sign out?`)) return; window.EGOAPI.signOut(); },
  };
  function start(boot) {
    B = boot;
    document.body.classList.remove('gated'); document.body.classList.add('fd-on');
    qs('#gate').innerHTML = '';
    try { const t = localStorage.getItem('ego-theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
    /* Add to home screen: the field app's own name and icon (design/CONTRACT.txt) */
    const head = (tag, attrs) => { const el = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); document.head.appendChild(el); };
    head('link', { rel: 'manifest', href: 'field.webmanifest' }); head('link', { rel: 'apple-touch-icon', href: 'field-180.png' });
    head('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }); head('meta', { name: 'mobile-web-app-capable', content: 'yes' }); head('meta', { name: 'apple-mobile-web-app-title', content: 'EGO Field' });
    head('meta', { name: 'theme-color', content: '#F4F4F5', media: '(prefers-color-scheme: light)' }); head('meta', { name: 'theme-color', content: '#0A0A0B', media: '(prefers-color-scheme: dark)' });
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
        if (e.target.name === 'fd-cat' && S.req) { S.req.cat = e.target.value; delete S.req.err.cat; const f = e.target.closest('.fd-field'); if (f) { f.classList.remove('has-err'); const x = f.querySelector('.fd-err'); if (x) x.remove(); } }
        if (e.target.name === 'fd-tl' && S.req) S.req.timeline = e.target.value;
        if (e.target.name === 'fd-rf') { S.rf = e.target.value; render(); }
        if (e.target.dataset && e.target.dataset.reqFile && S.req) { const R = S.req, fs = [...e.target.files];
          if (e.target.dataset.reqFile === 'card' && fs[0]) { if (R.cardUrl) URL.revokeObjectURL(R.cardUrl); R.card = fs[0]; R.cardUrl = URL.createObjectURL(fs[0]); }
          if (e.target.dataset.reqFile === 'photos') for (const f of fs.slice(0, 20 - R.photos.length)) { R.photos.push(f); R.urls.push(URL.createObjectURL(f)); }
          render(); }
        if (e.target.name === 'fd-th') { document.documentElement.dataset.theme = e.target.value; try { localStorage.setItem('ego-theme', e.target.value); } catch (x) {} }
      });
      window.addEventListener('hashchange', () => { S.sheet = ''; render(); window.scrollTo(0, 0); });
      /* typing in + Requirement is kept as it is typed, without drawing the screen again (the search redraws only its list) */
      document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.req; if (!k || !S.req) return; S.req[k] = e.target.value; if (k === 'q') { const p = qs('[data-picks]'); if (p) p.innerHTML = picksHtml(); } });
      document.addEventListener('toggle', e => { if (e.target.classList && e.target.classList.contains('fd-more') && S.req) S.req.more = e.target.open; }, true);
      /* weak network: send what waits when signal returns, every 30 s, and show the banner when it goes */
      window.addEventListener('online', () => { paintBanner(); flush(); });
      window.addEventListener('offline', () => paintBanner());
      setInterval(flush, 30000);
      /* the Roadmap may change on the desktop while the phone is open: read it again when the app comes back */
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !S.cam && !S.sheet && route() !== 'req') API('GET', '/api/field/me').then(r => { setField(r.field); render(); }).catch(() => {}); });
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
