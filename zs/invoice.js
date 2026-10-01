/* The invoice, as a real PDF.
 *
 * ⚠️ THIS IS A COPY OF AN INVOICE HE ALREADY SENDS, not a design of mine. Every
 * measurement below was taken off ZS/EGO/2026/003 and ZS/BER/2026/002 (both
 * raised 1 October 2026): the rule under the header, the two BILLED blocks, the
 * dark description band, the right-hand totals, the lime-barred note, the
 * payment block beside the due-date chip, the centred footer. The point of a
 * template is that the next one looks like the last one.
 *
 * WHY IT IS DRAWN RATHER THAN PRINTED. The browser's own Save as PDF would
 * reproduce an HTML version perfectly and hand the file to the person, and the
 * cockpit would never see the bytes — so there would be nothing to store against
 * the engagement and nothing to put a share link on. Drawing it gives us the
 * file itself, which is what makes it sendable.
 *
 * WHY NOT HTML-TO-CANVAS. html2canvas puts a PICTURE of the page in the PDF:
 * blurry on paper, text not selectable, not searchable, and three times the
 * size. An invoice is a document somebody's accountant will copy a number out of.
 *
 * ⚠️ THE RUPEE SIGN IS THE WHOLE REASON vendor/invoice-fonts.js EXISTS. The PDF
 * standard fonts are WinAnsi and have no ₹. See that file.
 */
