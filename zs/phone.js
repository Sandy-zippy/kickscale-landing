/* The phone app (Picasso, 29 Oct 2026).

   Below 768px the cockpit becomes an app: a header with the screen's name, a
   tab bar with the four screens used most, and "More" for every other menu
   item. Above 768px this file does nothing at all, so the desktop is untouched.

   It builds nothing of its own about the menu: the tabs and the More sheet are
   read from the rail (#nav) after every render, so labels, order, role gating
   and the Inbox count are always exactly the desktop's. No app.js hook is
   needed: GE.onRender is already public. */
(function () {
  var MQ = window.matchMedia && window.matchMedia('(max-width: 768px)');
  if (!MQ) return;
  /* Overview starts the day, Inbox is where people answer, Sales is the money,
     Outreach is Mark. If a role cannot see one, the next menu item fills in. */
  var TABS = ['home', 'inbox', 'floor', 'outreach'];
  var built = false, head, tabs, more;

  var SVG = function (d, w) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 1.8) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  };
  var BACK = SVG('<path d="M15 18l-6-6 6-6"/>', 2.2);
  var DOTS = SVG('<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>', 1);
  var CHEV = SVG('<path d="M9 6l6 6-6 6"/>', 2);
  var USER = SVG('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>');

  /* Jarvis and Targets share the target rings in the rail; in the More grid they
     sit side by side, so Jarvis takes the kit's own "agents" glyph (app.js ICONS) */
  var OWN = { jarvis: '<rect x="4" y="7" width="16" height="12" rx="2"/><path d="M12 3v4M9 12h.01M15 12h.01M9.5 16h5"/>' };

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function route() { return (location.hash || '#/home').replace(/^#\//, '').split('/')[0] || 'home'; }

  /* the menu as the rail drew it: [route, label, icon svg, badge html] */
  function menu() {
    return [].slice.call(document.querySelectorAll('#nav a')).map(function (a) {
      var svg = a.querySelector('svg'), i = a.querySelector('i'), sp = a.querySelector('span');
      var k = String(a.getAttribute('href') || '').replace(/^#\//, '');
      return [k, sp ? sp.textContent : a.textContent,
        (OWN[k] && svg) ? svg.outerHTML.replace(/(<svg[^>]*>)[\s\S]*<\/svg>/, '$1' + OWN[k] + '</svg>') : (svg ? svg.outerHTML : ''),
        i ? '<i>' + esc(i.textContent) + '</i>' : ''];
    });
  }

  function build() {
    built = true;
    document.documentElement.classList.add('ph-app');
    head = document.createElement('header');
    head.id = 'ph-head';
    head.innerHTML = '<span id="ph-left"></span><h1 id="ph-title"></h1>' +
      '<button class="ph-ic" id="ph-bell" type="button" aria-label="Notifications"></button>';
    tabs = document.createElement('nav');
    tabs.id = 'ph-tabs';
    tabs.setAttribute('aria-label', 'Main');
    more = document.createElement('dialog');
    more.id = 'ph-more';
    more.setAttribute('aria-labelledby', 'ph-more-t');
    var app = document.getElementById('app');
    app.insertBefore(head, app.firstChild);
    app.appendChild(tabs);
    document.body.appendChild(more);

    head.addEventListener('click', function (e) {
      if (e.target.closest('#ph-back') && window.GE) GE.ACTIONS.goBack();
      if (e.target.closest('#ph-bell')) {
        var bp = document.getElementById('bell');
        try { bp.togglePopover(); } catch (x) { var b = document.getElementById('bellbtn'); if (b) b.click(); }
      }
    });
    tabs.addEventListener('click', function (e) { if (e.target.closest('[data-ph="more"]')) openMore(); });
    more.addEventListener('click', function (e) {
      if (e.target === more || e.target.closest('[data-ph="close"]') || e.target.closest('a')) closeMore();
      /* the desktop's own buttons do the work, so the behaviour is identical */
      if (e.target.closest('[data-ph="theme"]')) { var t = document.getElementById('themebtn'); if (t) t.click(); paint(); paintMore(); }
      if (e.target.closest('[data-ph="account"]')) { closeMore(); var u = document.getElementById('uchip'); if (u) u.click(); }
    });
    window.addEventListener('scroll', edge, { passive: true });
    document.addEventListener('scroll', function (e) { var t = e.target; if (t.classList && t.classList.contains('rangebar')) fade(t); }, { capture: true, passive: true });
    /* the Inbox count and the bell change between renders (the pulse) */
    if (window.MutationObserver) {
      var mo = new MutationObserver(paint);
      ['nav', 'bellbtn'].forEach(function (id) { var n = document.getElementById(id); if (n) mo.observe(n, { childList: true, subtree: true, characterData: true }); });
    }
    if (window.GE && GE.onRender) GE.onRender(paint);
    paint();
  }

  function edge() {
    if (!head) return;
    var h = $('#shell .ph h1');
    /* gone once half the page's own title sits under the header (iOS large title) */
    var b = h && h.getBoundingClientRect();
    var gone = !h || (b.top + b.bottom) / 2 < head.getBoundingClientRect().bottom;
    head.classList.toggle('edge', gone);
  }

  /* Date filter strips: the edge fade goes once the strip is scrolled to its end */
  function fade(r) { r.classList.toggle('ph-end', r.scrollLeft + r.clientWidth >= r.scrollWidth - 2); }
  function strips() { [].slice.call(document.querySelectorAll('#shell .rangebar')).forEach(fade); }

  function paint() {
    if (!built || !MQ.matches) return;
    var items = menu(), r = route(), roots = items.map(function (x) { return x[0]; });
    var isRoot = roots.indexOf(r) >= 0;

    /* header: a back arrow on anything below a menu screen, else the mark */
    var h1 = $('#shell .ph h1');
    var own = (items.filter(function (x) { return x[0] === r; })[0] || [])[1];
    /* a menu screen is called what the menu calls it (Delivery, Sheet), so the
       header and the tab or More label always agree; a record keeps its own name */
    $('#ph-title').textContent = (isRoot && own) || (h1 && h1.textContent.trim()) || own || 'ZippyScale';
    head.classList.toggle('sub', !isRoot);
    $('#ph-left').innerHTML = isRoot
      ? '<span class="ph-ic" aria-hidden="true"><img src="img/icon-192.png" alt=""></span>'
      : '<button class="ph-ic" id="ph-back" type="button" aria-label="Back">' + BACK + '</button>';
    var bb = document.getElementById('bellbtn');
    $('#ph-bell').innerHTML = bb ? bb.innerHTML : '';
    if (bb) $('#ph-bell').setAttribute('aria-label', bb.getAttribute('aria-label') || 'Notifications');

    /* tabs: the chosen four, filled from the menu if a role hides one */
    var pick = TABS.filter(function (k) { return roots.indexOf(k) >= 0; });
    roots.forEach(function (k) { if (pick.length < 4 && pick.indexOf(k) < 0) pick.push(k); });
    var rest = items.filter(function (x) { return pick.indexOf(x[0]) < 0; });
    var inMore = rest.some(function (x) { return x[0] === r; });
    tabs.innerHTML = pick.map(function (k) {
      var x = items.filter(function (y) { return y[0] === k; })[0];
      var on = k === r;
      return '<a href="#/' + esc(k) + '"' + (on ? ' class="on" aria-current="page"' : '') + '><span class="pill">' + x[2] + '</span>' +
        esc(x[1]) + x[3] + '</a>';
    }).join('') +
      '<button type="button" data-ph="more" aria-haspopup="dialog"' + (inMore ? ' class="on"' : '') + '><span class="pill">' + DOTS + '</span>More</button>';
    more._rest = rest;
    if (more.open) paintMore();
    edge();
    strips();
    /* the status bar takes the colour of the header in either theme */
    var tc = document.querySelector('meta[name="theme-color"]:not([media])');
    if (tc) tc.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--coal').trim() || '#111111');
  }

  function paintMore() {
    var r = route(), rest = more._rest || [];
    var tl = document.getElementById('themelbl'), uc = document.getElementById('uchip');
    var who = uc ? uc.querySelector('b') : null, role = uc ? uc.querySelector('span > span') : null;
    var tsvg = '';
    /* the icon of where the button takes you, to match its words ("Dark mode" = the moon) */
    [].slice.call(document.querySelectorAll('#themebtn svg')).forEach(function (s) { if (getComputedStyle(s).display === 'none') tsvg = s.outerHTML.replace(/ class="[^"]*"/, ''); });
    more.innerHTML = '<div class="ph-grab" aria-hidden="true"></div>' +
      '<div class="ph-mhead"><h2 id="ph-more-t">More</h2>' +
      '<button class="ph-ic" type="button" data-ph="close" aria-label="Close">' + SVG('<path d="M6 6l12 12M18 6 6 18"/>', 2) + '</button></div>' +
      '<div class="ph-mbody"><div class="ph-grid">' + rest.map(function (x) {
        var on = x[0] === r;
        return '<a href="#/' + esc(x[0]) + '"' + (on ? ' class="on" aria-current="page"' : '') + '>' + x[2] + '<span>' + esc(x[1]) + '</span>' + x[3] + '</a>';
      }).join('') + '</div>' +
      '<div class="ph-rows">' +
      (tl ? '<button type="button" data-ph="theme">' + tsvg + esc(tl.textContent) + '</button>' : '') +
      (who ? '<button type="button" data-ph="account">' + USER + '<span>' + esc(who.textContent) +
        (role ? '<small>' + esc(role.textContent) + '</small>' : '') + '</span>' + CHEV.replace('<svg', '<svg class="chev"') + '</button>' : '') +
      '</div></div>';
  }

  function openMore() { paintMore(); if (!more.open) more.showModal(); }
  function closeMore() { if (more && more.open) more.close(); }

  function start() {
    /* home screen install: the worker keeps the shell, never the data */
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
    if (!built) build(); else paint();
  }

  function check() {
    if (built) {
      /* back to desktop width: the phone parts step out of the way */
      document.documentElement.classList.toggle('ph-app', MQ.matches);
      head.hidden = tabs.hidden = !MQ.matches;
      if (!MQ.matches) closeMore();
    }
    if (MQ.matches) start();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check); else check();
  /* turning a tablet or narrowing a window into phone size switches the app on */
  if (MQ.addEventListener) MQ.addEventListener('change', check);
  window.PHONE = { paint: paint, openMore: openMore, closeMore: closeMore };
})();
