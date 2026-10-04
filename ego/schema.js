'use strict';
/* COPY of ego/server/src/schema.js with `export` removed by build_live.py. */
/* EGO Master LIVE: the one field registry.

   ONE copy. The Worker imports it, the browser gets it as live/dist/schema.js
   (build_live.py strips the `export` keywords and nothing else), and
   make_template.py reads it through node to write the Excel headers and
   dropdowns. A field added here appears in the form, the 360 page, the server's
   validation and the upload template together, or it is not added at all. */

const CATS = ['LVT', 'SPC', 'Laminate', 'Engineered', 'Hywood', 'WPC Tile Deck', 'WPC Plank / Outdoor', 'PVC Soffit & Cladding'];

/* kind -> which division owns it. Architects and design firms sit in BOTH
   (29 Sep meeting: wholesale needs its own architect database too). */
const KINDS = {
  distributor: { label: 'Distributor', plural: 'Distributors', group: 'dealer', division: 'wholesale' },
  dealer: { label: 'Dealer', plural: 'Dealers', group: 'dealer', division: 'wholesale' },
  sub_dealer: { label: 'Sub-dealer', plural: 'Sub-dealers', group: 'dealer', division: 'wholesale' },
  architect: { label: 'Architect', plural: 'Architects', group: 'architect', division: 'both' },
  design_firm: { label: 'Design firm', plural: 'Design firms', group: 'firm', division: 'both' },
  retail: { label: 'Retail client', plural: 'Retail clients', group: 'retail', division: 'retail' },
  direct: { label: 'Client (individual or firm)', plural: 'Clients', group: 'direct', division: 'wholesale' },
};
/* Architects and firms are 'both' as a kind, but each RECORD belongs to the company
   that holds it (EGO Premium and Big E keep separate architect lists, 3 Oct). */
const KIND_BY_LABEL = Object.fromEntries(Object.entries(KINDS).map(([k, v]) => [v.label.toLowerCase(), k]));

const PIPELINES = {
  wholesale: { label: 'Wholesale opportunity', plural: 'Wholesale opportunities', division: 'wholesale', won: 'Payment collected', credit: 'Invoiced', lines: true },
  retail_lead: { label: 'Retail lead', plural: 'Retail leads', division: 'retail' },
  retail_project: { label: 'Retail project', plural: 'Retail projects', division: 'retail' },
};
/* which pipelines a client of each group may have */
const PIPES_FOR = { dealer: ['wholesale'], direct: ['wholesale'], retail: ['retail_lead', 'retail_project'], architect: ['wholesale', 'retail_lead', 'retail_project'], firm: ['wholesale', 'retail_lead', 'retail_project'] };

const SOURCES = ['Meta Ads', 'Google Ads', 'Website', 'WhatsApp', 'IndiaMART', 'JustDial', 'QR code', 'Walk-in', 'Referral', 'Field visit', 'Architect', 'Existing relationship', 'Other'];

/* Defaults for the lists the Owner can edit in Lists & stages. Stored in
   settings once edited; these only apply to a fresh database. */
const DEFAULT_LISTS = {
  stages: {
    wholesale: ['New', 'Contacted', 'Qualified', 'Quotation', 'Invoiced', 'Payment collected', 'Lost', 'Nurturing'],
    retail_lead: ['New', 'Contacted', 'Qualified', 'Appointment', 'Site visit', 'Sample', 'Quote', 'Won', 'Lost'],
    retail_project: ['New project', 'Qualified', 'Sample', 'Specification', 'Approval', 'Quotation', 'Negotiation', 'Won', 'Lost'],
  },
  cities: [
    ['Mumbai', 'West'], ['Navi Mumbai', 'West'], ['Thane', 'West'], ['Pune', 'West'], ['Nashik', 'West'], ['Nagpur', 'West'], ['Ahmedabad', 'West'], ['Surat', 'West'], ['Vadodara', 'West'], ['Goa', 'West'],
    ['Bengaluru', 'South'], ['Chennai', 'South'], ['Hyderabad', 'South'], ['Kochi', 'South'],
    ['New Delhi', 'North'], ['Gurugram', 'North'], ['Noida', 'North'], ['Jaipur', 'North'], ['Chandigarh', 'North'], ['Lucknow', 'North'],
    ['Kolkata', 'East'], ['Indore', 'Central'],
  ].map(([city, region]) => ({ city, region })),
  categories: CATS,
  lost_reasons: ['Price', 'Chose a competitor', 'Architect specified another brand', 'Project on hold', 'Delivery timeline', 'Credit terms', 'No response', 'Other'],
};
const REGIONS = ['West', 'South', 'North', 'East', 'Central'];

const DESIGNATIONS = ['Owner', 'Partner', 'Director', 'Principal', 'Purchase', 'Accounts', 'Store manager', 'Sales', 'Telecaller', 'Marketing', 'Site engineer', 'Project manager', 'Senior architect', 'Architect', 'Interior designer', 'Other'];

/* A field: key, label, type, where it shows (groups), required, options.
   col: true = its own database column; otherwise it lives in the `extra` JSON.
   Types: text textarea mobile email select multi number money date yesno gst
   pincode city cities (several from the city list) cats (from the category list)
   owner link (to another client). */
