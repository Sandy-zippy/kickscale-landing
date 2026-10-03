'use strict';
/* COPY of ego/server/src/schema.js with `export` removed by build_live.py. */
/* EGO Master LIVE: the one field registry.

   ONE copy. The Worker imports it, the browser gets it as live/dist/schema.js
   (build_live.py strips the `export` keywords and nothing else), and
   make_template.py reads it through node to write the Excel headers and
   dropdowns. A field added here appears in the form, the 360 page, the server's
   validation and the upload template together, or it is not added at all. */

const TEMPLATE_VERSION = 'EGO-UPLOAD-1';

const CATS = ['LVT', 'SPC', 'Laminate', 'Engineered', 'WPC Tile Deck', 'WPC Plank / Outdoor', 'PVC Soffit & Cladding'];

/* kind -> which division owns it. Architects and design firms sit in BOTH
   (29 Sep meeting: wholesale needs its own architect database too). */
const KINDS = {
  distributor: { label: 'Distributor', plural: 'Distributors', group: 'dealer', division: 'wholesale' },
  dealer: { label: 'Dealer', plural: 'Dealers', group: 'dealer', division: 'wholesale' },
  sub_dealer: { label: 'Sub-dealer', plural: 'Sub-dealers', group: 'dealer', division: 'wholesale' },
  architect: { label: 'Architect', plural: 'Architects', group: 'architect', division: 'both' },
  design_firm: { label: 'Design firm', plural: 'Design firms', group: 'firm', division: 'both' },
  retail: { label: 'Retail client', plural: 'Retail clients', group: 'retail', division: 'retail' },
};
const KIND_BY_LABEL = Object.fromEntries(Object.entries(KINDS).map(([k, v]) => [v.label.toLowerCase(), k]));

const PIPELINES = {
  wholesale: { label: 'Wholesale opportunity', plural: 'Wholesale opportunities', division: 'wholesale' },
  retail_lead: { label: 'Retail lead', plural: 'Retail leads', division: 'retail' },
  retail_project: { label: 'Retail project', plural: 'Retail projects', division: 'retail' },
};
/* which pipelines a client of each group may have */
const PIPES_FOR = { dealer: ['wholesale'], retail: ['retail_lead', 'retail_project'], architect: ['wholesale', 'retail_lead', 'retail_project'], firm: ['wholesale', 'retail_lead', 'retail_project'] };

const SOURCES = ['Meta Ads', 'Google Ads', 'Website', 'WhatsApp', 'IndiaMART', 'JustDial', 'QR code', 'Walk-in', 'Referral', 'Field visit', 'Architect', 'Existing relationship', 'Other'];

/* Defaults for the lists the Owner can edit in Lists & stages. Stored in
   settings once edited; these only apply to a fresh database. */
const DEFAULT_LISTS = {
  stages: {
    wholesale: ['New', 'Screening', 'Contacted', 'Qualified', 'Passed on', 'Dealer accepted', 'Quotation', 'Won', 'Lost'],
    retail_lead: ['New', 'Contacted', 'Qualified', 'Appointment', 'Site visit', 'Sample', 'Quote', 'Won', 'Lost'],
    retail_project: ['New project', 'Qualified', 'Sample', 'Specification', 'Approval', 'Quotation', 'Negotiation', 'Won', 'Lost'],
  },
  cities: [
    ['Mumbai', 'West'], ['Navi Mumbai', 'West'], ['Thane', 'West'], ['Pune', 'West'], ['Nashik', 'West'], ['Nagpur', 'West'], ['Ahmedabad', 'West'], ['Surat', 'West'], ['Vadodara', 'West'], ['Goa', 'West'],
    ['Bengaluru', 'South'], ['Chennai', 'South'], ['Hyderabad', 'South'], ['Kochi', 'South'],
    ['New Delhi', 'North'], ['Gurugram', 'North'], ['Noida', 'North'], ['Jaipur', 'North'], ['Chandigarh', 'North'], ['Lucknow', 'North'],
    ['Kolkata', 'East'], ['Indore', 'Central'],
  ].map(([city, region]) => ({ city, region })),
  lost_reasons: ['Price', 'Chose a competitor', 'Architect specified another brand', 'Project on hold', 'Delivery timeline', 'Credit terms', 'No response', 'Other'],
};
const REGIONS = ['West', 'South', 'North', 'East', 'Central'];

