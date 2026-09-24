/* Sample people, visits, enquiries and automation rules.
   Hand-written rather than generated, so the demo tells the same story every
   time and every id points at a car that is genuinely in stock. */
(function () {
  'use strict';

  function d(offset) {
    var t = new Date('2026-09-21T10:00:00+05:30');
    t.setDate(t.getDate() + offset);
    return t.toISOString().slice(0, 10);
  }
  function when(offset, hhmm) {
    return d(offset) + 'T' + hhmm + ':00+05:30';
  }

  /* name, mobile, source, assigned, stage, budget, wants, extras */
  var PEOPLE = [
    ['Arjun Reddy',    '9848011223', 'website',   'u3', 'Negotiating', [8000000, 38500000], { bodies: ['SUV'], makes: ['Mercedes-Benz', 'Land Rover'] },
      { wishlist: ['CC-358', 'CC-374', 'CC-298'], shown: [['CC-358', 'test_drove'], ['CC-374', 'interested']] }],
    ['Sneha Rao',      '9700455612', 'instagram', 'u4', 'In showroom', [2500000, 4000000], { bodies: ['Sedan', 'SUV'], fuels: ['Petrol'] },
      { wishlist: ['CC-381', 'CC-367'], shown: [['CC-381', 'interested'], ['CC-367', 'rejected']] }],
    ['Faisal Ahmed',   '7075391144', 'walkin',    'u3', 'Test drive',  [4000000, 5500000], { bodies: ['SUV'], makes: ['Toyota'] },
      { wishlist: ['CC-383', 'CC-390', 'CC-391'], shown: [['CC-383', 'test_drove'], ['CC-390', 'interested'], ['CC-391', 'interested']] }],
    ['Karthik Varma',  '9885560987', 'whatsapp',  'u4', 'Contacted',   [6000000, 8000000], { bodies: ['SUV'], makes: ['Mercedes-Benz'] },
      { wishlist: ['CC-382'], shown: [['CC-382', 'interested']] }],
    ['Divya Prasad',   '6302581190', 'website',   'u3', 'New lead',    [900000, 1600000], { bodies: ['SUV'] },
      { wishlist: ['CC-375', 'CC-388', 'CC-365'], shown: [] }],
    ['Rohit Chowdary', '9391127788', 'google',    'u4', 'In showroom', [3000000, 6000000], { bodies: ['Sedan'], makes: ['BMW', 'Lexus'] },
      { wishlist: ['CC-389', 'CC-387', 'CC-212'], shown: [['CC-212', 'interested'], ['CC-387', 'test_drove']] }],
    ['Meera Iyer',     '9000342211', 'meta',      'u3', 'Appointment', [4500000, 7000000], { bodies: ['SUV'], makes: ['Mercedes-Benz'] },
      { wishlist: ['CC-382', 'CC-371', 'CC-318', 'CC-391'], shown: [] }],
    ['Sandeep Goud',   '9948123456', 'walkin',    'u4', 'Delivered',   [3500000, 4200000], { bodies: ['SUV'], makes: ['Volvo'] },
      { purchased: [['CC-380', 3700000, -96]], shown: [['CC-380', 'bought']] }],
    ['Praveen Kumar',  '9885012340', 'whatsapp',  'u3', 'Lost',        [1200000, 1600000], { bodies: ['SUV'] },
      { shown: [['CC-365', 'rejected'], ['CC-255', 'rejected']] }],
    ['Nikhil Jain',    '9866554433', 'instagram', null, 'New lead',    [2000000, 2600000], { bodies: ['Sedan'], makes: ['Skoda'] }, {}],
    ['Ayesha Sultana', '7013998877', 'google',    null, 'New lead',    [900000, 1400000], { bodies: ['SUV'] }, {}],
    ['Vikram Rathore', '9701445566', 'referral',  'u4', 'Contacted',   [3000000, 4000000], { bodies: ['Sedan'], makes: ['BMW'] },
      { shown: [['CC-387', 'interested']] }],
    ['Deepak Sharma',  '9390011882', 'walkin',    'u3', 'Delivered',   [3500000, 4200000], { bodies: ['SUV'], makes: ['MG'] },
      { purchased: [['CC-393', 3950000, -40]], shown: [['CC-393', 'bought']] }],
    ['Harsha Vardhan', '8919772233', 'meta',      null, 'New lead',    [4500000, 7000000], { bodies: ['SUV'], makes: ['Porsche', 'Land Rover'] }, {}]
  ];

  /* channel, client index, at, body, extraction */
  var MESSAGES = [
    ['whatsapp', 9, when(0, '09:12'),
     'Hi, saw the Skoda Superb on your site. Is the Laurin & Klement still available? Looking to buy this month, budget around 22 lakhs.',
     { intent: 'enquiry', budget: [2000000, 2400000], bodies: ['Sedan'], makes: ['Skoda'],
       timeline: 'This month', cars: ['CC-2019'], confidence: 0.94,
       reply: 'Namaste Nikhil garu — the 2019 Superb Laurin & Klement is with us at \u20b922.50 L. It is on hold for another buyer until Friday. Shall I call you the moment it frees up?' }],
    ['instagram', 10, when(0, '10:40'),
     'hi is the xuv300 still there? and what would be the emi roughly',
     { intent: 'enquiry', budget: [900000, 1400000], bodies: ['SUV'], makes: ['Mahindra'],
       timeline: 'Undecided', cars: ['CC-375'], confidence: 0.88,
       reply: 'Hello Ayesha — the 2021 XUV 3OO is with us at \u20b99.50 L. That works out around \u20b916,700 a month over seven years. Would you like to see it?' }],
    ['google', 13, when(-1, '18:25'),
     'Called about the Porsche Cayenne. Want to know service history and whether finance can be arranged.',
     { intent: 'enquiry', budget: [4500000, 7000000], bodies: ['SUV'], makes: ['Porsche'],
       timeline: 'Next 3 months', cars: ['CC-391'], confidence: 0.81,
       reply: 'Good evening Mr. Vardhan — the 2016 Cayenne diesel has full service history and we arrange finance in-house. May I book you a viewing?' }],
    ['meta', 6, when(-1, '14:02'),
     'Lead form: interested in Mercedes SUV, budget 60-70 lakhs, wants to visit this weekend.',
     { intent: 'lead', budget: [6000000, 7000000], bodies: ['SUV'], makes: ['Mercedes-Benz'],
       timeline: 'This weekend', cars: ['CC-382', 'CC-371', 'CC-318'], confidence: 0.91,
       reply: 'Thank you for your enquiry Mrs. Iyer. We have the GLE 300d, the GLB 220d and a Range Rover Sport in your range. Saturday 11am at Kavuri Hills?' }],
    ['whatsapp', 11, when(0, '11:55'),
     'Do you take exchange? I have a 2019 Creta, about 60000 km. Looking at the 3GT.',
     { intent: 'trade_in', budget: [3000000, 4000000], bodies: ['Sedan'], makes: ['BMW'],
       timeline: 'Next month', cars: ['CC-387'], trade_in: 'Hyundai Creta 2019, ~60,000 km',
       confidence: 0.96,
       reply: 'Yes Mr. Rathore, we take exchanges. Bring the Creta in and we will value it the same day. The 2019 BMW 3GT is \u20b936.00 L.' }],
    ['instagram', 1, when(0, '08:30'),
     'is the camry hybrid self charging? do i need to plug it in anywhere',
     { intent: 'question', budget: [2500000, 3200000], bodies: ['Sedan'], fuels: ['Petrol'],
       timeline: 'Undecided', cars: ['CC-381'], confidence: 0.9,
       reply: 'Hello Sneha — the 2022 Camry Hybrid charges itself, there is no plug. It is with us at \u20b929.75 L. Happy to arrange a test drive.' }]
  ];

  var AUTOS = [
    { name: 'A car arrives matching what someone asked for', on: true,
      stages: ['New lead', 'Contacted', 'Appointment', 'In showroom'], sources: [],
      trigger: { type: 'matches_want' }, conds: [],
      actions: [{ type: 'notify_person', who: '', text: 'A car just landed that matches your customer\'s brief.' },
                { type: 'wa_template', template: 'new_match' }],
      note: 'Used stock is one of one. This is the rule that earns its keep.' },
    { name: 'Price drop on a saved car', on: true,
      stages: ['Contacted', 'In showroom', 'Negotiating'], sources: [],
      trigger: { type: 'price_drop' }, conds: [],
      actions: [{ type: 'wa_template', template: 'price_drop' }] },
    { name: 'Shown a car, did not buy — follow up next morning', on: true,
      stages: ['In showroom'], sources: [],
      trigger: { type: 'shown_not_bought', days: 1 }, conds: [],
      actions: [{ type: 'followup', due_in_days: 1, text: 'Call about the cars they liked yesterday.' }] },
    { name: 'Test drive reminder, two hours before', on: true,
      stages: ['Test drive', 'Appointment'], sources: [],
      trigger: { type: 'test_drive', state: 'booked' }, conds: [],
      actions: [{ type: 'wait', hours: 2 }, { type: 'wa_text', text: 'Your test drive is in two hours. Plot 145P, Opp. Divya Diamonds, Kavuri Hills, Madhapur.' }] },
    { name: 'Aged stock past 90 days → manager', on: true,
      stages: [], sources: [],
      trigger: { type: 'aged_stock', days: 90 }, conds: [],
      actions: [{ type: 'notify_role', role: 'manager', text: 'This car has been on the floor 90 days. Suggested cut is 3%.' }] },
    { name: 'Thin listing → inventory desk', on: true,
      stages: [], sources: [],
      trigger: { type: 'thin_listing', min_photos: 10 }, conds: [],
      actions: [{ type: 'notify_role', role: 'inventory', text: 'This listing needs photographs and a description before it goes live.' }] },
    { name: 'Finance file pending 48 hours', on: true,
      stages: ['Booked'], sources: [],
      trigger: { type: 'finance_pending', hours: 48 }, conds: [],
      actions: [{ type: 'notify_role', role: 'manager', text: 'Finance file has not moved in two days.' }] },
    { name: 'Thank you after delivery', on: true,
      stages: ['Won'], sources: [],
      trigger: { type: 'delivery_done' }, conds: [],
      actions: [{ type: 'wa_template', template: 'thank_you' }] },
    { name: 'Ask for a Google review, three days after delivery', on: true,
      stages: ['Won'], sources: [],
      trigger: { type: 'delivery_done' }, conds: [],
      actions: [{ type: 'wait', hours: 72 }, { type: 'review_request' }] },
    { name: 'Service due at six months', on: true,
      stages: ['Won'], sources: [],
      trigger: { type: 'service_due', months: 6 }, conds: [],
      actions: [{ type: 'wa_template', template: 'service_due' }] },
    { name: 'Upgrade due — three years or 40,000 km', on: true,
      stages: ['Won'], sources: [],
      trigger: { type: 'upgrade_due', years: 3, km: 40000 }, conds: [],
      actions: [{ type: 'followup', due_in_days: 0, text: 'Their car is due for an upgrade. Offer a valuation.' },
                { type: 'wa_template', template: 'upgrade' }],
      note: 'The repeat-purchase engine in this trade.' },
    { name: 'Open lead untouched for a week → manager', on: true,
      stages: [], sources: [],
      trigger: { type: 'no_contact', days: 7 }, conds: [],
      actions: [{ type: 'notify_role', role: 'manager', text: 'This lead has had no contact for seven days.' }] },
    { name: 'Insurance or RC on stock expiring', on: true,
      stages: [], sources: [],
      trigger: { type: 'papers_expiring', days: 30 }, conds: [],
      actions: [{ type: 'notify_role', role: 'inventory', text: 'Papers on this car expire within the month.' }] }
  ];

  window.SEEDER = function (D, RAW) {
    var ids = {};
    RAW.forEach(function (c) { ids[c.stock_id] = c; });

    D.branches = [
      { id: 'b1', name: 'Kavuri Hills', address: 'H.No. 1-98/21A, Plot 145P & 146P, Opp. Divya Diamonds, Madhapur, Hyderabad 500081',
        phone: '6269898989', target: { units: 4, value: 20000000 } },
      { id: 'b2', name: 'Banjara Hills', address: 'Road No. 12, Banjara Hills, Hyderabad 500034',
        phone: '7075390099', target: { units: 2, value: 9000000 } }
    ];

    D.clients = PEOPLE.map(function (p, i) {
      var x = p[7] || {};
      var c = CC.newClient({
        id: 'c' + (100 + i), name: p[0], mobile: p[1], source: p[2],
        assigned_to: p[3],
        budget_min: p[5][0], budget_max: p[5][1], wants: p[6],
        created: d(-[232, 198, 176, 151, 133, 118, 96, 84, 67, 52, 38, 26, 14, 5][i]), last_touch: d(-(i % 7))
      });
      c.branch = i % 5 === 4 ? 'b2' : 'b1';
      c._stage = p[4];
      c.wishlist = (x.wishlist || []).filter(function (s) { return ids[s]; });
      c.shown = (x.shown || []).filter(function (s) { return ids[s[0]]; })
        .map(function (s) { return { stock_id: s[0], mark: s[1], when: d(-(i % 9)), by: p[3] }; });
      c.purchased = (x.purchased || []).filter(function (s) { return ids[s[0]]; })
        .map(function (s) { return { stock_id: s[0], price: s[1], when: d(s[2]) }; });
      if (x.trade_in) c.trade_in = x.trade_in;
      return c;
    });

    /* One opportunity per person for whatever they are chasing now. Anyone whose
       old stage was Delivered or Lost gets a closed one instead — that is history,
       not pipeline. Two people also carry an older closed opportunity, so the
       repeat-buyer story is visible. */
    D.opportunities = [];
    D.clients.forEach(function (c, i) {
      var st = c._stage;
      var cars = (c.wishlist || []).slice(0, 3);
      var o = CC.newOpp({
        id: 'o' + (500 + i), client: c.id, assigned_to: c.assigned_to, branch: c.branch,
        source: c.source, budget_min: c.budget_min, budget_max: c.budget_max,
        wants: c.wants, trade_in: c.trade_in, cars: cars,
        created: c.created, updated: c.last_touch,
        title: (c.wants.makes || []).concat(c.wants.bodies || []).slice(0, 2).join(' ') || 'General enquiry'
      });
      if (st === 'Delivered') {
        var p0 = (c.purchased || [])[0];
        o.stage = 'Won'; o.outcome = 'won';
        o.won_car = p0 ? p0.stock_id : null;
        o.won_price = p0 ? p0.price : null;
        o.closed = p0 ? p0.when : c.last_touch;
        if (p0) { p0.opp = o.id; o.cars = [p0.stock_id]; }
      } else if (st === 'Lost') {
        o.stage = 'Lost'; o.outcome = 'lost';
        o.lost_reason = 'Bought elsewhere — our two cars were over their budget.';
        o.closed = c.last_touch;
      } else {
        o.stage = st;
      }
      D.opportunities.push(o);
      delete c._stage;
    });

    /* The cars they are genuinely after, promoted out of the shortlist. Follow-ups
       hang off these, not off the enquiry as a whole. */
    [['Arjun Reddy', ['CC-358']],
     ['Faisal Ahmed', ['CC-383']],
     ['Rohit Chowdary', ['CC-387', 'CC-212']],
     ['Karthik Varma', ['CC-382']],
     ['Sneha Rao', ['CC-381']],
     ['Vikram Rathore', ['CC-387']]].forEach(function (x) {
      var cl = D.clients.filter(function (c) { return c.name === x[0]; })[0];
      if (!cl) return;
      var o = D.opportunities.filter(function (y) { return y.client === cl.id && CC.isOpen(y); })[0];
      if (!o) return;
      x[1].forEach(function (sid) { if (ids[sid]) CC.playCar(o, sid, true); });
    });

    /* The stage is the truth about the deal, so bring every in-play car's mark up
       to match it. Without this the seed ships already contradicting itself. */
    D.opportunities.forEach(function (o) {
      if (!CC.isOpen(o)) return;
      var want = CC.STAGE_MARK[o.stage];
      if (!want) return;
      var cl = D.clients.filter(function (c) { return c.id === o.client; })[0];
      if (!cl) return;
      (o.inplay || []).forEach(function (sid) {
        var now = CC.markOf(cl, sid);
        if (now === 'rejected' || now === 'bought') return;
        if ((CC.MARK_RANK[now] || 0) < CC.MARK_RANK[want]) CC.addMark(cl, sid, want, null);
      });
    });

    /* two repeat buyers: a closed win last year, and a live enquiry now */
    var arjun = D.clients.filter(function (c) { return c.name === 'Arjun Reddy'; })[0];
    if (arjun) {
      arjun.purchased.push({ stock_id: null, price: 8900000, when: d(-402), opp: 'o560' });
      D.opportunities.push(CC.newOpp({
        id: 'o560', client: arjun.id, assigned_to: 'u3', branch: arjun.branch,
        title: 'Range Rover Sport', stage: 'Won', source: 'referral',
        created: d(-441), updated: d(-402), closed: d(-402)
      }));
      var last = D.opportunities[D.opportunities.length - 1];
      last.outcome = 'won'; last.won_price = 8900000; last.won_car = null;
    }
    var meera = D.clients.filter(function (c) { return c.name === 'Meera Iyer'; })[0];
    if (meera) {
      meera.purchased.push({ stock_id: null, price: 3200000, when: d(-318), opp: 'o561' });
      var o2 = CC.newOpp({
        id: 'o561', client: meera.id, assigned_to: 'u4', branch: meera.branch,
        title: 'Mercedes-Benz GLC', stage: 'Won', source: 'walkin',
        created: d(-350), updated: d(-318), closed: d(-318)
      });
      o2.outcome = 'won'; o2.won_price = 3200000;
      D.opportunities.push(o2);
    }

    /* three on the floor right now, three already closed */
    var byId = {};
    D.clients.forEach(function (c) { byId[c.name] = c; });
    D.messages = MESSAGES.map(function (m, i) {
      var c = D.clients[m[1]];
      return {
        id: 'm' + (200 + i), channel: m[0], client: c ? c.id : null,
        from: c ? c.name : 'Unknown', mobile: c ? c.mobile : '',
        at: m[2], body: m[3],
        card: { status: 'pending', confidence: m[4].confidence, extraction: m[4] }
      };
    });

    D.automations = AUTOS.map(function (a, i) {
      return Object.assign({ id: 'a' + (300 + i), runs: [12, 4, 31, 18, 6, 9, 2, 14, 11, 3, 1, 7, 5][i] || 0,
                             last: ['today', 'yesterday', 'today', 'today', '3 days ago', 'today',
                                    'last week', 'yesterday', '2 days ago', 'last week', 'last month',
                                    'yesterday', '4 days ago'][i] || '—' }, a);
    });

    /* Follow-up history: what was said and when we go back. The live ones drive
       the board's "no follow-up booked" and "overdue" flags. */
    var FOLLOWS = [
      ['Arjun Reddy',  -12, 'Call',           'Walked him through the G63 and the Vogue Autobiography. Wants the G63 but says the price is 15 lakh over what he had in mind.', 'Asked for a better price', true],
      ['Arjun Reddy',   -5, 'WhatsApp',       'Sent the inspection report and the service history for the G63. He is showing it to his accountant.', 'Going well \u2014 still keen', true],
      ['Arjun Reddy',    1, 'Call',           'Get the final number approved with the owner and call him back.', null, false],
      ['Rohit Chowdary', -8, 'Test drive',    'Drove the 3GT around Kavuri Hills. Liked it, wants to compare against the Lexus LS 500 before deciding.', 'Wants time to think', true],
      ['Rohit Chowdary', -1, 'Call',          'Rang twice, no answer. Left a message.', 'Could not reach them', true],
      ['Rohit Chowdary',  0, 'Call',          'Try again in the evening \u2014 he works mornings.', null, false],
      ['Karthik Varma', -14, 'WhatsApp',      'Asked about the GLE 300d. Sent photos and the price.', 'Going well \u2014 still keen', true],
      ['Karthik Varma',  -4, 'Call',          'Says he is now also looking at a new Audi from the showroom down the road.', 'Comparing with another dealer', true],
      ['Faisal Ahmed',   -6, 'Showroom visit','Came in with his wife, drove the Fortuner Legender and the Hilux. Prefers the Legender.', 'Going well \u2014 still keen', true],
      ['Faisal Ahmed',   -2, 'WhatsApp',      'Sent the finance quote. EMI works for him.', 'Ready to book', true],
      ['Faisal Ahmed',    2, 'Call',          'Confirm the booking amount and the delivery date.', null, false],
      ['Meera Iyer',     -3, 'Call',          'Booked her in for Saturday 11am to see the three SUVs.', 'Going well \u2014 still keen', true],
      ['Meera Iyer',      3, 'Showroom visit','Saturday viewing \u2014 have the GLE 300d, the GLB 220d and the Range Rover Sport ready.', null, false],
      ['Sneha Rao',      -9, 'Call',          'Explained the Camry is a self-charging hybrid, nothing to plug in. She is weighing it against the XC60.', 'Wants time to think', true],
      ['Praveen Kumar', -24, 'Call',          'Both cars were over his budget. Said he would look at something smaller elsewhere.', 'Cooling off \u2014 at risk', true],
      ['Vikram Rathore', -2, 'WhatsApp',      'Wants us to value his 2019 Creta against the 3GT. Bringing it in this week.', 'Going well \u2014 still keen', true],
      ['Divya Prasad',   -1, 'Call',          'First call \u2014 she is buying her first car, budget is firm at 15 lakh.', 'Going well \u2014 still keen', true],
      ['Karthik Varma',  -1, 'Call',          'called, no answer', 'Could not reach them', true],
      ['Sneha Rao',      -2, 'WhatsApp',      'sent details', 'Wants time to think', true],
      ['Arjun Reddy',    -3, 'Showroom visit','Brought his brother in to see the G63. Both liked it. He asked again about \u20b915 L off and whether we would take his Fortuner in exchange \u2014 said he will decide by the end of the month.', 'Asked for a better price', true]
    ];
    D.followups = FOLLOWS.map(function (x, i) {
      var cl = byId[x[0]];
      if (!cl) return null;
      var opp = D.opportunities.filter(function (o) { return o.client === cl.id && CC.isOpen(o); })[0]
             || D.opportunities.filter(function (o) { return o.client === cl.id; })[0];
      return CC.newFollow({
        id: 'fu' + (600 + i), opp: opp ? opp.id : null, client: cl.id,
        car: opp && (opp.inplay || []).length ? opp.inplay[0] : null,
        owner: cl.assigned_to, by: cl.assigned_to,
        due: d(x[1]), method: x[2], note: x[3], outcome: x[4],
        done: x[5], done_at: x[5] ? d(x[1]) : null, created: d(x[1] - 1)
      });
    }).filter(Boolean);

    /* expected purchase dates, where the customer has actually said one */
    [['Faisal Ahmed', 5], ['Arjun Reddy', 16], ['Meera Iyer', 12], ['Vikram Rathore', 30]]
      .forEach(function (x) {
        var cl = byId[x[0]];
        if (!cl) return;
        var o = D.opportunities.filter(function (y) { return y.client === cl.id && CC.isOpen(y); })[0];
        if (o) o.expected = d(x[1]);
      });

    D.followups = D.followups.concat([
      CC.newFollow({ id: 'fu700', client: byId['Deepak Sharma'].id, owner: 'u3', by: 'u3',
        due: d(2), method: 'Call', note: 'Delivered 40 days ago — ask for a Google review.' })
    ]);

    /* Sold cars leave the floor, so history carries a label rather than a stock
       id. Only the two most recent still point at something on the lot. */
    var HISTORY = [
      ['u3', -226, 'Mercedes-Benz GLC 220d 4Matic', 4150000, 'Rakesh Menon'],
      ['u4', -212, 'BMW 320d Sport Line',           2650000, 'Sunita Bhatia'],
      ['u3', -195, 'Toyota Fortuner 4x4 AT',        4380000, 'Ganesh Pillai'],
      ['u3', -181, 'Audi Q3 40 TFSI',               3100000, 'Nandini Rao'],
      ['u4', -168, 'Honda City ZX CVT',              890000, 'Prakash Nair'],
      ['u3', -154, 'Land Rover Discovery Sport',    5900000, 'Aditya Malhotra'],
      ['u4', -142, 'Skoda Octavia L&K',             2150000, 'Rekha Sinha'],
      ['u3', -129, 'BMW X1 sDrive20d',              3350000, 'Vivek Anand'],
      ['u3', -117, 'Volvo XC60 Inscription',        4600000, 'Shalini Gupta'],
      ['u4', -104, 'Mahindra Thar LX AT 4WD',       1420000, 'Mohan Das'],
      ['u4',  -96, 'Volvo XC60 D4',                 3700000, null, 'Sandeep Goud', 'CC-380'],
      ['u3',  -81, 'Mercedes-Benz C300 AMG Line',   4250000, 'Irfan Baig'],
      ['u4',  -68, 'Hyundai Tucson Signature',      2450000, 'Lata Krishnan'],
      ['u3',  -55, 'Toyota Vellfire Executive',     7600000, 'Suraj Kapoor'],
      ['u3',  -40, 'MG Gloster Savvy',              3950000, null, 'Deepak Sharma', 'CC-393'],
      ['u4',  -33, 'Jeep Compass Limited',          1950000, 'Pooja Desai'],
      ['u3',  -19, 'Mercedes-Benz GLA 220d',        3700000, 'Nikhil Bose'],
      ['u4',  -11, 'Toyota Innova Crysta ZX',       2350000, 'Ramesh Yadav'],
      ['u3',   -6, 'BMW M340i LCI',                 8000000, 'Zoya Rahman', null, 'CC-377']
    ];
    /* A few days of history so the activity log is not empty on first open. */
    var ACT = [
      ['u6', -0.1, 'car_edit', 'Registration number: blank \u2192 TS09 FB 4417', { car: 'CC-383' }],
      ['u6', -0.2, 'car_edit', 'Written description: blank \u2192 added', { car: 'CC-383' }],
      ['u3', -0.3, 'follow_log', 'Faisal Ahmed \u2014 WhatsApp: Sent the finance quote. EMI works for him. (Ready to book)'],
      ['u3', -0.4, 'opp_stage', 'Faisal Ahmed moved to Negotiating'],
      ['u5', -0.5, 'msg_approve', 'Created Nikhil Jain from a WhatsApp enquiry, assigned to Imran Ali'],
      ['u4', -0.6, 'opp_stage', 'Rohit Chowdary moved to Test drive'],
      ['u6', -0.8, 'car_publish', 'Volvo XC60 D4 marked Sold', { car: 'CC-380' }],
      ['u2', -1.2, 'target_set', 'Rahul Varma \u2014 units target set to 2'],
      ['u3', -1.3, 'follow_log', 'Rohit Chowdary \u2014 Call: Rang twice, no answer. Left a message. (Could not reach them)'],
      ['u1', -1.5, 'access_change', 'Sales Floor \u2014 cost set to off'],
      ['u4', -2.1, 'client_add', 'Vikram Rathore added from Referral'],
      ['u6', -2.4, 'car_edit', 'Listed price: 3050000 \u2192 2975000', { car: 'CC-381' }],
      ['u3', -3.2, 'opp_won', 'Won \u2014 Deepak Sharma bought the MG Gloster for \u20b939.50 L'],
      ['u2', -3.6, 'auto_toggle', '"Aged stock past 90 days \u2192 manager" switched on'],
      ['u5', -4.1, 'visit_new', 'Divya Prasad walked in \u2014 waiting at the door']
    ];
    D.activity = ACT.map(function (x, i) {
      var t = new Date('2026-09-22T17:30:00+05:30');
      t.setTime(t.getTime() + x[1] * 24 * 3600 * 1000);
      return Object.assign({ id: 'l' + (800 + i), at: t.toISOString(), by: x[0],
                             kind: x[2], text: x[3], client: null, opp: null, car: null },
                           x[4] || {});
    });

    D.sales = HISTORY.map(function (h, i) {
      var named = h[5] ? byId[h[5]] : null;
      return {
        id: 's' + (400 + i), by: h[0], at: d(h[1]), car: h[2], price: h[3],
        buyer: h[4] || h[5], client: named ? named.id : null, stock_id: h[6] || null,
        booking: Math.round(h[3] * 0.04 / 10000) * 10000,
        finance: i % 3 !== 0
      };
    });

    /* Monthly targets, which the owner and the manager can change in the console. */
    D.targets = JSON.parse(JSON.stringify(CC.DEFAULT_TARGETS));
  };
})();