const ALL = ['dealer', 'architect', 'firm', 'retail', 'direct'];
const ORGS = ['dealer', 'architect', 'firm'];
const CLIENT_FIELDS = [
  { key: 'kind', label: 'Type', type: 'select', opts: Object.keys(KINDS), req: true, col: true, groups: ALL, section: 'Basics' },
  { key: 'name', label: 'Name', type: 'text', req: true, col: true, groups: ALL, section: 'Basics' },
  { key: 'client_type', list: 'client_types', label: 'Client type', type: 'select', opts: ['Individual', 'Homeowner', 'Builder', 'Contractor', 'Hotel', 'Corporate', 'Retail chain', 'Institution', 'Other firm'], req: true, groups: ['retail', 'direct'], section: 'Basics' },
  { key: 'mobile', label: 'Mobile', type: 'mobile', req: true, col: true, groups: ALL, section: 'Basics' },
  { key: 'whatsapp', label: 'WhatsApp number', type: 'mobile', col: true, groups: ALL, section: 'Basics' },
  { key: 'mobile_alt', label: 'Alternate mobile', type: 'mobile', col: true, groups: ALL, section: 'Basics' },
  { key: 'email', label: 'Email', type: 'email', col: true, groups: ALL, section: 'Basics' },
  { key: 'city', label: 'City', type: 'city', req: true, col: true, groups: ALL, section: 'Basics' },
  { key: 'locality', label: 'Area or locality', type: 'text', groups: ALL, section: 'Basics' },
  { key: 'pincode', label: 'Pincode', type: 'pincode', groups: ALL, section: 'Basics' },
  { key: 'address', label: 'Address', type: 'textarea', groups: ALL, section: 'Basics' },
  { key: 'areas_covered', label: 'Areas they cover', type: 'cities', groups: ORGS, section: 'Basics' },
  { key: 'other_offices', label: 'Other offices or branches (areas)', type: 'text', groups: ORGS, section: 'Basics' },
  { key: 'owner_id', label: 'Owner at EGO', type: 'owner', req: true, col: true, groups: ALL, section: 'Basics' },
  { key: 'source', list: 'sources', label: 'Source', type: 'select', opts: SOURCES, col: true, groups: ALL, section: 'Basics' },
  { key: 'status', list: 'client_statuses', label: 'Status', type: 'select', opts: ['Active', 'Prospect', 'Inactive'], col: true, groups: ALL, section: 'Basics' },

  { key: 'legal_name', label: 'Legal name (as on GST)', type: 'text', groups: ['dealer', 'firm'], section: 'Business' },
  { key: 'gst', label: 'GST number', type: 'gst', col: true, groups: ['dealer', 'firm', 'retail', 'direct'], section: 'Business' },
  { key: 'parent_id', label: 'Buys through', type: 'link', to: ['distributor', 'dealer'], col: true, groups: ['dealer'], kinds: ['dealer', 'sub_dealer'], section: 'Business' },
  { key: 'grade', list: 'dealer_grades', label: 'Dealer rating', type: 'select', opts: ['Platinum', 'A', 'B', 'C'], col: true, groups: ['dealer'], section: 'Business' },
  { key: 'priority200', label: 'Priority 200', type: 'yesno', groups: ['dealer'], section: 'Business' },
  { key: 'since', label: 'Working with EGO since', type: 'date', groups: ['dealer', 'firm'], section: 'Business' },
  { key: 'credit_limit', label: 'Credit limit (₹)', type: 'money', groups: ['dealer'], section: 'Business' },
  { key: 'telesales_id', label: 'Telesales owner', type: 'owner', groups: ['dealer'], section: 'Business' },
  { key: 'specialist_id', label: 'Specialist owner', type: 'owner', groups: ['dealer'], section: 'Business' },
  { key: 'contact_every_days', label: 'Call or visit every (days)', type: 'number', groups: ['dealer'], section: 'Business' },

  { key: 'categories', label: 'Categories bought', type: 'cats', groups: ['dealer'], section: 'Products and market' },
  { key: 'categories_missing', label: 'Categories not bought yet', type: 'cats', groups: ['dealer'], section: 'Products and market' },
  { key: 'brands_sold', label: 'Other brands they sell', type: 'text', groups: ['dealer'], section: 'Products and market' },
  { key: 'competitors', label: 'Main competitors nearby', type: 'text', groups: ['dealer'], section: 'Products and market' },
  { key: 'customer_types', list: 'customer_types', label: 'They sell to', type: 'multi', opts: ['Homeowners', 'Builders', 'Architects and designers', 'Contractors', 'Corporate offices', 'Hotels', 'Institutions'], groups: ['dealer'], section: 'Products and market' },
  { key: 'project_partner', label: 'Project partner', type: 'select', opts: ['Yes', 'No', 'Maybe'], groups: ['dealer'], section: 'Products and market' },

  { key: 'showroom', label: 'Has a showroom', type: 'yesno', groups: ['dealer'], section: 'Infrastructure' },
  { key: 'display_area_sqft', label: 'Display area (sq ft)', type: 'number', groups: ['dealer'], section: 'Infrastructure' },
  { key: 'warehouse_sqft', label: 'Warehouse (sq ft)', type: 'number', groups: ['dealer'], section: 'Infrastructure' },
  { key: 'dealer_salespeople', label: 'Their salespeople', type: 'number', groups: ['dealer'], section: 'Infrastructure' },
  { key: 'own_installers', label: 'Their installers', type: 'number', groups: ['dealer'], section: 'Infrastructure' },
  { key: 'service_capable', label: 'Can install and service', type: 'yesno', groups: ['dealer'], section: 'Infrastructure' },

  { key: 'current_business', label: 'Current yearly business with EGO (₹, as they told us)', type: 'money', groups: ['dealer'], section: 'Potential' },
  { key: 'target_12m', label: '12-month target (₹)', type: 'money', groups: ['dealer'], section: 'Potential' },
  { key: 'potential_3y', label: '3-year potential (₹)', type: 'money', groups: ['dealer'], section: 'Potential' },
  { key: 'potential_note', label: 'Potential note', type: 'text', groups: ['dealer'], section: 'Potential' },

  { key: 'firm_id', label: 'Design firm', type: 'link', to: ['design_firm'], col: true, groups: ['architect'], section: 'Practice' },
  { key: 'position', list: 'positions', label: 'Position', type: 'select', opts: ['Principal', 'Partner', 'Senior architect', 'Architect', 'Interior designer', 'Other'], groups: ['architect'], section: 'Practice' },
  { key: 'specialisation', list: 'specialisations', label: 'Specialisation', type: 'select', opts: ['Luxury villas', 'Apartments', 'Workplace', 'Retail fit-outs', 'Hospitality', 'Institutional', 'Other'], groups: ['architect', 'firm'], section: 'Practice' },
  { key: 'focus', list: 'focus_areas', label: 'Focus', type: 'select', opts: ['Residential', 'Corporate', 'Hospitality', 'Retail', 'Mixed'], groups: ['architect', 'firm'], section: 'Practice' },
  { key: 'team_size', label: 'Team size', type: 'number', groups: ['firm'], section: 'Practice' },
  { key: 'rating', list: 'architect_ratings', label: 'Architect rating', type: 'select', opts: ['A', 'B', 'C'], groups: ['architect', 'firm'], section: 'Practice' },
  { key: 'potential', list: 'potentials', label: 'Potential', type: 'select', opts: ['High', 'Medium', 'Low'], groups: ['architect', 'firm'], section: 'Practice' },
  { key: 'design500', label: 'Design 500 member', type: 'yesno', groups: ['architect', 'firm'], section: 'Practice' },
  { key: 'relationship', list: 'relationships', label: 'Relationship', type: 'select', opts: ['EGO direct', 'Via dealer'], groups: ['architect'], section: 'Practice' },
  { key: 'connected_dealers', label: 'Connected dealers', type: 'text', groups: ['architect'], section: 'Practice' },

  { key: 'architect_id', label: 'Architect', type: 'link', to: ['architect', 'design_firm'], col: true, groups: ['retail'], section: 'Retail' },
  { key: 'campaign', label: 'Campaign', type: 'text', groups: ['retail'], section: 'Retail' },
  { key: 'condition_tag', list: 'condition_tags', label: 'Condition tag', type: 'select', opts: ['Hot', 'Warm', 'Cold'], groups: ['retail'], section: 'Retail' },

  { key: 'last_contact', label: 'Last contact', type: 'date', groups: ['architect', 'firm'], section: 'Follow-up' },
  { key: 'next_action', label: 'Next action', type: 'text', groups: ALL, section: 'Follow-up' },
  { key: 'next_date', label: 'Next action date', type: 'date', groups: ALL, section: 'Follow-up' },
  { key: 'notes', label: 'Notes', type: 'textarea', col: true, groups: ALL, section: 'Follow-up' },
];

