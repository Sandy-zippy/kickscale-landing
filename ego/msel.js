'use strict';
/* M1 MULTI-SELECT (19 Oct 2026, Bhargav: "a dropdown with multi-select"). ONE component for the team's app (popover
   under the field), the field app (bottom sheet) and the dealer portal; markup and classes are Picasso's .msel family
   (design/CONTRACT.txt, design/field.css). The ticks are real checkboxes carrying the field's name, so a form reads
   the picks the way it always did (every checked input of that name). Loaded before live.js, field.js and portal.js. */
(function () {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const svg = n => `<svg aria-hidden="true"><use href="icons.svg#i-${n}"/></svg>`;
  /* a saved value as a list: an old single string (before 19 Oct) is a one-item list; nothing old is rewritten */
  const arr = v => Array.isArray(v) ? v.filter(x => x !== '' && x != null).map(String) : v == null || v === '' ? [] : [String(v)];
  const chip = (v, l) => `<span class="msel-chip" data-v="${esc(v)}">${esc(l)}<button type="button" class="msel-rm" aria-label="Remove ${esc(l)}">${svg('x')}</button></span>`;
  /* o: { name, id, opts (values or [value, label]), sel, noun ('categories'), phone } */
  function html(o) {
    const kv = (o.opts || []).map(x => Array.isArray(x) ? [String(x[0]), String(x[1])] : [String(x), String(x)]), sel = arr(o.sel), noun = o.noun || 'categories';
    const title = `Choose ${noun}`, head = o.phone ? `<h3>${esc(title)}</h3>` : `<b>${esc(title)}</b>`;
    const list = `<div class="msel-head">${head}<span class="msel-n">${sel.length} picked</span></div>
      ${kv.length > 8 ? `<label class="msel-q">${svg('search')}<input type="search" placeholder="Search ${esc(noun)}" aria-label="Search ${esc(noun)}" autocomplete="off"></label>` : ''}
      <ul class="msel-opts" role="group" aria-label="${esc(noun[0].toUpperCase() + noun.slice(1))}">${kv.map(([v, l]) => `<li><label class="msel-opt"><input type="checkbox" name="${esc(o.name)}" value="${esc(v)}"${sel.includes(v) ? ' checked' : ''}><span class="msel-tick">${svg('check')}</span>${esc(l)}</label></li>`).join('')}</ul>
      <div class="msel-none" hidden></div>
      <div class="msel-foot"><button type="button" class="msel-clear">Clear</button><button type="button" class="msel-done ${o.phone ? 'fd-btn primary lg' : 'btn primary sm'}">Done</button></div>`;
    const pop = o.phone ? `<div class="fd-scrim msel-scrim" hidden></div><div class="fd-sheet msel-sheet" role="dialog" aria-label="${esc(title)}" hidden>${list}</div>`
      : `<div class="msel-pop" role="dialog" aria-label="${esc(title)}" hidden>${list}</div>`;
    return `<div class="msel" data-msel="${esc(o.name)}" data-noun="${esc(noun)}"><div class="msel-box">${kv.filter(([v]) => sel.includes(v)).map(([v, l]) => chip(v, l)).join('')}<button type="button" class="msel-open"${o.id ? ` id="${esc(o.id)}"` : ''} aria-haspopup="true" aria-expanded="false"><span class="msel-ph">${esc(title)}</span>${svg('chevron-down')}</button></div>${pop}</div>`;
  }
  const val = m => [...m.querySelectorAll('.msel-opts input:checked')].map(x => x.value);
  function sync(m) {
    const box = m.querySelector('.msel-box'), open = m.querySelector('.msel-open');
    box.querySelectorAll('.msel-chip').forEach(c => c.remove());
    m.querySelectorAll('.msel-opts input:checked').forEach(x => open.insertAdjacentHTML('beforebegin', chip(x.value, x.closest('label').textContent.trim())));
    m.querySelector('.msel-n').textContent = val(m).length + ' picked';
  }
  const list = m => m.querySelector('.msel-pop, .msel-sheet');
  function shut(m) { const l = list(m); if (!l || l.hidden) return; l.hidden = true; const s = m.querySelector('.msel-scrim'); if (s) s.hidden = true; m.classList.remove('is-open'); m.querySelector('.msel-open').setAttribute('aria-expanded', 'false'); }
  function show(m) { document.querySelectorAll('.msel.is-open').forEach(x => x !== m && shut(x)); const l = list(m); l.hidden = false; const s = m.querySelector('.msel-scrim'); if (s) s.hidden = false; m.classList.add('is-open'); m.querySelector('.msel-open').setAttribute('aria-expanded', 'true'); const q = m.querySelector('.msel-q input'); if (q && !m.querySelector('.msel-sheet')) q.focus(); }
  /* a tick changed by code (a chip's x, Clear) tells the form the same way a tap does */
  const tell = x => x.dispatchEvent(new Event('change', { bubbles: true }));
  document.addEventListener('click', e => {
    const m = e.target.closest && e.target.closest('.msel');
    document.querySelectorAll('.msel.is-open').forEach(x => { if (x !== m) shut(x); });
    if (!m) return;
    if (e.target.closest('.msel-rm')) { e.preventDefault(); const v = e.target.closest('.msel-chip').dataset.v, x = [...m.querySelectorAll('.msel-opts input')].find(i => i.value === v); if (x) { x.checked = false; tell(x); } return; }
    if (e.target.closest('.msel-open')) { e.preventDefault(); list(m).hidden ? show(m) : shut(m); return; }
    if (e.target.closest('.msel-clear')) { e.preventDefault(); m.querySelectorAll('.msel-opts input:checked').forEach(x => { x.checked = false; tell(x); }); return; }
    if (e.target.closest('.msel-done') || e.target.closest('.msel-scrim')) { e.preventDefault(); shut(m); m.querySelector('.msel-open').focus(); }
  });
  document.addEventListener('change', e => { const m = e.target.closest && e.target.closest('.msel'); if (m && e.target.type === 'checkbox') sync(m); });
  document.addEventListener('input', e => {
    const q = e.target.closest && e.target.closest('.msel-q'); if (!q) return;
    const m = q.closest('.msel'), t = e.target.value.trim().toLowerCase(); let n = 0;
    m.querySelectorAll('.msel-opts li').forEach(li => { const hit = !t || li.textContent.toLowerCase().includes(t); li.hidden = !hit; n += hit; });
    const none = m.querySelector('.msel-none'); none.hidden = n > 0; none.textContent = n ? '' : `No ${m.dataset.noun === 'categories' ? 'category' : 'item'} matches "${e.target.value.trim()}"`;
    m.querySelector('.msel-opts').hidden = !n;
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.msel.is-open').forEach(shut); });
  window.MSEL = { html, val, arr };
})();
