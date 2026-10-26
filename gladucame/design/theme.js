/* GLAD U CAME COCKPIT · theme · Picasso · 26 Oct 2026
   Load in <head> BEFORE the CSS as a plain script: applies the saved theme before first paint.
   GUCTheme.set('light'|'dark') · GUCTheme.get() · GUCTheme.toggle()
   Saved per device in localStorage "guc.theme". Default: light. Any [data-theme-toggle] flips it. */
(function (d) {
  var KEY = 'guc.theme', ok = { light: 1, dark: 1 };
  function get() { return d.documentElement.getAttribute('data-theme') || 'light'; }
  function set(t) {
    t = ok[t] ? t : 'light';
    d.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(KEY, t); } catch (e) {}
    var b = d.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < b.length; i++) { b[i].setAttribute('aria-pressed', t === 'dark'); var l = b[i].querySelector('[data-theme-label]'); if (l) l.textContent = t === 'dark' ? 'Dark' : 'Light'; }
    window.dispatchEvent(new CustomEvent('guc:theme', { detail: { theme: t } }));
    return t;
  }
  var saved; try { saved = localStorage.getItem(KEY); } catch (e) {}
  d.documentElement.setAttribute('data-theme', ok[saved] ? saved : 'light');
  d.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-theme-toggle]')) set(get() === 'dark' ? 'light' : 'dark'); });
  window.GUCTheme = { get: get, set: set, toggle: function () { return set(get() === 'dark' ? 'light' : 'dark'); } };
})(document);
