/* Show password: adds a "Show password" tick box under every password box on the page,
   including boxes drawn later by the app. One file, linked from every ZippyScale portal. */
(function () {
  function add(inp) {
    if (inp.dataset.pwEye) return;
    inp.dataset.pwEye = '1';
    var lab = document.createElement('label');
    lab.className = 'pw-eye';
    lab.style.cssText = 'display:flex;align-items:center;gap:6px;margin:6px 0 0;font-size:12px;font-weight:400;' +
      'text-transform:none;letter-spacing:normal;cursor:pointer;user-select:none;opacity:.8;color:inherit';
    var box = document.createElement('input');
    box.type = 'checkbox';
    box.style.cssText = 'margin:0;width:14px;height:14px;cursor:pointer';
    box.onchange = function () { inp.type = box.checked ? 'text' : 'password'; };
    lab.appendChild(box);
    lab.appendChild(document.createTextNode('Show password'));
    inp.insertAdjacentElement('afterend', lab);
  }
  function scan(root) { (root.querySelectorAll ? root : document).querySelectorAll('input[type=password]').forEach(add); }
  function start() {
    scan(document);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { if (n.matches('input[type=password]')) add(n); else scan(n); } }); });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
