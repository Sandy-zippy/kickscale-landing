/* Glad U Came demo . P1 UI behaviour . Picasso, ZippyScale . 4 Nov 2026
   1. GUC logo loader: on first load and after sign-in. About 1.1 s, pointer-events none, so it never holds a click.
      Reduced motion: the static logo for 0.45 s, no movement.
   2. Phone tab bar: More opens a sheet with the rest of the menu (read from the rendered sidebar, so role gating,
      order and counts stay app.js's) plus the account, theme, Reset sample data and Sign out.
   Loads right after <div id="root">, before app.js. Styles live in design/kit.css (P1 section). */
(function () {
  'use strict';
  var d = document, root = d.getElementById('root');
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LOGO = '<svg viewBox="0 0 9397 3220" aria-hidden="true" focusable="false"><rect class="ld-plate" width="9397" height="2720" rx="180"/><g class="ld-word" transform="translate(780 1010)"><path style="--k:0" d="M421 712Q338 712 268 686Q199 659 148 610Q96 561 68 495Q39 429 39 350Q39 271 68 205Q96 139 148 90Q200 41 270 14Q340 -12 424 -12Q517 -12 592 19Q666 50 717 109L613 205Q575 165 530 146Q485 126 432 126Q381 126 339 142Q297 158 266 188Q236 218 220 259Q203 300 203 350Q203 399 220 440Q236 481 266 512Q297 542 338 558Q380 574 430 574Q478 574 524 558Q540 553 556 545V339H704V623Q647 666 572 689Q496 712 421 712Z"/><path style="--k:1" d="M894 700V0H1056V568H1407V700Z"/><path style="--k:2" d="M1446 700 1758 0H1918L2231 700H2061L1999 550H1674L1612 700ZM1948 427 1837 159 1726 427Z"/><path style="--k:3" d="M2344 700V0H2662Q2776 0 2863 44Q2950 87 2999 165Q3048 243 3048 350Q3048 456 2999 534Q2950 613 2863 656Q2776 700 2662 700ZM2506 567H2654Q2724 567 2776 540Q2827 514 2856 465Q2884 416 2884 350Q2884 283 2856 234Q2827 186 2776 160Q2724 133 2654 133H2506Z"/><path style="--k:4" d="M3844 712Q3695 712 3611 629Q3527 546 3527 392V0H3689V386Q3689 486 3730 530Q3771 574 3845 574Q3919 574 3960 530Q4001 486 4001 386V0H4161V392Q4161 546 4077 629Q3993 712 3844 712Z"/><path style="--k:5" d="M5019 712Q4938 712 4868 686Q4799 659 4748 610Q4697 561 4668 495Q4640 429 4640 350Q4640 271 4668 205Q4697 139 4748 90Q4800 41 4869 14Q4938 -12 5020 -12Q5111 -12 5184 20Q5258 51 5308 112L5204 208Q5168 167 5124 146Q5080 126 5028 126Q4979 126 4938 142Q4897 158 4867 188Q4837 218 4820 259Q4804 300 4804 350Q4804 400 4820 441Q4837 482 4867 512Q4897 542 4938 558Q4979 574 5028 574Q5080 574 5124 554Q5168 533 5204 491L5308 587Q5258 648 5184 680Q5111 712 5019 712Z"/><path style="--k:6" d="M5356 700 5668 0H5828L6141 700H5971L5909 550H5584L5522 700ZM5858 427 5747 159 5636 427Z"/><path style="--k:7" d="M6254 700V0H6388L6650 435L6908 0H7041L7043 700H6891L6890 280L6684 626H6611L6406 289V700Z"/><path style="--k:8" d="M7249 700V0H7778V130H7410V282H7735V408H7410V570H7791V700Z"/></g><rect class="ld-track" x="2819" y="3100" width="3758" height="60" rx="30"/><rect class="ld-bar" x="2819" y="3100" width="3758" height="60" rx="30"/></svg>';

  /* ---------- 1. loader ---------- */
  /* automated browsers (the B1 to B5 checks, Tester) skip it so their screenshots never catch the overlay;
     check_p1.cjs turns it back on with localStorage guc.loader = 1 */
  var SKIP = navigator.webdriver && !localStorage.getItem('guc.loader');
  function loader() {
    if (SKIP) return;
    var old = d.querySelector('.guc-loader'); if (old) old.remove();
    var el = d.createElement('div');
    el.className = 'guc-loader'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = LOGO;
    d.body.appendChild(el);
    setTimeout(function () { el.remove(); }, REDUCED ? 450 : 1150);
  }
  loader();

  /* ---------- 2. More sheet ---------- */
  var SPRITE = function () { return d.body.getAttribute('data-sprite') || 'design/icons.svg'; };
  var ico = function (n) { return '<svg class="i" aria-hidden="true"><use href="' + SPRITE() + '#i-' + n + '"/></svg>'; };
  var sheet = null;
  function openMore() {
    var bar = d.querySelector('.bottom-bar'); if (!bar) return;
    var inBar = {}; bar.querySelectorAll('a.nav-a').forEach(function (a) { inBar[a.getAttribute('href')] = 1; });
    var links = Array.prototype.filter.call(d.querySelectorAll('.side .nav a.nav-a'), function (a) { return !inBar[a.getAttribute('href')]; });
    var foot = d.querySelector('.side-foot'), who = foot && foot.querySelector(':scope > div'), av = foot && foot.querySelector(':scope > .av');
    var dark = d.documentElement.getAttribute('data-theme') === 'dark';
    if (!sheet) { sheet = d.createElement('div'); sheet.id = 'ui-more'; sheet.className = 'more-sheet'; sheet.setAttribute('popover', 'auto'); sheet.setAttribute('aria-label', 'More'); d.body.appendChild(sheet); }
    sheet.innerHTML = '<span class="grab" aria-hidden="true"></span>' +
      '<div class="sheet-head"><h2 class="h-page">More</h2><button class="btn btn--icon btn--ghost" type="button" aria-label="Close" popovertarget="ui-more" popovertargetaction="hide">' + ico('x') + '</button></div>' +
      '<nav aria-label="More of the menu">' + links.map(function (a) {
        var c = a.cloneNode(true); c.className = 'menu-i'; return c.outerHTML; }).join('') + '</nav><hr>' +
      (who ? '<div class="who">' + (av ? av.outerHTML : '') + who.outerHTML + '</div>' : '') +
      '<button class="menu-i" type="button" data-theme-toggle>' + ico(dark ? 'sun' : 'moon') + (dark ? 'Light theme' : 'Dark theme') + '</button>' +
      '<button class="menu-i" type="button" data-do="resetdemo">' + ico('refresh') + 'Reset sample data</button>' +
      '<button class="menu-i" type="button" data-do="signout">' + ico('logout') + 'Sign out</button>';
    if (sheet.showPopover) sheet.showPopover(); else sheet.setAttribute('open', '');
  }
  /* capture phase: runs before app.js's old "open the sidebar drawer" handler and stops it */
  window.addEventListener('click', function (e) {
    var m = e.target.closest && e.target.closest('[data-do="more-sm"]');
    if (m) { e.stopImmediatePropagation(); e.preventDefault(); openMore(); return; }
    if (sheet && sheet.contains(e.target) && e.target.closest('a, button[data-do], [data-theme-toggle]') && sheet.hidePopover) {
      setTimeout(function () { try { sheet.hidePopover(); } catch (x) {} }, 0);
    }
  }, true);

  /* ---------- after each render: More is "current" when the open screen lives in it; loader after sign-in ---------- */
  var wasLogin = !!(root && root.querySelector('.login'));
  function after() {
    var bar = d.querySelector('.bottom-bar');
    if (bar) {
      var more = bar.querySelector('[data-do="more-sm"]');
      if (more) {
        more.setAttribute('aria-haspopup', 'true'); more.setAttribute('aria-controls', 'ui-more');
        var side = d.querySelector('.side .nav a.nav-a[aria-current="page"]');
        var cur = side && !bar.querySelector('a.nav-a[href="' + side.getAttribute('href') + '"]');
        if (cur) more.setAttribute('aria-current', 'page'); else more.removeAttribute('aria-current');
      }
    }
    var isLogin = !!(root && root.querySelector('.login'));
    if (wasLogin && !isLogin && root.querySelector('.app')) loader();
    wasLogin = isLogin;
  }
  if (root && window.MutationObserver) new MutationObserver(after).observe(root, { childList: true });
})();