const DESIGNATIONS = ['Owner', 'Partner', 'Director', 'Purchase', 'Accounts', 'Store manager', 'Sales', 'Site engineer', 'Project manager', 'Architect', 'Interior designer', 'Other'];

/* A field: key, label, type, where it shows (groups), required, options.
   col: true = its own database column; otherwise it lives in the `extra` JSON.
   Types: text textarea mobile email select multi number money date yesno gst
   pincode city owner link (to another client). */
const ALL = ['dealer', 'architect', 'firm', 'retail'];
const CLIENT_FIELDS = [
  { key: 'kind', label: 'Type', type: 'select', opts: Object.keys(KINDS), req: true, col: true, groups: ALL, section: 'Basics' },
  { key: 'name', label: 'Name', type: 'text', req: true, col: true, groups: ALL, section: 'Basics' },
  { key: 'client_type', label: 'Client type', type: 'select', opts: ['Homeowner', 'Builder', 'Hotel', 'Corporate', 'Retail chain', 'Institution'], req: true, groups: ['retail'], section: 'Basics' },
  { key: 'mobile', label: 'Mobile', type: 'mobile', req: true, col: true, groups: ALL, section: 'Basics' },
  { key: 'whatsapp', label: 'WhatsApp number', type: 'mobile', col: true, groups: ALL, section: 'Basics' },
  { key: 'mobile_alt', label: 'Alternate mobile', type: 'mobile', col: true, groups: ALL, section: 'Basics' },
  { key: 'email', label: 'Email', type: 'email', col: true, groups: ALL, section: 'Basics' },
  { key: 'city', label: 'City', type: 'city', req: true, col: true, groups: ALL, section: 'Basics' },
  { key: 'locality', label: 'Area or locality', type: 'text', groups: ALL, section: 'Basics' },
  { key: 'pincode', label: 'Pincode', type: 'pincode', groups: ALL, section: 'Basics' },
  { key: 'address', label: 'Address', type: 'textarea', groups: ALL, section: 'Basics' },
  { key: 'owner_id', label: 'Owner at EGO', type: 'owner', req: true, col: true, groups: ALL, section: 'Basics' },
  { key: 'source', label: 'Came from', type: 'select', opts: SOURCES, col: true, groups: ALL, section: 'Basics' },
  { key: 'status', label: 'Status', type: 'select', opts: ['Active', 'Prospect', 'Inactive'], col: true, groups: ALL, section: 'Basics' },

  { key: 'legal_name', label: 'Legal name (as on GST)', type: 'text', groups: ['dealer', 'firm'], section: 'Business' },
  { key: 'gst', label: 'GST number', type: 'gst', col: true, groups: ['dealer', 'firm', 'retail'], section: 'Business' },
  { key: 'parent_id', label: 'Buys through', type: 'link', to: ['distributor', 'dealer'], col: true, groups: ['dealer'], kinds: ['dealer', 'sub_dealer'], section: 'Business' },
  { key: 'grade', label: 'Grade', type: 'select', opts: ['Platinum', 'A', 'B', 'C'], col: true, groups: ['dealer'], section: 'Business' },
  { key: 'priority200', label: 'Priority 200', type: 'yesno', groups: ['dealer'], section: 'Business' },
  { key: 'since', label: 'Working with EGO since', type: 'date', groups: ['dealer', 'firm'], section: 'Business' },
  { key: 'credit_limit', label: 'Credit limit (₹)', type: 'money', groups: ['dealer'], section: 'Business' },
  { key: 'telesales_id', label: 'Telesales owner', type: 'owner', groups: ['dealer'], section: 'Business' },
  { key: 'specialist_id', label: 'Specialist owner', type: 'owner', groups: ['dealer'], section: 'Business' },
  { key: 'contact_every_days', label: 'Call or visit every (days)', type: 'number', groups: ['dealer'], section: 'Business' },

  { key: 'categories', label: 'Categories bought', type: 'multi', opts: CATS, groups: ['dealer'], section: 'Products and market' },
  { key: 'categories_missing', label: 'Categories not bought yet', type: 'multi', opts: CATS, groups: ['dealer'], section: 'Products and market' },
  { key: 'brands_sold', label: 'Other brands they sell', type: 'text', groups: ['dealer'], section: 'Products and market' },
  { key: 'competitors', label: 'Main competitors nearby', type: 'text', groups: ['dealer'], section: 'Products and market' },
  { key: 'customer_types', label: 'They sell to', type: 'multi', opts: ['Homeowners', 'Builders', 'Architects and designers', 'Contractors', 'Corporate offices', 'Hotels', 'Institutions'], groups: ['dealer'], section: 'Products and market' },
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
  { key: 'position', label: 'Position', type: 'select', opts: ['Principal', 'Partner', 'Senior architect', 'Architect', 'Interior designer', 'Other'], groups: ['architect'], section: 'Practice' },
  { key: 'specialisation', label: 'Specialisation', type: 'select', opts: ['Luxury villas', 'Apartments', 'Workplace', 'Retail fit-outs', 'Hospitality', 'Institutional', 'Other'], groups: ['architect', 'firm'], section: 'Practice' },
  { key: 'focus', label: 'Focus', type: 'select', opts: ['Residential', 'Corporate', 'Hospitality', 'Retail', 'Mixed'], groups: ['architect', 'firm'], section: 'Practice' },
  { key: 'team_size', label: 'Team size', type: 'number', groups: ['firm'], section: 'Practice' },
  { key: 'potential', label: 'Potential', type: 'select', opts: ['High', 'Medium', 'Low'], groups: ['architect', 'firm'], section: 'Practice' },
  { key: 'design500', label: 'Design 500 member', type: 'yesno', groups: ['architect', 'firm'], section: 'Practice' },
  { key: 'relationship', label: 'Relationship', type: 'select', opts: ['EGO direct', 'Via dealer'], groups: ['architect'], section: 'Practice' },
  { key: 'connected_dealers', label: 'Connected dealers', type: 'text', groups: ['architect'], section: 'Practice' },

  { key: 'architect_id', label: 'Architect', type: 'link', to: ['architect'], col: true, groups: ['retail'], section: 'Retail' },
  { key: 'campaign', label: 'Campaign', type: 'text', groups: ['retail'], section: 'Retail' },
  { key: 'condition_tag', label: 'Condition tag', type: 'select', opts: ['Hot', 'Warm', 'Cold'], groups: ['retail'], section: 'Retail' },

  { key: 'last_contact', label: 'Last contact', type: 'date', groups: ['architect', 'firm'], section: 'Follow-up' },
  { key: 'next_action', label: 'Next action', type: 'text', groups: ALL, section: 'Follow-up' },
  { key: 'next_date', label: 'Next action date', type: 'date', groups: ALL, section: 'Follow-up' },
  { key: 'notes', label: 'Notes', type: 'textarea', col: true, groups: ALL, section: 'Follow-up' },
];

