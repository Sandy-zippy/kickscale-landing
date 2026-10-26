/* GLAD U CAME COCKPIT · kit behaviour · Picasso · 26 Oct 2026
   One delegated listener. No framework, no library. Everything is visible and usable without it.
   <body data-sprite="design/icons.svg"> tells it where the icon sprite lives.
   Public: GUC.toast(text, undoFn) · GUC.done(taskEl) · GUC.fillBySpeak(dialogEl) */
(function (d) {
  var SPRITE = function () { return (d.body && d.body.getAttribute('data-sprite')) || 'design/icons.svg'; };
  var ico = function (n, c) { return '<svg class="i ' + (c || '') + '" aria-hidden="true"><use href="' + SPRITE() + '#i-' + n + '"/></svg>'; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  function toast(text, undo) {
    var box = d.querySelector('.toasts');
    if (!box) { box = d.createElement('div'); box.className = 'toasts'; box.setAttribute('aria-live', 'polite'); d.body.appendChild(box); }
    var t = d.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
    t.innerHTML = ico('circle-check') + '<span>' + esc(text) + '</span>' + (undo ? '<button class="btn btn--sm btn--ghost" type="button">Undo</button>' : '');
    if (undo) t.querySelector('button').onclick = function () { undo(); t.remove(); };
    box.appendChild(t); setTimeout(function () { t.remove(); }, 5000);
  }

  function progress(scope) {
    var list = scope.closest('[data-today]'); if (!list) return;
    var all = list.querySelectorAll('.task').length, done = list.querySelectorAll('.task.is-done').length;
    list.querySelectorAll('[data-day-bar]').forEach(function (b) { b.style.setProperty('--p', all ? Math.round(done / all * 100) : 0); });
    list.querySelectorAll('[data-day-txt]').forEach(function (s) { s.textContent = done + ' of ' + all + ' done today'; });
    if (all && done === all) list.querySelectorAll('.burst').forEach(function (b) { b.classList.remove('is-on'); void b.offsetWidth; b.classList.add('is-on'); });
  }

  function done(task) {
    var was = task.classList.contains('is-done');
    task.classList.toggle('is-done', !was);
    var b = task.querySelector('.task-check'); if (b) b.setAttribute('aria-pressed', !was);
    progress(task);
    if (!was) {
      var s = task.closest('[data-today]') && task.closest('[data-today]').querySelector('.streak');
      if (s) { s.classList.remove('is-bump'); void s.offsetWidth; s.classList.add('is-bump'); }
      toast('Done. Nice one.', function () { done(task); });
    }
  }

  function closePops(except) { d.querySelectorAll('.pop[data-temp]').forEach(function (p) { if (p !== except) p.remove(); }); d.querySelectorAll('[data-pop-open]').forEach(function (p) { if (p !== except) { p.hidden = true; p.removeAttribute('data-pop-open'); } }); }

  function blocked(task) {
    if (task.querySelector('.reason')) { task.querySelector('.reason .input').focus(); return; }
    var r = d.createElement('div'); r.className = 'reason';
    r.innerHTML = '<input class="input" placeholder="What is it waiting on? (needed)" aria-label="Reason for Blocked">' +
      '<div class="reason-quick"><button type="button">Waiting on brand</button><button type="button">Waiting on influencer</button><button type="button">Need approval</button></div>' +
      '<button class="btn btn--sm btn--solid" type="button" data-reason-save>Mark Blocked</button><button class="btn btn--sm btn--ghost" type="button" data-reason-cancel>Cancel</button>';
    task.appendChild(r); r.querySelector('.input').focus();
  }

  function fillBySpeak(dlg, btn) {
    btn.classList.add('is-live'); btn.setAttribute('aria-pressed', 'true');
    var lab = btn.querySelector('[data-mic-label]'); if (lab) lab.textContent = 'Listening';
    var fields = dlg.querySelectorAll('[data-speak]'), i = 0;
    setTimeout(function step() {
      if (i >= fields.length) {
        btn.classList.remove('is-live'); btn.setAttribute('aria-pressed', 'false'); if (lab) lab.textContent = 'Speak';
        toast('Filled ' + fields.length + ' fields. Check them, then save.'); return;
      }
      var f = fields[i++], el = f.querySelector('.input, .select, .textarea');
      if (el) { el.value = f.getAttribute('data-speak'); f.classList.add('is-filled'); }
      setTimeout(step, 260);
    }, 1200);
  }

  d.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : e.target.parentElement, a;
    if ((a = t.closest('[data-act]'))) {
      var task = a.closest('.task'), act = a.getAttribute('data-act');
      if (act === 'done' && task) done(task);
      if (act === 'blocked' && task) blocked(task);
      if (act === 'snooze' && task) {
        closePops();
        var m = d.createElement('div'); m.className = 'pop'; m.setAttribute('data-temp', ''); m.setAttribute('role', 'menu');
        m.innerHTML = ['Later today|4:00 pm', 'Tomorrow|10:00 am', 'Monday|10:00 am', 'Pick a date|'].map(function (o) { o = o.split('|');
          return '<button class="menu-i" role="menuitem" type="button" data-snooze="' + o[0] + '">' + ico('clock-pause') + o[0] + '<span class="faint">' + o[1] + '</span></button>'; }).join('');
        m.style.right = '12px'; m.style.top = '100%'; task.appendChild(m);
      }
      return;
    }
    if ((a = t.closest('[data-snooze]'))) {
      var tk = a.closest('.task'); a.closest('.pop').remove();
      tk.classList.add('is-leaving'); setTimeout(function () { tk.hidden = true; progress(tk); }, 280);
      toast('Snoozed to ' + a.getAttribute('data-snooze').toLowerCase() + '.', function () { tk.hidden = false; tk.classList.remove('is-leaving'); });
      return;
    }
    if ((a = t.closest('.reason-quick > button'))) { a.closest('.reason').querySelector('.input').value = a.textContent; return; }
    if ((a = t.closest('[data-reason-cancel]'))) { a.closest('.reason').remove(); return; }
    if ((a = t.closest('[data-reason-save]'))) {
      var rr = a.closest('.reason'), inp = rr.querySelector('.input'), tb = a.closest('.task');
      if (!inp.value.trim()) { inp.focus(); inp.setAttribute('aria-invalid', 'true'); inp.placeholder = 'A reason is needed for Blocked'; return; }
      tb.classList.add('is-blocked'); rr.remove();
      var meta = tb.querySelector('.task-meta'), n = d.createElement('span'); n.className = 'blocked-note'; n.textContent = 'Blocked: ' + inp.value; meta.appendChild(n);
      toast('Marked Blocked. Your department head is told.', function () { tb.classList.remove('is-blocked'); n.remove(); });
      return;
    }
    if ((a = t.closest('[data-mic]'))) { var dl = a.closest('.dialog'); if (dl && !a.classList.contains('is-live')) fillBySpeak(dl, a); return; }
    if ((a = t.closest('[data-open]'))) { var dg = d.getElementById(a.getAttribute('data-open')); if (dg && dg.showModal) dg.showModal(); return; }
    if ((a = t.closest('[data-close]'))) { var c = a.closest('dialog'); if (c) c.close(); return; }
    if ((a = t.closest('[data-pop]'))) {
      var p = d.getElementById(a.getAttribute('data-pop')); if (!p) return;
      var open = p.hidden; closePops(); p.hidden = !open; if (open) p.setAttribute('data-pop-open', ''); a.setAttribute('aria-expanded', open);
      if (open && a.classList.contains('bell')) { a.classList.remove('is-ring'); }
      return;
    }
    if ((a = t.closest('[data-reload]'))) { location.reload(); return; }
    if (!t.closest('.pop')) closePops();
  });

  d.addEventListener('change', function (e) {
    var s = e.target.closest && e.target.closest('[data-datef]');
    if (s) { var c = s.parentElement.querySelector('.datef-custom'); if (c) c.hidden = s.value !== 'custom'; }
  });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePops(); });

  window.GUC = { toast: toast, done: done, fillBySpeak: fillBySpeak, icon: ico };
})(document);
