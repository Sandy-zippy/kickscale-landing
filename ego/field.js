'use strict';
/* EGO Master: the FIELD SALES APP (17 Oct 2026, R2a). Loaded instead of the team's app when a login's role opens
   the field app (Field Sales), the way portal.js is for dealers. Phone first, the patterns of design/CONTRACT.txt
   as they are. Today: Start my day / End my day with a selfie, the time and the GPS fix. Visits: today's Roadmap,
   Directions, Check in, how it went. Me: name, company, theme, Add to home screen, Sign out.
   + Requirement and My numbers are R2b: their tabs stay hidden until their screens work (never a shell). */
(function () {
  const API = window.EGOAPI.api;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const qs = s => document.querySelector(s);
  const ic = (n, cls) => `<svg class="${cls || 'fd-ic'}" aria-hidden="true"><use href="icons.svg#i-${n}"/></svg>`;
  let B = null, root = null;
  const S = { cam: null, camErr: '', stream: null, shot: null, shotUrl: '', gps: null, confirm: null, sheet: '', busy: false };
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
  function toast(html) {
    let t = qs('.fd-toast'); if (t) t.remove();
    t = document.createElement('div'); t.className = 'fd-toast'; t.setAttribute('role', 'status');
    t.innerHTML = `${ic('circle-check')}<span>${html}</span>`; (root || document.body).appendChild(t);
    clearTimeout(toast.t); toast.t = setTimeout(() => t.remove(), 3500);
  }

  /* ---- top bar and bottom bar */
  const hello = () => { const h = ist().getUTCHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
  const top = (title, sub, right) => `<header class="fd-top"><div class="fd-hello"><b>${esc(title)}</b><span>${esc(sub)}</span></div>${right || `<span class="fd-avatar" aria-label="${esc(B.user.name)}">${esc(initials(B.user.name))}</span>`}</header>`;
  /* the bar is exactly Today . Visits . + Requirement . My numbers . Me; an item shows once its screen works (R2b turns on the two) */
  const NAV = [['today', 'sun', 'Today', true], ['visits', 'route', 'Visits', true], ['req', 'plus', 'Requirement', false], ['numbers', 'chart-donut-3', 'My numbers', false], ['me', 'user-circle', 'Me', true]];
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
    me() {
      const boss = (B.staff || []).find(s => s.id === (B.staff.find(x => x.id === B.user.id) || {}).reports_to);
      const th = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      return top('Me', `${B.access.name} · ${CO[B.user.division] || ''}`) + `<main class="fd-view">
        <div class="fd-card fd-row"><span class="fd-avatar" style="width:56px;height:56px;font-size:18px">${esc(initials(B.user.name))}</span><span class="fd-grow"><b style="font-size:18px">${esc(B.user.name)}</b><span class="fd-meta" style="display:block">${esc(CO[B.user.division] || '')}${B.user.region ? ' · ' + esc(B.user.region) : ''}${boss ? ' · Manager: ' + esc(boss.name) : ''}</span></span></div>
        <div class="fd-list">
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
    try { const r = await API('POST', '/api/field/' + S.cam, fd, true); B.field = r.field; const mode = S.cam; closeCam(); location.hash = '#/today'; render(); toast(mode === 'start' ? `<b>Day started ${hm(att().start_at)}.</b> Check in is open.` : '<b>Day ended.</b> See you tomorrow.'); }
    catch (e) { S.busy = false; render(); toast(esc(e.message)); }
  }
  const closeCam = () => { stopCam(); S.cam = null; S.confirm = null; S.shot = null; S.busy = false; if (S.shotUrl) URL.revokeObjectURL(S.shotUrl); S.shotUrl = ''; };

  /* ---- Check in, then how it went */
  const where1 = () => new Promise(ok => { if (!navigator.geolocation) return ok(null); navigator.geolocation.getCurrentPosition(p => ok({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) }), () => ok(null), { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }); });
  async function checkin(el) {
    el.setAttribute('aria-busy', 'true'); el.disabled = true;
    const g = await where1(), fd = new FormData();
    if (g) { fd.append('lat', g.lat); fd.append('lng', g.lng); fd.append('acc', g.acc); }
    try { const r = await API('POST', `/api/field/visits/${el.dataset.id}/checkin`, fd, true); B.field = r.field; S.sheet = el.dataset.id; S.sheetGps = g; render(); }
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
      <div class="fd-btns"><button type="button" class="fd-btn lg" data-fa="sheet-x">Later</button><button type="button" class="fd-btn primary lg" data-fa="outcome" data-id="${v.id}">Save</button></div></form></div>`;
  }
  async function saveOutcome(el) {
    const f = qs(`[data-sheet="${el.dataset.id}"]`), out = (f.querySelector('input[name="fd-out"]:checked') || {}).value;
    if (!out) { qs('#fd-sheet-err').textContent = 'Choose how it went.'; return; }
    const fd = new FormData(); fd.append('outcome', out); fd.append('note', qs('#fd-note').value);
    if (out === 'Order taken' && qs('#fd-boxes').value.trim()) fd.append('boxes', qs('#fd-boxes').value.replace(/[,\s]/g, ''));
    if (out === 'Follow-up set' && qs('#fd-fu').value) fd.append('follow_on', qs('#fd-fu').value);
    const ph = qs('#fd-vphoto').files[0]; if (ph) fd.append('photo', ph);
    el.setAttribute('aria-busy', 'true'); el.disabled = true;
    try { const r = await API('POST', `/api/field/visits/${el.dataset.id}/outcome`, fd, true); B.field = r.field; S.sheet = ''; render(); toast(`<b>Saved:</b> ${esc(out)}`); }
    catch (e) { el.removeAttribute('aria-busy'); el.disabled = false; qs('#fd-sheet-err').textContent = e.message; }
  }

  /* ---- render */
  const route = () => { const r = (location.hash || '#/today').split('/')[1] || 'today'; return V[r] && NAV.some(n => n[0] === r && n[3]) ? r : 'today'; };
  function render() {
    if (!root) return;
    if (S.cam && !S.confirm) { if (!qs('.fd-cam') || S.camErr !== (qs('.fd-cam').dataset.err || '')) { root.innerHTML = camHtml(); qs('.fd-cam').dataset.err = S.camErr; const v = qs('.fd-cam video'); if (v && S.stream) v.srcObject = S.stream; } return; }
    if (S.confirm) { root.innerHTML = confirmHtml(); return; }
    const r = route();
    root.innerHTML = V[r]() + nav(r) + (S.sheet ? sheetHtml() : '');
  }
  const A = {
    cam: el => openCam(el.dataset.mode), 'cam-x': () => { closeCam(); render(); }, shoot, retake: () => openCam(S.cam), send: sendDay, nophoto: () => setShot(null),
    checkin, sheet: el => { S.sheet = el.dataset.id; render(); }, 'sheet-x': () => { S.sheet = ''; render(); }, outcome: saveOutcome,
    team: () => { try { sessionStorage.setItem('ego-team', '1'); } catch (e) {} location.hash = '#/home'; location.reload(); },
    out: () => window.EGOAPI.signOut(),
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
        if (e.target.name === 'fd-th') { document.documentElement.dataset.theme = e.target.value; try { localStorage.setItem('ego-theme', e.target.value); } catch (x) {} }
      });
      window.addEventListener('hashchange', () => { S.sheet = ''; render(); window.scrollTo(0, 0); });
      /* the Roadmap may change on the desktop while the phone is open: read it again when the app comes back */
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !S.cam && !S.sheet) API('GET', '/api/field/me').then(r => { B.field = r.field; render(); }).catch(() => {}); });
    }
    if (!location.hash || location.hash === '#/home') history.replaceState(null, '', '#/today');
    render();
  }
  window.EGOFIELD = { start, refresh: b => { B = b; render(); } };
})();
