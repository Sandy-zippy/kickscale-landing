/* The shell: sign in, the nav, the router, the drawer and the little modal. */
(function () {

  var NAV = [
    { grp:'Selling' },
    { r:'#/home',            n:'Overview' },
    { r:'#/clients',         n:'Clients' },
    { r:'#/showroom',        n:'The showroom' },
    { r:'#/order',           n:'Opportunities' },
    { r:'#/inbox',           n:'Inbox' },
    { r:'#/targets',         n:'Targets' },
    { grp:'Operations' },
    { r:'#/floor',           n:'Our operations' },
    { r:'#/designers-floor', n:'At the designers' },
    { r:'#/mine',            n:'Master tracking' },
    { grp:'Stock' },
    { r:'#/fabric',          n:'Fabric library' },
    { r:'#/readymade',       n:'Readymade' },
    { grp:'Money' },
    { r:'#/invoices',        n:'Invoices' },
    { r:'#/payables',        n:'Owed to designers' },
    { r:'#/costsheet',       n:'P/L on each order' },
    { r:'#/accounting',      n:'Accounting' },
    { grp:'The house' },
    { r:'#/campaigns',       n:'Campaigns' },
    { r:'#/agents',          n:'Agents and their rules' },
    { r:'#/team',            n:'Team' }
  ];

  function firstRoute() {
    for (var i = 0; i < NAV.length; i++) if (NAV[i].r && GE.allowed(NAV[i].r)) return NAV[i].r;
    return '#/home';
  }

  /* ---------- the loader: their monogram drawing itself ---------- */

  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var boot = document.getElementById('boot'), bootTimer = null;

  function showBoot(quick) {
    if (!boot || !window.SAASYA_MARK) return;
    clearTimeout(bootTimer);
    boot.className = quick ? 'quick' : '';
    boot.innerHTML = '<div class="bmark">' + window.SAASYA_MARK('run') + '</div>' +
                     '<div class="bword">Saasya&nbsp;<i>Men</i></div>';
  }
  function hideBoot(quick) {
    if (!boot) return;
    var hold = RM ? 320 : (quick ? 820 : 1600);
    clearTimeout(bootTimer);
    bootTimer = setTimeout(function () {
      boot.classList.add('out');
      bootTimer = setTimeout(function () { boot.classList.add('gone'); }, 460);
    }, hold);
  }

  function drawGate() {
    var D = GE.D, html = '';
    var order = ['Owner','BDM','Operations manager','Accounts','Stylist','Salesperson','Master'];
    order.forEach(function (role) {
      GE.by(D.people, 'role', role).forEach(function (p) {
        var ini = p.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2);
        html += '<button data-signin="' + p.id + '"><span class="av">' + ini + '</span>' +
                '<span><b>' + GE.esc(p.name) + '</b><span>' + GE.esc(p.role) +
                (p.craft ? ' · ' + GE.esc(p.craft) : '') + '</span></span>' +
                '<span class="go">\u203a</span></button>';
      });
    });
    document.getElementById('who').innerHTML = html;
  }

  function drawFrame() {
    var me = GE.me(), html = '';
    NAV.forEach(function (it) {
      if (it.grp) { html += '<div class="grp" data-grp>' + it.grp + '</div>'; return; }
      if (!GE.allowed(it.r)) return;
      html += '<a href="' + it.r + '">' + it.n + '</a>';
    });
    var nav = document.getElementById('nav');
    nav.innerHTML = html;
    /* drop a group heading that ended up with nothing under it */
    [].forEach.call(nav.querySelectorAll('[data-grp]'), function (g) {
      var n = g.nextElementSibling;
      if (!n || n.hasAttribute('data-grp')) g.remove();
    });
    document.getElementById('me').innerHTML =
      '<b>' + GE.esc(me.name) + '</b><span>' + GE.esc(me.role) + '</span>' +
      '<button data-act="signout">Sign out</button> ' +
      '<button data-act="reset" title="Throw away every change made in this prototype">Reset data</button>';
  }

  var lastRoute = null;

  /* a card, a swatch or a table row that acts like a button must answer the keyboard */
  function native(el) {
    var t = el.tagName;
    return t === 'BUTTON' || t === 'A' || t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA';
  }
  function wire(root) {
    [].forEach.call(root.querySelectorAll('[data-act],[data-signin]'), function (el) {
      if (native(el) || el.hasAttribute('tabindex')) return;
      el.tabIndex = 0;
      if (el.tagName !== 'TR' && !el.getAttribute('role')) el.setAttribute('role', 'button');
    });
  }

  function route() {
    var r = location.hash || firstRoute();
    var view = GE.VIEWS[r.split('?')[0]];
    if (!view) { location.hash = firstRoute(); return; }
    if (!GE.allowed(r)) {          /* typing a hash is not a way round the role */
      GE.toast('That screen is not part of your role.');
      location.hash = firstRoute(); return;
    }
    var shell = document.getElementById('shell');
    shell.innerHTML = view();
    wire(shell);
    /* the screen arrives once per route. Typing in a search box re-renders the same
       route, and a screen that re-enters on every keystroke would flicker. */
    shell.classList.remove('enter');
    if (r !== lastRoute) shell.classList.add('enter');
    lastRoute = r;
    [].forEach.call(document.querySelectorAll('#nav a'), function (a) {
      a.className = (a.getAttribute('href') === r) ? 'on' : '';
    });
    window.scrollTo(0, 0);
    document.querySelector('.main').scrollTop = 0;
  }

  GE.go = function (r) { if (location.hash === r) route(); else location.hash = r; };
  GE.refresh = route;

  /* ---------- drawer and modal ---------- */

  GE.drawer = function (html) {
    var b = document.getElementById('dbody');
    b.innerHTML = html;
    wire(b);
    document.getElementById('drawer').classList.add('on');
  };
  GE.closeDrawer = function () { document.getElementById('drawer').classList.remove('on'); };

  var modal = null;
  GE.modal = function (html) {
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal';
      document.body.appendChild(modal);
      modal.addEventListener('mousedown', function (e) { if (e.target === modal) GE.closeModal(); });
    }
    modal.innerHTML = '<div class="mpanel">' +
      '<button class="dclose" data-act="closemodal" aria-label="Close" style="top:14px;right:16px">&times;</button>' +
      html + '</div>';
    modal.classList.add('on');
    wire(modal);
  };
  GE.closeModal = function () { if (modal) modal.classList.remove('on'); };

  GE.toast = function (msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.className = 'toast';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  };

  /* ---------- one delegated click handler for the whole app ---------- */

  document.addEventListener('click', function (e) {
    var s = e.target.closest('[data-signin]');
    if (s) {
      showBoot(true);
      GE.signIn(s.getAttribute('data-signin'));
      document.getElementById('gate').classList.add('hide');
      document.getElementById('app').classList.add('on');
      drawFrame();
      if (!location.hash || !GE.VIEWS[location.hash]) location.hash = firstRoute();
      route();
      hideBoot(true);
      return;
    }
    var a = e.target.closest('[data-act]');
    if (!a) return;
    var act = a.getAttribute('data-act');
    if (act === 'signout') { GE.signOut(); return; }
    if (act === 'reset') {
      if (confirm('Throw away every change made in this prototype and start again from the sample data?'))
        GE.reset();
      return;
    }
    if (act === 'closemodal') { GE.closeModal(); return; }
    if (act === 'closedrawer') { GE.closeDrawer(); return; }
    if (GE.ACTIONS[act]) {
      e.preventDefault();
      GE.ACTIONS[act](a.getAttribute('data-id'), a, e);
    }
  });

  /* typing filters as you type */
  document.addEventListener('input', function (e) {
    var a = e.target.closest('[data-input]');
    if (a && GE.ACTIONS[a.getAttribute('data-input')])
      GE.ACTIONS[a.getAttribute('data-input')](a.getAttribute('data-id'), a, e);
  });

  /* a <select> fires change, not input */
  document.addEventListener('change', function (e) {
    var a = e.target.closest('[data-change]');
    if (a && GE.ACTIONS[a.getAttribute('data-change')])
      GE.ACTIONS[a.getAttribute('data-change')](a.getAttribute('data-id'), a, e);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { GE.closeModal(); GE.closeDrawer(); return; }
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = e.target.closest && e.target.closest('[data-act],[data-signin]');
    if (!el || native(el)) return;
    e.preventDefault();
    el.click();
  });

  window.addEventListener('hashchange', function () { if (GE.me()) route(); });

  GE.boot = function () {
    document.documentElement.classList.add('js');
    var seen = null;
    try { seen = sessionStorage.getItem(GE.KEY + '.seen'); sessionStorage.setItem(GE.KEY + '.seen', '1'); } catch (err) {}
    if (seen) showBoot(true);
    hideBoot(!!seen);
    GE.load();
    drawGate();
    var back = null;
    try { back = sessionStorage.getItem(GE.KEY + '.me'); } catch (err) {}
    if (back && GE.one(GE.D.people, back)) {
      GE.signIn(back);
      document.getElementById('gate').classList.add('hide');
      document.getElementById('app').classList.add('on');
      drawFrame();
      if (!location.hash || !GE.VIEWS[location.hash]) location.hash = firstRoute();
      route();
    }
  };
})();
