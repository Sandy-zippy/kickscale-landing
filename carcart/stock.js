/* Stock: the table, the editable car record, add-a-car, and the inventory sheet.
   Registers itself into GE.VIEWS / GE.ACTIONS. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS;
  var esc = function (s) { return CC.esc(s); };

  var SORT = { k: 'days', dir: -1 }, Q = '', F = {}, EDIT = null, DRAFT = null;

  /* ---------------- stock table ---------------- */

  var COLS = [
    ['stock_id', 'Stock'], ['name', 'Vehicle'], ['year', 'Year'], ['km', 'Kms'], ['price', 'Ask'],
    ['landed', 'Landed', 'cost'], ['floor', 'Floor', 'cost'], ['margin', 'Margin', 'cost'],
    ['marginpc', 'Margin %', 'cost'], ['days', 'Days'], ['age', 'Ageing'],
    ['completeness', 'Details'], ['availability', 'Status'], ['n_photos', 'Photos']
  ];

  function tests(k) {
    return function (c) {
      if (k === 'aged') return c.days > 90;
      if (k === 'thin') return c.n_photos < 14;
      if (k === 'nodesc') return !CC.fieldValue(c, CC.fieldByKey('description'));
      if (k === 'faults') return (c.faults || []).length > 0;
      if (k === 'window') return G.inRange(c.posted);
      return true;
    };
  }

  V.stock = function () {
    var cars = G.cars(), a = G.acc();
    /* Cost columns stay on the screen for every role and are masked instead of
       removed. A wall of dots tells a salesperson the number exists and is not
       theirs; a missing column just looks like the software cannot do it. */
    var cols = COLS;

    var h = '<div class="ph"><div><h1>Stock</h1><p>' + cars.length + ' cars &middot; ' +
      (a.cost ? CC.money(cars.reduce(function (s, c) { return s + c.price; }, 0)) + ' at asking prices'
              : 'costs and margins are hidden for your role') + '</p></div>' +
      '<div class="right">' +
      (a.addStock ? '<a class="btn" href="#/carnew">+ Add a car</a>' : '') +
      (a.editStock ? '<a class="btn alt" href="#/sheet">Open the sheet</a>' : '') +
      '</div></div>';

    /* The date window is opt-in here: a stock list is about what is on the floor
       now, so filtering it by listing date has to be a deliberate act. */
    h += G.rangeBar(cars.filter(function (c) { return G.inRange(c.posted); }).length +
      ' of ' + cars.length + ' listed in this window' + (F.window ? '' : ' — not filtered yet'));

    h += '<div class="chips" style="margin-bottom:14px">' +
      '<input id="q" type="search" placeholder="Search stock, make, model&hellip;" value="' + esc(Q) + '" ' +
      'style="background:var(--coal);border:1px solid var(--line);padding:8px 12px;min-width:210px" autocomplete="off">' +
      [['aged', 'Over 90 days'], ['thin', 'Under 14 photos'], ['nodesc', 'No description'],
       ['faults', 'Has faults'], ['window', 'Listed in this window']]
        .map(function (f) {
          return '<button class="chip" data-act="stockFilter" data-id="' + f[0] + '" aria-pressed="' +
            (F[f[0]] ? 'true' : 'false') + '">' + f[1] + '<i>' + cars.filter(tests(f[0])).length + '</i></button>';
        }).join('') + '</div>';

    var list = cars.filter(function (c) {
      if (Q) {
        var hay = [c.stock_id, c.make, c.model, c.variant, c.year, c.fuel, c.body_type].join(' ').toLowerCase();
        if (hay.indexOf(Q) < 0) return false;
      }
      return Object.keys(F).every(function (k) { return !F[k] || tests(k)(c); });
    });
    list.sort(function (x, y) {
      var k = SORT.k;
      var av = k === 'age' ? x.days : x[k], bv = k === 'age' ? y.days : y[k];
      if (typeof av === 'string') return SORT.dir * av.localeCompare(bv);
      return SORT.dir * ((av || 0) - (bv || 0));
    });

    h += '<div class="scroller"><table class="tbl"><thead><tr>' +
      cols.map(function (c) { return '<th data-act="stockSort" data-id="' + c[0] + '">' + c[1] + '</th>'; }).join('') +
      '</tr></thead><tbody>' +
      (list.length ? list.map(function (c) {
        var age = CC.ageBucket(c.days);
        var cell = {
          stock_id: c.stock_id,
          name: '<div class="veh"><img loading="lazy" src="' + CC.coverSrc(c) + '" alt="">' +
            '<span><b>' + esc(c.make + ' ' + c.model) + '</b><span>' + esc(c.variant || c.body_type) + '</span></span></div>',
          year: '<span class="num">' + c.year + '</span>',
          km: '<span class="num">' + CC.fmt(c.km) + '</span>',
          price: '<span class="num">' + CC.money(c.price) + '</span>',
          landed: cost(c.landed), floor: cost(c.floor), margin: cost(c.margin),
          marginpc: a.cost ? c.marginpc.toFixed(1) + '%' : '<span class="masked" title="Hidden for your role">••••</span>',
          days: '<span class="num">' + c.days + '</span>',
          age: '<span class="pill ' + age[1] + '">' + age[0] + '</span>',
          completeness: '<span class="bar"><i style="width:' + c.completeness + '%"></i></span> ' + c.completeness + '%',
          availability: '<span class="pill ' + (c.availability === 'Available' ? 'ok' : c.availability === 'Reserved' ? 'warn' : 'bad') + '">' + c.availability + '</span>',
          n_photos: '<span class="num">' + c.n_photos + '</span>'
        };
        return '<tr data-act="openCar" data-id="' + esc(c.stock_id) + '">' +
          cols.map(function (col) {
            var num = ['year', 'km', 'price', 'landed', 'floor', 'margin', 'marginpc', 'days', 'n_photos'].indexOf(col[0]) >= 0;
            return '<td' + (num ? ' class="num"' : '') + '>' + cell[col[0]] + '</td>';
          }).join('') + '</tr>';
      }).join('') : '<tr><td colspan="' + cols.length + '" class="empty">Nothing matches.</td></tr>') +
      '</tbody></table></div>';
    return h;
  };

  function cost(v) {
    return G.acc().cost ? CC.money(v) : '<span class="masked" title="Hidden for your role">₹ ••••</span>';
  }

  /* ---------------- the car record: published vs missing, both editable ---------------- */

  V.car = function (id) {
    var c = G.carById(id);
    if (!c) return G.deny('No such car', 'That stock number is not on the floor.');
    var a = G.acc(), editable = a.editStock;
    var s = c.score;

    var h = '<div class="ph"><div><h1>' + esc(c.stock_id + ' · ' + c.make + ' ' + c.model) + '</h1>' +
      '<p>' + esc([c.variant, c.year, c.body_type, CC.fmt(c.km) + ' km'].filter(Boolean).join(' · ')) + '</p></div>' +
      '<div class="right"><a class="btn alt" href="#/stock">Back to stock</a>' +
      (a.publish ? '<button class="btn alt" data-act="togglePublish" data-id="' + esc(c.stock_id) + '">' +
        (c.availability === 'Sold' ? 'Put back on sale' : 'Mark sold') + '</button>' : '') +
      '<a class="btn alt" href="catalogue.html?car=' + esc(c.stock_id) + '" target="_blank">View on site</a>' +
      '</div></div>';

    if ((c.faults || []).length) {
      h += '<div class="card" style="border-color:var(--bad);margin-bottom:16px"><h3 style="color:var(--bad)">' +
        c.faults.length + ' fault' + (c.faults.length === 1 ? '' : 's') + ' on this record</h3>' +
        '<ul style="margin:8px 0 0;padding-left:18px;color:var(--mut);font-size:13px">' +
        c.faults.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></div>';
    }

    h += '<div class="cols" style="align-items:start">';

    /* left: the money, if they may see it */
    h += '<div>';
    if (a.cost) {
      var d = c.demo || {}, cut = c.days > 90 ? Math.round(c.price * 0.03 / 1000) * 1000 : 0;
      h += '<h3 class="sec">Cost ledger <em style="font-style:normal;color:var(--dim)">(illustrative)</em></h3>' +
        '<ul class="ledger">' +
        li('Purchase price', CC.money(d.purchase_price)) + li('Reconditioning', CC.money(d.recon)) +
        li('Transport', CC.money(d.transport)) + li('Landed cost', CC.money(d.landed_cost)) +
        li('Floor price', CC.money(d.floor_price)) + li('Asking price', CC.money(c.price)) +
        '<li class="tot"><span>Profit if sold at ask</span><b>' + CC.money(c.margin) + '</b></li></ul>' +
        '<h3 class="sec">Ageing</h3><ul class="ledger">' +
        li('Listed on', c.posted) + li('Days on the floor', c.days + ' days') +
        li('Holding cost so far', CC.money(c.holding)) +
        (cut ? '<li class="tot"><span>Suggested price cut</span><b>' + CC.money(cut) + '</b></li>' : '') +
        '</ul>';
    } else {
      h += '<div class="note">Cost, margin and holding figures are hidden for ' +
        esc(CC.ROLES[G.me().role].label.toLowerCase()) + '. The owner sets that in Settings.</div>';
    }

    var saved = interestedIn(c.stock_id);
    h += '<h3 class="sec">Customer interest</h3>';
    h += saved.length
      ? '<div class="card" style="padding:0">' + saved.map(function (x) {
          return '<div class="pickrow"><div class="t"><b>' + esc(x.client.name) + '</b>' +
            '<span>' + esc(CC.MARKS[x.mark] || 'Saved') + ' &middot; ' +
            CC.maskMobile(x.client.mobile, G.me(), G.D().access) + '</span></div>' +
            '<button class="minibtn" data-act="openClient" data-id="' + esc(x.client.id) + '">Open</button></div>';
        }).join('') + '</div>'
      : '<p class="m" style="color:var(--mut)">Nobody has saved or been shown this car yet.</p>';

    h += '<h3 class="sec">Photographs (' + c.n_photos + ')</h3><div class="dthumbs">' +
      c.photos.slice(0, 12).map(function (p) {
        return '<img loading="lazy" src="' + CC.photoSrc(p) + '" alt="">';
      }).join('') + '</div>';
    h += '</div>';

    /* right: what the buyer is told — the editable panel */
    h += '<div><h3 class="sec">What the buyer is told</h3>' +
      '<div class="progress"><span class="bar" style="width:180px;height:9px"><i style="width:' + s.pct + '%"></i></span>' +
      '<b>' + s.present + ' of ' + s.total + ' fields</b>' +
      '<span style="color:var(--mut);font-size:12.5px">' + s.pct + '% filled in</span></div>';

    if (!editable) h += '<div class="note">You can see this, but editing car details is switched off for your role.</div>';

    CC.FIELD_GROUPS.forEach(function (grp) {
      var fields = CC.FIELDS.filter(function (f) { return f.group === grp; });
      var got = fields.filter(function (f) { return CC.hasField(c, f); }).length;
      h += '<div class="fgroup"><h4>' + esc(grp) + ' <span style="float:right;color:var(--mut)">' +
        got + '/' + fields.length + '</span></h4><div class="fieldset">';
      h += fields.map(function (f) { return fieldCell(c, f, editable); }).join('');
      h += '</div></div>';
    });

    var log = G.D().activity.filter(function (x) { return x.car === c.stock_id; });
    if (log.length) {
      h += '<h3 class="sec">Changes</h3><ul class="ledger">' + log.slice(0, 12).map(function (x) {
        var who = CC.staffById(x.by);
        return '<li><span>' + esc(x.text) + '</span><b>' + (who ? esc(who.name.split(' ')[0]) : '—') +
          ' &middot; ' + esc(String(x.at).slice(0, 10)) + '</b></li>';
      }).join('') + '</ul>' +
      '<p class="hint"><a href="#/activity" style="color:var(--ember)">See everything in the activity log</a></p>';
    }
    h += '</div></div>';
    return h;
  };

  function li(k, v) { return '<li><span>' + k + '</span><b>' + esc(v) + '</b></li>'; }

  function fieldCell(c, f, editable) {
    var val = CC.fieldValue(c, f);
    var has = CC.hasField(c, f);
    var key = c.stock_id + '|' + f.key;

    if (EDIT === key) {
      return '<div class="fld"><form data-fkey="' + esc(key) + '" style="width:100%">' +
        '<div style="width:100%"><span class="k">' + esc(f.label) + '</span>' + input(f, val) + '</div>' +
        '<button class="minibtn" type="submit">Save</button>' +
        '<button class="minibtn" type="button" data-act="cancelField">Cancel</button>' +
        '</form></div>';
    }

    var body = '<div style="min-width:0"><span class="k">' + esc(f.label) +
      (f.unit ? ' <span style="color:var(--dim)">(' + esc(f.unit) + ')</span>' : '') + '</span>' +
      (has ? '<span class="v">' + esc(fmtVal(f, val)) + '</span>'
           : '<span class="v none">not published</span>') + '</div>';

    var btn = '';
    if (editable && f.type !== 'derived') {
      btn = '<span class="go"><button class="minibtn" data-act="editField" data-id="' + esc(key) + '">' +
        (has ? 'Edit' : '+ Add') + '</button></span>';
    }
    return '<div class="fld' + (has ? '' : ' miss') + '">' + body + btn + '</div>';
  }

  function fmtVal(f, v) {
    if (f.type === 'number' && (f.key === 'price' || f.key === 'offer' || f.key === 'rto_cost' || f.key === 'booking'))
      return CC.money(v);
    if (f.key === 'km' || f.key === 'emi') return CC.fmt(v);
    return String(v);
  }

  function input(f, val) {
    var v = val === null || val === undefined ? '' : val;
    if (f.type === 'select') {
      return '<select name="v" autofocus><option value="">—</option>' +
        (f.options || []).map(function (o) {
          return '<option' + (String(v) === o ? ' selected' : '') + '>' + esc(o) + '</option>';
        }).join('') + '</select>';
    }
    if (f.type === 'textarea') return '<textarea name="v" autofocus rows="3">' + esc(v) + '</textarea>';
    var t = f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text';
    return '<input name="v" type="' + t + '" value="' + esc(v) + '" autofocus>';
  }

  function interestedIn(stockId) {
    var me = G.me(), D = G.D(), out = [];
    D.clients.forEach(function (cl) {
      if (!CC.inScope(cl, me, D.access)) return;
      var m = CC.markOf(cl, stockId);
      if (m) out.push({ client: cl, mark: m });
      else if ((cl.wishlist || []).indexOf(stockId) >= 0) out.push({ client: cl, mark: null });
    });
    return out;
  }

  /* ---------------- add a car ---------------- */

  V.carnew = function () {
    if (!G.acc().addStock) return G.deny('Not in your view', 'Adding cars is switched off for your role.');
    DRAFT = DRAFT || { photos: [], videos: [] };

    var h = '<div class="ph"><div><h1>Add a car</h1><p>Everything here lands on the website the moment you publish it.</p></div>' +
      '<div class="right"><a class="btn alt" href="#/stock">Cancel</a></div></div>';

    h += '<form id="carform">';
    h += '<div class="fgroup"><h4>Photographs and video</h4><div class="fbody">' +
      '<div class="f wide"><label>Photographs &mdash; the first one becomes the cover</label>' +
      '<input type="file" id="ph-in" accept="image/*" multiple></div>' +
      '<div class="f wide" id="ph-prev">' + previews() + '</div>' +
      '<div class="f wide"><label>Walkaround video</label><input type="file" id="vid-in" accept="video/*">' +
      '<p class="hint">The demonstration records the file name and size so you can see where video sits. ' +
      'It does not store the file itself &mdash; a live build uploads it to storage.</p></div>' +
      '</div></div>';

    CC.FIELD_GROUPS.forEach(function (grp) {
      if (grp === 'Media') return;
      var fields = CC.FIELDS.filter(function (f) { return f.group === grp && f.type !== 'derived'; });
      if (!fields.length) return;
      h += '<div class="fgroup"><h4>' + esc(grp) + '</h4><div class="fbody">' +
        fields.map(function (f) {
          return '<div class="f' + (f.type === 'textarea' ? ' wide' : '') + '">' +
            '<label for="n-' + f.key + '">' + esc(f.label) +
            (f.unit ? '<span class="unit">' + esc(f.unit) + '</span>' : '') + '</label>' +
            inputNamed(f) + '</div>';
        }).join('') + '</div></div>';
    });

    h += '<p class="err" id="car-err"></p>' +
      '<button class="btn" type="submit">Add this car</button> ' +
      '<button class="btn alt" type="button" data-act="clearDraft">Clear photos</button></form>';
    return h;
  };

  function inputNamed(f) {
    var id = 'n-' + f.key;
    if (f.type === 'select') {
      return '<select id="' + id + '" name="' + f.key + '"><option value="">—</option>' +
        (f.options || []).map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>';
    }
    if (f.type === 'textarea') return '<textarea id="' + id + '" name="' + f.key + '" rows="3"></textarea>';
    var t = f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text';
    return '<input id="' + id + '" name="' + f.key + '" type="' + t + '">';
  }

  function previews() {
    if (!DRAFT || !DRAFT.photos.length) return '<p class="hint">No photographs yet.</p>';
    return '<div class="dthumbs">' + DRAFT.photos.map(function (p, i) {
      return '<img src="' + p + '" alt="Photo ' + (i + 1) + '">';
    }).join('') + '</div><p class="hint">' + DRAFT.photos.length + ' photograph' +
      (DRAFT.photos.length === 1 ? '' : 's') +
      (DRAFT.videos.length ? ' &middot; video: ' + esc(DRAFT.videos[0]) : '') + '</p>';
  }

  /* Downscale before storing — full-size data URLs would blow localStorage. */
  function shrink(file, cb) {
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 1200, w = img.width, hgt = img.height;
        if (w > max || hgt > max) { var s = max / Math.max(w, hgt); w = Math.round(w * s); hgt = Math.round(hgt * s); }
        var cv = document.createElement('canvas');
        cv.width = w; cv.height = hgt;
        cv.getContext('2d').drawImage(img, 0, 0, w, hgt);
        cb(cv.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = function () { cb(null); };
      img.src = r.result;
    };
    r.onerror = function () { cb(null); };
    r.readAsDataURL(file);
  }

  /* ---------------- the inventory sheet ---------------- */

  var SHEET_COLS = ['stock_id', 'make', 'model', 'variant', 'year', 'km', 'fuel', 'transmission',
                    'body_type', 'price', 'availability', 'n_photos', 'posted', 'source_url'];

  V.sheet = function (mode) {
    if (!G.acc().editStock) return G.deny('Not in your view', 'The inventory sheet is switched off for your role.');
    var cars = G.cars();
    var log = G.syncLog() || [];

    var h = '';
    if (mode !== 'panel') {
      h += '<div class="ph"><div><h1>Inventory sheet</h1>' +
        '<p>One row per car. The sweep reads carcartonline.com every five minutes and writes this sheet.</p></div>' +
        '<div class="right"><button class="btn alt" data-act="exportSheet">Export CSV</button>' +
        '<button class="btn alt" data-act="importSheet">Import CSV</button></div></div>';
    }

    h += '<div class="card" style="margin-bottom:14px;display:flex;gap:16px;align-items:center;flex-wrap:wrap">' +
      '<div><b style="font-family:var(--d);font-size:15px">' + cars.length + ' rows</b>' +
      '<span style="display:block;color:var(--mut);font-size:12.5px">Last sweep: ' +
      esc(lastSweep()) + '</span></div>' +
      '<span class="pill ok">Sweep every 5 min</span>' +
      '<span style="color:var(--dim);font-size:12.5px;margin-left:auto">' +
      'Run it yourself: <code style="color:var(--mut)">python3 sync.py --watch</code></span></div>';

    if (mode === 'panel') return h + '<div class="note">The sweep is a script on the dealership machine. ' +
      'It reads the live website, writes <code>data/sheet.csv</code>, and records what changed. ' +
      'Pointing it at a real Google Sheet needs an Apps Script web app URL &mdash; the steps are in the README.</div>';

    if (log.length) {
      h += '<p class="eyebrow">Recent sweeps</p><div class="card" style="padding:0;margin-bottom:16px">' +
        log.slice(0, 6).map(function (s) {
          return '<div class="conn"><div><b>' + esc(s.at) + '</b><span>' +
            s.added + ' added &middot; ' + s.changed + ' changed &middot; ' + s.removed + ' removed</span></div></div>';
        }).join('') + '</div>';
    }

    h += '<div class="scroller"><table class="tbl"><thead><tr>' +
      SHEET_COLS.map(function (k) { return '<th>' + esc(k) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + cars.map(function (c) {
        return '<tr data-act="openCar" data-id="' + esc(c.stock_id) + '">' +
          SHEET_COLS.map(function (k) {
            var v = k === 'availability' ? c.availability : c[k];
            return '<td>' + esc(v === null || v === undefined ? '' : v) + '</td>';
          }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
    return h;
  };

  function lastSweep() {
    var log = G.syncLog() || [];
    if (log.length) return log[0].at;
    return 'not run yet — the sheet below is built from the last scrape';
  }

  function toCSV(cars) {
    var rows = [SHEET_COLS.join(',')];
    cars.forEach(function (c) {
      rows.push(SHEET_COLS.map(function (k) {
        var v = k === 'availability' ? c.availability : c[k];
        v = v === null || v === undefined ? '' : String(v);
        return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(','));
    });
    return rows.join('\n');
  }

  /* ---------------- actions ---------------- */

  Object.assign(A, {
    stockSort: function (k) { if (SORT.k === k) SORT.dir *= -1; else { SORT.k = k; SORT.dir = -1; } G.render(); },
    stockFilter: function (k) { F[k] = !F[k]; G.render(); },
    editField: function (key) { EDIT = key; G.render(); },
    cancelField: function () { EDIT = null; G.render(); },
    togglePublish: function (id) {
      var c = G.carById(id);
      var next = c.availability === 'Sold' ? 'Available' : 'Sold';
      var r = G.editCar(id, 'availability', next);
      if (r.error) return G.toast(r.error, true);
      G.log('car_publish', c.make + ' ' + c.model + ' marked ' + next, { car: id });
      G.save();
      G.toast(next === 'Sold' ? 'Marked sold and pulled from the website.' : 'Back on sale.');
      G.render();
    },
    clearDraft: function () { DRAFT = { photos: [], videos: [] }; G.render(); },
    exportSheet: function () {
      var blob = new Blob([toCSV(G.cars())], { type: 'text/csv' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'carcart-stock-' + CC.today() + '.csv';
      a.click();
      G.toast('Sheet exported.');
    },
    importSheet: function () {
      G.modal('Import a CSV', 'Rows are matched on stock number.',
        '<p class="m">Pick the file the inventory desk has been working in. Anything that has changed ' +
        'is written back onto the car record, and the change is logged.</p>' +
        '<p style="margin-top:14px"><input type="file" id="csv-in" accept=".csv,text/csv"></p>');
    }
  });

  /* file inputs and inline-edit forms */
  A.onChange = function (e) {
    if (e.target.id === 'ph-in') {
      var files = Array.prototype.slice.call(e.target.files).slice(0, 12);
      if (!files.length) return;
      DRAFT = DRAFT || { photos: [], videos: [] };
      var left = files.length;
      files.forEach(function (f) {
        shrink(f, function (url) {
          if (url && DRAFT.photos.length < 12) DRAFT.photos.push(url);
          if (--left === 0) {
            var box = document.getElementById('ph-prev');
            if (box) box.innerHTML = previews();
            G.toast(DRAFT.photos.length + ' photograph' + (DRAFT.photos.length === 1 ? '' : 's') + ' ready.');
          }
        });
      });
      return;
    }
    if (e.target.id === 'vid-in') {
      var v = e.target.files[0];
      if (!v) return;
      DRAFT = DRAFT || { photos: [], videos: [] };
      DRAFT.videos = [v.name + ' (' + Math.round(v.size / 1048576) + ' MB)'];
      var box2 = document.getElementById('ph-prev');
      if (box2) box2.innerHTML = previews();
      G.toast('Video noted. The demonstration does not store the file.');
      return;
    }
    if (e.target.id === 'csv-in') {
      var file = e.target.files[0];
      if (!file) return;
      var r = new FileReader();
      r.onload = function () { applyCSV(String(r.result)); };
      r.readAsText(file);
    }
  };

  function applyCSV(text) {
    var lines = text.trim().split(/\r?\n/);
    var head = lines.shift().split(',').map(function (s) { return s.trim(); });
    var n = 0;
    lines.forEach(function (ln) {
      var cells = ln.split(',');
      var row = {};
      head.forEach(function (k, i) { row[k] = (cells[i] || '').trim(); });
      if (!row.stock_id) return;
      var car = G.carById(row.stock_id);
      if (!car) return;
      ['price', 'km', 'year', 'variant', 'fuel', 'transmission', 'body_type', 'availability'].forEach(function (k) {
        if (!(k in row) || row[k] === '') return;
        var cur = k === 'availability' ? car.availability : car[k];
        if (String(cur) === row[k]) return;
        var res = G.editCar(row.stock_id, k, row[k]);
        if (!res.error) n++;
      });
    });
    document.getElementById('modal').close();
    if (n) G.log('sheet_import', n + ' change' + (n === 1 ? '' : 's') + ' written back from an imported sheet');
    G.toast(n ? n + ' change' + (n === 1 ? '' : 's') + ' written back from the sheet.' : 'Nothing had changed.');
    G.render();
  }

  A.onSubmit = function (e) {
    var f = e.target;
    if (f.dataset && f.dataset.fkey) {
      e.preventDefault();
      var p = f.dataset.fkey.split('|');
      var r = G.editCar(p[0], p[1], f.elements.v.value);
      EDIT = null;
      if (r.error) G.toast(r.error, true);
      else G.toast(r.field.label + ' saved.');
      G.render();
      return;
    }
    if (f.id === 'carform') {
      e.preventDefault();
      saveCar(f);
    }
  };

  function saveCar(form) {
    var data = new FormData(form), o = {};
    CC.FIELDS.forEach(function (fl) {
      if (fl.type === 'derived') return;
      var v = data.get(fl.key);
      if (v !== null && String(v).trim() !== '') o[fl.key] = fl.type === 'number' ? Number(v) : String(v).trim();
    });
    var err = document.getElementById('car-err');
    if (!o.make || !o.model) { err.textContent = 'A car needs at least a make and a model.'; return; }
    if (!o.price) { err.textContent = 'Give it an asking price.'; return; }
    if (!(DRAFT && DRAFT.photos.length)) { err.textContent = 'Add at least one photograph.'; return; }

    var n = G.cars().length + 1;
    var id = o.stock_id || ('CC-' + String(100 + n).slice(-3));
    while (G.carById(id)) { n++; id = 'CC-' + String(100 + n).slice(-3); }

    var core = ['make', 'model', 'variant', 'year', 'km', 'fuel', 'transmission', 'body_type', 'price', 'description'];
    var car = {
      stock_id: id, slug: '', wp_id: null,
      make: o.make, raw_make: o.make, model: o.model, variant: o.variant || '',
      title: o.make + ' ' + o.model + (o.variant ? ' ' + o.variant : ''),
      year: o.year || null, price: o.price, price_raw: o.price, price_corrected: false,
      emi: emiFor(o.price), km: o.km == null ? null : o.km,
      fuel: o.fuel || null, transmission: o.transmission || null,
      body_type: o.body_type || null, description: o.description || '',
      photos: DRAFT.photos.slice(), n_photos: DRAFT.photos.length,
      posted: CC.today(), days_listed: 0, source_url: '', views: null,
      faults: [], gaps: [], added_here: true,
      extra: {}, demo: demoFor(o.price)
    };
    Object.keys(o).forEach(function (k) { if (core.indexOf(k) < 0) car.extra[k] = o[k]; });
    if (DRAFT.videos.length) car.extra.video = DRAFT.videos[0];

    G.addCar(car);
    G.log('car_add', car.title + ' added to stock at ' + CC.money(car.price) +
          ' with ' + car.n_photos + ' photographs', { car: id });
    G.save();
    DRAFT = { photos: [], videos: [] };
    G.toast(car.title + ' added as ' + id + '.');
    G.go('#/car/' + id);
  }

  /* the stock search box */
  document.addEventListener('input', function (e) {
    if (e.target.id === 'q') { Q = e.target.value.toLowerCase().trim(); G.render(); }
  });

  function emiFor(price) {
    var p = price * 0.8, r = 0.095 / 12, n = 84;
    return Math.round(p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) / 100) * 100;
  }
  function demoFor(price) {
    var landed = Math.round(price * 0.89 / 1000) * 1000;
    return { purchase_price: landed - 60000, recon: 45000, transport: 15000,
             landed_cost: landed, floor_price: Math.round(landed * 1.025 / 1000) * 1000,
             margin: price - landed, owners: 1, inspection: 185,
             service_history: 'Full — authorised', insurance: 'Comprehensive', keys: 2,
             tyres: [88, 86, 85, 87], warranty: '12 months / 20,000 km',
             branch: 'Kavuri Hills', availability: 'Available' };
  }
})();
