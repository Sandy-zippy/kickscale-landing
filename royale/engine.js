// Royale Product Discovery Portal — demo engine.
// Catalogue generator (synthetic, deterministic) + filter engine + brief interpreter.
// ponytail: runs fully in the browser on generated data; production = Supabase rows + Gemini interpreter + pgvector.
(function (root) {
  // ---------- seeded RNG so the catalogue is identical every run ----------
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  const OCCASIONS = ['Corporate', 'Diwali & festive', 'New Year', 'Onboarding', 'Conference & events', 'Wedding', 'Anniversary', 'Rewards & recognition'];
  const RECIPIENTS = ['Employees', 'Clients', 'Doctors & professionals', 'Leadership & CXOs', 'Dealers & channel partners', 'Women', 'Men'];
  const PACKS = ['Gift box', 'Bulk ready', 'Hamper', 'Eco pack', 'Premium box'];
  const ATTRS = ['Premium', 'Logo brandable', 'Eco-friendly', 'Made in India', 'Unisex', 'Sample in office', 'UCPMP-safe for doctors'];

  // category: code, named vendors (from Royale's range + typical gifting brands), product bases [name, minPrice, maxPrice, materials, occasions idx, recipients idx]
  const CATS = [
    { name: 'Perfume & Fragrance', code: 'FRG', icon: 'bottle', vendors: ['Yardley London', 'Park Avenue', 'Enchanteur', 'Aramusk', 'Santoor', 'Cantabil', 'Fogg', 'Engage', 'Wild Stone', 'Bella Vita'],
      variants: ['50 ml', '100 ml', '125 ml', '150 ml', 'twin pack', 'gift box', 'travel set', 'premium gift set'],
      bases: [['English Lavender EDT', 380, 1400, ['Glass'], [0, 1, 7], [0, 1, 5]], ['Signature EDP', 700, 2600, ['Glass'], [0, 1, 6], [1, 3]], ['Royal Sandalwood body spray', 250, 700, ['Aluminium'], [0, 1], [0, 6]], ['English Rose EDT', 450, 1500, ['Glass'], [1, 5, 6], [5, 1]], ['Grooming kit, deo + aftershave', 600, 1800, ['Glass', 'Aluminium'], [0, 3, 7], [0, 6]], ['Voyage EDP corporate box', 900, 2400, ['Glass'], [0, 4], [1, 2, 3]], ['Attar collection', 500, 3200, ['Glass'], [1, 5], [1, 3]], ['Room & car fragrance set', 300, 1100, ['Glass', 'Wood'], [0, 1, 4], [0, 1, 2]]] },
    { name: 'Electronics & Gadgets', code: 'ELE', icon: 'bolt', vendors: ['boAt', 'Noise', 'Portronics', 'Ambrane', 'JBL', 'Stuffcool', 'Zebronics', 'Lapcare', 'Mivi', 'Philips'],
      variants: ['black', 'white', 'midnight blue', 'with logo engraving', 'gift box', 'combo'],
      bases: [['Bluetooth speaker 10W', 1200, 4500, ['Plastic', 'Fabric'], [0, 1, 7], [0, 1, 3]], ['Wireless earbuds', 1100, 3800, ['Plastic'], [0, 3, 7], [0, 1]], ['Power bank 10000 mAh', 700, 2200, ['Aluminium', 'Plastic'], [0, 3, 4], [0, 1, 2]], ['Smartwatch', 1800, 6500, ['Silicone', 'Metal'], [7, 1, 6], [0, 3]], ['Wireless charging pad', 650, 2400, ['Plastic', 'Wood'], [0, 4], [1, 2, 3]], ['Tech organiser kit', 800, 2600, ['PU leather'], [3, 4], [0, 2]], ['Desk lamp with charger', 1400, 3900, ['Metal'], [0, 1], [2, 3]], ['Neckband earphones', 600, 1600, ['Plastic'], [3, 4], [0, 4]]] },
    { name: 'Apparel', code: 'APP', icon: 'shirt', vendors: ['Cantabil', 'Peter England', 'Van Heusen', 'Allen Solly', 'US Polo Assn.', 'Tee Tree Uniforms', 'Hanes', 'Campus Sutra'],
      variants: ['navy', 'black', 'white', 'maroon', 'olive', 'grey melange', 'with embroidery'],
      bases: [['Cotton polo T-shirt', 350, 1200, ['Cotton'], [0, 3, 4], [0, 4]], ['Dri-fit event T-shirt', 250, 700, ['Polyester'], [4, 3], [0, 4]], ['Winter jacket', 1500, 4800, ['Polyester', 'Nylon'], [7, 2], [0, 3]], ['Hoodie', 800, 2200, ['Cotton'], [3, 2], [0]], ['Formal shirt gift box', 900, 2600, ['Cotton'], [1, 6, 7], [1, 3, 6]], ['Cap', 150, 500, ['Cotton'], [4, 3], [0, 4]], ['Silk stole', 600, 2400, ['Silk'], [1, 5], [5, 1]]] },
    { name: 'Bags & Travel', code: 'BAG', icon: 'bag', vendors: ['American Tourister', 'Wildcraft', 'Skybags', 'Safari', 'Mokobara', 'Hidesign', 'Arctic Fox', 'Da Milano'],
      variants: ['15.6 inch', 'black', 'grey', 'navy', 'with logo patch', 'expandable'],
      bases: [['Laptop backpack', 1100, 4200, ['Polyester', 'Nylon'], [3, 0, 4], [0, 1]], ['Trolley cabin bag', 3200, 9500, ['Polycarbonate'], [7, 6, 1], [3, 1]], ['Duffle bag', 1200, 3900, ['Polyester', 'Canvas'], [7, 0], [0, 4]], ['Leather messenger bag', 2800, 8900, ['Leather'], [1, 6], [3, 1, 6]], ['Jute tote', 180, 650, ['Jute'], [4, 0], [0, 5, 2]], ['Conference bag', 250, 900, ['Canvas', 'Polyester'], [4], [2, 0]], ['Travel pouch kit', 500, 1600, ['PU leather'], [7, 1], [0, 1]]] },
    { name: 'Stationery & Desk', code: 'STN', icon: 'pen', vendors: ['Parker', 'Cross', 'Pierre Cardin', 'Montblanc', 'Matrikas', 'Doodle', 'Classmate', 'Luxor'],
      variants: ['gift box', 'with name engraving', 'set of 2', 'A5', 'executive edition', 'black', 'blue'],
      bases: [['Ball pen', 250, 2800, ['Metal'], [0, 4, 7], [1, 2, 3]], ['Pen + diary set', 450, 1900, ['PU leather', 'Paper'], [2, 0, 4], [0, 1, 2]], ['Executive diary 2027', 300, 1200, ['PU leather', 'Paper'], [2, 0], [0, 1, 2, 4]], ['Desk organiser', 600, 2400, ['Wood', 'Metal'], [0, 3], [3, 1]], ['Card holder', 350, 1500, ['Leather', 'Metal'], [0, 4], [2, 3, 1]], ['Planter pen stand', 300, 900, ['Bamboo'], [0, 4], [0, 2]], ['Fountain pen', 1200, 9500, ['Metal'], [7, 6], [3, 2]]] },
    { name: 'Drinkware', code: 'DRK', icon: 'cup', vendors: ['Milton', 'Borosil', 'Cello', 'Hydro Flask India', 'Treo', 'Nestasia', 'Eco Bamboo Co.'],
      variants: ['500 ml', '750 ml', '1 L', 'black', 'steel', 'with logo', 'set of 2'],
      bases: [['Vacuum flask', 450, 1600, ['Steel'], [0, 3, 4], [0, 2, 4]], ['Coffee mug', 150, 650, ['Ceramic'], [3, 4], [0, 2]], ['Temperature display bottle', 400, 1200, ['Steel'], [3, 0], [0, 2]], ['Bamboo tumbler', 350, 900, ['Bamboo'], [4, 0], [0, 2]], ['Glass bottle with sleeve', 300, 850, ['Glass'], [4, 3], [0, 5]], ['Tea gift set', 900, 3200, ['Ceramic'], [1, 6], [1, 3]]] },
    { name: 'Home & Kitchen', code: 'HOM', icon: 'home', vendors: ['Prestige', 'Borosil', 'Wonderchef', 'Pigeon', 'Home Centre', 'Good Earth', 'Chumbak', 'Ellementry'],
      variants: ['gift pack', 'set of 3', 'set of 6', 'premium', 'festive edition'],
      bases: [['Dinner set', 1800, 7800, ['Ceramic', 'Opalware'], [1, 5, 6], [0, 1, 3]], ['Casserole set', 800, 2400, ['Steel'], [1, 5], [0, 4]], ['Brass diya set', 400, 1800, ['Brass'], [1], [0, 1, 4]], ['Copper bottle + glasses', 900, 2600, ['Copper'], [1, 5, 6], [1, 2, 3]], ['Scented candle set', 350, 1500, ['Wax', 'Glass'], [1, 2], [5, 0, 1]], ['Serving platter', 700, 3200, ['Wood', 'Brass'], [1, 5], [1, 3]]] },
    { name: 'Gourmet & Dry Fruits', code: 'GRM', icon: 'gift', vendors: ['Happilo', 'Nutraj', 'Ferrero Rocher', 'Cadbury Gifting', 'Smoor', 'Bombay Sweet Shop', 'Tea Trunk'],
      variants: ['250 g', '500 g', '1 kg', 'box of 12', 'festive tin', 'premium tray'],
      bases: [['Dry fruit gift box', 500, 3200, ['Wood', 'Cardboard'], [1, 2], [0, 1, 4]], ['Chocolate assortment', 350, 2200, ['Cardboard'], [1, 2, 6], [0, 1]], ['Mithai & namkeen box', 400, 1600, ['Cardboard'], [1], [0, 4]], ['Tea & cookies hamper', 700, 2600, ['Jute', 'Wood'], [1, 2], [1, 2]], ['Gourmet nuts trio', 600, 2000, ['Glass'], [1, 2], [1, 3]]] },
    { name: 'Wellness & Personal Care', code: 'WEL', icon: 'leaf', vendors: ['Santoor', 'Forest Essentials', 'Kama Ayurveda', 'Himalaya', 'The Body Shop', 'Mamaearth', 'HealthSense'],
      variants: ['travel size', 'gift box', 'trio', 'festive edition', 'men', 'women'],
      bases: [['Bath & body gift set', 450, 2800, ['Glass', 'Plastic'], [1, 7], [5, 0]], ['Ayurvedic skincare kit', 900, 3600, ['Glass'], [1, 6], [5, 1, 3]], ['Yoga mat + bottle kit', 900, 2400, ['TPE', 'Steel'], [3, 7], [0]], ['Massager', 1200, 4500, ['Plastic'], [7, 6], [3, 1]], ['Digital BP monitor', 1500, 3200, ['Plastic'], [4, 0], [2, 3]], ['Grooming kit', 700, 2600, ['Metal'], [7, 1], [6, 0]]] },
    { name: 'Hampers & Kits', code: 'HMP', icon: 'box', vendors: ['Royale Curated', 'The Gift Studio', 'Boxup Partners', 'Kraft Hampers Co.'],
      variants: ['classic', 'premium', 'deluxe', 'mini', 'eco edition'],
      bases: [['Diwali hamper, diya + dry fruits', 900, 5200, ['Wood', 'Brass', 'Jute'], [1], [0, 1, 4]], ['New joiner welcome kit', 1200, 4200, ['Cardboard'], [3], [0]], ['Doctor\'s desk kit, pen + diary + planter', 600, 1800, ['Bamboo', 'Paper'], [4, 0], [2]], ['New Year desk hamper', 800, 3000, ['Wood'], [2], [1, 0]], ['Gold gift hamper, EDT + talc + soap', 900, 1900, ['Glass', 'Cardboard'], [1, 6], [1, 5]], ['Conference delegate kit', 350, 1400, ['Jute', 'Paper'], [4], [2, 0]], ['Wedding return gift box', 400, 2200, ['Brass', 'Velvet'], [5], [1]]] },
    { name: 'Awards & Trophies', code: 'AWD', icon: 'star', vendors: ['Trophy House Mumbai', 'Crystal Craft India', 'Momento Makers'],
      variants: ['6 inch', '8 inch', '10 inch', 'with engraving', 'wooden base'],
      bases: [['Crystal award', 700, 3500, ['Crystal'], [7, 6], [0, 4]], ['Metal memento', 450, 2200, ['Metal', 'Wood'], [7, 4], [0, 2, 4]], ['Wooden plaque', 350, 1500, ['Wood'], [7, 6], [0, 4]]] },
    { name: 'Watches & Clocks', code: 'WAT', icon: 'clock', vendors: ['Titan', 'Fastrack', 'Sonata', 'Casio', 'Ajanta Clocks', 'Timex'],
      variants: ['men', 'women', 'couple set', 'gift box', 'black dial', 'rose gold'],
      bases: [['Analog wrist watch', 1200, 7800, ['Steel', 'Leather'], [7, 6, 1], [0, 3, 1]], ['Wall clock with logo', 450, 1800, ['Plastic', 'Wood'], [0, 4], [4, 2]], ['Desk clock', 400, 1600, ['Wood', 'Metal'], [0, 4], [2, 1]], ['Couple watch set', 3000, 9500, ['Steel'], [5, 6], [1, 3]]] },
  ];
  const PREMIUM = new Set(['Montblanc', 'Cross', 'Hidesign', 'Da Milano', 'Mokobara', 'Forest Essentials', 'Kama Ayurveda', 'Good Earth', 'JBL', 'Titan', 'Philips', 'Van Heusen', 'American Tourister', 'Ferrero Rocher', 'Smoor', 'Bombay Sweet Shop']);
  const COLORS = ['Black', 'White', 'Blue', 'Brown', 'Grey', 'Gold', 'Silver', 'Red', 'Green', 'Pink'];
  const FILLER_A = ['Shree', 'Balaji', 'Mumbai', 'Siddhi', 'Om', 'Jai Ambe', 'Kohinoor', 'Laxmi', 'Vardhman', 'Ganesh', 'Navkar', 'Mahavir', 'Sai', 'Bhavani', 'Parshva', 'Ashapura', 'Deccan', 'Western', 'Crown', 'Pearl'];
  const FILLER_B = ['Enterprises', 'Traders', 'Gift House', 'Impex', 'Industries', 'Creations', 'Corporation', 'Marketing', 'Agencies', 'Exports'];

  function build(total) {
    total = total || 104382;
    const r = rng(20260916), pick = a => a[(r() * a.length) | 0];
    // 362 vendors: named brands + regional suppliers spread over categories
    const vendors = []; // {name, cat}
    CATS.forEach((c, ci) => c.vendors.forEach(v => vendors.push({ name: v, cat: ci, brand: true })));
    let i = 0;
    while (vendors.length < 362) { const n = FILLER_A[i % FILLER_A.length] + ' ' + FILLER_B[(i * 7 + 3) % FILLER_B.length]; i++; if (!vendors.some(v => v.name === n)) vendors.push({ name: n, cat: i % CATS.length }); else vendors.push({ name: n + ' ' + (i % 9 + 2), cat: i % CATS.length }); }
    const byCat = CATS.map((_, ci) => vendors.map((v, vi) => v.cat === ci ? vi : -1).filter(x => x >= 0));
    const items = new Array(total);
    let samples = 0;
    for (let k = 0; k < total; k++) {
      const ci = (r() * CATS.length) | 0, c = CATS[ci], b = pick(c.bases);
      let vi = r() < 0.72 ? byCat[ci][(r() * Math.min(byCat[ci].length, c.vendors.length)) | 0] : pick(byCat[ci]);
      const prem = PREMIUM.has(vendors[vi].name);
      if (prem && b[2] < 1500) { const regional = byCat[ci].filter(x => !vendors[x].brand); vi = regional.length ? pick(regional) : byCat[ci][0]; }
      const mult = PREMIUM.has(vendors[vi].name) ? 1.8 : 1;
      const price = Math.round(mult * (b[1] + Math.pow(r(), 1.6) * (b[2] - b[1])) / 10) * 10 - (r() < 0.4 ? 1 : 0);
      const occ = b[4].slice(); if (r() < 0.5) occ.push(0);
      const rec = b[5].slice(); if (r() < 0.2) rec.push((r() * RECIPIENTS.length) | 0);
      const attrs = [];
      if (mult > 1 || price > b[1] + (b[2] - b[1]) * 0.55) attrs.push(0);
      if (r() < 0.6) attrs.push(1);
      if (b[3].some(m => /Bamboo|Jute|Cotton|Wood|Paper|Canvas/.test(m)) && r() < 0.7) attrs.push(2);
      if (r() < 0.45) attrs.push(3);
      if (ci === 0 && r() < 0.4) attrs.push(4);
      // UCPMP 2024: pharma may give doctors only professional-use items up to ₹1,000
      if (price <= 1000 && (ci === 4 || /^Doctor's desk kit|^Conference bag/.test(b[0]))) attrs.push(6);
      if (samples < 350 && r() < 0.0036) { attrs.push(5); samples++; }
      const packs = [r() < 0.6 ? 0 : 4]; if (price < 900 && r() < 0.6) packs.push(1); if (attrs.includes(2)) packs.push(3); if (ci === 9) packs.push(2);
      const moq = pick([10, 25, 25, 50, 50, 100, 100, 200, 500]);
      items[k] = {
        id: 'RC-' + c.code + '-' + String(k + 1).padStart(6, '0'), name: b[0] + ', ' + pick(c.variants), cat: ci, vendor: vi, price,
        occ: [...new Set(occ)], rec: [...new Set(rec)], pack: [...new Set(packs)], attr: [...new Set(attrs)], mat: b[3], color: pick(COLORS),
        moq, stock: moq * pick([2, 4, 10, 20, 50]), lead: pick([3, 5, 7, 7, 10, 14, 21]), hue: (ci * 29 + (k % 7) * 9) % 360,
      };
    }
    return { items, vendors, cats: CATS };
  }

  // ---------- filter engine: one pass, returns results + facet counts ----------
  // f = {cat:Set, vendor:Set, min, max, occ:Set, rec:Set, pack:Set, attr:Set, qty, lead, text:[terms]}
  const GROUPS = ['cat', 'vendor', 'occ', 'rec', 'pack', 'attr'];
  function has(arrOrVal, set) { if (!set || !set.size) return true; if (Array.isArray(arrOrVal)) { for (const x of arrOrVal) if (set.has(x)) return true; return false; } return set.has(arrOrVal); }
  function search(db, f) {
    const t0 = (typeof performance !== 'undefined' ? performance : Date).now();
    const counts = { cat: {}, vendor: {}, occ: {}, rec: {}, pack: {}, attr: {} };
    const out = [];
    const terms = (f.text || []).map(s => s.toLowerCase());
    for (const it of db.items) {
      if (f.min != null && it.price < f.min) continue;
      if (f.max != null && it.price > f.max) continue;
      if (f.qty && it.moq > f.qty) continue;
      if (f.lead && it.lead > f.lead) continue;
      if (terms.length) { const hay = (it.name + ' ' + it.mat.join(' ') + ' ' + it.color).toLowerCase(); if (!terms.every(t => hay.includes(t))) continue; }
      let failed = null, fails = 0;
      if (!has(it.cat, f.cat)) { failed = 'cat'; fails++; }
      if (!has(it.vendor, f.vendor)) { failed = 'vendor'; fails++; }
      if (fails < 2 && !has(it.occ, f.occ)) { failed = 'occ'; fails++; }
      if (fails < 2 && !has(it.rec, f.rec)) { failed = 'rec'; fails++; }
      if (fails < 2 && !has(it.pack, f.pack)) { failed = 'pack'; fails++; }
      if (fails < 2 && !allOf(it.attr, f.attr)) { failed = 'attr'; fails++; }
      if (fails > 1) continue;
      if (fails === 1) { bump(counts[failed], it, failed); continue; }
      out.push(it);
      for (const g of GROUPS) bump(counts[g], it, g);
    }
    return { results: out, counts, ms: (typeof performance !== 'undefined' ? performance : Date).now() - t0 };
  }
  // attributes are AND (Premium + Eco); every other group is OR, like any faceted search
  function allOf(arr, set) { if (!set || !set.size) return true; for (const x of set) if (!arr.includes(x)) return false; return true; }
  function bump(c, it, g) { const v = it[g]; if (Array.isArray(v)) for (const x of v) c[x] = (c[x] || 0) + 1; else c[v] = (c[v] || 0) + 1; }

  // ---------- brief interpreter: plain English -> the same filters ----------
  // ponytail: rule-based so the demo works offline; production swaps this for one Gemini call returning the same JSON.
  const CAT_WORDS = [
    [0, /perfume|fragrance|scent|deo|deodorant|edt|edp|attar|body spray|cologne/], [1, /electronic|gadget|speaker|earbud|headphone|power ?bank|smart ?watch|charger|tech/],
    [2, /apparel|t-?shirt|tee|polo|jacket|hoodie|shirt|cap|clothing|uniform|stole/], [3, /bag|backpack|trolley|luggage|duffle|tote|travel/],
    [4, /stationery|pen|diary|notebook|desk|card holder|planner/], [5, /bottle|flask|mug|tumbler|drinkware|sipper/],
    [6, /kitchen|home|dinner set|diya|candle|platter|copper/], [7, /dry ?fruit|chocolate|sweet|mithai|gourmet|food|edible|cookies|nuts/],
    [8, /wellness|skincare|spa|bath|yoga|ayurved|grooming|self-?care|health/], [9, /hamper|kit|combo|box set/],
    [10, /award|trophy|memento|plaque/], [11, /watch|clock/],
  ];
  const OCC_WORDS = [[1, /diwali|festive|festival|deepavali|dussehra/], [2, /new year/], [3, /onboard|joining|joiner|welcome kit|induction/], [4, /conference|seminar|event|summit|cme|expo|delegate/], [5, /wedding|marriage|return gift/], [6, /anniversar/], [7, /reward|recognition|award|incentive|top performer|achiever/], [0, /corporate|office|business/]];
  const REC_WORDS = [[2, /doctor|pediatrician|paediatrician|physician|cardiologist|surgeon|dentist|gynae|hcp|medical professional|chemist|pharmacist|ca |lawyer|professional/], [0, /employee|staff|team|workforce|joiners?\b/], [1, /client|customer|patron/], [3, /cxo|ceo|director|leadership|senior|vip|md\b|founder|board/], [4, /dealer|distributor|channel partner|retailer|stockist/], [5, /women|ladies|female|her\b/], [6, /\bmen\b|gents|male|him\b/]];
  const ATTR_WORDS = [[0, /premium|luxury|high-?end|exclusive/], [1, /logo|brand(ed|able)|engrav|custom/], [2, /eco|sustainab|green|plastic-?free|biodegradable/], [3, /made in india|indian|local|vocal/], [5, /in office|sample|ready stock|see it/], [6, /ucpmp|compliant|compliance/]];

  function money(s) { s = s.replace(/[,₹\s]|rs\.?|inr/gi, ''); const m = s.match(/^([\d.]+)(k|l|lakh)?$/i); if (!m) return null; let n = parseFloat(m[1]); if (/k/i.test(m[2] || '')) n *= 1000; if (/l/i.test(m[2] || '')) n *= 100000; return Math.round(n); }
  const AMT = '(?:₹|rs\\.?|inr)?\\s*([\\d,]+(?:\\.\\d+)?\\s*(?:k|l|lakh)?)';

  function interpret(text, db) {
    const q = ' ' + text.toLowerCase().replace(/\s+/g, ' ') + ' ';
    const f = { cat: new Set(), vendor: new Set(), occ: new Set(), rec: new Set(), pack: new Set(), attr: new Set(), min: null, max: null, qty: null, lead: null };
    let m;
    if ((m = q.match(new RegExp('between ' + AMT + ' (?:and|to|-) ' + AMT))) || (m = q.match(new RegExp(AMT + ' ?(?:-|to) ?' + AMT + ' (?:range|budget|each|per)')))) { f.min = money(m[1]); f.max = money(m[2]); }
    else if ((m = q.match(new RegExp('(?:under|below|less than|within|upto|up to|max(?:imum)?|budget(?: of)?|not more than)\\s*' + AMT)))) f.max = money(m[1]);
    else if ((m = q.match(new RegExp('(?:around|approx(?:imately)?|about|roughly|~)\\s*' + AMT)))) { const v = money(m[1]); f.min = Math.round(v * 0.8); f.max = Math.round(v * 1.2); }
    if ((m = q.match(new RegExp('(?:above|over|more than|minimum|min|starting)\\s*' + AMT)))) f.min = money(m[1]);
    if ((m = q.match(/([\d,]+)\s*(?:new |senior |top |key )?(?:pieces|pcs|pc|units|nos|people|pax|employees|joiners|members|attendees|doctors|delegates|guests|clients|dealers|partners|qty|quantity)/)) || (m = q.match(/(?:qty|quantity|moq)\s*(?:of\s*)?([\d,]+)/))) f.qty = parseInt(m[1].replace(/,/g, ''), 10);
    if ((m = q.match(/(?:in|within)\s*(\d+)\s*days?/))) f.lead = +m[1];
    else if (/next week|7 days|a week/.test(q)) f.lead = 7;
    else if (/urgent|asap|tomorrow|immediate/.test(q)) f.lead = 3;
    for (const [i, re] of CAT_WORDS) if (re.test(q)) { f.cat.add(i); if (i !== 9) break; }
    for (const [i, re] of OCC_WORDS) if (re.test(q) && !(i === 0 && f.occ.size)) f.occ.add(i);
    for (const [i, re] of REC_WORDS) if (re.test(q)) f.rec.add(i);
    for (const [i, re] of ATTR_WORDS) if (re.test(q)) f.attr.add(i);
    if (/\bhamper/.test(q)) f.pack.add(2);
    db.vendors.forEach((v, vi) => {
      const n = v.name.toLowerCase(), first = n.split(' ')[0];
      if (q.includes(' ' + n) || (v.brand && first.length > 3 && new RegExp('\\b' + first.replace(/[.]/g, '\\.') + '\\b').test(q))) { f.vendor.add(vi); f.cat.add(v.cat); }
    });
    return f;
  }

  // no exact match -> loosen the least important constraints first, and say what was loosened
  function searchWithRelax(db, f) {
    let r = search(db, f); const relaxed = [];
    const steps = [['attr', 'attributes'], ['lead', 'delivery time'], ['pack', 'pack type'], ['occ', 'occasion'], ['qty', 'quantity / MOQ'], ['rec', 'recipient']];
    for (const [k, label] of steps) {
      if (r.results.length) break;
      const empty = f[k] instanceof Set ? !f[k].size : f[k] == null;
      if (empty) continue;
      f = Object.assign({}, f, { [k]: f[k] instanceof Set ? new Set() : null }); relaxed.push(label); r = search(db, f);
    }
    return Object.assign(r, { relaxed, filters: f });
  }

  const api = { build, search, searchWithRelax, interpret, OCCASIONS, RECIPIENTS, PACKS, ATTRS };
  if (typeof module !== 'undefined') module.exports = api; else root.RoyaleEngine = api;
})(this);
