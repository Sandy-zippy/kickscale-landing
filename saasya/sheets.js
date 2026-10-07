/* Excel sheets (7 Oct): one engine for every bulk entry. A sample sheet is built at the moment it is
   downloaded, from the lists as they stand (vendors, designers, cloths, kinds, stylists...), with real
   Excel dropdowns, so it is never out of date. An upload is checked against today's lists, row by row,
   and nothing saves until it is confirmed. The Sheet Keeper agent watches for sheets downloaded before
   a list changed. */
(function () {
  var A = GE.ACTIONS, esc = GE.esc, one = GE.one, by = GE.by, rupees = GE.rupees;
  function D() { return GE.D; }
  var EXCELJS = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
  function need(cb) {
    if (window.ExcelJS) return cb();
    if (!document.head) return;
    var sc = document.createElement('script'); sc.src = EXCELJS; sc.onload = cb;
    sc.onerror = function () { GE.toast('The Excel maker could not load. Check the internet connection.'); }; document.head.appendChild(sc);
  }
  function who(s) { return GE.whoSupplies(s); }
  var L = {   /* every list a sheet can offer, read fresh each time */
    vendors: function () { return D().vendors.map(function (v) { return v.name; }); },
    designers: function () { return D().designers.map(function (x) { return x.name; }); },
    makers: function () { return ['Saasya Men'].concat(D().designers.map(function (x) { return x.name; })); },
    cloths: function () { return D().fabrics.map(clothName); },
    kinds: function () { return GE.KINDS.slice(); },
    where: function () { return ['Store', 'Godown']; },
    gst: function () { return ['5', '12', '18']; },
    stockType: function () { return ['On-order', 'Consignment', 'Our own']; },
    stylists: function () { return D().people.filter(function (p) { return p.role === 'Stylist' || p.role === 'Salesperson'; }).map(function (p) { return p.name; }); },
    people: function () { return D().people.map(function (p) { return p.name; }); },
    sources: function () { return GE.SOURCES.slice(); },
    occasions: function () { return [].concat.apply([], GE.OCCASIONS.map(function (g) { return g[1]; })); },
    codes: function () { return GE.COUNTRY_CODES.map(function (c) { return c[0]; }); },
    households: function () { return D().families.map(function (f) { return f.name + (f.area ? ', ' + f.area : ''); }); },
    expenseKinds: function () { return ['Porter / courier', 'Electricity (current bill)', 'Rent', 'Salaries and wages', 'Repairs and maintenance', 'Marketing', 'Packaging', 'Travel', 'Miscellaneous']; },
    modes: function () { return ['Cash', 'Net transfer', 'Cheque', 'UPI (GPay / PhonePe / Razorpay)', 'Credit card', 'Debit card']; }
  };
  GE.sheetLists = L;
  function clothName(f) { return f.brand + ' ' + f.colour + (f.pattern ? ', ' + f.pattern : '') + ' (' + ((one(D().vendors, f.vendor) || {}).name || '') + ')'; }

  /* the sheets. Each column: header, list (dropdown), type, required, note. */
  var SHEETS = {
    fabricIn: { title: 'Fabric received', where: 'Fabric stock', note: 'One row per cloth on a vendor’s bill. Rows with the same vendor, bill number and date become one bill.',
      cols: [['Vendor', 'vendors', 'text', 1], ['Their bill number', null, 'text', 0], ['Received on', null, 'date', 1], ['Cloth (from the library)', 'cloths', 'text', 0, 'Leave empty for a new cloth and fill the three columns after it'],
        ['New cloth: brand', null, 'text', 0], ['New cloth: colour', null, 'text', 0], ['New cloth: pattern', null, 'text', 0], ['Metres', null, 'num', 1], ['Cost a metre', null, 'num', 1], ['GST %', 'gst', 'text', 1], ['Where it goes', 'where', 'text', 1]],
      example: function () { var f = D().fabrics[0] || {}; return [[(one(D().vendors, f.vendor) || {}).name, 'ZI/2026/120', GE.localToday(), clothName(f), '', '', '', 12, f.cost, '5', 'Store'], [(one(D().vendors, f.vendor) || {}).name, 'ZI/2026/120', GE.localToday(), '', 'Ermenegildo Zegna', 'Grey', 'Birdseye', 8, 9600, '5', 'Godown']]; } },
    fabricLib: { title: 'Fabric library', where: 'Fabric library', note: 'One row per cloth a vendor offers. A row with the same brand, colour and vendor as an existing cloth updates it.',
      cols: [['Brand', null, 'text', 1], ['Colour', null, 'text', 1], ['Pattern', null, 'text', 0], ['Book', null, 'text', 0], ['Vendor', 'vendors', 'text', 1], ['Their price a metre', null, 'num', 1],
        ['They hold, metres', null, 'num', 0], ['Our selling price a metre', null, 'num', 0, 'Only the owner or BDM’s upload sets this'], ['Notify me under, metres', null, 'num', 0]],
      example: function () { return [['Vitale Barberis Canonico', 'Navy', 'Twill', 'Perennial', (D().vendors[0] || {}).name, 7200, 150, 12000, 5]]; } },
    vendors: { title: 'Vendors', where: 'Fabric library', note: 'One row per vendor. A row with an existing vendor’s name updates it.',
      cols: [['Vendor name', null, 'text', 1], ['City', null, 'text', 0], ['Days to deliver', null, 'num', 0], ['Contact', null, 'text', 0]],
      example: function () { return [['Vimal Textiles', 'Surat', 7, '+91 261 400 0000']]; } },
    designsOurs: { title: 'Our designs', where: 'Designs, ours', note: 'One row per design of ours. A row with an existing code updates that design.',
      cols: [['Our name for it', null, 'text', 1], ['Code', null, 'text', 0], ['Kind', 'kinds', 'text', 1], ['Designed by', 'people', 'text', 0], ['Size', null, 'text', 0], ['What it costs us', null, 'num', 1],
        ['What we sell it at', null, 'num', 1], ['Days to make another', null, 'num', 0], ['Where', 'where', 'text', 0]],
      example: function () { return [['Linen bandhgala, sand', 'SM-BG-030', GE.KINDS[0], (D().people[4] || {}).name, '40', 28000, 66000, 18, 'Store']]; } },
    stock: { title: 'Readymade stock received', where: 'Readymade stock, Designs third-party, On-order purchases, Consignment',
      note: 'One row per design and size. "How many" makes that many pieces, each with its own code. Rows with the same type, maker, bill and date become one purchase.',
      cols: [['Type', 'stockType', 'text', 1], ['Designer or maker', 'makers', 'text', 1], ['Their bill number', null, 'text', 0], ['Received on', null, 'date', 1], ['Design', null, 'text', 1], ['Kind', 'kinds', 'text', 1],
        ['Colour', null, 'text', 0], ['Size', null, 'text', 1], ['How many', null, 'num', 1], ['Cost before GST', null, 'num', 0, 'Not needed for consignment'], ['Price before GST', null, 'num', 1], ['GST %', 'gst', 'text', 1],
        ['Where', 'where', 'text', 1], ['Credit period, days', null, 'num', 0, 'On-order only, once per bill'], ['Advance paid', null, 'num', 0, 'On-order only, once per bill']],
      example: function () { return [['On-order', 'JJ Valaya', 'JJV/2026/0500', GE.localToday(), 'Ivory achkan, zardozi', 'Sherwani', 'Ivory', '40', 1, 95000, 160000, '18', 'Store', 60, 100000],
        ['On-order', 'JJ Valaya', 'JJV/2026/0500', GE.localToday(), 'Ivory achkan, zardozi', 'Sherwani', 'Ivory', '42', 2, 95000, 160000, '18', 'Store', '', ''],
        ['Consignment', 'Gaurav Gupta', '', GE.localToday(), 'Draped kurta, charcoal', 'Kurta', 'Charcoal', '40', 1, '', 142000, '18', 'Store', '', '']]; } },
    clients: { title: 'Clients', where: 'Clients', note: 'One row per client. A mobile number that is already on a client is refused.',
      cols: [['Name', null, 'text', 1], ['Country code', 'codes', 'text', 1], ['Mobile', null, 'text', 1], ['Source', 'sources', 'text', 1], ['Stylist', 'stylists', 'text', 1], ['Occasion', 'occasions', 'text', 0],
        ['Date of the occasion', null, 'date', 0], ['Delivery wanted by', null, 'date', 0], ['Household', 'households', 'text', 0], ['Who he is in it', null, 'text', 0], ['Birthday', null, 'date', 0], ['Note', null, 'text', 0]],
      example: function () { return [['Aditya Jalan', '+91', '9830012345', 'Referral', (L.stylists()[0] || ''), 'Sangeet', '2026-12-12', '2026-12-01', '', '', '', 'Wants an ivory sherwani']]; } },
    stitching: { title: 'Stitching charges', where: 'Stitching charges', note: 'One row per outfit. An existing outfit is updated. Only the owner or BDM’s upload is accepted.',
      cols: [['Outfit', 'kinds', 'text', 1, 'Pick, or type a new outfit'], ['Stitching', null, 'num', 1], ['Design charge', null, 'num', 0]],
      example: function () { return [['Bandi set', 9000, 3000]]; } },
    expenses: { title: 'Money out, expenses', where: 'Money in and out', note: 'One row per expense. Payments to designers or vendors are recorded on their purchases.',
      cols: [['Date', null, 'date', 1], ['What it was', 'expenseKinds', 'text', 1], ['Paid to', null, 'text', 1], ['Amount', null, 'num', 1], ['GST in it', null, 'num', 0], ['How', 'modes', 'text', 1], ['Reference', null, 'text', 0], ['Note', null, 'text', 0]],
      example: function () { return [[GE.localToday(), 'Porter / courier', 'Rahim Porter Services', 1200, 0, 'Cash', '', 'Godown to store']]; } }
  };
  GE.SHEETS = SHEETS;
  function listsOf(key) { var o = {}; SHEETS[key].cols.forEach(function (c) { if (c[1]) o[c[1]] = L[c[1]](); }); return o; }

  /* ---------- the sample sheet ---------- */
  A.sheetSample = function (key) {
    var S = SHEETS[key]; if (!S) return;
    need(function () {
      var wb = new window.ExcelJS.Workbook(), fill = wb.addWorksheet('Fill this'), how = wb.addWorksheet('How to fill'), ex = wb.addWorksheet('Examples'), lists = wb.addWorksheet('Lists');
      var lists0 = listsOf(key), listCols = Object.keys(lists0);
      listCols.forEach(function (name, i) {
        var col = i + 1; lists.getCell(1, col).value = name;
        lists0[name].forEach(function (v, r) { lists.getCell(r + 2, col).value = v; });
      });
      lists.state = 'hidden';
      fill.columns = S.cols.map(function (c) { return { header: c[0] + (c[3] ? ' *' : ''), key: c[0], width: Math.max(14, c[0].length + 4) }; });
      fill.getRow(1).font = { bold: true }; fill.views = [{ state: 'frozen', ySplit: 1 }];
      S.cols.forEach(function (c, i) {
        var letter = fill.getColumn(i + 1).letter;
        for (var r = 2; r <= 501; r++) {
          var cell = fill.getCell(letter + r);
          if (c[1]) { var li = listCols.indexOf(c[1]), L2 = lists.getColumn(li + 1).letter, n = Math.max(2, lists0[c[1]].length + 1);
            cell.dataValidation = { type: 'list', allowBlank: !c[3], formulae: ['Lists!$' + L2 + '$2:$' + L2 + '$' + n], showErrorMessage: c[0].indexOf('Outfit') < 0, errorTitle: 'Pick from the list', error: 'Choose a value from the dropdown.' }; }
          else if (c[2] === 'num') cell.dataValidation = { type: 'decimal', operator: 'greaterThanOrEqual', allowBlank: !c[3], formulae: [0], showErrorMessage: true, error: 'A number, 0 or more.' };
          else if (c[2] === 'date') { cell.dataValidation = { type: 'date', operator: 'greaterThan', allowBlank: !c[3], formulae: [new Date(2000, 0, 1)], showErrorMessage: true, error: 'A date, like 07/10/2026.' }; cell.numFmt = 'yyyy-mm-dd'; }
        }
      });
      how.getCell('A1').value = 'Saasya Men: ' + S.title; how.getCell('A1').font = { bold: true, size: 14 };
      how.getCell('A2').value = S.note;
      how.getCell('A3').value = 'Fill the "Fill this" tab. Columns with * are required. Dropdowns show today’s lists. Then upload the file on the ' + S.where + ' screen.';
      how.getCell('A4').value = 'Made on ' + GE.d(GE.localToday()) + '. If a list changes (a new vendor, designer or cloth), download a fresh sheet: it will carry it.';
      how.getCell('A6').value = 'Column'; how.getCell('B6').value = 'Required'; how.getCell('C6').value = 'What goes in it'; how.getRow(6).font = { bold: true };
      S.cols.forEach(function (c, i) { how.getCell('A' + (7 + i)).value = c[0]; how.getCell('B' + (7 + i)).value = c[3] ? 'Yes' : 'No';
        how.getCell('C' + (7 + i)).value = (c[1] ? 'Pick from the dropdown. ' : c[2] === 'date' ? 'A date. ' : c[2] === 'num' ? 'A number. ' : '') + (c[4] || ''); });
      how.getColumn(1).width = 30; how.getColumn(3).width = 70;
      ex.addRow(S.cols.map(function (c) { return c[0]; })).font = { bold: true };
      S.example().forEach(function (r) { ex.addRow(r); });
      var meta = wb.addWorksheet('_meta'); meta.getCell('A1').value = key; meta.getCell('A2').value = GE.localToday(); meta.state = 'veryHidden';
      wb.xlsx.writeBuffer().then(function (buf) {
        var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
        a.download = 'Saasya-Men-' + S.title.replace(/[^A-Za-z]+/g, '-') + '-sheet.xlsx'; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 500);
      });
      (D().sheetSeen = D().sheetSeen || {})[key] = { at: GE.localToday(), by: GE.me().id, lists: lists0 }; GE.save();
      GE.toast('The ' + S.title.toLowerCase() + ' sheet is downloading, with today’s lists in its dropdowns.');
    });
  };

  /* ---------- the upload ---------- */
  var PENDING = null;
  A.sheetUpload = function (key, el) {
    var f = el.files && el.files[0]; if (!f) return; el.value = '';
    need(function () {
      var fr = new FileReader();
      fr.onload = function (e) {
        var wb = new window.ExcelJS.Workbook();
        wb.xlsx.load(e.target.result).then(function () {
          var ws = wb.getWorksheet('Fill this') || wb.worksheets[0], meta = wb.getWorksheet('_meta'), rows = [];
          var mk = meta && meta.getCell('A1').value;
          if (mk && mk !== key) { GE.modal('<h2>Wrong sheet</h2><div class="note bad">This is the <b>' + esc(SHEETS[mk] ? SHEETS[mk].title : mk) + '</b> sheet. Upload it on its own screen, or download the ' + esc(SHEETS[key].title.toLowerCase()) + ' sheet here.</div>'); return; }
          ws.eachRow({ includeEmpty: false }, function (row, n) { if (n === 1) return; var vals = SHEETS[key].cols.map(function (c, i) { return cellText(row.getCell(i + 1).value, c[2]); }); if (vals.some(function (v) { return v !== ''; })) rows.push({ n: n, v: vals }); });
          preview(key, rows, meta ? meta.getCell('A2').value : '');
        }, function () { GE.toast('That file could not be read. Download the sample sheet and fill it.'); });
      };
      fr.readAsArrayBuffer(f);
    });
  };
  function cellText(v, type) {
    if (v == null) return '';
    if (v instanceof Date) return new Date(v.getTime() - v.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    if (typeof v === 'object') { if (v.result != null) v = v.result; else if (v.text) v = v.text; else if (v.richText) v = v.richText.map(function (r) { return r.text; }).join(''); }
    v = String(v).trim();
    if (type === 'date' && /^\d{2}\/\d{2}\/\d{4}$/.test(v)) { var p = v.split('/'); v = p[2] + '-' + p[1] + '-' + p[0]; }
    return v;
  }
  GE.cellText = cellText;
  /* check every row against today's lists; returns { errs, plan, say } where plan() saves */
  function checkRows(key, rows) {
    var S = SHEETS[key], errs = [], lists = listsOf(key), ok = [];
    rows.forEach(function (r) {
      var bad = [];
      S.cols.forEach(function (c, i) {
        var v = r.v[i];
        if (c[3] && v === '') bad.push(c[0] + ' is empty');
        else if (v !== '' && c[1] && lists[c[1]].indexOf(v) < 0 && c[0].indexOf('Outfit') < 0) bad.push('"' + v + '" is not in the ' + c[0].toLowerCase() + ' list');
        else if (v !== '' && c[2] === 'num' && isNaN(Number(v))) bad.push(c[0] + ' must be a number');
        else if (v !== '' && c[2] === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(v)) bad.push(c[0] + ' must be a date');
      });
      var extra = ROWCHECK[key] ? ROWCHECK[key](r.v) : '';
      if (extra) bad.push(extra);
      if (bad.length) errs.push('Row ' + r.n + ': ' + bad.join('; ') + '.'); else ok.push(r.v);
    });
    return { errs: errs, ok: ok };
  }
  GE.checkRows = checkRows;
  var ROWCHECK = {
    fabricIn: function (v) { return !v[3] && !v[4] ? 'choose a cloth from the library, or fill "New cloth: brand"' : ''; },
    stock: function (v) { var t = v[0]; if (t === 'Our own' && v[1] !== 'Saasya Men') return 'Our own stock is made by Saasya Men'; if (t !== 'Our own' && v[1] === 'Saasya Men') return 'On-order and consignment come from a designer'; if (t !== 'Consignment' && !(Number(v[9]) > 0)) return 'put in the cost before GST'; if (!(Number(v[8]) >= 1)) return 'How many must be 1 or more'; return ''; },
    clients: function (v) { var digits = String(v[2]).replace(/\D/g, ''); if (!GE.phoneOk(v[1], digits)) return v[1] === '+91' ? 'an Indian mobile is 10 digits starting 6 to 9' : 'check the mobile'; var full = GE.phoneJoin(v[1], digits).replace(/\D/g, ''); if (D().clients.some(function (c) { return String(c.phone || '').replace(/\D/g, '') === full; })) return 'this mobile is already on a client'; return ''; }
  };
  var APPLY = {
    fabricIn: function (rows) {
      var groups = {}, n = 0;
      rows.forEach(function (v) { var k = [v[0], v[1], v[2]].join('|'); (groups[k] = groups[k] || []).push(v); });
      Object.keys(groups).forEach(function (k) {
        var g = groups[k], ven = D().vendors.filter(function (x) { return x.name === g[0][0]; })[0], at = g[0][2], pid = 'FAB-' + ('0' + (GE.fabBills().length + 1)).slice(-2);
        while (one(D().purchases, pid)) pid += 'b';
        var total = 0;
        g.forEach(function (v) {
          var fab = D().fabrics.filter(function (f) { return clothName(f) === v[3]; })[0];
          if (!fab) { fab = { id: GE.uid('F-'), brand: v[4], colour: v[5], pattern: v[6], book: '', vendor: ven.id, cost: Number(v[8]) || 0, sell_m: 0, threshold: 5, procure_days: ven.days || 21, at_vendor: 0, hex: '#b9b2a6', img: '', sat_days: 0, sold_90: 0 }; D().fabrics.push(fab); }
          var m = Number(v[7]) || 0, c = Number(v[8]) || 0, gst = Number(v[9]) || 5; total += GE.withGst(m * c, gst); n += m;
          D().fabric_lots.push({ id: GE.uid('FL-'), code: GE.nextLotCode(at), fabric: fab.id, vendor: ven.id, at: at, metres: m, cost_m: c, gst: gst, bill: v[1], location: v[10] || 'Store', purchase: pid });
          if (c) fab.cost = c;
        });
        D().purchases.push({ id: pid, type: 'fabric', supplier: ven.id, at: at, credit_days: 30, advance: 0, bill: g[0][1], note: g.length + ' cloths from the sheet', amount: total });
      });
      return Object.keys(groups).length + ' fabric bills, ' + Math.round(n * 10) / 10 + ' m received';
    },
    fabricLib: function (rows) {
      var add = 0, upd = 0;
      rows.forEach(function (v) {
        var ven = D().vendors.filter(function (x) { return x.name === v[4]; })[0];
        var f = D().fabrics.filter(function (x) { return x.brand.toLowerCase() === v[0].toLowerCase() && x.colour.toLowerCase() === v[1].toLowerCase() && x.vendor === ven.id; })[0];
        if (!f) { f = { id: GE.uid('F-'), brand: v[0], colour: v[1], vendor: ven.id, hex: '#b9b2a6', img: '', sat_days: 0, sold_90: 0, threshold: 5, procure_days: ven.days || 21, sell_m: 0, at_vendor: 0 }; D().fabrics.push(f); add++; } else upd++;
        f.pattern = v[2] || f.pattern || ''; f.book = v[3] || f.book || ''; f.cost = Number(v[5]) || f.cost; if (v[6] !== '') f.at_vendor = Number(v[6]) || 0;
        if (v[7] !== '' && GE.canPrice()) f.sell_m = Number(v[7]) || 0; if (v[8] !== '') f.threshold = Number(v[8]) || 0;
      });
      return add + ' cloths added, ' + upd + ' updated';
    },
    vendors: function (rows) {
      var add = 0, upd = 0;
      rows.forEach(function (v) { var x = D().vendors.filter(function (y) { return y.name.toLowerCase() === v[0].toLowerCase(); })[0];
        if (!x) { x = { id: GE.uid('V-'), name: v[0], contact: '' }; D().vendors.push(x); add++; } else upd++;
        x.city = v[1] || x.city || ''; x.days = Number(v[2]) || x.days || 21; x.contact = v[3] || x.contact || ''; });
      return add + ' vendors added, ' + upd + ' updated';
    },
    designsOurs: function (rows) {
      var add = 0, upd = 0;
      rows.forEach(function (v) { var r = v[1] ? D().readymade.filter(function (x) { return x.code === v[1]; })[0] : null;
        if (!r) { r = { id: GE.uid('R-'), owner: 'Sasya', age_days: 0, made_count: 0, img: '' }; D().readymade.push(r); add++; } else upd++;
        r.name = v[0]; r.code = v[1]; r.kind = v[2]; r.designed_by = v[3] || r.designed_by || ''; r.size = v[4]; r.cost_to_make = Number(v[5]) || 0; r.price = Number(v[6]) || 0; r.make_days = Number(v[7]) || r.make_days || 0; r.warehouse = v[8] || 'Store'; });
      return add + ' designs added, ' + upd + ' updated';
    },
    stock: function (rows) {
      var groups = {}, typ = { 'On-order': 'on-order', 'Consignment': 'consignment', 'Our own': 'own' }, made = 0;
      rows.forEach(function (v) { var k = [v[0], v[1], v[2], v[3]].join('|'); (groups[k] = groups[k] || []).push(v); });
      Object.keys(groups).forEach(function (k) {
        var g = groups[k], t = typ[g[0][0]], sup = g[0][1] === 'Saasya Men' ? 'Sasya' : (D().designers.filter(function (x) { return x.name === g[0][1]; })[0] || {}).id;
        var lines = g.map(function (v) { var sz = []; for (var q = 0; q < Number(v[8]); q++) sz.push(v[7]); return { name: v[4], kind: v[5], colour: v[6], sizes: sz, cost_ex: v[9], price_ex: v[10], gst: v[11] }; });
        var first = g.filter(function (v) { return v[13] !== '' || v[14] !== ''; })[0] || g[0];
        made += GE.receiveLines(t, sup, g[0][3], g[0][2], g[0][12], lines, { credit: first[13], adv: first[14] }).length;
      });
      return made + ' pieces received on ' + Object.keys(groups).length + (Object.keys(groups).length === 1 ? ' bill' : ' bills');
    },
    clients: function (rows) {
      rows.forEach(function (v) {
        var fam = v[8] ? (D().families.filter(function (f) { return (f.name + (f.area ? ', ' + f.area : '')) === v[8]; })[0] || {}).id || '' : '';
        var sty = (D().people.filter(function (p) { return p.name === v[4]; })[0] || {}).id;
        D().clients.push({ id: GE.uid('C-'), family: fam, name: v[0], relation: v[9], phone: GE.phoneJoin(v[1], v[2]), email: '', dob: v[10], anniversary: '', source: v[3], stylist: sty, salesperson: sty, note: v[11], event: v[5], event_date: v[6], delivery_wanted: v[7] });
      });
      return rows.length + ' clients added';
    },
    stitching: function (rows) {
      if (!GE.canPrice()) return 'Nothing saved: only the owner or the BDM can set stitching charges';
      var add = 0;
      rows.forEach(function (v) { var x = D().stitching.filter(function (s) { return s.kind.toLowerCase() === v[0].toLowerCase(); })[0];
        if (!x) { x = { kind: v[0] }; D().stitching.push(x); add++; if (GE.KINDS.indexOf(v[0]) < 0) GE.KINDS.push(v[0]); }
        x.stitch = Number(v[1]) || 0; x.design = Number(v[2]) || 0; });
      return rows.length + ' outfits set, ' + add + ' new';
    },
    expenses: function (rows) {
      rows.forEach(function (v) { D().expenses.push({ id: GE.uid('EX-'), at: v[0], category: v[1], payee: v[2], amount: Number(v[3]) || 0, gst: Number(v[4]) || 0, mode: v[5], ref: v[6], note: v[7], by: GE.me().id }); });
      return rows.length + ' expenses recorded';
    }
  };
  GE.applySheet = function (key, rows) { var r = APPLY[key](rows); GE.save(); return r; };
  function preview(key, rows, madeOn) {
    var res = checkRows(key, rows), S = SHEETS[key];
    PENDING = res.errs.length ? null : { key: key, rows: res.ok };
    var old = madeOn && madeOn < GE.localToday() ? '<p class="hint">This sheet was made on ' + GE.d(madeOn) + '. It has been checked against today’s lists.</p>' : '';
    GE.modal('<h2>' + esc(S.title) + ': the sheet</h2>' + old +
      (!rows.length ? '<div class="note bad">The "Fill this" tab is empty.</div>' :
      res.errs.length ? '<div class="note bad"><b>Nothing has been saved. Fix these in the sheet and upload it again:</b><ul class="gone">' + res.errs.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div>' :
      '<p class="sub">' + rows.length + ' rows, all correct. Check, then save.</p><div style="overflow-x:auto;max-height:50vh"><table><thead><tr>' + S.cols.map(function (c) { return '<th>' + esc(c[0]) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        res.ok.slice(0, 200).map(function (v) { return '<tr>' + v.map(function (x) { return '<td>' + esc(x) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
        '<button class="btn gold" data-act="sheetSave">Save ' + rows.length + ' rows</button>'));
  }
  A.sheetSave = function () {
    if (!PENDING) return;
    var msg = GE.applySheet(PENDING.key, PENDING.rows); PENDING = null;
    GE.closeModal(); GE.refresh(); GE.toast('Saved from the sheet: ' + msg + '.');
  };
  /* the two buttons, placed beside each screen's own add button */
  GE.sheetButtons = function (key, label) {
    return '<button class="btn alt" data-act="sheetSample" data-id="' + key + '">Sample Excel' + (label ? ': ' + label : '') + '</button> ' +
      '<label class="btn alt upl1">Upload Excel' + (label ? ': ' + label : '') + '<input type="file" accept=".xlsx" data-input="sheetUpload" data-id="' + key + '" hidden></label>';
  };
  /* the Sheet Keeper's check: a sheet downloaded before a list it uses changed */
  GE.sheetDrift = function () {
    var out = [], seen = D().sheetSeen || {};
    Object.keys(seen).forEach(function (key) {
      if (!SHEETS[key]) return;
      var then = seen[key].lists || {}, now = listsOf(key), added = [], gone = [];
      Object.keys(now).forEach(function (l) { (now[l] || []).forEach(function (v) { if ((then[l] || []).indexOf(v) < 0) added.push(v); }); (then[l] || []).forEach(function (v) { if ((now[l] || []).indexOf(v) < 0) gone.push(v); }); });
      if (added.length || gone.length) out.push({ key: key, title: SHEETS[key].title, at: seen[key].at, added: added, gone: gone });
    });
    return out;
  };
})();