(function () {
  'use strict';
  var G = window.GE;

  /* A4 in points, which is what jsPDF measures in. */
  var W = 595.28, H = 841.89;
  var M = 48;                 /* side margin */
  var R = W - M;              /* the right edge every amount is aligned to */

  var INK = [17, 17, 17];
  var LIME = [138, 158, 20];  /* the brand lime, darkened so it reads on white */
  var GREY = [110, 110, 110];
  var FAINT = [224, 224, 224];
  var BAND = [245, 245, 241];

  function ready() {
    return !!(window.jspdf && window.jspdf.jsPDF && window.ZS_INVOICE_FONTS);
  }

  function doc() {
    var d = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4', compress: true });
    d.addFileToVFS('Inter-Regular.ttf', window.ZS_INVOICE_FONTS.regular);
    d.addFont('Inter-Regular.ttf', 'Inter', 'normal');
    d.addFileToVFS('Inter-SemiBold.ttf', window.ZS_INVOICE_FONTS.semibold);
    d.addFont('Inter-SemiBold.ttf', 'Inter', 'bold');
    d.setFont('Inter', 'normal');
    return d;
  }

  /* ---------------- small drawing helpers ---------------- */

  function set(d, size, weight, colour, space) {
    d.setFont('Inter', weight || 'normal');
    d.setFontSize(size);
    var c = colour || INK;
    d.setTextColor(c[0], c[1], c[2]);
    d.setCharSpace(space || 0);
  }
  function rule(d, y, x1, x2, colour, w) {
    var c = colour || FAINT;
    d.setDrawColor(c[0], c[1], c[2]);
    d.setLineWidth(w || 0.7);
    d.line(x1 == null ? M : x1, y, x2 == null ? R : x2, y);
  }
  function fill(d, x, y, w, h, colour) {
    d.setFillColor(colour[0], colour[1], colour[2]);
    d.rect(x, y, w, h, 'F');
  }
  /* The small letter-spaced labels: BILLED BY, DESCRIPTION, DUE DATE. */
  function eyebrow(d, text, x, y, colour) {
    set(d, 7.5, 'bold', colour || LIME, 1.1);
    d.text(String(text || '').toUpperCase(), x, y);
    d.setCharSpace(0);
  }
  function lines(d, text, x, y, leading, max) {
    var out = y;
    String(text == null ? '' : text).split('\n').forEach(function (ln) {
      var wrapped = max ? d.splitTextToSize(ln, max) : [ln];
      wrapped.forEach(function (w2) { d.text(w2, x, out); out += leading; });
    });
    return out;
  }

  /* ---------------- the document ---------------- */

  /* `inv` is the invoice record, `o` the engagement, `c` the client, `t` the
     template out of Settings. Nothing is read from the screen: the same inputs
     always draw the same page, which is what makes it checkable. */
  function build(inv, o, c, t, logoData) {
    var d = doc();
    var tot = ZS.invoiceTotals(inv, t.gst_rate);
    var billTo = inv.bill_to || ZS.billToFrom(c);

    /* ---- header ---- */
    if (logoData) {
      try { d.addImage(logoData, 'PNG', M, 52, 104, 0); }
      catch (e) { /* a logo that will not decode must not cost the invoice */ }
    }
    if (!logoData) { set(d, 15, 'bold'); d.text(t.legal_name || '', M, 72); }

    set(d, 23, 'bold', INK, 2.2);
    d.text('INVOICE', R, 76, { align: 'right' });
    d.setCharSpace(0);

    var hy = 100;
    [['Invoice No:', inv.number || inv.ref || ''],
     ['Invoice Date:', ZS.longDate(inv.raised)],
     ['Due Date:', inv.due_text || ZS.longDate(inv.due)]].forEach(function (row) {
      if (!row[1]) return;
      set(d, 8.5, 'bold');
      var vw = d.getTextWidth(row[1]);
      d.text(row[1], R, hy, { align: 'right' });
      set(d, 8.5, 'normal', GREY);
      d.text(row[0], R - vw - 5, hy, { align: 'right' });
      hy += 14;
    });

    rule(d, 134, M, R, INK, 2);

    /* ---- billed by / billed to ---- */
    var colR = M + 272;
    eyebrow(d, 'Billed by', M, 164);
    eyebrow(d, 'Billed to', colR, 164);
    rule(d, 169, M, M + 56, LIME, 1);
    rule(d, 169, colR, colR + 56, LIME, 1);

    set(d, 10.5, 'bold');
    d.text(t.legal_name || '', M, 190);
    d.text(billTo.name || '', colR, 190, { maxWidth: 232 });

    set(d, 8.3, 'normal', GREY);
    var ly = 210;
    if (t.byline) { d.text(t.byline, M, ly); ly += 14.5; }
    lines(d, t.address, M, ly, 14.5, 236);
    if (t.email) {
      var ay = ly + String(t.address || '').split('\n').length * 14.5;
      d.text('Email: ' + t.email, M, ay);
    }

    var ry = 210;
    ry = lines(d, billTo.lines, colR, ry, 14.5, 232);
    if (billTo.attn) { d.text('Attn: ' + billTo.attn, colR, ry); ry += 14.5; }
    if (billTo.mobile) {
      d.text('Mobile: ' + ((billTo.dial ? billTo.dial + ' ' : '') + billTo.mobile).trim(),
             colR, ry);
      ry += 14.5;
    }
    if (billTo.gst) { d.text('GSTIN: ' + billTo.gst, colR, ry); ry += 14.5; }

    /* ---- the description band ---- */
    var ty = 286;
    fill(d, M, ty, R - M, 25, INK);
    /* the amount column sits on its own, slightly lighter block, as on his */
    fill(d, R - 118, ty, 118, 25, [34, 34, 34]);
    eyebrow(d, 'Description', M + 11, ty + 16.5, [255, 255, 255]);
    set(d, 7.5, 'bold', [255, 255, 255], 1.1);
    d.text('AMOUNT', R - 11, ty + 16.5, { align: 'right' });
    d.setCharSpace(0);

    /* ⚠️ MEASURED, NOT ASSUMED. The scope is a real sentence and it wraps: the
       first version put the detail line at a fixed offset and a two-line scope
       printed straight through it. splitTextToSize tells us how many lines it
       actually became. */
    var ry2 = ty + 46;
    set(d, 9.5, 'normal');
    var scopeLines = d.splitTextToSize(inv.scope || ('Phase ' + (inv.n || 1)), R - M - 150);
    scopeLines.forEach(function (ln, i) { d.text(ln, M + 11, ry2 + i * 13); });
    var below = ry2 + scopeLines.length * 13;
    set(d, 9.5, 'normal');
    d.text(ZS.rupees(tot.order || inv.amount), R - 11, ry2, { align: 'right' });
    if (inv.detail) {
      set(d, 7.6, 'normal', GREY);
      var dl = d.splitTextToSize(inv.detail, R - M - 150);
      dl.forEach(function (ln, i) { d.text(ln, M + 11, below + 2 + i * 11); });
      below += 2 + dl.length * 11;
    }
    rule(d, below + 6, M, R, FAINT, 0.7);

    /* ---- the totals, right-hand side ----
       ⚠️ The order value and the deductions are shown even when there are none,
       because a client reading "Total Due" with no working shown is a client who
       writes back to ask what it is for. */
    var x = M + 290, vy = below + 34;
    var row = function (label, value, bold) {
      set(d, 9, bold ? 'bold' : 'normal', bold ? INK : GREY);
      d.text(label, x, vy);
      set(d, 9, bold ? 'bold' : 'normal', INK);
      d.text(value, R, vy, { align: 'right' });
      vy += 20;
    };

    var hasCuts = (inv.deductions || []).length > 0;
    row(hasCuts ? 'Order value' : 'Subtotal', ZS.rupees(tot.order || inv.amount));
    (inv.deductions || []).forEach(function (cut) {
      if (!cut || !Number(cut.amount)) return;
      row(cut.label || 'Less', '– ' + ZS.rupees(cut.amount));
    });
    row('GST', tot.rate ? ZS.rupees(tot.gst) + '  (' + tot.rate + '%)' : 'Not Applicable');

    rule(d, vy - 14, x, R, INK, 0.9);
    vy += 4;
    set(d, 12, 'bold');
    d.text(hasCuts ? 'Total Due Now' : 'Total Due', x, vy);
    d.text(ZS.rupees(tot.total || inv.amount), R, vy, { align: 'right' });

    /* ---- the note ---- */
    var noteLines = [];
    if (!t.gst_registered && t.gst_note) noteLines.push(t.gst_note);
    if (inv.note) noteLines.push(inv.note);
    var ny = vy + 28;
    if (noteLines.length) {
      var txt = noteLines.join('\n');
      var wrapped = [];
      txt.split('\n').forEach(function (ln, i) {
        if (i) wrapped.push('');          /* his leaves a line between them */
        wrapped = wrapped.concat(d.splitTextToSize(ln, R - M - 36));
      });
      var nh = wrapped.length * 13 + 22;
      fill(d, M, ny, R - M, nh, BAND);
      fill(d, M, ny, 3, nh, LIME);
      set(d, 8.3, 'normal', [70, 70, 70]);
      var wy = ny + 17;
      wrapped.forEach(function (ln) { d.text(ln, M + 20, wy); wy += 13; });
      ny += nh;
    }

    /* ---- payment details and the due-date chip ----

       ⚠️ ANCHORED NEAR THE BOTTOM, where it sits on his. The first version put
       it a fixed distance below the note, so a long note walked the bank details
       straight through the footer rule. It sits at the anchor when there is room
       and moves down when the note is tall; if that would run off the page it
       goes on a second page rather than printing over anything. */
    var PAY_H = 120;              /* eyebrow, four rows at 26, and the last rule */
    var ANCHOR = 632;             /* where it sits on his when there is room */
    var py = Math.max(ANCHOR, ny + 26);
    if (py + PAY_H > H - 84) { d.addPage(); py = 90; }
    eyebrow(d, 'Payment account details', M, py);
    rule(d, py + 5, M, M + 172, LIME, 1);

    var pay = [['Account Name', t.bank_holder], ['Bank', t.bank_name],
               ['Account No.', t.bank_account], ['IFSC', t.bank_ifsc]];
    var byy = py + 30;
    pay.forEach(function (p) {
      if (!p[1]) return;
      set(d, 8.5, 'normal', GREY);
      d.text(p[0], M, byy);
      set(d, 8.5, 'bold');
      d.text(String(p[1]), M + 268, byy, { align: 'right' });
      rule(d, byy + 9, M, M + 268, [238, 238, 238], 0.6);
      byy += 26;
    });

    var dx = M + 304;
    eyebrow(d, 'Due date', dx, py);
    var chip = inv.due_text || ZS.longDate(inv.due) || '';
    if (chip) {
      set(d, 9, 'bold');
      var cw = d.getTextWidth(chip) + 26;
      fill(d, dx + 62, py - 12, cw, 23, INK);
      set(d, 9, 'bold', [255, 255, 255]);
      d.text(chip, dx + 62 + cw / 2, py + 3.5, { align: 'center' });
    }
    if (inv.pay_line) {
      set(d, 8.5, 'normal', [70, 70, 70]);
      lines(d, inv.pay_line, dx, py + 36, 14, R - dx);
    }

    /* ---- footer, on every page there turned out to be ---- */
    var pages = d.getNumberOfPages();
    for (var p = 1; p <= pages; p++) {
      d.setPage(p);
      rule(d, H - 70, M, R, FAINT, 0.7);
      set(d, 7.6, 'normal', GREY);
      d.text(t.footer || '', W / 2, H - 52, { align: 'center' });
    }

    return d;
  }

  /* ---------------- the logo, as bytes ----------------
     jsPDF wants a data URL. The bundled file is fetched once and kept, and an
     uploaded one in Settings is used as it is. A missing logo prints the legal
     name instead rather than failing. */
  var logoCache = null;
  function logo(t) {
    if (t.logo) return Promise.resolve(t.logo);
    if (logoCache) return Promise.resolve(logoCache);
    return fetch('img/zippyscale-logo-full.png')
      .then(function (r) { return r.ok ? r.blob() : null; })
      .then(function (b) {
        if (!b) return null;
        return new Promise(function (res) {
          var fr = new FileReader();
          fr.onload = function () { logoCache = fr.result; res(logoCache); };
          fr.onerror = function () { res(null); };
          fr.readAsDataURL(b);
        });
      })
      .catch(function () { return null; });
  }

  /* ---------------- what the rest of the cockpit calls ---------------- */

  G.invoicePdf = function (inv, o, c) {
    if (!ready()) {
      return Promise.reject(new Error('The PDF engine did not load. Reload the page.'));
    }
    var t = ZS.invoiceTemplate(G.D());
    return logo(t).then(function (img) {
      var d = build(inv, o, c, t, img);
      return { dataUrl: d.output('datauristring'),
               name: fileName(inv, c),
               doc: d };
    });
  };

  function fileName(inv, c) {
    var who = String((c && c.name) || 'Client').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
    var num = String(inv.number || inv.ref || '').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
    return 'ZippyScale_Invoice_' + who + (num ? '_' + num : '') + '.pdf';
  }
  G.invoiceFileName = fileName;
  G.invoicePdfReady = ready;
})();
