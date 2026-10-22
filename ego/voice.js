'use strict';
/* B1 VOICE TYPING (22 Oct 2026, Bhargav: "speak instead of type in every big text box"). ONE helper for the team's app,
   the field app and the dealer portal; markup and classes are Picasso's VT kit (design/CONTRACT.txt, design/field.css).
   Ported from ZippyScale's own dictate() (agentic-cockpit/zippyscale/app.js), with its lessons kept:
     * THE BOX IS THE SOURCE OF TRUTH. Each FINAL phrase is inserted once, at the caret or at the end; nothing already in
       the box is ever rewritten, so a word typed or corrected while listening survives the next phrase.
     * Interim words show in the .vt-say line only, never in the box, until the browser makes them final.
     * Chrome ends a session by itself after a pause: if nobody tapped stop, it starts again; the box already holds
       every word. Tapping the mic again on the same box stops; a later tap CONTINUES from what is in the box.
     * Leaving the box (focus goes elsewhere), closing the form, or a redraw that removes the box stops listening and
       keeps every word (a phrase still showing is written in as final while the box exists).
   Every textarea gets the mic by itself after any render (a MutationObserver), dialogs included; data-novt opts out. */
(function () {
  const SR = () => window.SpeechRecognition || window.webkitSpeechRecognition;
  const IDLE = 'Listening, tap to stop';
  let REC = null, BOX = null, deniedSaid = false;

  /* spoken punctuation, then a capital where a sentence starts and a full stop on a phrase that ends with none */
  const SAID = [[/\s*\b(?:new line|next line|new paragraph)\b\s*/gi, '\n'], [/\s*\b(?:full stop|period)\b/gi, '.'], [/\s*\bcomma\b/gi, ','],
    [/\s*\bquestion mark\b/gi, '?'], [/\s*\bexclamation mark\b/gi, '!'], [/\s*\bcolon\b/gi, ':']];
  const ASKS = /^(what|why|how|when|where|who|which|can|could|is|are|do|does|did|will|shall|should|would)\b/i;
  function punctuate(text, before) {
    let t = String(text || '').replace(/[ \t]+/g, ' ').trim();
    for (const [re, to] of SAID) t = t.replace(re, to);
    t = t.replace(/[ \t]+([.,?!:])/g, '$1').replace(/^[ \t]+|[ \t]+$/g, '');
    if (!t) return '';
    const startsNew = !/\S/.test(before || '') || /[.?!\n]\s*$/.test(before || '');
    if (startsNew) t = t.charAt(0).toUpperCase() + t.slice(1);
    t = t.replace(/([.?!]\s+|\n)([a-z])/g, (w, p, c) => p + c.toUpperCase());
    if (!/[.?!,;:\n]$/.test(t)) t += ASKS.test(t.split(/[.?!\n]\s*/).pop()) ? '?' : '.';
    return t;
  }

  const fire = (box, type) => { try { box.dispatchEvent(new Event(type, { bubbles: true })); } catch (e) {} };
  /* insert one final phrase at the caret (when the person has put one there) or at the end, with a space either side */
  function put(box, finalText) {
    if (!box || !box.isConnected) return false;
    const v = box.value;
    let at = box.dataset.vtCaret === '1' && typeof box.selectionStart === 'number' ? box.selectionStart : v.length;
    if (at > v.length) at = v.length;
    const before = v.slice(0, at), after = v.slice(at), add = punctuate(finalText, before);
    if (!add) return false;
    const lead = before && !/\s$/.test(before) ? ' ' : '', trail = after && !/^\s/.test(after) ? ' ' : '';
    box.value = before + lead + add + trail + after;
    const end = before.length + lead.length + add.length;
    try { box.selectionStart = box.selectionEnd = end; } catch (e) {}
    box.dataset.vtCaret = '1';
    box.dataset.vtDirty = '1';
    fire(box, 'input');   /* drafts, autosave and "errors clear on input" react exactly as if it had been typed */
    return true;
  }

  const wrapOf = box => box && box.closest('.vt-wrap');
  function paint(box, on, say) {
    const w = wrapOf(box); if (!w) return;
    const b = w.querySelector('.vt-mic'), s = w.querySelector('.vt-say');
    w.classList.toggle('is-listening', !!on);
    if (b) { b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.setAttribute('aria-label', on ? IDLE : 'Voice typing'); }
    if (s) s.textContent = say || IDLE;
  }
  const toast = m => { const f = VOICE.toast || (window.EM && window.EM.toast); if (f) f(m); };

  function stop() {
    const r = REC; if (!r) return;
    r.wanted = false;
    try { r.stop(); } catch (e) { r.onend && r.onend(); }
  }

  function start(box) {
    const Rec = SR(); if (!Rec || !box) return;
    if (REC) { const same = BOX === box; stop(); if (same) return; }
    let interim = '';
    const r = new Rec();
    r.lang = 'en-IN'; r.continuous = true; r.interimResults = true; r.wanted = true;
    r.onresult = e => {
      let fin = ''; interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += (fin ? ' ' : '') + t.trim(); else interim += t;
      }
      if (fin) put(box, fin);
      paint(box, true, interim.trim() || IDLE);
    };
    r.onerror = e => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;   /* harmless: a pause, or our own stop */
      r.wanted = false;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { if (!deniedSaid) toast('Allow the microphone for this site to use voice typing.'); deniedSaid = true; }
      else toast('Voice typing stopped. Tap the mic to carry on.');
    };
    r.onend = () => {
      /* a phrase still showing when the session ends is never finalised by the next one: keep it as final */
      if (interim.trim()) put(box, interim);
      interim = '';
      if (r.wanted && box.isConnected) { try { r.start(); return; } catch (err) { /* stop below */ } }
      if (REC === r) { REC = null; BOX = null; }
      paint(box, false);
      if (box.dataset.vtDirty === '1') { delete box.dataset.vtDirty; fire(box, 'change'); }
    };
    try { r.start(); } catch (err) { toast('Voice typing could not start. Tap the mic to try again.'); return; }
    REC = r; BOX = box;
    paint(box, true, IDLE);
  }

  const MIC = '<svg aria-hidden="true"><use href="icons.svg#i-mic"/></svg>';
  function decorate(ta) {
    if (ta.closest('.vt-wrap') || ta.hasAttribute('data-novt') || ta.readOnly || ta.disabled) return;
    const focused = document.activeElement === ta, s0 = ta.selectionStart, s1 = ta.selectionEnd;
    const w = document.createElement('div');
    w.className = 'vt-wrap' + (SR() ? '' : ' is-off');
    /* a box laid out by its own inline style (a flex row, a gap above) keeps that place through the wrap */
    if (ta.style.flex) { w.style.flex = ta.style.flex; ta.style.flex = ''; }
    if (ta.style.marginTop) { w.style.marginTop = ta.style.marginTop; ta.style.marginTop = ''; }
    ta.parentNode.insertBefore(w, ta);
    w.appendChild(ta);
    w.insertAdjacentHTML('beforeend', SR()
      ? `<button type="button" class="vt-mic" aria-pressed="false" aria-label="Voice typing">${MIC}</button><span class="vt-say" aria-live="polite">${IDLE}</span>`
      : `<button type="button" class="vt-mic" disabled aria-label="Voice typing" title="Voice typing needs Chrome or Safari">${MIC}</button>`);
    if (focused) { ta.focus(); try { ta.selectionStart = s0; ta.selectionEnd = s1; } catch (e) {} }
  }
  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    if (root.tagName === 'TEXTAREA') decorate(root);
    root.querySelectorAll('textarea').forEach(decorate);
  }

  /* the person put the caret somewhere: the next phrase goes there, not at the end */
  document.addEventListener('focusin', e => { if (e.target.tagName === 'TEXTAREA' && e.target.closest('.vt-wrap')) e.target.dataset.vtCaret = '1'; });
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.vt-mic'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    if (b.disabled) return;
    const box = b.closest('.vt-wrap').querySelector('textarea');
    start(box);
    if (REC && BOX === box) { try { b.focus(); } catch (x) {} }
  }, true);
  /* leaving the box (focus to anything outside its wrap) stops listening; every word already written stays */
  document.addEventListener('focusout', e => {
    if (!REC || !BOX) return;
    const w = wrapOf(BOX); if (!w || !w.contains(e.target)) return;
    if (e.relatedTarget && w.contains(e.relatedTarget)) return;
    stop();
  });
  const watch = () => new MutationObserver(ms => {
    for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) scan(n);
    if (BOX && !BOX.isConnected) stop();   /* the form closed or redrew under us */
  }).observe(document.body, { childList: true, subtree: true });
  if (document.body) { scan(document.body); watch(); } else document.addEventListener('DOMContentLoaded', () => { scan(document.body); watch(); });

  window.VOICE = { start, stop, scan, punctuate, listening: () => BOX, toast: null };
})();