const CONTACT_FIELDS = [
  { key: 'name', label: 'Name', type: 'text', req: true },
  { key: 'designation', label: 'Designation', type: 'select', opts: DESIGNATIONS },
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
  { key: 'products', label: 'Products', type: 'multi', opts: CATS },
  { key: 'area_sqft', label: 'Area (sq ft)', type: 'number' },
  { key: 'application', label: 'Room or application', type: 'text' },
  { key: 'budget', label: 'Budget band', type: 'select', opts: ['Under 2 lakh', '2 to 5 lakh', '5 to 10 lakh', 'Above 10 lakh'] },
  { key: 'source', label: 'Came from', type: 'select', opts: SOURCES },
  { key: 'owner_id', label: 'Owner at EGO', type: 'owner', req: true },
  { key: 'contact_id', label: 'Point of contact', type: 'contact' },
  { key: 'next_action', label: 'Next action', type: 'text' },
  { key: 'next_date', label: 'Next action date', type: 'date' },
  { key: 'expected_close', label: 'Expected close', type: 'date' },
  { key: 'lost_reason', label: 'Lost reason', type: 'lost' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];
const OPP_COLS = ['pipeline', 'title', 'stage', 'value', 'owner_id', 'contact_id', 'next_action', 'next_date', 'lost_reason', 'source'];

const fieldsFor = kind => {
  const g = KINDS[kind] && KINDS[kind].group;
  return CLIENT_FIELDS.filter(f => f.groups.includes(g) && (!f.kinds || f.kinds.includes(kind)));
};

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
      const hit = matchOpt(f.opts, v, f.key === 'kind' ? KINDS : f.key === 'pipeline' ? PIPELINES : null);
      return hit == null ? { error: `"${v}" is not in the list` } : { value: hit };
    }
    case 'multi': {
      const arr = Array.isArray(v) ? v : String(v).split(/[,;]/).map(s => s.trim()).filter(Boolean);
      const out = [];
      for (const x of arr) { const hit = matchOpt(f.opts, x); if (hit == null) return { error: `"${x}" is not in the list` }; if (!out.includes(hit)) out.push(hit); }
      return { value: out };
    }
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

