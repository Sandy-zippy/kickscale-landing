/* The date picker.

   The browser's own <input type="date"> drew a bevelled box with "01/10/2026" in
   it, which means 1 October to one reader and 10 January to another. This keeps
   every date input exactly where it is, as the real form value, and puts a
   button beside it that reads "1 Oct 2026" and opens a calendar in the
   cockpit's own colours.

   Nothing that renders a date changes: a MutationObserver finds every
   input[type=date] on any screen, including ones drawn later. Picking a day sets
   input.value and fires `input` and `change`, so every existing handler (stage
   changes, the registry's unsaved count, filters) works untouched.

   On a phone (coarse pointer) the native date wheel is the better control for a
   thumb, so it is left alone and only styled. */
(function () {
  'use strict';
  if (typeof document === 'undefined' || !document.createElement || typeof MutationObserver === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;

  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
               'September', 'October', 'November', 'December'];
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var iso = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var parse = function (s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  };
  var nice = function (s) { var d = parse(s); return d ? d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear() : ''; };

  var pop = null, owner = null, view = null, focusDay = null;

  function label(btn, input) {
    var v = nice(input.value);
    btn.querySelector('.zsd-txt').textContent = v || 'Pick a date';
    btn.classList.toggle('zsd-empty', !v);
  }

  function enhance(input) {
    if (input.__zsd) return;
    input.__zsd = true;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'zsd-btn';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.innerHTML = '<span class="zsd-txt"></span>' +
      '<svg class="zsd-ico" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><rect x="2.5" y="4" width="15" height="13.5" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M2.5 8.5h15M6.5 2.5v3M13.5 2.5v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    if (input.id) {
      /* the existing <label for=input> now names the button a screen reader lands on */
      var lab = document.querySelector('label[for="' + input.id + '"]');
      if (lab) btn.setAttribute('aria-label', lab.textContent.trim() + ': choose a date');
    }
    input.classList.add('zsd-native');
    input.setAttribute('tabindex', '-1');
    input.setAttribute('aria-hidden', 'true');
    input.parentNode.insertBefore(btn, input.nextSibling);
    btn.__input = input;
    label(btn, input);
    /* a value set from code (a scan, a reset) still shows on the button */
    input.addEventListener('change', function () { label(btn, input); });
    btn.addEventListener('click', function () { pop && owner === btn ? close() : open(btn); });
  }

  function scan(root) {
    if (!root.querySelectorAll) return;
    if (root.matches && root.matches('input[type="date"]')) enhance(root);
    Array.prototype.forEach.call(root.querySelectorAll('input[type="date"]'), enhance);
  }

  function inRange(input, d) {
    var min = parse(input.min), max = parse(input.max);
    return !(min && d < min) && !(max && d > max);
  }

  function draw() {
    var input = owner.__input, sel = parse(input.value), today = new Date();
    today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    var first = new Date(view.getFullYear(), view.getMonth(), 1);
    var lead = (first.getDay() + 6) % 7;            /* weeks start on Monday */
    var start = new Date(first); start.setDate(1 - lead);
    var h = '<div class="zsd-head">' +
      '<button type="button" class="zsd-nav" data-zsd="-1" aria-label="Previous month">&#8249;</button>' +
      '<b>' + MONTH[view.getMonth()] + ' ' + view.getFullYear() + '</b>' +
      '<button type="button" class="zsd-nav" data-zsd="1" aria-label="Next month">&#8250;</button></div>' +
      '<div class="zsd-grid" role="grid">' +
      ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(function (w) { return '<span class="zsd-wd">' + w + '</span>'; }).join('');
    for (var i = 0; i < 42; i++) {
      var d = new Date(start); d.setDate(start.getDate() + i);
      var k = iso(d), cls = 'zsd-day';
      if (d.getMonth() !== view.getMonth()) cls += ' zsd-out';
      if (+d === +today) cls += ' zsd-today';
      if (sel && +d === +sel) cls += ' zsd-sel';
      var ok = inRange(input, d);
      h += '<button type="button" class="' + cls + '" data-day="' + k + '"' +
        (ok ? '' : ' disabled') + (focusDay && +d === +focusDay ? '' : ' tabindex="-1"') +
        ' aria-label="' + d.getDate() + ' ' + MONTH[d.getMonth()] + ' ' + d.getFullYear() + '"' +
        (sel && +d === +sel ? ' aria-selected="true"' : '') + '>' + d.getDate() + '</button>';
    }
    h += '</div><div class="zsd-foot">' +
      '<button type="button" class="zsd-link" data-zsd="today">Today</button>' +
      (input.value ? '<button type="button" class="zsd-link" data-zsd="clear">Clear</button>' : '') + '</div>';
    pop.innerHTML = h;
    var f = pop.querySelector('.zsd-day:not([tabindex="-1"])');
    if (f) f.focus();
  }

  function place() {
    var r = owner.getBoundingClientRect(), w = 288, ph = pop.offsetHeight || 330;
    var left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
    var top = r.bottom + 6 + ph > window.innerHeight && r.top - 6 - ph > 0 ? r.top - 6 - ph : r.bottom + 6;
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
  }

  function open(btn) {
    close();
    owner = btn;
    var sel = parse(btn.__input.value) || new Date();
    view = new Date(sel.getFullYear(), sel.getMonth(), 1);
    focusDay = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate());
    pop = document.createElement('div');
    pop.className = 'zsd-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Choose a date');
    document.body.appendChild(pop);
    draw();
    place();
    btn.setAttribute('aria-expanded', 'true');
    pop.addEventListener('click', onPop);
    pop.addEventListener('keydown', onKey);
  }

  function close(refocus) {
    if (!pop) return;
    pop.remove();
    pop = null;
    if (owner) { owner.setAttribute('aria-expanded', 'false'); if (refocus) owner.focus(); }
    owner = null;
  }

  function pick(value) {
    var input = owner.__input, btn = owner;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    label(btn, input);
    close(true);
  }

  function onPop(e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    var act = b.getAttribute('data-zsd');
    if (b.hasAttribute('data-day')) return pick(b.getAttribute('data-day'));
    if (act === 'today') return pick(iso(new Date()));
    if (act === 'clear') return pick('');
    if (act) {
      view = new Date(view.getFullYear(), view.getMonth() + Number(act), 1);
      focusDay = new Date(view);
      draw();
    }
  }

  function onKey(e) {
    var step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (e.key === 'Escape') { e.preventDefault(); return close(true); }
    if (!step && e.key !== 'PageUp' && e.key !== 'PageDown') return;
    e.preventDefault();
    var d = new Date(focusDay || view);
    if (step) d.setDate(d.getDate() + step);
    else d.setMonth(d.getMonth() + (e.key === 'PageDown' ? 1 : -1));
    focusDay = d;
    view = new Date(d.getFullYear(), d.getMonth(), 1);
    draw();
  }

  document.addEventListener('mousedown', function (e) {
    if (pop && !pop.contains(e.target) && e.target !== owner && !(owner && owner.contains(e.target))) close();
  });
  window.addEventListener('resize', function () { if (pop) place(); });
  window.addEventListener('scroll', function () { if (pop) place(); }, true);

  new MutationObserver(function (muts) {
    muts.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) scan(n); }); });
    /* a screen redraw throws the open picker's owner away */
    if (pop && owner && !document.body.contains(owner)) close();
  }).observe(document.documentElement, { childList: true, subtree: true });
  scan(document);
})();