const CONTACT_FIELDS = [
  { key: 'name', label: 'Name', type: 'text', req: true },
  { key: 'designation', list: 'roles', label: 'Role', type: 'select', opts: DESIGNATIONS },
  { key: 'responsibilities', label: 'Responsibilities', type: 'text' },
  { key: 'mobile', label: 'Mobile', type: 'mobile', req: true },
  { key: 'whatsapp', label: 'WhatsApp number', type: 'mobile' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'is_primary', label: 'Main contact', type: 'yesno' },
];

const OPP_FIELDS = [
  { key: 'pipeline', label: 'Pipeline', type: 'select', opts: Object.keys(PIPELINES), req: true },
  { key: 'title', label: 'Title', type: 'text', req: true },
  { key: 'stage', label: 'Stage', type: 'stage', req: true },
  { key: 'value', label: 'Value (₹)', type: 'money' },
  { key: 'products', label: 'Products', type: 'cats' },
  { key: 'area_sqft', label: 'Area (sq ft)', type: 'number' },
  { key: 'application', label: 'Room or application', type: 'text' },
  { key: 'budget', list: 'budget_bands', label: 'Budget band', type: 'select', opts: ['Under 2 lakh', '2 to 5 lakh', '5 to 10 lakh', 'Above 10 lakh'] },
  { key: 'source', list: 'sources', label: 'Source', type: 'select', opts: SOURCES },
  { key: 'owner_id', label: 'Owner at EGO', type: 'owner', req: true },
  { key: 'contact_id', label: 'Point of contact', type: 'contact' },
  { key: 'next_action', label: 'Next action', type: 'text' },
  { key: 'next_date', label: 'Next action date', type: 'date' },
  { key: 'expected_close', label: 'Expected close', type: 'date' },
  { key: 'lost_reason', label: 'Lost reason', type: 'lost' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];
/* The stage that counts as won: for a wholesale sale it is Payment collected (4 Oct), and
   that is where it passes to fulfilment. Lost is lost everywhere; Nurturing stays open. */
const wonStage = p => (PIPELINES[p] && PIPELINES[p].won) || 'Won';
const isClosed = (p, st) => st === wonStage(p) || st === 'Lost';
/* stages a sales board cannot lose or rename: the won stage, Lost, and where credit is checked */
const lockedStages = p => [PIPELINES[p] && PIPELINES[p].credit, wonStage(p), 'Lost'].filter(Boolean);
const OPP_COLS = ['pipeline', 'title', 'stage', 'value', 'owner_id', 'contact_id', 'next_action', 'next_date', 'lost_reason', 'source'];

const fieldsFor = kind => {
  const g = KINDS[kind] && KINDS[kind].group;
  return CLIENT_FIELDS.filter(f => f.groups.includes(g) && (!f.kinds || f.kinds.includes(kind)));
};

/* The unit a number is entered in, shown beside the box (₹ … /- for money is automatic).
   Kept apart from the labels so the Excel headers stay exactly as they are. */
const UNITS = { display_area_sqft: 'sq ft', warehouse_sqft: 'sq ft', area_sqft: 'sq ft', contact_every_days: 'days', team_size: 'people', dealer_salespeople: 'people',
  own_installers: 'people', warranty_res: 'years', warranty_com: 'years', pcs_per_box: 'pieces', sqft_per_box: 'sq ft', sqm_per_box: 'm²', weight_box_kg: 'kg', boxes_per_pallet: 'boxes', low_stock: 'boxes' };

/* ---------------------------------------------------------------- normalising */

const DIALS = ['+91', '+971', '+966', '+974', '+968', '+965', '+973', '+1', '+44', '+61', '+65', '+977', '+94', '+880'];
const DIAL_CODES = DIALS;
/* Any way a person types a mobile, to one stored form: +<country><number>.
   Ten digits with no code is Indian. Returns { value } or { error }. */
function normMobile(raw, dial) {
  let s = String(raw == null ? '' : raw).trim();
  if (!s) return { value: '' };
  if (/e\+/i.test(s)) return { error: 'reads as a number in scientific form; format the column as text' };
  const plus = s.startsWith('+') || s.startsWith('00');
  let d = s.replace(/\D/g, '');
  if (s.startsWith('00')) d = d.slice(2);
  let code = dial || '+91';
  if (plus) {
    const hit = DIALS.slice().sort((a, b) => b.length - a.length).find(c => d.startsWith(c.slice(1)));
    if (!hit) return { error: 'has a country code we do not know' };
    code = hit; d = d.slice(hit.length - 1);
  } else if (code === '+91') {
    if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
    else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  }
  if (code === '+91') {
    if (d.length !== 10) return { error: `has ${d.length} digits, an Indian mobile needs 10` };
    if (!/^[6-9]/.test(d)) return { error: 'must start with 6, 7, 8 or 9' };
  } else if (d.length < 6 || d.length > 12) return { error: `has ${d.length} digits` };
  return { value: code + d };
}
const fmtMobile = v => {
  if (!v) return '';
  if (v.startsWith('+91') && v.length === 13) return `+91 ${v.slice(3, 8)} ${v.slice(8)}`;
  return v;
};
const GST_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const normGst = v => String(v == null ? '' : v).replace(/\s+/g, '').toUpperCase();

const yes = v => {
  if (v === true || v === 1) return true;
  if (v === false || v === 0 || v == null || v === '') return false;
  const s = String(v).trim().toLowerCase();
  if (['yes', 'y', 'true', '1'].includes(s)) return true;
  if (['no', 'n', 'false', '0'].includes(s)) return false;
  return null;
};
const toNum = v => {
  if (v === '' || v == null) return null;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[,\s₹]|rs\.?/gi, '');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
  return Number(s);
};
/* Dates arrive as 2026-10-03, 03/10/2026 (Indian order) or an Excel serial. */
function normDate(v) {
  if (v === '' || v == null) return { value: '' };
  if (typeof v === 'number' && v > 20000 && v < 80000) {
    const d = new Date(Math.round((v - 25569) * 864e5));
    return { value: d.toISOString().slice(0, 10) };
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return okDate(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return okDate(+m[3], +m[2], +m[1]);
  return { error: 'is not a date (use 2026-10-03 or 03/10/2026)' };
}
function okDate(y, mo, d) {
  const x = new Date(Date.UTC(y, mo - 1, d));
  if (x.getUTCMonth() !== mo - 1 || x.getUTCDate() !== d) return { error: 'is not a real date' };
  return { value: x.toISOString().slice(0, 10) };
}

/* ---------------------------------------------------------------- validating

   ctx: { lists, staffIds: Set, staffByName: Map(lower name or login -> id),
          clientKind: id -> kind (for links) }
   Returns { rec, errors: [sentence] }. Unknown keys are dropped, so a form or a
   sheet that invents a field writes nothing rather than something. */
function cleanClient(input, ctx) {
  const errors = [], rec = { extra: {} };
  const kind = input.kind;
  if (!KINDS[kind]) return { rec: null, errors: ['type is not one of: ' + Object.values(KINDS).map(k => k.label).join(', ')] };
  rec.kind = kind;
  for (const f of fieldsFor(kind)) {
    if (f.key === 'kind') continue;
    const r = cleanValue(f, input[f.key], ctx, input);
    if (r.error) { errors.push(`${f.label} ${r.error}`); continue; }
    const empty = r.value === '' || r.value == null || (Array.isArray(r.value) && !r.value.length);
    if (f.req && empty) { errors.push(`${f.label} is compulsory`); continue; }
    if (f.col) rec[f.key] = empty ? (f.type === 'number' || f.type === 'money' ? null : '') : r.value;
    else if (!empty) rec.extra[f.key] = r.value;
  }
  if (rec.status === '' || rec.status == null) rec.status = 'Active';
  return { rec, errors };
}
function cleanContact(input, ctx) {
  const errors = [], rec = {};
  for (const f of CONTACT_FIELDS) {
    const r = cleanValue(f, input[f.key], ctx, input);
    if (r.error) { errors.push(`${f.label} ${r.error}`); continue; }
    const empty = r.value === '' || r.value == null;
    if (f.req && empty) { errors.push(`${f.label} is compulsory`); continue; }
    rec[f.key] = f.type === 'yesno' ? !!r.value : (empty ? '' : r.value);
  }
  return { rec, errors };
}
function cleanOpp(input, ctx) {
  const errors = [], rec = { extra: {} };
  const pipe = PIPELINES[input.pipeline] ? input.pipeline : Object.keys(PIPELINES).find(k => PIPELINES[k].label.toLowerCase() === String(input.pipeline || '').trim().toLowerCase());
  input = { ...input, pipeline: pipe };
  if (!PIPELINES[pipe]) return { rec: null, errors: ['pipeline is not one of: ' + Object.values(PIPELINES).map(p => p.label).join(', ')] };
  for (const f of OPP_FIELDS) {
    const r = cleanValue(f, input[f.key], ctx, input);
    if (r.error) { errors.push(`${f.label} ${r.error}`); continue; }
    const empty = r.value === '' || r.value == null || (Array.isArray(r.value) && !r.value.length);
    if (f.req && empty) { errors.push(`${f.label} is compulsory`); continue; }
    if (OPP_COLS.includes(f.key)) rec[f.key] = empty ? (f.type === 'money' ? null : '') : r.value;
    else if (!empty) rec.extra[f.key] = r.value;
  }
  if (rec.stage === 'Lost' && !rec.lost_reason) errors.push('Lost reason is compulsory when the stage is Lost');
  if (rec.stage !== 'Lost') rec.lost_reason = '';
  return { rec, errors };
}

function cleanValue(f, v, ctx, whole) {
  const lists = (ctx && ctx.lists) || DEFAULT_LISTS;
  if (typeof v === 'string') v = v.trim();
  if (v === undefined || v === null) v = '';
  switch (f.type) {
    case 'text': case 'textarea': return { value: String(v).slice(0, f.type === 'textarea' ? 4000 : 300) };
    case 'email':
      if (v === '') return { value: '' };
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? { value: String(v).toLowerCase() } : { error: 'is not an email address' };
    case 'mobile': return normMobile(v, whole && whole[f.key + '_dial']);
    case 'gst': {
      const g = normGst(v);
      if (!g) return { value: '' };
      return GST_RE.test(g) ? { value: g } : { error: 'is not a valid 15-character GST number' };
    }
    case 'pincode': {
      if (v === '') return { value: '' };
      const p = String(v).replace(/\s/g, '');
      return /^[1-9]\d{5}$/.test(p) ? { value: p } : { error: 'needs 6 digits' };
    }
    case 'number': case 'money': {
      const n = toNum(v);
      if (n == null) return { value: null };
      if (Number.isNaN(n) || n < 0) return { error: 'is not a number' };
      return { value: f.type === 'number' ? Math.round(n) : Math.round(n * 100) / 100 };
    }
    case 'date': return normDate(v);
    case 'yesno': {
      if (v === '') return { value: false };
      const y = yes(v);
      return y == null ? { error: 'must be Yes or No' } : { value: y };
    }
    case 'select': {
      if (v === '') return { value: '' };
      const hit = matchOpt(optsOf(f, lists), v, f.key === 'kind' ? KINDS : f.key === 'pipeline' ? PIPELINES : null);
      return hit == null ? { error: `"${v}" is not in the list` } : { value: hit };
    }
    case 'multi': {
      const arr = Array.isArray(v) ? v : String(v).split(/[,;]/).map(s => s.trim()).filter(Boolean);
      const out = [];
      for (const x of arr) { const hit = matchOpt(optsOf(f, lists), x); if (hit == null) return { error: `"${x}" is not in the list` }; if (!out.includes(hit)) out.push(hit); }
      return { value: out };
    }
    case 'cat': {
      if (v === '') return { value: '' };
      const hit = (lists.categories || CATS).find(c => c.toLowerCase() === String(v).toLowerCase());
      return hit ? { value: hit } : { error: `"${v}" is not a product category (the Owner adds categories in Lists and stages)` };
    }
    case 'decimal': {
      const n = toNum(v);
      if (n == null) return { value: null };
      if (Number.isNaN(n) || n < 0) return { error: 'is not a number' };
      return { value: Math.round(n * 1000) / 1000 };
    }
    case 'cats': return cleanValue({ ...f, type: 'multi', opts: lists.categories || CATS }, v, ctx, whole);
    case 'cities': return cleanValue({ ...f, type: 'multi', opts: lists.cities.map(c => c.city) }, v, ctx, whole);
    case 'city': {
      if (v === '') return { value: '' };
      const hit = lists.cities.find(c => c.city.toLowerCase() === String(v).toLowerCase());
      return hit ? { value: hit.city } : { error: `"${v}" is not in the city list (the Owner can add it in Lists and stages)` };
    }
    case 'stage': {
      if (v === '') return { value: '' };
      const st = (lists.stages && lists.stages[whole.pipeline]) || [];
      const hit = st.find(s => s.toLowerCase() === String(v).toLowerCase());
      return hit ? { value: hit } : { error: `"${v}" is not a stage of this pipeline` };
    }
    case 'lost': {
      if (v === '') return { value: '' };
      const hit = lists.lost_reasons.find(s => s.toLowerCase() === String(v).toLowerCase());
      return hit ? { value: hit } : { error: `"${v}" is not in the lost reasons list` };
    }
    case 'owner': {
      if (v === '') return { value: '' };
      if (ctx && ctx.staffIds && ctx.staffIds.has(v)) return { value: v };
      const id = ctx && ctx.staffByName && ctx.staffByName.get(String(v).toLowerCase());
      return id ? { value: id } : { error: `"${v}" is not a person on the team` };
    }
    case 'link': case 'contact': return { value: v === '' ? '' : String(v) };
    default: return { value: v };
  }
}
function matchOpt(opts, v, labels) {
  const s = String(v).toLowerCase();
  for (const o of opts) {
    if (o.toLowerCase() === s) return o;
    if (labels && labels[o] && labels[o].label.toLowerCase() === s) return o;
  }
  return null;
}
const optLabel = (f, o) => f.key === 'kind' ? KINDS[o].label : f.key === 'pipeline' ? PIPELINES[o].label : o;
const regionOf = (lists, city) => { const c = (lists || DEFAULT_LISTS).cities.find(x => x.city === city); return c ? c.region : ''; };

/* ---------------------------------------------------------------- inventory (3 Oct)

   ONE inventory for EGO Premium and Big E. Category > collection > design, as on
   egopremium.com: the technical specs belong to the COLLECTION, a design is a name,
   a code and a photo. Stock is counted in boxes per design per warehouse, and only
   ever changes through a stock move (in, out, transfer, opening), so every number
   has a who, a when and a reason. */
const STOCK_ROLES = ['owner', 'director', 'ws_warehouse'];
const SUB_TYPES = ['Plank', 'Tile', 'Herringbone', 'Chevron', 'Board', 'Profile', 'Other'];
const COLLECTION_FIELDS = [
  { key: 'category', label: 'Category', type: 'cat', req: true, col: true, section: 'Collection' },
  { key: 'name', label: 'Collection name', type: 'text', req: true, col: true, section: 'Collection' },
  { key: 'sqft_per_box', label: 'Square feet per box', type: 'decimal', section: 'Box size and packing' },
  { key: 'sqm_per_box', label: 'Square metres per box', type: 'decimal', section: 'Box size and packing' },
  { key: 'pcs_per_box', label: 'Pieces per box', type: 'number', section: 'Box size and packing' },
  { key: 'weight_box_kg', label: 'Weight per box (kg)', type: 'decimal', section: 'Box size and packing' },
  { key: 'boxes_per_pallet', label: 'Boxes per pallet', type: 'number', section: 'Box size and packing' },
  { key: 'price_sqft', label: 'Price per sq ft (₹)', type: 'money', section: 'Box size and packing' },
  { key: 'size_mm', label: 'Size (mm)', type: 'text', section: 'Specifications' },
  { key: 'thickness_mm', label: 'Thickness', type: 'text', section: 'Specifications' },
  { key: 'wear_layer', label: 'Wear layer', type: 'text', section: 'Specifications' },
  { key: 'construction', label: 'Construction or layers', type: 'text', section: 'Specifications' },
  { key: 'core', label: 'Core or base', type: 'text', section: 'Specifications' },
  { key: 'ac_rating', list: 'ac_ratings', label: 'AC rating', type: 'select', opts: ['AC3', 'AC4', 'AC5', 'AC6'], section: 'Specifications' },
  { key: 'use_class', label: 'Class of use', type: 'text', section: 'Specifications' },
  { key: 'finish', label: 'Surface or finish', type: 'text', section: 'Specifications' },
  { key: 'edges', label: 'Edges', type: 'text', section: 'Specifications' },
  { key: 'click_system', label: 'Click system', type: 'text', section: 'Specifications' },
  { key: 'underlay', label: 'Underlay', type: 'text', section: 'Specifications' },
  { key: 'water', label: 'Water resistance', type: 'text', section: 'Specifications' },
  { key: 'fire_rating', label: 'Fire rating', type: 'text', section: 'Specifications' },
  { key: 'slip', label: 'Slip resistance', type: 'text', section: 'Specifications' },
  { key: 'acoustics', label: 'Acoustics', type: 'text', section: 'Specifications' },
  { key: 'emissions', label: 'Emissions', type: 'text', section: 'Specifications' },
  { key: 'warranty_res', label: 'Warranty, residential (years)', type: 'number', section: 'Warranty' },
  { key: 'warranty_com', label: 'Warranty, commercial (years)', type: 'number', section: 'Warranty' },
  { key: 'catalogue_url', label: 'Catalogue link', type: 'text', section: 'Other' },
  { key: 'notes', label: 'Notes', type: 'textarea', section: 'Other' },
];
const PRODUCT_FIELDS = [
  { key: 'collection_id', label: 'Collection', type: 'collection', req: true, col: true },
  { key: 'name', label: 'Design name', type: 'text', req: true, col: true },
  { key: 'code', label: 'Design code', type: 'text', col: true },
  { key: 'sub_type', list: 'design_types', label: 'Type', type: 'select', opts: SUB_TYPES, col: true },
  { key: 'colour', label: 'Colour or shade', type: 'text' },
  { key: 'image', label: 'Photo link', type: 'text' },
  { key: 'low_stock', label: 'Warn below (boxes)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', opts: ['Active', 'Discontinued'], col: true },
];
const WAREHOUSE_FIELDS = [
  { key: 'name', label: 'Warehouse name', type: 'text', req: true },
  { key: 'city', label: 'City', type: 'text' },
  { key: 'address', label: 'Address', type: 'textarea' },
];
const MOVE_KINDS = { in: 'Stock in', out: 'Stock out', transfer: 'Transfer', opening: 'Opening stock' };
const SQFT = 10.7639;
const sqftOf = (boxes, sqm) => sqm ? Math.round(boxes * sqm * SQFT) : null;
/* a box size can be given in sq ft or in m²: whichever is missing is worked out, so both are always there */
function boxSizes(extra) {
  if (extra.sqft_per_box != null && extra.sqm_per_box == null) extra.sqm_per_box = Math.round(extra.sqft_per_box / SQFT * 1000) / 1000;
  else if (extra.sqm_per_box != null && extra.sqft_per_box == null) extra.sqft_per_box = Math.round(extra.sqm_per_box * SQFT * 100) / 100;
  return extra;
}
/* one cleaner for the three: unknown keys are dropped, money and specs go in extra */
function cleanFields(fields, input, ctx) {
  const errors = [], rec = { extra: {} };
  for (const f of fields) {
    const r = cleanValue(f, input[f.key], ctx, input);
    if (r.error) { errors.push(`${f.label} ${r.error}`); continue; }
    const empty = r.value === '' || r.value == null;
    if (f.req && empty) { errors.push(`${f.label} is compulsory`); continue; }
    if (f.col || fields === WAREHOUSE_FIELDS) rec[f.key] = empty ? (['number', 'money', 'decimal'].includes(f.type) ? null : '') : r.value;
    else if (!empty) rec.extra[f.key] = r.value;
  }
  return { rec, errors };
}

/* ---------------------------------------------------------------- the Excel templates

   TWO files, one per company (3 Oct): EGO Premium uploads only in Wholesale, Big E
   only in Retail. Each sheet lists its plain-language headers; the header text IS the
   mapping (compared after normHeader), so headers are generated here and nowhere else.
   `first` puts the columns a person fills first at the front: who they are, where,
   and the rating; every remaining field of the kind follows in registry order. */
/* Each file asks only for the basics, in the order of the add form (3 Oct): company,
   point of contact, address, areas, business. Everything else is filled in EGO Master
   afterwards. A company is reached through its point of contact, so the contact sits
   on the company's own row and its mobile becomes the company's mobile.
   A column may draw its dropdown from another sheet of the same file (`ref`), from the
   team (`owner`), or from a fixed list (`opts`): the same lists the app's dropdowns use. */
const POC_COLS = [
  { key: 'poc_name', type: 'text', req: true, header: 'Point of contact name *' },
  { key: 'poc_designation', list: 'roles', type: 'select', opts: DESIGNATIONS, header: 'Point of contact role' },
  { key: 'poc_responsibilities', type: 'text', header: 'Point of contact responsibilities' },
  { key: 'poc_mobile', type: 'mobile', req: true, header: 'Point of contact mobile (10 digits) *' },
  { key: 'poc_email', type: 'email', header: 'Point of contact email ID' },
];
const POC_KEYS = POC_COLS.map(c => c.key);
const ORG_HEADS = { email: 'Email ID', city: 'City of main office', locality: 'Area of main office', address: 'Full address of main office', owner_id: 'Who looks after them at EGO', areas_covered: 'Areas they cover' };
const PEOPLE = (id, sheet, of, kinds, from) => ({ id, sheet, tab: 'contacts', kinds, refs: { client_key: [from, 'name'] }, heads: {
  client_key: `${of} (pick from the ${from} sheet, or type its mobile or GST)`,
  name: 'Person name', designation: 'Role', responsibilities: 'Responsibilities (what they handle)', mobile: 'Mobile number (10 digits)',
  whatsapp: 'WhatsApp number, if different', email: 'Email ID', is_primary: 'Main person to talk to (Yes or No)' } });
const SHEETS = {
  dealers: { id: 'dealers', sheet: 'Dealer companies', tab: 'clients', kinds: ['distributor', 'dealer', 'sub_dealer'], poc: true,
    only: ['kind', 'name', 'legal_name', 'gst', 'POC', 'address', 'locality', 'city', 'pincode', 'areas_covered', 'other_offices', 'owner_id', 'grade', 'parent_id', 'source', 'status', 'since', 'credit_limit', 'priority200'],
    refs: { parent_id: ['Dealer companies', 'name'] },
    heads: { ...ORG_HEADS, name: 'Dealer company name', kind: 'Type (Distributor, Dealer or Sub-dealer)', parent_id: 'Buys through (pick their distributor or dealer)' } },
  dealer_people: PEOPLE('dealer_people', 'Dealer people', 'Company', ['distributor', 'dealer', 'sub_dealer'], 'Dealer companies'),
  architects: { id: 'architects', sheet: 'Architect firms', tab: 'clients', kinds: ['design_firm', 'architect'], poc: true,
    only: ['kind', 'name', 'legal_name', 'gst', 'POC', 'address', 'locality', 'city', 'pincode', 'areas_covered', 'other_offices', 'owner_id', 'rating', 'source', 'status', 'since', 'relationship'],
    heads: { ...ORG_HEADS, name: 'Architect firm name', kind: 'Firm or solo architect (Design firm or Architect)', areas_covered: 'Areas they work in' } },
  architect_people: PEOPLE('architect_people', 'Architect people', 'Firm', ['design_firm', 'architect'], 'Architect firms'),
};
const CLIENTS_SHEET = kind => ({ id: 'clients', sheet: 'People (no company)', tab: 'clients', kinds: [kind],
  only: ['name', 'client_type', 'mobile', 'whatsapp', 'email', 'address', 'locality', 'city', 'pincode', 'owner_id', 'source', 'status'],
  heads: { email: 'Email ID', name: 'Person or firm name', client_type: 'Individual or what kind of firm', city: 'City', locality: 'Area', owner_id: 'Who looks after them at EGO', mobile: 'Mobile number (10 digits)' } });
const TEMPLATES = {
  ws: { id: 'ws', company: 'EGO Premium', division: 'wholesale', version: 'EGO-WS-2', file: 'EGO-Premium-Upload-Template.xlsx',
    sheets: [SHEETS.dealers, SHEETS.dealer_people, SHEETS.architects, SHEETS.architect_people, CLIENTS_SHEET('direct')] },
  bige: { id: 'bige', company: 'Big E', division: 'retail', version: 'BIGE-2', file: 'Big-E-Upload-Template.xlsx',
    sheets: [SHEETS.architects, SHEETS.architect_people, CLIENTS_SHEET('retail')] },
  /* the shared inventory: the same file whichever company uploads it */
  inv: { id: 'inv', company: 'Inventory', division: 'both', version: 'EGO-INV-3', file: 'EGO-Inventory-Upload-Template.xlsx', sheets: [
    { id: 'categories', sheet: 'Categories', tab: 'categories' },
    { id: 'collections', sheet: 'Collections', tab: 'collections', only: ['category', 'name', 'sqft_per_box', 'sqm_per_box', 'pcs_per_box', 'size_mm', 'thickness_mm', 'wear_layer'],
      refs: { category: ['Categories', 'name'] },
      heads: { category: 'Category (pick from the Categories sheet)', name: 'Collection name (e.g. Divine)', sqft_per_box: 'Box size in square feet', sqm_per_box: 'Box size in square metres (fill this OR square feet)' } },
    { id: 'warehouses', sheet: 'Warehouses', tab: 'warehouses' },
    { id: 'stock', sheet: 'Designs & stock', tab: 'stock', refs: { category: ['Categories', 'name'], collection: ['Collections', 'name'], warehouse: ['Warehouses', 'name'] } },
  ] },
};
const templateFor = division => Object.values(TEMPLATES).find(t => t.division === division);
/* One row = one design in one warehouse. A design in two warehouses is two rows; a
   design with no stock yet leaves Warehouse and Boxes empty. Square feet is a formula
   in the file, worked out from the collection's box size, and is never imported. */
const CATEGORY_COLS = [{ key: 'name', type: 'text', req: true, header: 'Category name *' }];
const STOCK_COLS = [
  { key: 'category', type: 'text', header: 'Category (pick)' },
  { key: 'collection', type: 'text', req: true, header: 'Collection (pick from the Collections sheet) *' },
  { key: 'name', type: 'text', req: true, header: 'Design name *' },
  { key: 'code', type: 'text', header: 'Design code (if any)' },
  { key: 'sub_type', list: 'design_types', type: 'select', opts: SUB_TYPES, header: 'Type (Plank, Tile, Herringbone...)' },
  { key: 'colour', type: 'text', header: 'Colour or shade' },
  { key: 'warehouse', type: 'text', header: 'Warehouse (pick from the Warehouses sheet)' },
  { key: 'boxes', type: 'number', header: 'Boxes in this warehouse today' },
  { key: 'calc_sqft', type: 'calc', header: 'Square feet in this warehouse (worked out, do not type)' },
  { key: 'status', type: 'select', opts: ['Active', 'Discontinued'], header: 'Status' },
];
const HINT = { decimal: '', mobile: ' (10 digits)', multi: ' (separate with commas)', cats: ' (separate with commas)', cities: ' (cities, separate with commas)', date: ' (DD/MM/YYYY)', owner: ' (username or name)', pincode: ' (6 digits)' };
function templateColumns(t) {
  const heads = t.heads || {}, refs = t.refs || {};
  const col = f => ({ key: f.key, type: f.type, opts: f.opts, list: f.list, req: !!f.req, ref: refs[f.key], header: (heads[f.key] || f.label + (f.type === 'link' ? ' (name, mobile or GST)' : HINT[f.type] || '')) + (f.req ? ' *' : '') });
  const withRefs = cols => cols.map(c => ({ ...c, ref: c.ref || refs[c.key] }));
  if (t.tab === 'stock') return withRefs(STOCK_COLS);
  if (t.tab === 'categories') return CATEGORY_COLS;
  if (t.tab === 'contacts') return [{ key: 'client_key', type: 'text', req: true, ref: refs.client_key, header: heads.client_key + ' *' }, ...CONTACT_FIELDS.map(col)];
  const pool = t.tab === 'clients' ? CLIENT_FIELDS.filter(f => t.kinds.some(k => fieldsFor(k).includes(f))) : { collections: COLLECTION_FIELDS, warehouses: WAREHOUSE_FIELDS }[t.tab];
  if (!t.only) return pool.map(col);
  /* the basics only, in the order given; the point of contact goes where 'POC' stands */
  return t.only.flatMap(k => k === 'POC' ? POC_COLS : pool.filter(f => f.key === k && !(k === 'kind' && t.kinds.length === 1)).map(f => k === 'kind' ? { ...col(f), opts: t.kinds } : col(f)));
}
const normHeader = h => String(h == null ? '' : h).replace(/\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
/* an example row is shown in every sheet and never imported */
const EXAMPLE_MARK = 'EXAMPLE';

/* ---------------------------------------------------------------- the editable lists (4 Oct)

   Every dropdown the team may want to change is a named list in settings, edited in
   Lists & stages. A field names its list (`list: 'sources'`); its `opts` above are only
   the starting values for a fresh database. The kind of record, the pipeline, Yes/No
   and a design's Active/Discontinued stay fixed: the app's logic depends on them. */
const LIST_GROUPS = [
  ['People and companies', [['sources', 'Sources'], ['roles', 'Roles (people at a company)'], ['client_types', 'Kinds of personal client'], ['client_statuses', 'Status'], ['dealer_grades', 'Dealer ratings'],
    ['architect_ratings', 'Architect ratings'], ['positions', 'Architect positions'], ['specialisations', 'Specialisations'], ['focus_areas', 'Focus'], ['potentials', 'Potential'],
    ['relationships', 'Relationship (architects)'], ['customer_types', 'Who dealers sell to'], ['condition_tags', 'Condition tags (retail)']]],
  ['Opportunities', [['lost_reasons', 'Lost reasons'], ['budget_bands', 'Budget bands']]],
  ['Inventory', [['categories', 'Product categories'], ['design_types', 'Design types'], ['ac_ratings', 'AC ratings']]],
];
const LIST_LABEL = Object.fromEntries(LIST_GROUPS.flatMap(([, ls]) => ls));
const fieldList = f => f.list || (f.type === 'cats' || f.type === 'cat' ? 'categories' : f.type === 'cities' || f.type === 'city' ? 'cities' : f.type === 'lost' ? 'lost_reasons' : null);
/* which saved values use a list: table, field, whether it is a column or inside `extra`, and whether it holds several */
const LIST_USES = (() => {
  const out = {}, add = (table, fields, isCol) => fields.forEach(f => { const k = fieldList(f); if (k) (out[k] = out[k] || []).push({ table, key: f.key, col: isCol(f), multi: ['multi', 'cats', 'cities'].includes(f.type) }); });
  add('clients', CLIENT_FIELDS, f => !!f.col);
  add('contacts', CONTACT_FIELDS, () => true);
  add('opportunities', OPP_FIELDS, f => OPP_COLS.includes(f.key));
  add('collections', COLLECTION_FIELDS, f => !!f.col);
  add('products', PRODUCT_FIELDS, f => !!f.col);
  return out;
})();
for (const f of [...CLIENT_FIELDS, ...CONTACT_FIELDS, ...OPP_FIELDS, ...COLLECTION_FIELDS, ...PRODUCT_FIELDS]) if (f.list && !DEFAULT_LISTS[f.list]) DEFAULT_LISTS[f.list] = f.opts;
const optsOf = (f, lists) => (f.list && lists && lists[f.list]) || f.opts;

/* ---------------------------------------------------------------- operations (4 Oct)

   The processing side, as agreed in the demo. Each stage set is editable in Lists &
   stages; the LOCKED stages carry the logic (a credit check, allocating stock, taking it
   out at dispatch, adding it when production arrives), so they can be moved around but
   never renamed or removed, like Won and Lost. Every other stage is free. */
const OPS = {
  fulfilment_stages: { label: 'Fulfilment stages (wholesale)', note: 'Starts by itself when a wholesale opportunity reaches Payment collected. Stock check is where boxes are set aside from the warehouses; whatever is not goes to production. Dispatched takes them out of stock.',
    list: ['Design & MOQ verified', 'Stock check', 'Allocated', 'Waiting on production', 'Packed', 'Dispatched', 'Delivered'], locked: ['Stock check', 'Allocated', 'Waiting on production', 'Packed', 'Dispatched', 'Delivered'] },
  production_stages: { label: 'Production order stages', note: 'Received at warehouse adds the boxes to stock; they are then given to the orders waiting for them.',
    list: ['Production order placed', 'In production', 'Quality check', 'Shipped', 'In transit', 'Received at warehouse', 'Allocated & closed'], locked: ['Production order placed', 'Received at warehouse', 'Allocated & closed'] },
  site_steps: { label: 'Installation steps (retail sites)', note: 'Installer allocated needs a crew, Site readiness needs every item ready, Snagging needs no open snag, Sign-off needs the client\'s sign-off.',
    list: ['Site identified', 'Survey scheduled', 'Survey completed', 'Measurement & BOQ', 'Commercial approval', 'Installer allocated', 'Material confirmed', 'Material dispatched', 'Material received',
      'Site readiness', 'Installation scheduled', 'Installation started', 'Work in progress', 'Snagging', 'Installation completed', 'Sign-off & handover', 'Billing & installer payment', 'Warranty / service'],
    locked: ['Installer allocated', 'Site readiness', 'Installation started', 'Snagging', 'Installation completed', 'Sign-off & handover'] },
  complaint_statuses: { label: 'Complaint statuses', note: 'Resolved needs a resolution.', list: ['Open', 'In progress', 'Resolved'], locked: ['Open', 'Resolved'] },
};
const OPS_LISTS = [['complaint_types', 'Complaint types', ['Product · swelling', 'Product · colour variation', 'Product · click joint damage', 'Installation · gaps / uneven', 'Installation · squeaking', 'Delivery · damaged boxes', 'Delivery · short supply', 'Service · slow response']],
  ['complaint_channels', 'Complaint channels', ['WhatsApp', 'Phone', 'Dealer', 'Email', 'Field visit']], ['severities', 'Severity', ['Low', 'Medium', 'High']],
  ['snag_types', 'Snag types', ['Uneven joint', 'Gap at skirting', 'Scratch / chip', 'Squeaking', 'Colour variation', 'Swelling near wet area']],
  ['readiness_items', 'Site readiness checklist', ['Civil & electrical work complete', 'Subfloor level (±3 mm / 2 m)', 'Moisture below limit', 'Painting / false ceiling done', 'Secure storage for material', 'Lift / access for material', 'Site contact available']],
  ['delay_reasons', 'Site delay reasons', ['Customer / site not ready', 'Material shortage', 'Installer unavailable', 'Transport', 'Design / measurement change']]];
DEFAULT_LISTS.ops = Object.fromEntries(Object.entries(OPS).map(([k, v]) => [k, v.list]));
for (const [k, , v] of OPS_LISTS) DEFAULT_LISTS[k] = v;
LIST_GROUPS.push(['Operations lists', OPS_LISTS.map(([k, l]) => [k, l])]);
Object.assign(LIST_LABEL, Object.fromEntries(OPS_LISTS.map(([k, l]) => [k, l])));

/* the numbers the processing uses, all editable in Lists & stages > Rules and numbers */
const DEFAULT_RULES = {
  gst_pct: 18, moq_boxes: 500, production_round_boxes: 50, production_eta_days: 45, payment_days: 45,
  /* approvals: who may say yes up to what. Owner: no limit. */
  approvals: {
    credit: { label: 'Credit above the limit', unit: '₹', levels: { manager: 100000, head: 500000, director: 1500000 } },
    discount: { label: 'Dealer discount', unit: '%', levels: { manager: 1, head: 3, director: 5 } },
    complaint: { label: 'Complaint settlement', unit: '₹', levels: { manager: 15000, head: 75000, director: 200000 } },
  },
  complaint_settle_from: 15000,
  p200: { tiers: [{ name: 'A', min: 70 }, { name: 'B', min: 50 }, { name: 'C', min: 30 }, { name: 'Watchlist', min: 0 }],
    weights: { sales: 40, breadth: 20, payments: 15, display: 10, activity: 15 } },
};
DEFAULT_LISTS.rules = DEFAULT_RULES;
const APPROVER_LEVEL = { owner: 'owner', director: 'director', ws_head: 'head', rt_head: 'head', ws_rm: 'manager', rt_project: 'manager' };
const levelLimit = (rules, kind, role) => { const l = APPROVER_LEVEL[role]; if (l === 'owner') return Infinity; const a = rules.approvals[kind]; return l && a ? a.levels[l] || 0 : 0; };
const opsStages = (lists, k) => ((lists || {}).ops || {})[k] || OPS[k].list;
const lastOf = a => a[a.length - 1];
const DISCOUNT_FIELD = { key: 'discount_pct', label: 'Discount (%)', type: 'decimal' };
