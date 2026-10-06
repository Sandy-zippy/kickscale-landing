/* Hand-written sample data. One story: a December wedding, a designer who has gone
   quiet, a bunch of silk running out, and a bill nobody has chased.
   Every client here is invented. None of it is Sasya's own. */
/* stock: every physical piece, each with its own barcode, owned by the purchase it came in on */
function SEED_STOCK() {
  var pieces = [], n = 0;
  function add(purchase, supplier, source, at, name, kind, sizes, cost, price, design, sold, returned) {
    sizes.forEach(function (sz, i) {
      n++;
      var st = sold && sold[i] ? 'sold' : returned && returned[i] ? 'returned' : 'in stock';
      pieces.push({ id:'P-' + ('000' + n).slice(-4), barcode:'SM' + at.slice(2, 7).replace('-', '') + '-' + ('000' + n).slice(-4),
        name:name, code:'', kind:kind, size:sz, colour:'', supplier:supplier, source:source, purchase:purchase,
        cost_ex: source === 'consignment' ? 0 : cost, price_ex:price, gst:18, received:at, location: n % 5 === 0 ? 'Godown' : 'Store',
        status:st, order:'', garment:'', sold_at: st === 'sold' ? sold[i] : '', returned_at: st === 'returned' ? returned[i] : '', design:design || '',
        history:[{ what:'Received', by:'p-deb', at:at + 'T11:00' }] });
    });
  }
  /* on-order from JJ Valaya: 8 in, one sold before the cockpit, one sent back after 7 days */
  add('PUR-01','D-02','on-order','2026-08-20','Black sherwani, dori work','Sherwani',['40','42','42','44'],110000,185000,'R-02',[0,'2026-09-15'],[0,0,0,'2026-08-27']);
  add('PUR-01','D-02','on-order','2026-08-20','Ivory achkan, zardozi','Sherwani',['40','42'],95000,160000,'');
  add('PUR-01','D-02','on-order','2026-08-20','Velvet bandhgala, midnight','Suit jacket / blazer / bandhgala',['40','42'],70000,118000,'');
  /* on-order from Rohit Gandhi + Rahul Khanna */
  add('PUR-02','D-05','on-order','2026-09-10','Tuxedo, shawl lapel','Suit jacket / blazer / bandhgala',['38','40','42','44'],60000,98000,'',[0,0,'2026-09-28']);
  /* consignment, not ours until sold */
  add('CON-01','D-01','consignment','2026-09-01','Bandhgala, ink blue','Suit jacket / blazer / bandhgala',['40','42'],0,125000,'R-05',['2026-09-22']);
  add('CON-01','D-01','consignment','2026-09-01','Asymmetric kurta set','Kurta',['40','42','44'],0,88000,'');
  add('CON-02','D-04','consignment','2026-09-15','Draped kurta, charcoal','Kurta',['38','40','42'],0,142000,'R-03');
  /* our own make */
  add('','Sasya','own','2026-09-14','Ivory linen bandhgala','Suit jacket / blazer / bandhgala',['40','42'],29500,68000,'R-01');
  add('','Sasya','own','2026-08-13','Navy tuxedo, grosgrain lapel','Suit jacket / blazer / bandhgala',['38'],41000,95000,'R-04');
  add('','Sasya','own','2026-09-27','Bandhgala, bottle green raw silk','Suit jacket / blazer / bandhgala',['40','42'],34000,82000,'R-06');
  return {
    pieces: pieces,
    purchases: [
      { id:'PUR-01', type:'on-order', supplier:'D-02', at:'2026-08-20', credit_days:60, advance:300000, bill:'JJV/2026/0412', note:'Festive buy, eight pieces' },
      { id:'PUR-02', type:'on-order', supplier:'D-05', at:'2026-09-10', credit_days:60, advance:100000, bill:'RGRK/SM/88', note:'' },
      { id:'CON-01', type:'consignment', supplier:'D-01', at:'2026-09-01', credit_days:0, advance:0, bill:'', note:'Sent on goodwill for the season' },
      { id:'CON-02', type:'consignment', supplier:'D-04', at:'2026-09-15', credit_days:0, advance:0, bill:'', note:'' }
    ]
  };
}
function SEED() {
  var STOCK = SEED_STOCK();
  return {
    pieces: STOCK.pieces,
    purchases: STOCK.purchases,
    v: 2,
    unit: 'inches',
    gst: 0.18,

    people: [
      { id:'p-rachit',  name:'Rachit Agarwal',  role:'Owner',              login:'owner',   phone:'+91 98300 11111', reports:null,       lines:['In-house','Third-party'] },
      { id:'p-ananya',  name:'Ananya Sen',      role:'BDM',                login:'bdm',     phone:'+91 98300 22222', reports:'p-rachit', lines:['In-house','Third-party'] },
      { id:'p-deb',     name:'Debashis Roy',    role:'Operations manager', login:'ops',     phone:'+91 98300 33333', reports:'p-rachit', lines:['In-house','Third-party'] },
      { id:'p-sunita',  name:'Sunita Jain',     role:'Accounts',           login:'accounts',phone:'+91 98300 44444', reports:'p-rachit', lines:[] },
      { id:'p-farhan',  name:'Farhan Qureshi',  role:'Stylist',            login:'stylist', phone:'+91 98300 55555', reports:'p-ananya', lines:['In-house'] },
      { id:'p-rohit',   name:'Rohit Mehra',     role:'Salesperson',        login:'rohit',   phone:'+91 98300 66666', reports:'p-ananya', lines:['In-house'] },
      { id:'p-pallavi', name:'Pallavi Dutta',   role:'Salesperson',        login:'pallavi', phone:'+91 98300 77777', reports:'p-ananya', lines:['Third-party'] },
      { id:'p-iqbal',   name:'Iqbal Mia',       role:'Master',             login:'iqbal',   phone:'+91 98300 88881', reports:'p-deb',    lines:['In-house'], craft:'Jackets and bandhgalas' },
      { id:'p-sujit',   name:'Sujit Das',       role:'Master',             login:'sujit',   phone:'+91 98300 88882', reports:'p-deb',    lines:['In-house'], craft:'Sherwanis, kurtas, churidars' },
      { id:'p-ratan',   name:'Ratan Karigar',   role:'Master',             login:'ratan',   phone:'+91 98300 88883', reports:'p-deb',    lines:['In-house'], craft:'Hand embroidery' },
      { id:'p-bikash',  name:'Bikash Mondal',   role:'Master',             login:'bikash',  phone:'+91 98300 88884', reports:'p-deb',    lines:['In-house'], craft:'Marking and cutting' }
    ],

    families: [
      { id:'F-01', name:'Bhansali',  area:'Alipore',     note:'Karan is getting married on 12 December. Three men to dress.' },
      { id:'F-02', name:'Khaitan',   area:'Park Street', note:'Walked in off the street on 24 September.' },
      { id:'F-03', name:'Sen',       area:'Salt Lake',   note:'Second year with us.' },
      { id:'F-04', name:'Lodha',     area:'Ballygunge',  note:'Referred by the Sens.' },
      { id:'F-05', name:'Poddar',    area:'New Alipore', note:'Walked in yesterday afternoon.' }
    ],

    clients: [
      { id:'C-01', family:'F-01', name:'Karan Bhansali',  relation:'Son, the groom', phone:'+91 98310 10001', email:'karan.b@example.in',
        dob:'1996-04-18', anniversary:'', source:'Referral', stylist:'p-farhan', salesperson:'p-rohit',
        note:'Wedding 12 Dec 2026. Prefers a slim fit and dislikes a high collar.' },
      { id:'C-02', family:'F-01', name:'Jayant Bhansali', relation:'Father of the groom', phone:'+91 98310 10002', email:'',
        dob:'1964-11-02', anniversary:'1992-02-09', source:'Existing client', stylist:'p-farhan', salesperson:'p-rohit',
        note:'Has lost weight since February. Measurements re-taken.' },
      { id:'C-03', family:'F-01', name:'Rishi Bhansali',  relation:'Brother of the groom', phone:'+91 98310 10003', email:'rishi@bhansaliexports.example',
        dob:'1999-07-30', anniversary:'', source:'Referral', stylist:'p-farhan', salesperson:'p-pallavi',
        note:'Wants a designer piece, not in-house. Bills go to the company.' },
      { id:'C-04', family:'F-02', name:'Vikram Khaitan',  relation:'', phone:'+91 98320 20001', email:'',
        dob:'', anniversary:'', source:'Walk-in', stylist:'p-farhan', salesperson:'p-rohit',
        note:'Saw the window on Shakespeare Sarani. Shown three bunches. Has not come back.' },
      { id:'C-05', family:'F-03', name:'Arindam Sen',     relation:'', phone:'+91 98330 30001', email:'arindam.sen@example.in',
        dob:'1981-01-21', anniversary:'2010-12-04', source:'Instagram', stylist:'p-farhan', salesperson:'p-pallavi',
        note:'Bought a suit last September. Back for a Valaya bandhgala.' },
      { id:'C-06', family:'F-04', name:'Nikhil Lodha',    relation:'', phone:'+91 98340 40001', email:'',
        dob:'1989-09-09', anniversary:'2016-02-14', source:'Outreach by Mark', stylist:'p-farhan', salesperson:'p-pallavi',
        note:'Reception on 9 January. Quote going out this week.' },
      { id:'C-07', family:'F-05', name:'Aditya Poddar',   relation:'', phone:'+91 98350 50001', email:'',
        dob:'', anniversary:'', source:'Walk-in', stylist:'p-farhan', salesperson:'p-rohit',
        note:'Walked in on 1 October asking about a bandhgala for his brother’s wedding.' }
    ],

    /* dated sets, never overwritten */
    meas: [
      { id:'M-01', client:'C-01', kind:'Sherwani', at:'2026-09-19', by:'p-farhan', unit:'inches',
        why:'First set', trial:'', vals:{ 'neck':16, 'collar height':2.0, 'shoulder':18.0, 'chest':40.5,
        'stomach':37, 'waist':35, 'hip':39.5, 'sleeve length':24.5, 'bicep':13.5, 'cuff':10,
        'sherwani length (2in below the knee)':44 } },
      { id:'M-02', client:'C-01', kind:'Suit jacket / blazer / bandhgala', at:'2026-09-19', by:'p-farhan', unit:'inches',
        why:'First set', trial:'', vals:{ 'neck':16,'shoulder':18.0,'chest':40.5,'stomach':37,'waist':35,
        'seat':39.5,'sleeve length':24.5,'bicep':13.5,'cuff':10,'front chest':15.5,'back width':16.5,'jacket length':30 } },
      { id:'M-03', client:'C-01', kind:'Churidar / pyjama', at:'2026-09-19', by:'p-farhan', unit:'inches',
        why:'First set', trial:'', vals:{ 'waist':34,'hip':39.5,'thigh':22,'knee':15,'calf':14,
        'ankle (mohri)':11,'length':41,'gather allowance':6 } },
      { id:'M-10', client:'C-01', kind:'Shirt', at:'2026-09-19', by:'p-farhan', unit:'inches',
        why:'First set', trial:'', vals:{ 'collar':16,'shoulder':18,'chest':40.5,'stomach':37,'waist':35,
        'sleeve length':25,'bicep':13.5,'cuff':9.5,'shirt length':30 } },
      { id:'M-11', client:'C-01', kind:'Waistcoat / Nehru jacket', at:'2026-09-19', by:'p-farhan', unit:'inches',
        why:'First set', trial:'', vals:{ 'chest':40.5,'stomach':37,'waist':35,'shoulder':18,'armhole':20,
        'front length':26,'back length':25.5 } },
      { id:'M-04', client:'C-02', kind:'Suit jacket / blazer / bandhgala', at:'2026-02-11', by:'p-farhan', unit:'inches',
        why:'First set', trial:'', vals:{ 'neck':17,'shoulder':17.5,'chest':44,'stomach':43,'waist':42,
        'seat':43,'sleeve length':23.5,'bicep':15,'cuff':10.5,'front chest':16.5,'back width':17.5,'jacket length':31 } },
      { id:'M-05', client:'C-02', kind:'Suit jacket / blazer / bandhgala', at:'2026-10-01', by:'p-deb', unit:'inches',
        why:'He has lost weight', trial:'', vals:{ 'neck':16.5,'shoulder':17.0,'chest':42,'stomach':40,'waist':39,
        'seat':41.5,'sleeve length':23.5,'bicep':14.5,'cuff':10.5,'front chest':16,'back width':17,'jacket length':31 } },
      { id:'M-12', client:'C-02', kind:'Trousers / breeches', at:'2026-10-01', by:'p-deb', unit:'inches',
        why:'He has lost weight', trial:'', vals:{ 'waist':39,'seat':41.5,'thigh':24,'knee':17,
        'bottom (mohri)':15.5,'outseam':41,'inseam':30.5,'rise':11 } },
      { id:'M-06', client:'C-03', kind:'Sherwani', at:'2026-09-27', by:'p-farhan', unit:'inches',
        why:'First set', trial:'', vals:{ 'neck':15.5,'collar height':2.0,'shoulder':17.5,'chest':39,'stomach':35,
        'waist':33,'hip':38,'sleeve length':24,'bicep':13,'cuff':9.5,'sherwani length (2in below the knee)':43 } },
      { id:'M-07', client:'C-05', kind:'Suit jacket / blazer / bandhgala', at:'2025-09-02', by:'p-farhan', unit:'inches',
        why:'First set', trial:'', vals:{ 'neck':16,'shoulder':17.5,'chest':41,'stomach':38,'waist':36,
        'seat':40,'sleeve length':24,'bicep':14,'cuff':10,'front chest':15.5,'back width':16.5,'jacket length':30.5 } },
      { id:'M-08', client:'C-05', kind:'Suit jacket / blazer / bandhgala', at:'2026-09-29', by:'p-sujit', unit:'inches',
        why:'Alteration after delivery', trial:'Trial 1',
        vals:{ 'neck':16,'shoulder':17.5,'chest':41,'stomach':39,'waist':37.5,
        'seat':40,'sleeve length':23.5,'bicep':14,'cuff':10,'front chest':15.5,'back width':16.5,'jacket length':30.5 } }
    ],

    orders: [
      { id:'O-1041', ops:'p-deb', client:'C-01', family:'F-01', vertical:'in-house', type:'Our own bespoke', stage:'In operations',
        value:485000, cuts:[{ label:'Discount', amount:15000 }],
        source:'Referral', salesperson:'p-rohit', stylist:'p-farhan',
        booked:'2026-09-12', advance_at:'2026-09-18',
        event:'Wedding', event_date:'2026-12-12', delivery:'2026-12-05', trial:'2026-11-22',
        note:'Five pieces for the wedding and the reception. Sherwani is the long one.',
        history:[{stage:'Stylist',by:'p-rohit',at:'2026-09-12T11:20'},{stage:'Shown designs',by:'p-farhan',at:'2026-09-12T12:40'},
                 {stage:'Quotation provided',by:'p-rohit',at:'2026-09-16T10:10'},{stage:'Advance taken',by:'p-rohit',at:'2026-09-18T13:00'},
                 {stage:'Measurements',by:'p-farhan',at:'2026-09-19T17:05'},{stage:'In operations',by:'p-deb',at:'2026-09-20T18:30'}] },

      { id:'O-1042', ops:'p-deb', client:'C-02', family:'F-01', vertical:'in-house', type:'Our own bespoke', stage:'In operations',
        value:135000, cuts:[],
        source:'Existing client', salesperson:'p-rohit', stylist:'p-farhan',
        booked:'2026-09-28', advance_at:'2026-10-01',
        event:'Wedding', event_date:'2026-12-12', delivery:'2026-11-28', trial:'2026-11-08',
        note:'Father of the groom. Bandhgala and trousers.',
        history:[{stage:'Stylist',by:'p-rohit',at:'2026-09-28T16:00'},{stage:'Shown designs',by:'p-farhan',at:'2026-09-28T16:40'},
                 {stage:'Quotation provided',by:'p-rohit',at:'2026-09-30T18:20'},{stage:'Advance taken',by:'p-rohit',at:'2026-10-01T12:15'},
                 {stage:'Measurements',by:'p-deb',at:'2026-10-01T12:30'},{stage:'In operations',by:'p-deb',at:'2026-10-01T12:40'}] },

      { id:'O-1043', client:'C-03', family:'F-01', vertical:'designer', type:'Third-party custom-made', stage:'In operations',
        value:240000, cuts:[],
        source:'Referral', salesperson:'p-pallavi', stylist:'p-farhan',
        booked:'2026-09-22', advance_at:'2026-09-26', designer:'D-01',
        event:'Wedding', event_date:'2026-12-12', delivery:'2026-11-25', promised:'2026-11-10', expected_in:'2026-11-10',
        note:'Customised sherwani made at Shantanu & Nikhil. Billed to Bhansali Exports.',
        history:[{stage:'Stylist',by:'p-pallavi',at:'2026-09-22T14:30'},{stage:'Shown designs',by:'p-pallavi',at:'2026-09-22T15:00'},
                 {stage:'Quotation provided',by:'p-pallavi',at:'2026-09-25T11:00'},{stage:'Advance taken',by:'p-pallavi',at:'2026-09-26T16:30'},
                 {stage:'Measurements',by:'p-farhan',at:'2026-09-27T12:00'},{stage:'In operations',by:'p-deb',at:'2026-09-27T17:00'}] },

      { id:'O-1045', client:'C-05', family:'F-03', vertical:'designer', type:'Third-party readymade', stage:'Alteration',
        value:88000, cuts:[],
        source:'Instagram', salesperson:'p-pallavi', stylist:'p-farhan',
        booked:'2026-08-20', advance_at:'2026-08-25', designer:'D-02',
        event:'Reception', event_date:'2026-10-18', delivery:'2026-10-10', promised:'2026-09-20', expected_in:'2026-09-20',
        note:'Readymade JJ Valaya bandhgala, size 42, taken in at the waist here.',
        history:[{stage:'Stylist',by:'p-pallavi',at:'2026-08-20T12:30'},{stage:'Shown designs',by:'p-pallavi',at:'2026-08-20T13:00'},
                 {stage:'Quotation provided',by:'p-pallavi',at:'2026-08-22T11:00'},{stage:'Advance taken',by:'p-pallavi',at:'2026-08-25T15:20'},
                 {stage:'In operations',by:'p-deb',at:'2026-08-25T15:40'},
                 {stage:'Trial',by:'p-farhan',at:'2026-09-29T12:00'},{stage:'Alteration',by:'p-deb',at:'2026-09-29T12:30'}] },

      { id:'O-1046', client:'C-04', family:'F-02', vertical:'in-house', type:'Our own bespoke', stage:'Shown designs',
        value:0, estimate:160000, cuts:[],
        source:'Walk-in', salesperson:'p-rohit', stylist:'p-farhan',
        booked:'2026-09-24', advance_at:'',
        event:'', event_date:'', delivery:'', trial:'',
        note:'Shown Zegna navy and two Scabal greys. Said he would think about it.',
        history:[{stage:'Stylist',by:'p-rohit',at:'2026-09-24T17:40'},{stage:'Shown designs',by:'p-farhan',at:'2026-09-24T18:10'}] },

      { id:'O-1047', client:'C-06', family:'F-04', vertical:'in-house', type:'Our own bespoke', stage:'Quotation provided',
        value:0, estimate:210000, cuts:[],
        source:'Outreach by Mark', salesperson:'p-pallavi', stylist:'p-farhan',
        booked:'2026-09-29', advance_at:'',
        event:'Reception', event_date:'2027-01-09', delivery:'', trial:'',
        note:'Quote of 2.1 lakh sent on 30 September. Measurements once the advance is in.',
        history:[{stage:'Stylist',by:'p-pallavi',at:'2026-09-29T12:00'},{stage:'Shown designs',by:'p-farhan',at:'2026-09-29T12:50'},
                 {stage:'Quotation provided',by:'p-pallavi',at:'2026-09-30T11:30'}] },

      { id:'O-1049', client:'C-05', family:'F-03', vertical:'designer', type:'Third-party custom-made', stage:'In operations',
        value:320000, cuts:[{ label:'Loyalty adjustment', amount:8000 }],
        source:'Existing client', salesperson:'p-pallavi', stylist:'p-farhan',
        booked:'2026-09-27', advance_at:'2026-10-01', designer:'D-03',
        event:'Wedding', event_date:'2027-02-06', delivery:'2027-01-20', promised:'2027-01-05', expected_in:'2027-01-05',
        note:'Customised Tahiliani sherwani for his brother-in-law.',
        history:[{stage:'Stylist',by:'p-pallavi',at:'2026-09-27T13:30'},{stage:'Shown designs',by:'p-pallavi',at:'2026-09-27T14:00'},
                 {stage:'Quotation provided',by:'p-pallavi',at:'2026-09-29T17:00'},{stage:'Advance taken',by:'p-pallavi',at:'2026-10-01T11:00'},
                 {stage:'Measurements',by:'p-farhan',at:'2026-10-01T11:10'},{stage:'In operations',by:'p-deb',at:'2026-10-01T11:20'}] },

      { id:'O-1050', client:'C-02', family:'F-01', vertical:'in-house', type:'Our own bespoke', stage:'Measurements',
        value:95000, cuts:[],
        source:'Existing client', salesperson:'p-rohit', stylist:'p-farhan',
        booked:'2026-10-01', advance_at:'2026-10-02', from_design:'R-01',
        event:'Wedding', event_date:'2026-12-12', delivery:'2026-11-30', trial:'2026-11-12',
        note:'Liked the ivory linen bandhgala on the floor and wants it made to his own measurements, plus two shirts.',
        history:[{stage:'Stylist',by:'p-rohit',at:'2026-10-01T17:40'},{stage:'Shown designs',by:'p-farhan',at:'2026-10-01T17:50'},
                 {stage:'Quotation provided',by:'p-rohit',at:'2026-10-01T18:00'},{stage:'Advance taken',by:'p-rohit',at:'2026-10-02T10:40'},
                 {stage:'Measurements',by:'p-farhan',at:'2026-10-02T11:00'}] },

      { id:'O-1052', client:'C-07', family:'F-05', vertical:'in-house', type:'', stage:'Stylist',
        value:0, estimate:120000, cuts:[],
        source:'Walk-in', salesperson:'p-rohit', stylist:'p-farhan',
        booked:'2026-10-01', advance_at:'',
        event:'Wedding', event_date:'2027-02-20', delivery:'', trial:'',
        note:'Farhan is with him. Nothing shown yet.',
        history:[{stage:'Stylist',by:'p-rohit',at:'2026-10-01T16:10'}] },

      { id:'O-1033', client:'C-05', family:'F-03', vertical:'in-house', type:'Our own bespoke', stage:'Delivered',
        value:162000, cuts:[{ label:'Loyalty adjustment', amount:7000 }],
        source:'Instagram', salesperson:'p-pallavi', stylist:'p-farhan',
        booked:'2026-07-28', advance_at:'2026-08-05',
        event:'Anniversary', event_date:'2026-09-28', delivery:'2026-09-20', trial:'2026-09-08',
        note:'Two-piece Scabal charcoal suit. Delivered on time.',
        history:[{stage:'Advance taken',by:'p-pallavi',at:'2026-08-05T12:00'},{stage:'Measurements',by:'p-farhan',at:'2026-08-06T11:00'},
                 {stage:'In operations',by:'p-deb',at:'2026-08-06T12:20'},
                 {stage:'Trial',by:'p-farhan',at:'2026-09-08T16:00'},{stage:'Ready',by:'p-deb',at:'2026-09-18T18:00'},
                 {stage:'Delivered',by:'p-rohit',at:'2026-09-20T13:00'}] }
    ],

    garments: [
      { id:'G-01', order:'O-1041', kind:'Sherwani', make:'custom', stage:'Embroidery / handwork',
        master:'p-ratan', fabrics:[{fabric:'F-02',metres:4.5},{fabric:'F-07',metres:1.5}],
        due:'2026-11-10', designer:'',
        note:'Ivory raw silk, zardozi on the placket and cuffs. Collar 2in, not 2.5.',
        samples:[{name:'Reference sherwani, front.jpg', size:'1.2 MB'},{name:'Reference sherwani, cuff detail.jpg', size:'980 KB'}],
        designform:[{name:'Design form O-1041 sherwani.pdf', size:'210 KB'}],
        history:[{stage:'Not started',by:'p-deb',at:'2026-09-20T18:30'},{stage:'Design confirmed',by:'p-farhan',at:'2026-09-21T12:00'},
                 {stage:'Fabric sourced',by:'p-deb',at:'2026-09-22T10:00'},
                 {stage:'Cut',by:'p-bikash',at:'2026-09-24T11:00'},
                 {stage:'Cut',by:'p-bikash',at:'2026-09-24T16:30',handover:true,from:'p-bikash',to:'p-sujit',note:'Cutting done, over to Sujit for stitching'},
                 {stage:'Stitching',by:'p-sujit',at:'2026-09-26T09:30'},
                 {stage:'Stitching',by:'p-sujit',at:'2026-09-29T09:45',handover:true,from:'p-sujit',to:'p-ratan',note:'Body is ready, over to Ratan for the zardozi'},
                 {stage:'Embroidery / handwork',by:'p-ratan',at:'2026-09-29T10:00'}] },
      { id:'G-02', order:'O-1041', kind:'Suit jacket / blazer / bandhgala', make:'custom', stage:'Stitching',
        master:'p-iqbal', fabrics:[{fabric:'F-01',metres:3.2},{fabric:'F-07',metres:1.2}],
        due:'2026-11-15', designer:'',
        note:'Zegna navy bandhgala, self buttons.',
        samples:[{name:'Bandhgala reference.jpg', size:'840 KB'}], designform:[],
        history:[{stage:'Not started',by:'p-deb',at:'2026-09-20T18:30'},{stage:'Design confirmed',by:'p-farhan',at:'2026-09-21T12:10'},
                 {stage:'Fabric sourced',by:'p-deb',at:'2026-09-21T15:00'},
                 {stage:'Cut',by:'p-bikash',at:'2026-09-25T10:00'},
                 {stage:'Cut',by:'p-bikash',at:'2026-09-26T17:00',handover:true,from:'p-bikash',to:'p-iqbal',note:'Cut and marked, over to Iqbal'},
                 {stage:'Stitching',by:'p-iqbal',at:'2026-09-27T09:00'}] },
      { id:'G-03', order:'O-1041', kind:'Shirt', make:'custom', stage:'Cut',
        master:'p-iqbal', fabrics:[{fabric:'F-06',metres:2.0}], due:'2026-11-18', designer:'',
        note:'White poplin, cutaway collar.', samples:[], designform:[],
        history:[{stage:'Not started',by:'p-deb',at:'2026-09-20T18:30'},{stage:'Design confirmed',by:'p-farhan',at:'2026-09-21T12:20'},
                 {stage:'Fabric sourced',by:'p-deb',at:'2026-09-21T15:10'},{stage:'Cut',by:'p-bikash',at:'2026-09-28T11:00'}] },
      { id:'G-04', order:'O-1041', kind:'Churidar / pyjama', make:'custom', stage:'Not started',
        master:'', fabrics:[{fabric:'F-02',metres:2.5}], due:'2026-11-12', designer:'',
        note:'To go under the sherwani. Nobody has picked it up.', samples:[], designform:[],
        history:[{stage:'Not started',by:'p-deb',at:'2026-09-17T18:30'}] },
      { id:'G-05', order:'O-1041', kind:'Waistcoat / Nehru jacket', make:'custom', stage:'Design confirmed',
        master:'p-iqbal', fabrics:[{fabric:'F-03',metres:1.8},{fabric:'F-07',metres:0.9}],
        due:'2026-11-16', designer:'',
        note:'Charcoal Nehru jacket for the reception.', samples:[], designform:[],
        history:[{stage:'Not started',by:'p-deb',at:'2026-09-20T18:30'},{stage:'Design confirmed',by:'p-farhan',at:'2026-09-21T13:00'}] },

      { id:'G-06', order:'O-1042', kind:'Suit jacket / blazer / bandhgala', make:'custom', stage:'Stitching',
        master:'p-iqbal', fabrics:[{fabric:'F-04',metres:3.4},{fabric:'F-07',metres:1.2}],
        due:'2026-11-14', designer:'',
        note:'Dormeuil midnight. Cut to the new, smaller set.', samples:[], designform:[],
        history:[{stage:'Not started',by:'p-deb',at:'2026-10-01T12:40'},{stage:'Design confirmed',by:'p-farhan',at:'2026-10-01T15:00'},
                 {stage:'Fabric sourced',by:'p-deb',at:'2026-10-01T16:00'},{stage:'Cut',by:'p-bikash',at:'2026-10-01T17:30'},
                 {stage:'Stitching',by:'p-iqbal',at:'2026-10-02T09:30'}] },
      { id:'G-07', order:'O-1042', kind:'Trousers / breeches', make:'custom', stage:'Cut',
        master:'p-bikash', fabrics:[{fabric:'F-04',metres:1.3}], due:'2026-11-14', designer:'',
        note:'', samples:[], designform:[],
        history:[{stage:'Not started',by:'p-deb',at:'2026-10-01T12:40'},{stage:'Design confirmed',by:'p-farhan',at:'2026-10-01T15:05'},
                 {stage:'Fabric sourced',by:'p-deb',at:'2026-10-01T16:05'},{stage:'Cut',by:'p-bikash',at:'2026-10-02T10:00'}] },

      { id:'G-08', order:'O-1043', kind:'Sherwani', make:'custom', stage:'Queried by designer',
        master:'', fabrics:[], due:'2026-11-10', designer:'D-01',
        note:'They have asked whether the collar height is 2in or 2.5in. Nobody has answered.',
        samples:[{name:'S&N lookbook page 14.jpg', size:'1.4 MB'}], designform:[{name:'Design form, S&N sherwani.pdf', size:'190 KB'}],
        history:[{stage:'Order confirmed',by:'p-pallavi',at:'2026-09-27T17:00'},{stage:'Measurements sent',by:'p-farhan',at:'2026-09-27T18:00'},
                 {stage:'Designer accepted',by:'p-pallavi',at:'2026-09-28T16:00'},{stage:'Queried by designer',by:'p-pallavi',at:'2026-09-29T10:30'}] },

      { id:'G-09', order:'O-1045', kind:'Suit jacket / blazer / bandhgala', make:'readymade', stage:'Alteration here',
        master:'p-sujit', fabrics:[], due:'2026-10-06', designer:'D-02',
        note:'Taking in 1.5in at the waist and shortening the sleeve by half an inch.',
        samples:[], designform:[],
        history:[{stage:'Order confirmed',by:'p-pallavi',at:'2026-08-25T15:40'},{stage:'Dispatched to us',by:'p-pallavi',at:'2026-09-15T10:00'},
                 {stage:'Received and checked',by:'p-deb',at:'2026-09-18T12:00'},{stage:'Trial',by:'p-farhan',at:'2026-09-29T12:00'},
                 {stage:'Alteration here',by:'p-deb',at:'2026-09-29T12:30'}] },

      { id:'G-10', order:'O-1049', kind:'Sherwani', make:'custom', stage:'Measurements sent',
        master:'', fabrics:[], due:'2027-01-05', designer:'D-03',
        note:'', samples:[], designform:[],
        history:[{stage:'Order confirmed',by:'p-pallavi',at:'2026-10-01T11:20'},{stage:'Measurements sent',by:'p-farhan',at:'2026-10-01T15:00'}] },

      { id:'G-11', order:'O-1050', kind:'Suit jacket / blazer / bandhgala', make:'custom', stage:'Not started',
        master:'', fabrics:[{fabric:'F-02',metres:2.8}], due:'2026-11-20', designer:'',
        note:'Our ivory linen bandhgala SM-BG-014, made to his measurements.', samples:[], designform:[],
        history:[{stage:'Not started',by:'p-deb',at:'2026-10-02T11:00'}] },
      { id:'G-12', order:'O-1050', kind:'Shirt', make:'custom', stage:'Not started',
        master:'', fabrics:[{fabric:'F-06',metres:2.0}], due:'2026-11-20', designer:'', note:'',
        samples:[], designform:[],
        history:[{stage:'Not started',by:'p-deb',at:'2026-10-02T11:00'}] },

      { id:'G-13', order:'O-1033', kind:'Suit jacket / blazer / bandhgala', make:'custom', stage:'Delivered',
        master:'p-iqbal', fabrics:[{fabric:'F-03',metres:3.6},{fabric:'F-07',metres:1.4}],
        due:'2026-09-16', designer:'', note:'', samples:[], designform:[],
        history:[{stage:'Cut',by:'p-bikash',at:'2026-08-12T10:00'},
                 {stage:'Cut',by:'p-bikash',at:'2026-08-19T17:00',handover:true,from:'p-bikash',to:'p-iqbal',note:'Over to Iqbal'},
                 {stage:'Stitching',by:'p-iqbal',at:'2026-08-20T10:00'},
                 {stage:'Finishing',by:'p-iqbal',at:'2026-09-10T10:00'},{stage:'Checking',by:'p-deb',at:'2026-09-16T10:00'},
                 {stage:'Ready',by:'p-deb',at:'2026-09-18T18:00'},{stage:'Delivered',by:'p-rohit',at:'2026-09-20T13:00'}] },
      { id:'G-14', order:'O-1033', kind:'Trousers / breeches', make:'custom', stage:'Delivered',
        master:'p-iqbal', fabrics:[{fabric:'F-03',metres:1.4}], due:'2026-09-16', designer:'', note:'',
        samples:[], designform:[],
        history:[{stage:'Cut',by:'p-bikash',at:'2026-08-12T10:10'},{stage:'Stitching',by:'p-iqbal',at:'2026-08-21T10:00'},
                 {stage:'Ready',by:'p-deb',at:'2026-09-18T18:00'},{stage:'Delivered',by:'p-rohit',at:'2026-09-20T13:00'}] }
    ],

    fabrics: [
      { id:'F-01', brand:'Ermenegildo Zegna', vendor:'V-01', book:'Trofeo 600', pattern:'Plain twill',
        colour:'Navy', hex:'#1e2a44', img:'', cost:9800, threshold:6, procure_days:21,
        rates:{ 'Suit jacket / blazer / bandhgala':{ per_m:30000, design:15000 }, 'Trousers / breeches':{ per_m:9000, design:3000 }, 'Waistcoat / Nehru jacket':{ per_m:12000, design:5000 } },
        stock:{ Store:8.4, Godown:12.0 }, sat_days:18, sold_90:26 },
      { id:'F-02', brand:'Loro Piana', vendor:'V-02', book:'Raw silk', pattern:'Slub',
        colour:'Ivory', hex:'#e8ded0', img:'', cost:14500, threshold:5, procure_days:28,
        rates:{ 'Sherwani':{ per_m:28000, design:25000 }, 'Kurta':{ per_m:16000, design:5000 }, 'Churidar / pyjama':{ per_m:9000, design:2000 }, 'Suit jacket / blazer / bandhgala':{ per_m:40000, design:20000 } },
        stock:{ Store:3.2, Godown:1.5 }, sat_days:9, sold_90:17 },
      { id:'F-03', brand:'Scabal', vendor:'V-03', book:'Super 150s', pattern:'Herringbone',
        colour:'Charcoal', hex:'#343a40', img:'', cost:7600, threshold:6, procure_days:24,
        rates:{ 'Suit jacket / blazer / bandhgala':{ per_m:20000, design:15000 }, 'Trousers / breeches':{ per_m:7000, design:3000 }, 'Waistcoat / Nehru jacket':{ per_m:9000, design:5000 } },
        stock:{ Store:11.0, Godown:9.0 }, sat_days:42, sold_90:18 },
      { id:'F-04', brand:'Dormeuil', vendor:'V-04', book:'Amadeus 365', pattern:'Plain',
        colour:'Midnight blue', hex:'#141c33', img:'', cost:8200, threshold:5, procure_days:26,
        stock:{ Store:6.6, Godown:4.0 }, sat_days:27, sold_90:12 },
      { id:'F-05', brand:'Cerruti 1881', vendor:'V-05', book:'Linea', pattern:'Birdseye',
        colour:'Stone grey', hex:'#9aa0a6', img:'', cost:5400, threshold:8, procure_days:18,
        stock:{ Store:14.0, Godown:22.0 }, sat_days:168, sold_90:2 },
      { id:'F-06', brand:'Thomas Mason', vendor:'V-06', book:'Journey', pattern:'Poplin',
        colour:'White', hex:'#f7f7f4', img:'', cost:2100, threshold:20, procure_days:14,
        stock:{ Store:34.0, Godown:48.0 }, sat_days:4, sold_90:61 },
      { id:'F-07', brand:'Bemberg', vendor:'V-06', book:'Cupro lining', pattern:'Plain',
        colour:'Ivory', hex:'#efe8db', img:'', cost:650, threshold:20, procure_days:14,
        stock:{ Store:26.0, Godown:40.0 }, sat_days:3, sold_90:48 }
    ],

    vendors: [
      { id:'V-01', name:'Zegna India, Reliance Brands', city:'Mumbai', days:21, contact:'+91 22 4000 1111' },
      { id:'V-02', name:'Loro Piana, Milan', city:'Milan', days:28, contact:'orders@lp.example' },
      { id:'V-03', name:'Scabal, Brussels', city:'Brussels', days:24, contact:'india@scabal.example' },
      { id:'V-04', name:'Dormeuil, Paris', city:'Paris', days:26, contact:'india@dormeuil.example' },
      { id:'V-05', name:'Cerruti 1881', city:'Biella', days:18, contact:'export@cerruti.example' },
      { id:'V-06', name:'Albini Group', city:'Bergamo', days:14, contact:'india@albini.example' }
    ],

    designers: [
      { id:'D-01', name:'Shantanu & Nikhil', margin:30, consign:1480000, aged_days:46, city:'Delhi' },
      { id:'D-02', name:'JJ Valaya',         margin:30, consign:920000,  aged_days:112, city:'Delhi' },
      { id:'D-03', name:'Tarun Tahiliani',   margin:20, consign:2150000, aged_days:31, city:'Delhi' },
      { id:'D-04', name:'Gaurav Gupta',      margin:30, consign:640000,  aged_days:22, city:'Delhi' },
      { id:'D-05', name:'Rohit Gandhi + Rahul Khanna', margin:20, consign:410000, aged_days:88, city:'Delhi' }
    ],

    /* two segments, kept apart: ours, and the designers' stock standing in our shop */
    readymade: [
      { id:'R-01', name:'Ivory linen bandhgala', code:'SM-BG-014', kind:'Suit jacket / blazer / bandhgala',
        owner:'Sasya', designed_by:'Farhan Qureshi', size:'40', price:68000, cost_to_make:29500,
        make_days:18, age_days:22, warehouse:'Store', made_count:6, img:'' },
      { id:'R-04', name:'Navy tuxedo, grosgrain lapel', code:'SM-TX-002', kind:'Suit jacket / blazer / bandhgala',
        owner:'Sasya', designed_by:'Rachit Agarwal', size:'38', price:95000, cost_to_make:41000,
        make_days:21, age_days:54, warehouse:'Godown', made_count:3, img:'' },
      { id:'R-06', name:'Bandhgala, bottle green raw silk', code:'SM-BG-021', kind:'Suit jacket / blazer / bandhgala',
        owner:'Sasya', designed_by:'Farhan Qureshi', size:'42', price:82000, cost_to_make:34000,
        make_days:16, age_days:9, warehouse:'Store', made_count:11, img:'' },
      { id:'R-02', name:'Black sherwani, dori work', code:'', kind:'Sherwani',
        owner:'D-02', designed_by:'JJ Valaya', size:'42', price:185000, cost_to_make:0,
        make_days:0, age_days:96, warehouse:'Store', made_count:0, img:'' },
      { id:'R-03', name:'Draped kurta, charcoal', code:'', kind:'Kurta',
        owner:'D-04', designed_by:'Gaurav Gupta', size:'40', price:142000, cost_to_make:0,
        make_days:0, age_days:11, warehouse:'Store', made_count:0, img:'' },
      { id:'R-05', name:'Bandhgala, ink blue', code:'', kind:'Suit jacket / blazer / bandhgala',
        owner:'D-01', designed_by:'Shantanu & Nikhil', size:'42', price:125000, cost_to_make:0,
        make_days:0, age_days:8, warehouse:'Store', made_count:0, img:'' }
    ],

    /* an invoice is a demand for an amount: an advance, a part payment or the final one */
    invoices: [
      { id:'INV-2641', order:'O-1041', client:'C-01', billed_to:'Karan Bhansali', parent:'',
        amount:250000, kind:'Advance', issued:'2026-09-18', due:'2026-09-25',
        scope:'Advance against five garments: sherwani, bandhgala, two shirts, churidar and a Nehru jacket.' },
      { id:'INV-2648', order:'O-1043', client:'C-03', billed_to:'Bhansali Exports Pvt Ltd', parent:'Bhansali Exports Pvt Ltd',
        amount:80000, kind:'Advance', issued:'2026-09-26', due:'2026-10-06',
        scope:'Advance against a customised sherwani made at Shantanu & Nikhil.' },
      { id:'INV-2652', order:'O-1045', client:'C-05', billed_to:'Arindam Sen', parent:'',
        amount:103840, kind:'Final', issued:'2026-09-29', due:'2026-10-01',
        scope:'JJ Valaya bandhgala, size 42, with alterations done in house.' },
      { id:'INV-2655', order:'O-1042', client:'C-02', billed_to:'Jayant Bhansali', parent:'',
        amount:60000, kind:'Advance', issued:'2026-10-01', due:'2026-10-08',
        scope:'Advance against a bandhgala and trousers.' },
      { id:'INV-2658', order:'O-1049', client:'C-05', billed_to:'Arindam Sen', parent:'',
        amount:120000, kind:'Advance', issued:'2026-10-01', due:'2026-10-11',
        scope:'Advance against a customised Tarun Tahiliani sherwani.' },
      { id:'INV-2662', order:'O-1050', client:'C-02', billed_to:'Jayant Bhansali', parent:'',
        amount:45000, kind:'Advance', issued:'2026-10-02', due:'2026-10-09',
        scope:'Advance against a bandhgala made to measure and two shirts.' },
      { id:'INV-2601', order:'O-1033', client:'C-05', billed_to:'Arindam Sen', parent:'',
        amount:182900, kind:'Final', issued:'2026-09-20', due:'2026-09-27',
        scope:'Two-piece Scabal charcoal suit, delivered 20 September.' }
    ],

    payins: [
      { id:'PI-01', invoice:'INV-2641', amount:150000, method:'UPI (GPay / PhonePe / Razorpay)', at:'2026-09-18', ref:'UPI/9823451', by:'p-sunita' },
      { id:'PI-02', invoice:'INV-2641', amount:100000, method:'Net transfer', at:'2026-09-22', ref:'HDFC/NEFT/77231', by:'p-sunita' },
      { id:'PI-09', invoice:'INV-2648', amount:80000,  method:'Net transfer', at:'2026-09-26', ref:'ICICI/RTGS/41187', by:'p-sunita' },
      { id:'PI-03', invoice:'INV-2652', amount:40000,  method:'Cash', at:'2026-09-29', ref:'Counter receipt 312', by:'p-sunita' },
      { id:'PI-04', invoice:'INV-2655', amount:60000,  method:'Cheque', at:'2026-10-01', ref:'ICICI 440192', by:'p-sunita' },
      { id:'PI-05', invoice:'INV-2658', amount:120000, method:'Credit card', at:'2026-10-01', ref:'AMEX ****4021', by:'p-sunita' },
      { id:'PI-08', invoice:'INV-2662', amount:45000,  method:'UPI (GPay / PhonePe / Razorpay)', at:'2026-10-02', ref:'UPI/1120934', by:'p-sunita' },
      { id:'PI-06', invoice:'INV-2601', amount:80000,  method:'Net transfer', at:'2026-08-05', ref:'SBI/IMPS/55120', by:'p-sunita' },
      { id:'PI-07', invoice:'INV-2601', amount:102900, method:'Net transfer', at:'2026-09-20', ref:'SBI/IMPS/55988', by:'p-sunita' }
    ],

    payables: [
      { id:'PB-01', designer:'D-01', order:'O-1043', gross:0, margin:30, at:'2026-09-26', paid:false, paid_at:'' },
      { id:'PB-02', designer:'D-02', order:'O-1045', gross:0, margin:30, at:'2026-08-25', paid:false, paid_at:'' },
      { id:'PB-03', designer:'D-03', order:'O-1049', gross:0, margin:20, at:'2026-10-01', paid:false, paid_at:'' },
      { id:'PB-04', designer:'D-04', order:'O-1020', gross:142000, margin:30, at:'2026-08-10', paid:true, paid_at:'2026-09-05' }
    ],

    costlines: [
      { id:'CL-01', order:'O-1033', kind:'Stitching',            label:'Jacket and trousers, Iqbal', amount:18000, by:'p-deb', at:'2026-09-18' },
      { id:'CL-02', order:'O-1033', kind:'Designing',            label:'Pattern and fittings',       amount:9000,  by:'p-deb', at:'2026-09-18' },
      { id:'CL-03', order:'O-1033', kind:'Porter / courier',     label:'Two trips to Salt Lake',     amount:1200,  by:'p-deb', at:'2026-09-20' },
      { id:'CL-04', order:'O-1033', kind:'Embroidery / handwork',label:'Lapel buttonhole, hand',     amount:14000, by:'p-deb', at:'2026-09-14' },
      { id:'CL-05', order:'O-1041', kind:'Stitching',            label:'Five pieces, Sujit and Iqbal', amount:46000, by:'p-deb', at:'2026-09-26' },
      { id:'CL-06', order:'O-1041', kind:'Embroidery / handwork',label:'Zardozi, Ratan, sherwani',   amount:65000, by:'p-deb', at:'2026-09-29' },
      { id:'CL-07', order:'O-1041', kind:'Designing',            label:'Full wedding set',           amount:15000, by:'p-deb', at:'2026-09-20' },
      { id:'CL-08', order:'O-1041', kind:'Porter / courier',     label:'Fabric from the godown',     amount:2400,  by:'p-deb', at:'2026-09-22' },
      { id:'CL-09', order:'O-1042', kind:'Stitching',            label:'Bandhgala and trousers',     amount:14000, by:'p-deb', at:'2026-10-01' }
    ],

    comms: [
      { id:'CM-01', on:'client', ref:'C-01', at:'2026-09-16T11:20', source:'WhatsApp', who:'p-rohit',
        note:'Sent the quote for all five pieces. He asked whether the sherwani could be ready a week earlier.',
        docs:[{name:'Quote O-1041.pdf', size:'84 KB'}] },
      { id:'CM-02', on:'client', ref:'C-01', at:'2026-09-18T13:10', source:'Call', who:'p-rohit',
        note:'Advance of 2.5 lakh confirmed on the phone. Transfer in two parts.', docs:[] },
      { id:'CM-03', on:'order', ref:'O-1043', at:'2026-09-29T10:40', source:'Email', who:'p-pallavi',
        note:'Shantanu & Nikhil studio asked whether the collar is 2in or 2.5in. Forwarded to Farhan. No answer yet.',
        docs:[{name:'SN query 29 Sep.eml', size:'12 KB'}] },
      { id:'CM-04', on:'client', ref:'C-04', at:'2026-09-24T18:30', source:'Walk-in', who:'p-farhan',
        note:'Shown Zegna navy and two Scabal greys. Liked the navy. Took a photograph of the bunch.', docs:[] },
      { id:'CM-05', on:'client', ref:'C-05', at:'2026-09-29T12:20', source:'Online meet', who:'p-farhan',
        note:'Trial on video. Waist to come in 1.5in, sleeve half an inch shorter.', docs:[] },
      { id:'CM-06', on:'client', ref:'C-07', at:'2026-10-01T16:15', source:'Walk-in', who:'p-rohit',
        note:'Came in at four. Farhan is with him. Brother marrying in February, wants a bandhgala and maybe a sherwani.', docs:[] }
    ],

    follows: [
      { id:'FU-01', order:'O-1047', client:'C-06', at:'2026-10-04', method:'WhatsApp', owner:'p-pallavi',
        note:'Chase the quote and send the two sherwani references.', done:false, outcome:'' },
      { id:'FU-02', order:'O-1041', client:'C-01', at:'2026-10-05', method:'Phone call', owner:'p-rohit',
        note:'Confirm the trial date of 22 November.', done:false, outcome:'' },
      { id:'FU-03', order:'O-1043', client:'C-03', at:'2026-10-03', method:'Phone call', owner:'p-pallavi',
        note:'Answer the collar question and tell the studio to carry on.', done:false, outcome:'' },
      { id:'FU-04', order:'O-1045', client:'C-05', at:'2026-09-30', method:'WhatsApp', owner:'p-pallavi',
        note:'Told him the alteration is done by 6 October.', done:true, outcome:'Ready to sign' }
    ],

    targets: [
      { id:'T-02', what:'Order value closed', per:'house',      who:'house',    month:4500000, unit:'money' },
      { id:'T-01a',what:'Order value closed', per:'salesperson',who:'p-rohit',  month:2500000, unit:'money' },
      { id:'T-01b',what:'Order value closed', per:'salesperson',who:'p-pallavi',month:1800000, unit:'money' },
      { id:'T-03', what:'Margin kept',        per:'house',      who:'house',    month:1800000, unit:'money' },
      { id:'T-04', what:'Delivered on or before the promised date', per:'house', who:'house', month:90, unit:'pct' },
      { id:'T-05a',what:'Garments returned on time', per:'master', who:'p-iqbal', month:95, unit:'pct' },
      { id:'T-05b',what:'Garments returned on time', per:'master', who:'p-sujit', month:95, unit:'pct' },
      { id:'T-05c',what:'Garments returned on time', per:'master', who:'p-ratan', month:90, unit:'pct' },
      { id:'T-05d',what:'Garments returned on time', per:'master', who:'p-bikash',month:95, unit:'pct' },
      { id:'T-06', what:'Households advised who placed an order', per:'stylist', who:'p-farhan', month:12, unit:'count' }
    ],

    agents: [
      { id:'floorwatch',    name:'The Floor Watch', mode:'auto',
        job:'a garment held longer than that kind of work usually takes, or past its due date',
        rules:{ held_days:7 },
        rule_labels:{ held_days:'Raise a garment held at one stage for more than this many days' } },
      { id:'clock',         name:'The Clock', mode:'auto',
        job:'counts back from the delivery date and raises any garment still unfinished',
        rules:{ days_before_delivery:7 },
        rule_labels:{ days_before_delivery:'Start counting this many days before the delivery date' } },
      { id:'designerchase', name:'The Chaser', mode:'suggest',
        job:'an order going quiet in either operations pipeline',
        rules:{ quiet_days:3 },
        rule_labels:{ quiet_days:'Chase a query or a silent designer after this many days' } },
      { id:'walkin',        name:'The Doorman', mode:'suggest',
        job:'a client shown designs or quoted who never came back and has no follow-up booked',
        rules:{ quiet_days:5 },
        rule_labels:{ quiet_days:'Flag a quiet client after this many days' } },
      { id:'bolt',          name:'The Bolt', mode:'auto',
        job:'a fabric below the threshold set on it, weighed against that vendor’s delivery days',
        rules:{},
        rule_labels:{} },
      { id:'collector',     name:'The Collector', mode:'suggest',
        job:'an invoice sent and not cleared',
        rules:{ grace_days:0 },
        rule_labels:{ grace_days:'Days of grace after the due date before chasing' } },
      { id:'settler',       name:'The Settler', mode:'suggest',
        job:'a designer owed money for too long, and their ageing stock',
        rules:{ age_days:30 },
        rule_labels:{ age_days:'Raise a payable older than this many days' } },
      { id:'shelf',         name:'The Shelf', mode:'suggest',
        job:'what is not moving and what is: dead fabric, dead readymade, and the winners',
        rules:{ dead_fabric_days:120, dead_piece_days:90 },
        rule_labels:{ dead_fabric_days:'Call a fabric dead after this many days without a cut',
                      dead_piece_days:'Call a readymade piece dead after this many days on the floor' } }
    ],

    threads: [
      { id:'TH-01', client:'C-01', channel:'WhatsApp', assigned:'p-rohit', unread:1, msgs:[
        { at:'2026-10-01T19:12', from:'them', text:'Rohit bhai, any chance the sherwani is ready by 28 November? My mother wants photographs before the sangeet.' },
        { at:'2026-10-01T19:40', from:'us',   text:'Let me check with the floor and confirm tomorrow, Mr. Bhansali.' },
        { at:'2026-10-02T09:05', from:'them', text:'Thank you. Also please send the churidar colour options.' } ] },
      { id:'TH-02', client:'C-04', channel:'Instagram', assigned:'p-farhan', unread:0, msgs:[
        { at:'2026-09-25T11:02', from:'them', text:'Hi, I came by yesterday. Can you send me the navy one again?' },
        { at:'2026-09-25T11:30', from:'us',   text:'Of course. Here is the Zegna Trofeo navy, and the two Scabal greys you liked.' } ] },
      { id:'TH-03', client:'C-05', channel:'WhatsApp', assigned:'p-pallavi', unread:2, msgs:[
        { at:'2026-10-02T08:40', from:'them', text:'Is the bandhgala back from alteration?' },
        { at:'2026-10-02T08:41', from:'them', text:'The reception is on the 18th.' } ] }
    ],

    campaigns: [
      { id:'CP-01', channel:'Meta', name:'Wedding season, Kolkata, Oct',  spend:85000, leads:62, orders:4, value:740000, window:'1 to 31 Oct' },
      { id:'CP-02', channel:'Google', name:'Bespoke suits Kolkata',       spend:42000, leads:23, orders:2, value:310000, window:'1 to 31 Oct' },
      { id:'CP-03', channel:'Meta', name:'Third-party designer carousel', spend:36000, leads:19, orders:1, value:320000, window:'1 to 31 Oct' },
      { id:'CP-04', channel:'LinkedIn', name:'Corporate gifting, suits',  spend:18000, leads:7,  orders:0, value:0,      window:'1 to 31 Oct' }
    ]
  };
}