/* ---------------------------------------------------------------- the Excel template

   The tabs and their columns, derived from the fields above so a new field
   reaches the template without a second edit. The header text IS the mapping:
   the importer reads a column by its header, so headers are generated here and
   compared after normHeader() on the way back in. */
const TEMPLATE_TABS = [
  { id: 'dealers', sheet: 'Dealers & distributors', tab: 'clients', kinds: ['distributor', 'dealer', 'sub_dealer'] },
  { id: 'architects', sheet: 'Architects & firms', tab: 'clients', kinds: ['architect', 'design_firm'] },
  { id: 'retail', sheet: 'Retail clients', tab: 'clients', kinds: ['retail'] },
  { id: 'contacts', sheet: 'Contacts', tab: 'contacts' },
  { id: 'opps', sheet: 'Opportunities', tab: 'opps' },
];
const HINT = { mobile: ' (10 digits)', multi: ' (separate with commas)', date: ' (DD/MM/YYYY)', owner: ' (login or name)', pincode: ' (6 digits)' };
const linkHint = f => ` (mobile or GST of the ${f.to.map(k => KINDS[k].label.toLowerCase()).join(' or ')})`;
function templateColumns(t) {
  const col = (f, header) => ({ key: f.key, type: f.type, opts: f.opts, req: !!f.req, header: (header || f.label + (f.type === 'link' ? linkHint(f) : HINT[f.type] || '')) + (f.req ? ' *' : '') });
  if (t.tab === 'clients') {
    const keys = new Set(t.kinds.flatMap(k => fieldsFor(k).map(f => f.key)));
    return CLIENT_FIELDS.filter(f => keys.has(f.key) && !(f.key === 'kind' && t.kinds.length === 1))
      .map(f => f.key === 'kind' ? { ...col(f), opts: t.kinds } : col(f));
  }
  const key = { key: 'client_key', type: 'text', req: true, header: 'Client mobile or GST *' };
  if (t.tab === 'contacts') return [key, ...CONTACT_FIELDS.map(f => col(f))];
  return [key, ...OPP_FIELDS.map(f => f.key === 'contact_id' ? { key: 'contact_name', type: 'text', header: 'Point of contact (name, as on the Contacts sheet)' } : f.key === 'stage' ? { ...col(f), opts: [] } : col(f))];
}
const normHeader = h => String(h == null ? '' : h).replace(/\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
/* an example row is shown in every sheet and never imported */
const EXAMPLE_MARK = 'EXAMPLE';
