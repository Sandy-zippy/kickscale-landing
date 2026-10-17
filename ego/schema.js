'use strict';
/* COPY of ego/server/src/schema.js with `export` removed by build_live.py. */
/* EGO Master LIVE: the one field registry.

   ONE copy. The Worker imports it, the browser gets it as live/dist/schema.js
   (build_live.py strips the `export` keywords and nothing else), and
   make_template.py reads it through node to write the Excel headers and
   dropdowns. A field added here appears in the form, the 360 page, the server's
   validation and the upload template together, or it is not added at all. */

/* EGO's own list (onboarding answers, 5 Oct): Big E also sells PVC soffit, cladding and bamboo */
const CATS = ['LVT', 'SPC', 'Laminate', 'Engineered', 'Hywood', 'WPC Tile Deck', 'WPC Plank Deck', 'PVC Soffit & Cladding', 'Bamboo Deck', 'Bamboo Cladding / Soffit'];

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
  /* 6 Oct, EGO's own order: the sale ends at Order confirmed; stock is blocked, the PI sent, the money taken and the invoice raised in fulfilment */
  wholesale: { label: 'Wholesale opportunity', plural: 'Wholesale opportunities', division: 'wholesale', won: 'Order confirmed', lines: true },
  retail_lead: { label: 'Retail lead', plural: 'Retail leads', division: 'retail' },
  retail_project: { label: 'Retail project', plural: 'Retail projects', division: 'retail', project: true },
  /* 17 Oct (R3a): EGO Premium's Project pipeline (spec section 13) and its Retail pipeline, the consumer lead
     engine (spec section 15) where a lead is qualified and allocated to a dealer. Leads for dealers folded into it. */
  ego_project: { label: 'Project opportunity', plural: 'Project opportunities', division: 'wholesale', project: true },
  ego_retail: { label: 'Consumer lead', plural: 'Retail (consumer leads)', division: 'wholesale', dealer: true },
};
/* which pipelines a client of each group may have */
const PIPES_FOR = { dealer: ['wholesale', 'ego_project'], direct: ['wholesale', 'ego_project', 'ego_retail'], retail: ['retail_lead', 'retail_project'], architect: ['wholesale', 'ego_project', 'retail_lead', 'retail_project'], firm: ['wholesale', 'ego_project', 'retail_lead', 'retail_project'] };
/* the Project pipeline of each company: a project's opportunities sit in it */
const PROJECT_PIPE = { wholesale: 'ego_project', retail: 'retail_project' };

const SOURCES = ['Meta Ads', 'Google Ads', 'Website', 'WhatsApp', 'IndiaMART', 'JustDial', 'Runo', 'Sales Diary', 'QR code', 'Walk-in', 'Referral', 'Field visit', 'Architect', 'Existing relationship', 'Other'];

/* Defaults for the lists the Owner can edit in Lists & stages. Stored in
   settings once edited; these only apply to a fresh database. */
const DEFAULT_LISTS = {
  stages: {
    wholesale: ['New', 'Contacted', 'Qualified', 'Quotation', 'Order confirmed', 'Lost', 'Nurturing'],
    retail_lead: ['New', 'Contacted', 'Qualified', 'Appointment', 'Site visit', 'Sample', 'Quote', 'Won', 'Lost'],
    retail_project: ['New project', 'Qualified', 'Sample', 'Specification', 'Approval', 'Quotation', 'Negotiation', 'Won', 'Lost'],
    ego_project: ['New Project', 'Qualified', 'Sample', 'Specification', 'Approval', 'Quotation', 'Negotiation', 'Won', 'Lost'],
    ego_retail: ['New', 'Qualified', 'Dealer allocated', 'Dealer accepted', 'Site visit', 'Sample', 'Quote', 'Won', 'Lost'],
  },
  cities: [
    ['Mumbai', 'West'], ['Navi Mumbai', 'West'], ['Thane', 'West'], ['Pune', 'West'], ['Nashik', 'West'], ['Nagpur', 'West'], ['Ahmedabad', 'West'], ['Surat', 'West'], ['Vadodara', 'West'], ['Goa', 'West'],
    ['Bengaluru', 'South'], ['Chennai', 'South'], ['Hyderabad', 'South'], ['Kochi', 'South'],
    ['New Delhi', 'North'], ['Gurugram', 'North'], ['Noida', 'North'], ['Jaipur', 'North'], ['Chandigarh', 'North'], ['Lucknow', 'North'],
    ['Kolkata', 'East'], ['Indore', 'Central'],
  ].map(([city, region]) => ({ city, region })),
  categories: CATS,
  lost_reasons: ['Stock not available', 'Price', 'Colour not available', 'Size not available', 'Chose a competitor', 'Architect specified another brand', 'Project on hold', 'Delivery timeline', 'Credit terms', 'No response', 'Other'],
};
const REGIONS = ['West', 'South', 'North', 'East', 'Central'];

/* the 28 states and 8 union territories, A to Z (11 Oct) */
const STATES = ['Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];
/* picking a city fills its state; a city not here leaves the state to be picked */
const CITY_STATE = { Mumbai: 'Maharashtra', 'Navi Mumbai': 'Maharashtra', Thane: 'Maharashtra', Pune: 'Maharashtra', Nashik: 'Maharashtra', Nagpur: 'Maharashtra', Ahmedabad: 'Gujarat', Surat: 'Gujarat', Vadodara: 'Gujarat', Goa: 'Goa',
  Bengaluru: 'Karnataka', Chennai: 'Tamil Nadu', Hyderabad: 'Telangana', Kochi: 'Kerala', 'New Delhi': 'Delhi', Gurugram: 'Haryana', Noida: 'Uttar Pradesh', Jaipur: 'Rajasthan', Chandigarh: 'Chandigarh', Lucknow: 'Uttar Pradesh',
  Kolkata: 'West Bengal', Indore: 'Madhya Pradesh', Raipur: 'Chhattisgarh', Bhopal: 'Madhya Pradesh', Visakhapatnam: 'Andhra Pradesh', Coimbatore: 'Tamil Nadu', Ludhiana: 'Punjab', Patna: 'Bihar', Bhubaneswar: 'Odisha', Guwahati: 'Assam', Dehradun: 'Uttarakhand' };
const NEXT_ACTIONS = ['Call', 'WhatsApp', 'Visit dealer', 'Site visit', 'Send sample', 'Send catalogue', 'Send quotation', 'Follow up on quotation', 'Collect payment', 'Meeting'];

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
  { key: 'state', list: 'states', label: 'State', type: 'select', opts: STATES, groups: ALL, section: 'Basics' },
  { key: 'locality', label: 'Area or locality', type: 'text', groups: ALL, section: 'Basics' },
  { key: 'pincode', label: 'Pincode', type: 'pincode', groups: ALL, section: 'Basics' },
  { key: 'address', label: 'Address', type: 'textarea', groups: ALL, section: 'Basics' },
  /* more addresses (another branch, a site, a godown): picked as billing or delivery on a sale (11 Oct) */
  { key: 'addresses', label: 'Other addresses', type: 'addresses', groups: ALL, section: 'Basics' },
  { key: 'areas_covered', label: 'Areas they cover', klabel: { distributor: 'Assigned area (they answer for its sales)' }, type: 'cities', groups: ORGS, section: 'Basics' },
  { key: 'other_offices', label: 'Other offices or branches (areas)', type: 'text', groups: ORGS, section: 'Basics' },
  { key: 'owner_id', label: 'Owner at EGO', type: 'owner', req: true, col: true, groups: ALL, section: 'Basics' },
  { key: 'source', list: 'sources', label: 'Source', type: 'select', opts: SOURCES, col: true, groups: ALL, section: 'Basics' },
  { key: 'status', list: 'client_statuses', label: 'Status', type: 'select', opts: ['Active', 'Prospect', 'Inactive'], col: true, groups: ALL, section: 'Basics' },

  { key: 'legal_name', label: 'Legal name (as on GST)', type: 'text', groups: ['dealer', 'firm'], section: 'Business' },
  { key: 'gst', label: 'GST number', type: 'gst', col: true, groups: ['dealer', 'firm', 'retail', 'direct'], section: 'Business' },
  /* a sub-dealer is a retailer served by a distributor; a dealer buys from EGO directly (onboarding answers) */
  { key: 'parent_id', label: 'Distributor who serves them', type: 'link', to: ['distributor'], req: true, col: true, groups: ['dealer'], kinds: ['sub_dealer'], section: 'Business' },
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
  /* Project Partner (spec section 14, R3a): only Yes and Potential dealers are offered as a project's partner */
  { key: 'project_partner', label: 'Project Partner', type: 'select', opts: ['Yes', 'No', 'Potential'], groups: ['dealer'], section: 'Products and market' },
  { key: 'partner_capability', label: 'Project Partner capability', type: 'text', groups: ['dealer'], section: 'Products and market' },

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
  { key: 'next_action', list: 'next_actions', label: 'Next action', type: 'suggest', opts: NEXT_ACTIONS, groups: ALL, section: 'Follow-up' },
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
  /* left blank, it is named for them: client · product · month (11 Oct) */
  { key: 'title', label: 'Opportunity name', type: 'text' },
  { key: 'stage', label: 'Stage', type: 'stage', req: true },
  { key: 'value', label: 'Value (₹)', type: 'money' },
  { key: 'products', label: 'Products', type: 'cats' },
  { key: 'area_sqft', label: 'Area (sq ft)', type: 'number' },
  { key: 'application', label: 'Room or application', type: 'text' },
  { key: 'budget', list: 'budget_bands', label: 'Budget band', type: 'select', opts: ['Under 2 lakh', '2 to 5 lakh', '5 to 10 lakh', 'Above 10 lakh'] },
  { key: 'source', list: 'sources', label: 'Source', type: 'select', opts: SOURCES },
  { key: 'project_id', label: 'Project', type: 'project', pipes: ['ego_project', 'retail_project'] },
  { key: 'dealer_id', label: 'Allocated dealer', type: 'dealer', pipes: ['ego_retail'] },
  { key: 'owner_id', label: 'Owner at EGO', type: 'owner', req: true },
  { key: 'contact_id', label: 'Point of contact', type: 'contact' },
  { key: 'next_action', list: 'next_actions', label: 'Next action', type: 'suggest', opts: NEXT_ACTIONS },
  { key: 'next_date', label: 'Next action date', type: 'date' },
  { key: 'expected_close', label: 'Expected close', type: 'date' },
  { key: 'lost_reason', label: 'Lost reason', type: 'lost' },
  { key: 'lost_detail', label: 'Lost: the details', type: 'textarea' },
  /* what EGO writes on an order or quotation (onboarding answers); wholesale only */
  { key: 'billing_address', label: 'Billing address', type: 'address', pipes: ['wholesale'], section: 'Billing, payment and delivery' },
  { key: 'delivery_address', label: 'Delivery address', type: 'address', pipes: ['wholesale'], section: 'Billing, payment and delivery' },
  { key: 'payment_terms', list: 'payment_terms', label: 'Payment terms', type: 'suggest', opts: ['100% advance', '50% advance, balance before dispatch', '30% advance, balance before dispatch', 'Against delivery', 'PDC (post-dated cheque)', '15 days credit', '30 days credit', '45 days credit', '60 days credit'], pipes: ['wholesale'], section: 'Billing, payment and delivery' },
  { key: 'delivery_terms', list: 'delivery_terms', label: 'Delivery terms', type: 'suggest', opts: ['Ex-warehouse Bhiwandi', 'Door delivery, freight extra', 'Door delivery, freight included', 'Transport arranged by the dealer', 'Delivered to site'], pipes: ['wholesale'], section: 'Billing, payment and delivery' },
  { key: 'delivery_time', label: 'Delivery time', type: 'text', pipes: ['wholesale'], section: 'Billing, payment and delivery' },
  { key: 'terms', label: 'Terms and conditions', type: 'textarea', pipes: ['wholesale'], section: 'Billing, payment and delivery' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];
/* the name a sale gets when nobody typed one: who · what · when */
const oppAutoName = (client, what, iso) => [client, what, new Date((iso || new Date().toISOString()).slice(0, 10) + 'T00:00:00Z').toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })].filter(Boolean).join(' · ');
/* a client's main address as one block, the first choice for billing */
const mainAddress = c => { const x = { ...c, ...(c && c.extra) }; return [x.address, x.locality, x.city, x.state, x.pincode].map(v => String(v || '').trim()).filter(Boolean).join(', '); };
const oppFieldsFor = p => OPP_FIELDS.filter(f => !f.pipes || f.pipes.includes(p));
const labelFor = (f, kind) => (f.klabel && f.klabel[kind]) || f.label;
/* the charges a wholesale order may carry besides its designs, typed as "what for" + amount */
const CHARGE_HINTS = ['Installation', 'Porter / loading', 'Transport', 'Skirting / profile', 'Film / foam', 'Accessories'];
/* The stage that counts as won: for a wholesale sale it is Order confirmed (6 Oct), and
   that is where it passes to fulfilment. Lost is lost everywhere; Nurturing stays open. */
/* A stage that drives the processing has a ROLE (its first name) and a current NAME: the
   Owner may unlock and rename it, and the logic follows the role, never the words. */
const nm = (lists, set, role) => ((lists && lists.names && lists.names[set]) || {})[role] || role;
const wonStage = (p, lists) => nm(lists, 'stages.' + p, (PIPELINES[p] && PIPELINES[p].won) || 'Won');
const lostStage = (p, lists) => nm(lists, 'stages.' + p, 'Lost');
const creditStage = (p, lists) => PIPELINES[p] && PIPELINES[p].credit ? nm(lists, 'stages.' + p, PIPELINES[p].credit) : null;
const isClosed = (p, st, lists) => st === wonStage(p, lists) || st === lostStage(p, lists);
const OPP_COLS = ['pipeline', 'title', 'stage', 'value', 'owner_id', 'contact_id', 'next_action', 'next_date', 'lost_reason', 'source', 'project_id', 'dealer_id'];

/* A Project (17 Oct, R3a) is one building or site. Under it: its opportunities (per tower, phase or product),
   its contacts by role, its Project Partner dealer and its installation sites. One per company. */
const PROJECT_TYPES = ['Builder', 'Hotel', 'Corporate', 'Retail', 'Others'];
const PROJECT_STAGES = ['Identified', 'Qualified', 'Sample', 'Specification', 'Approval', 'Quotation', 'Negotiation', 'Won', 'Lost', 'Execution', 'Installation', 'Collection', 'Completed'];
const PROJECT_FIELDS = [
  { key: 'name', label: 'Project name', type: 'text', req: true },
  { key: 'type', list: 'project_types', label: 'Project type', type: 'select', opts: PROJECT_TYPES, req: true },
  { key: 'city', label: 'City', type: 'city', req: true },
  { key: 'address', label: 'Site address', type: 'address' },
  { key: 'stage', list: 'project_stages', label: 'Stage', type: 'select', opts: PROJECT_STAGES, req: true },
  { key: 'owner_id', label: 'Owner at EGO', type: 'owner', req: true },
  { key: 'value', label: 'Expected value (₹)', type: 'money' },
  { key: 'partner_id', label: 'Project Partner dealer', type: 'partner' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];
const PROJECT_ROLES = ['Owner', 'Purchase manager', 'Project manager', 'Architect', 'Contractor'];
const PARTNER_OK = ['Yes', 'Potential'];
function cleanProject(input, ctx) {
  const errors = [], rec = {};
  for (const f of PROJECT_FIELDS) {
    const r = cleanValue(f, input[f.key], ctx, input);
    if (r.error) { errors.push(`${f.label} ${r.error}`); continue; }
    const empty = r.value === '' || r.value == null;
    if (f.req && empty) { errors.push(`${f.label} is compulsory`); continue; }
    rec[f.key] = empty ? (f.type === 'money' ? null : '') : r.value;
  }
  const roles = (ctx && ctx.lists && ctx.lists.project_roles) || PROJECT_ROLES;
  rec.contacts = [];
  for (const [i, k] of (Array.isArray(input.contacts) ? input.contacts : []).entries()) {
    const name = String((k && k.name) || '').trim().slice(0, 120), role = String((k && k.role) || '').trim(), mob = normMobile((k && k.mobile) || '', k && k.mobile_dial);
    if (!name && !(k && k.mobile)) continue;
    if (!name) { errors.push(`Contact ${i + 1}: give the name`); continue; }
    if (!roles.includes(role)) { errors.push(`Contact ${i + 1}: choose the role (${roles.join(', ')})`); continue; }
    if (mob.error) { errors.push(`Contact ${i + 1}: mobile ${mob.error}`); continue; }
    rec.contacts.push({ role, name, mobile: mob.value || '', email: String((k && k.email) || '').trim().slice(0, 120) });
  }
  return { rec, errors };
}

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
  for (const f of oppFieldsFor(pipe)) {
    const r = cleanValue(f, input[f.key], ctx, input);
    if (r.error) { errors.push(`${f.label} ${r.error}`); continue; }
    const empty = r.value === '' || r.value == null || (Array.isArray(r.value) && !r.value.length);
    if (f.req && empty) { errors.push(`${f.label} is compulsory`); continue; }
    if (OPP_COLS.includes(f.key)) rec[f.key] = empty ? (f.type === 'money' ? null : '') : r.value;
    else if (!empty) rec.extra[f.key] = r.value;
  }
  const lost = lostStage(pipe, ctx && ctx.lists);
  if (rec.stage === lost && !rec.lost_reason) errors.push(`Lost reason is compulsory when the stage is ${lost}`);
  if (rec.stage === lost && !rec.extra.lost_detail) errors.push(`Lost: the details are compulsory when the stage is ${lost}`);
  if (rec.stage !== lost) { rec.lost_reason = ''; delete rec.extra.lost_detail; }
  return { rec, errors };
}

function cleanValue(f, v, ctx, whole) {
  const lists = (ctx && ctx.lists) || DEFAULT_LISTS;
  if (typeof v === 'string') v = v.trim();
  if (v === undefined || v === null) v = '';
  switch (f.type) {
    case 'text': case 'textarea': case 'suggest': case 'address': return { value: String(v).slice(0, ['textarea', 'address'].includes(f.type) ? 4000 : 300) };
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
    case 'link': case 'contact': case 'project': case 'dealer': case 'partner': return { value: v === '' ? '' : String(v) };
    case 'addresses': {
      const arr = (Array.isArray(v) ? v : String(v).split(/\n\s*\n/)).map(a => String(a || '').trim().slice(0, 600)).filter(Boolean);
      return { value: [...new Set(arr)].slice(0, 30) };
    }
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
/* who changes the ONE inventory, from either company: EGO Premium's warehouse, Big E's heads (4 Oct) */
const STOCK_ROLES = ['owner', 'director', 'ws_warehouse', 'rt_head', 'rt_project'];
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
    only: ['kind', 'name', 'legal_name', 'gst', 'POC', 'address', 'locality', 'city', 'state', 'pincode', 'areas_covered', 'other_offices', 'owner_id', 'grade', 'parent_id', 'source', 'status', 'since', 'credit_limit', 'priority200'],
    refs: { parent_id: ['Dealer companies', 'name'] },
    heads: { ...ORG_HEADS, name: 'Dealer company name', kind: 'Type (Distributor, Dealer or Sub-dealer)', areas_covered: 'Areas they cover (a distributor: its assigned area)', parent_id: 'Distributor who serves them (sub-dealers only: pick the distributor)' } },
  dealer_people: PEOPLE('dealer_people', 'Dealer people', 'Company', ['distributor', 'dealer', 'sub_dealer'], 'Dealer companies'),
  architects: { id: 'architects', sheet: 'Architect firms', tab: 'clients', kinds: ['design_firm', 'architect'], poc: true,
    only: ['kind', 'name', 'legal_name', 'gst', 'POC', 'address', 'locality', 'city', 'state', 'pincode', 'areas_covered', 'other_offices', 'owner_id', 'rating', 'source', 'status', 'since', 'relationship'],
    heads: { ...ORG_HEADS, name: 'Architect firm name', kind: 'Firm or solo architect (Design firm or Architect)', areas_covered: 'Areas they work in' } },
  architect_people: PEOPLE('architect_people', 'Architect people', 'Firm', ['design_firm', 'architect'], 'Architect firms'),
};
const CLIENTS_SHEET = kind => ({ id: 'clients', sheet: 'People (no company)', tab: 'clients', kinds: [kind],
  only: ['name', 'client_type', 'mobile', 'whatsapp', 'email', 'address', 'locality', 'city', 'state', 'pincode', 'owner_id', 'source', 'status'],
  heads: { email: 'Email ID', name: 'Person or firm name', client_type: 'Individual or what kind of firm', city: 'City', locality: 'Area', owner_id: 'Who looks after them at EGO', mobile: 'Mobile number (10 digits)' } });
const TEMPLATES = {
  ws: { id: 'ws', company: 'EGO Premium', division: 'wholesale', version: 'EGO-WS-3', file: 'EGO-Premium-Upload-Template.xlsx',
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
  /* a field compulsory for only some kinds on the sheet (a sub-dealer's distributor) gets no star: its header says when */
  const col = f => ({ key: f.key, type: f.type, opts: f.opts, list: f.list, req: !!f.req && !f.kinds, ref: refs[f.key], header: (heads[f.key] || f.label + (f.type === 'link' ? ' (name, mobile or GST)' : HINT[f.type] || '')) + (f.req && !f.kinds ? ' *' : '') });
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
  ['People and companies', [['sources', 'Sources'], ['states', 'States'], ['roles', 'Roles (people at a company)'], ['client_types', 'Kinds of personal client'], ['client_statuses', 'Status'], ['dealer_grades', 'Dealer ratings'],
    ['architect_ratings', 'Architect ratings'], ['positions', 'Architect positions'], ['specialisations', 'Specialisations'], ['focus_areas', 'Focus'], ['potentials', 'Potential'],
    ['relationships', 'Relationship (architects)'], ['customer_types', 'Who dealers sell to'], ['condition_tags', 'Condition tags (retail)']]],
  ['Projects', [['project_types', 'Project types'], ['project_stages', 'Project stages'], ['project_roles', 'Project contact roles']]],
  ['Opportunities', [['lost_reasons', 'Lost reasons'], ['budget_bands', 'Budget bands'], ['next_actions', 'Next actions'], ['followup_sources', 'Follow-up sources'], ['payment_terms', 'Payment terms'], ['delivery_terms', 'Delivery terms']]],
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
  add('projects', PROJECT_FIELDS, () => true);
  return out;
})();
DEFAULT_LISTS.project_roles = PROJECT_ROLES;
for (const f of [...CLIENT_FIELDS, ...CONTACT_FIELDS, ...OPP_FIELDS, ...COLLECTION_FIELDS, ...PRODUCT_FIELDS, ...PROJECT_FIELDS]) if (f.list && !DEFAULT_LISTS[f.list]) DEFAULT_LISTS[f.list] = f.opts;
/* where a follow-up came from or how it happened (13 Oct), recorded when it is done; editable in Lists & stages */
DEFAULT_LISTS.followup_sources = ['Call', 'WhatsApp', 'Visit', 'Email', 'Meeting', 'Meta lead', 'IndiaMART', 'Walk-in', 'Referral', 'Other'];
LIST_USES.followup_sources = [{ table: 'follow_ups', key: 'source', col: true, multi: false }];
const optsOf = (f, lists) => (f.list && lists && lists[f.list]) || f.opts;

/* ---------------------------------------------------------------- operations (4 Oct)

   The processing side, as agreed in the demo. Each stage set is editable in Lists &
   stages; the LOCKED stages carry the logic (a credit check, allocating stock, taking it
   out at dispatch, adding it when production arrives), so they can be moved around but
   never renamed or removed, like Won and Lost. Every other stage is free. */
const OPS = {
  /* EGO's own order (onboarding answers, 6 Oct): stock checked, blocked, PI emailed, advance or full
     payment, invoiced, dispatched, delivered. Not in stock: blocked from the coming production against an advance. */
  fulfilment_stages: { label: 'Fulfilment stages (wholesale)', note: 'Starts by itself when a wholesale opportunity reaches Order confirmed. Stock check blocks boxes in the warehouses; what is missing goes on a production order. Payment received takes the advance or full payment, Invoiced checks the credit limit, Dispatched takes the boxes out of stock.',
    list: ['Stock check', 'Blocked', 'Waiting on production', 'PI sent', 'Payment received', 'Invoiced', 'Packed', 'Dispatched', 'Delivered'], locked: ['Stock check', 'Blocked', 'Waiting on production', 'Payment received', 'Invoiced', 'Dispatched', 'Delivered'] },
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
  /* a lead handed to a dealer with no update for this many days goes to the dealer's field sales owner (13 Oct, batch 4) */
  lead_escalate_days: 2,
  p200: { tiers: [{ name: 'A', min: 70 }, { name: 'B', min: 50 }, { name: 'C', min: 30 }, { name: 'Watchlist', min: 0 }],
    weights: { sales: 40, breadth: 20, payments: 15, display: 10, activity: 15 } },
};
DEFAULT_LISTS.rules = DEFAULT_RULES;
const APPROVER_LEVEL = { owner: 'owner', director: 'director', ws_head: 'head', rt_head: 'head', ws_rm: 'manager', rt_project: 'manager' };
/* what a role may approve: its approval level (switched in Roles & access), against the limits in Rules and numbers */
const levelLimit = (rules, kind, level) => { if (level === 'owner') return Infinity; const a = rules.approvals[kind]; return level && a ? a.levels[level] || 0 : 0; };
const LEVELS = [['none', 'Nothing'], ['manager', 'Up to the manager limits'], ['head', 'Up to the head limits'], ['director', 'Up to the director limits'], ['owner', 'No limit']];
const opsStages = (lists, k) => ((lists || {}).ops || {})[k] || OPS[k].list;
const lastOf = a => a[a.length - 1];
const DISCOUNT_FIELD = { key: 'discount_pct', label: 'Discount (%)', type: 'decimal' };

/* ---------------------------------------------------------------- dealer schemes (6 Oct)

   As EGO runs them (onboarding answers): a target over a period (today a 7-month dealer
   scheme), approved by management, settled at the end. Progress is counted from invoiced
   orders, never typed. */
const SCHEME_APPROVE = ['owner', 'director'];
const SCHEME_SETTLE = ['owner', 'director', 'ws_finance'];
const SCHEME_EDIT = ['owner', 'director', 'ws_head', 'ws_finance'];
/* who moves an order through fulfilment (8 Oct, by department): the stock people block boxes and
   place production, Accounts takes the PI, the payment and the invoice, Dispatch packs and sends.
   Sales and telesales follow their orders but do not move them. */
const FUL_ROLES = { stock: ['owner', 'director', 'ws_head', 'ws_warehouse'], money: ['owner', 'director', 'ws_finance'], dispatch: ['owner', 'director', 'ws_warehouse'] };
const FUL_GROUP = { 'Stock check': 'stock', Blocked: 'stock', 'Waiting on production': 'stock', 'PI sent': 'money', 'Payment received': 'money', Invoiced: 'money', Packed: 'dispatch', Dispatched: 'dispatch', Delivered: 'dispatch' };
/* the group a fulfilment stage belongs to, whatever it is called now. A stage that is not a processing stage
   (PI sent, Packed, or one the Owner added) belongs with the next processing stage after it: PI sent with
   Payment received, Packed with Dispatched. A renamed stage keeps its group. */
const fulGroupOf = (lists, stage) => {
  const FS = opsStages(lists, 'fulfilment_stages'), roles = OPS.fulfilment_stages.locked.map(r => [nm(lists, 'ops.fulfilment_stages', r), FUL_GROUP[r]]);
  for (let i = Math.max(0, FS.indexOf(stage)); i < FS.length; i++) { const hit = roles.find(([n]) => n === FS[i]); if (hit) return hit[1]; }
  return null;
};
/* ful: the order steps a role has (stock, money, dispatch), switched in Roles & access */
const canFul = (lists, ful, stage) => { const g = fulGroupOf(lists, stage); return g ? (ful || []).includes(g) : !!(ful || []).length; };
const FUL_LABEL = { stock: 'Block stock and place production', money: 'PI, payment and invoice', dispatch: 'Pack, dispatch and deliver' };
const SCHEME_LABEL = { edit: 'Draw up', approve: 'Approve', settle: 'Settle' };
const DASHES = [['', 'Standard Home'], ['mgmt', 'Management'], ['head', 'Sales head'], ['sales', 'Field sales'], ['tele', 'Telesales'], ['accounts', 'Accounts'], ['dispatch', 'Dispatch'], ['office', 'Office'], ['mkt', 'Marketing']];
const SCOPES_ALL = [['all', 'Everything, both companies'], ['division', 'Everything in their company'], ['region', 'Their region'], ['own', 'Their own and their team\'s'], ['none', 'No business records']];
/* the screens each role has; a role not listed has every screen its access allows */
const ROLE_TABS = {
  ws_field: ['home', 'people', 'architects', 'dealers', 'opps', 'schemes', 'orders', 'orderbook', 'complaints', 'inventory', 'analysis', 'account'],
  ws_tele: ['home', 'people', 'architects', 'dealers', 'opps', 'schemes', 'orders', 'orderbook', 'complaints', 'inventory', 'analysis', 'account'],
  ws_finance: ['home', 'people', 'architects', 'dealers', 'opps', 'schemes', 'orders', 'orderbook', 'complaints', 'approvals', 'inventory', 'analysis', 'account'],
  ws_warehouse: ['home', 'orders', 'orderbook', 'inventory', 'complaints', 'analysis', 'account'],
  office_admin: ['home', 'people', 'architects', 'dealers', 'inventory', 'complaints', 'analysis', 'account'],
  ws_marketing: ['home', 'people', 'architects', 'dealers', 'opps', 'analysis', 'account'],
};
/* what a file kept on a fulfilment order is (13 Oct): EGO makes these in Tally and uploads the PDF here */
const ORDER_DOC_TYPES = ['PI', 'Invoice', 'Payment proof', 'Other'];
const SCHEME_WHO = { all: 'Every dealer, distributor and sub-dealer', chosen: 'The dealers chosen below', rating: 'Dealers with these ratings' };

/* the roles each stage set has (by their first names), and what is locked to begin with */
const ROLE_SETS = {
  'stages.wholesale': ['Order confirmed', 'Lost', 'Nurturing'],
  'stages.retail_lead': ['Won', 'Lost'], 'stages.retail_project': ['Won', 'Lost'],
  /* a consumer lead needs a dealer from Dealer allocated on; the dealer accepts it in the portal */
  'stages.ego_project': ['Won', 'Lost'], 'stages.ego_retail': ['Dealer allocated', 'Dealer accepted', 'Won', 'Lost'],
  ...Object.fromEntries(Object.entries(OPS).map(([k, v]) => ['ops.' + k, v.locked])),
};
const roleNames = (lists, set) => (ROLE_SETS[set] || []).map(r => nm(lists, set, r));
/* every item of every list can be locked or unlocked; the roles start locked */
const locksOf = (lists, set) => (lists && lists.locks && lists.locks[set]) || roleNames(lists, set).filter(n => !/^Nurturing$/.test(n));

/* Integrations (12 Oct): the tools whose keys are kept in EGO Master, with the values each one
   needs. Any other tool can be added with its own names; this list only fills the names in. */
const TOOLS = [
  ['Bolna', 'AI voice agent', ['API key']],
  ['VoiceLink', 'Indian +91 numbers and SIP calling', ['Username', 'Password']],
  ['Sarvam', 'Indian-language voice and speech', ['API key']],
  ['Exotel', 'Calling', ['Account SID', 'API key', 'API token']],
  ['Plivo', 'Calling', ['Auth ID', 'Auth token']],
  ['Meta lead ads', 'Facebook and Instagram lead forms', ['Page ID', 'Page access token', 'App secret']],
  ['WhatsApp Cloud API', 'WhatsApp messages', ['Phone number ID', 'Business account ID', 'Access token']],
  ['IndiaMART', 'Enquiries', ['CRM key']],
  ['Gmail (Apps Script)', 'Email', ['Script URL', 'Shared secret']],
  ['Runo', 'Calls and telecalling', ['API key']],
  ['Sales Diary', 'Field visits', ['API key']],
  ['JustDial', 'Enquiries', ['API key']],
  ['Google Gemini', 'AI model', ['API key']],
  ['OpenAI', 'AI model', ['API key']],
  ['Other', 'Any other tool', ['API key']],
];

/* Activities (13 Oct): one place for every call, visit, message, meeting and lead, whether a person
   logged it or a connection wrote it. A connection is Live only once a real event from it is here. */
const ACT_KINDS = { call: 'Call', visit: 'Visit', whatsapp: 'WhatsApp', email: 'Email', meeting: 'Meeting', lead: 'Lead', note: 'Note', system: 'System' };
const ACT_MANUAL = ['call', 'visit', 'whatsapp', 'email', 'meeting', 'note'];
const ACT_SOURCES = ['manual', 'meta', 'voice', 'whatsapp', 'gmail', 'indiamart', 'tally', 'runo', 'salesdiary', 'justdial', 'api'];
const CONNECTIONS = [
  { id: 'meta', name: 'Meta lead ads', tools: ['Meta lead ads'], source: 'meta', waits: 'Meta Business Manager and Page admin access from EGO' },
  { id: 'voice', name: 'AI voice agent', tools: ['Bolna', 'VoiceLink'], source: 'voice', waits: 'A +91 calling number, DLT registration, and Meta lead ads connected first' },
  { id: 'whatsapp', name: 'WhatsApp', tools: ['WhatsApp Cloud API'], source: 'whatsapp', waits: 'The WhatsApp number EGO will use, and Meta approval' },
  { id: 'indiamart', name: 'IndiaMART', tools: ['IndiaMART'], source: 'indiamart', waits: 'An IndiaMART plan with the Leads API, and the OTP mobile' },
  { id: 'gmail', name: 'Gmail', tools: ['Gmail (Apps Script)'], source: 'gmail', waits: 'The enquiry mailbox (Google Workspace or not)' },
  { id: 'tally', name: 'Tally', tools: [], source: 'tally', waits: 'The Tally edition and the PC that runs it' },
  { id: 'runo', name: 'Runo', tools: ['Runo'], source: 'runo', waits: 'The Runo API key' },
  { id: 'salesdiary', name: 'Sales Diary', tools: ['Sales Diary'], source: 'salesdiary', waits: 'The Sales Diary API documents from the vendor' },
  { id: 'justdial', name: 'JustDial', tools: ['JustDial'], source: 'justdial', waits: 'JustDial lead feed access' },
];
/* "No further follow-up" is allowed only on a record that is closed: a won or lost opportunity, or an Inactive client */
const CLIENT_CLOSED = 'Inactive';

/* the Recycle bin (13 Oct): every delete waits here this many days, then the daily run purges it */
const BIN_DAYS = 30;
const BIN_KIND = { client: 'Client', contact: 'Contact', opportunity: 'Opportunity', document: 'File', product: 'Design', role: 'Role', scheme: 'Scheme', tool_key: 'Tool key', target: 'Target', lead: 'Lead for a dealer', plan: 'Development plan' };

/* Targets (13 Oct, batch 3): per person, per team (a manager and everyone under them on Reports to),
   per department or role, and for the company; by month, quarter or financial year (April to March).
   Achievement is counted on screen from saved records, never typed. Shared by the server and the browser. */
const TARGET_LEVELS = { person: 'A person', team: 'A team', role: 'A department or role', company: 'The company' };
const TARGET_PERIODS = { month: 'Month', quarter: 'Quarter', year: 'Financial year' };
const MONTHS_FULL = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();   // m is 1 to 12
const p2 = n => String(n).padStart(2, '0');
/* a period's first and last day: month 2026-10, quarter 2026-Q3 (Oct to Dec of FY 2026-27), year 2026 (FY 2026-27) */
function periodRange(type, key) {
  let m;
  if (type === 'month' && (m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(key || ''))) { const y = +m[1], mo = +m[2]; return { start: `${y}-${p2(mo)}-01`, end: `${y}-${p2(mo)}-${lastDay(y, mo)}` }; }
  if (type === 'quarter' && (m = /^(\d{4})-Q([1-4])$/.exec(key || ''))) {
    const fy = +m[1], q = +m[2], m0 = 4 + (q - 1) * 3, y = m0 > 12 ? fy + 1 : fy, mo = m0 > 12 ? m0 - 12 : m0;
    return { start: `${y}-${p2(mo)}-01`, end: `${y}-${p2(mo + 2)}-${lastDay(y, mo + 2)}` };
  }
  if (type === 'year' && (m = /^(\d{4})$/.exec(key || ''))) return { start: `${m[1]}-04-01`, end: `${+m[1] + 1}-03-31` };
  return null;
}
function periodLabel(type, key) {
  const r = periodRange(type, key); if (!r) return String(key || '');
  if (type === 'month') return `${MONS[+key.slice(5, 7) - 1]} ${key.slice(0, 4)}`;
  const fy = +key.slice(0, 4), fyTxt = `${fy}-${p2((fy + 1) % 100)}`;
  if (type === 'year') return fyTxt;
  return `Q${key.slice(-1)} ${fyTxt} (${MONS[+r.start.slice(5, 7) - 1]} to ${MONS[+r.end.slice(5, 7) - 1]} ${r.end.slice(0, 4)})`;
}
/* the periods offered in forms and in the Excel file: this financial year and the next */
function periodOptions(day) {
  const y = +day.slice(0, 4), mo = +day.slice(5, 7), fy = mo >= 4 ? y : y - 1, out = [];
  for (const f of [fy, fy + 1]) {
    for (let i = 0; i < 12; i++) { const m0 = 4 + i, yy = m0 > 12 ? f + 1 : f, key = `${yy}-${p2(m0 > 12 ? m0 - 12 : m0)}`; out.push({ type: 'month', key, label: periodLabel('month', key) }); }
    for (let q = 1; q <= 4; q++) out.push({ type: 'quarter', key: `${f}-Q${q}`, label: periodLabel('quarter', `${f}-Q${q}`) });
    out.push({ type: 'year', key: String(f), label: periodLabel('year', String(f)) });
  }
  return out;
}
/* "Oct 2026", "Q3 2026-27 (Oct to Dec 2026)" or "2026-27" back to its type and key */
function periodOfLabel(label) {
  const t = String(label || '').trim(); let m;
  if ((m = /^([A-Za-z]+)\s+(\d{4})$/.exec(t))) { const w = m[1].toLowerCase(), i = MONS.findIndex((x, j) => x.toLowerCase() === w || MONTHS_FULL[j] === w); return i < 0 ? null : { type: 'month', key: `${m[2]}-${p2(i + 1)}` }; }
  if ((m = /^Q([1-4])\s+(\d{4})-(\d{2})\b/i.exec(t)) && +m[3] === (+m[2] + 1) % 100) return { type: 'quarter', key: `${m[2]}-Q${m[1]}` };
  if ((m = /^(\d{4})-(\d{2})$/.exec(t)) && +m[2] === (+m[1] + 1) % 100) return { type: 'year', key: m[1] };
  return null;
}


/* ---------------------------------------------------------------- batch 4 (13 Oct): leads for dealers, development plans, the dealer portal

   A homeowner or retail enquiry that telesales hand to a dealer near them. The dealer updates it in the
   dealer portal, or EGO's team does; a lead with no update for lead_escalate_days goes to the dealer's
   field sales owner in the bell. */
const LEAD_STATUSES = ['Handed over', 'Dealer contacted', 'Visited', 'Won', 'Lost'];
const LEAD_CLOSED = ['Won', 'Lost'];
/* a Priority 200 dealer's development plan: goals, and the interventions that get it there (each one a follow-up) */
const IV_KINDS = ['Visit', 'Training', 'Display', 'Scheme', 'Joint marketing', 'Credit review'];
const IV_STATUSES = ['Planned', 'In progress', 'Done', 'Cancelled'];
const REVIEW_EVERY = { Weekly: 7, Fortnightly: 14, Monthly: 30, Quarterly: 91 };
/* a timestamp (SQLite, ISO) or a plain date, as that day in India */
const istDay = ts => { if (!ts) return ''; const s = String(ts); if (/^\d{4}-\d\d-\d\d$/.test(s)) return s; const ms = Date.parse(/Z$|[+-]\d\d:?\d\d$/.test(s) ? s : s.replace(' ', 'T') + 'Z'); return isNaN(ms) ? '' : new Date(ms + 5.5 * 36e5).toISOString().slice(0, 10); };
/* progress against a plan, counted from invoiced orders only (one function for the team's screen and the portal):
   value before GST, boxes, and the plan's categories bought, in orders invoiced between its start and end */
function planProgress(plan, orders, lines, catOf) {
  const inv = (orders || []).filter(o => o.client_id === plan.client_id && o.invoiced_at && istDay(o.invoiced_at) >= plan.start_on && istDay(o.invoiced_at) <= plan.end_on);
  const ids = new Set(inv.map(o => o.id)), ls = (lines || []).filter(l => ids.has(l.order_id));
  const cats = [...new Set(ls.map(l => catOf(l.product_id)).filter(Boolean))], goalCats = plan.goal_cats || [];
  return { orders: inv, value: inv.reduce((a, o) => a + (Number(o.subtotal) || 0), 0), boxes: ls.reduce((a, l) => a + (Number(l.boxes) || 0), 0), cats, catsHit: goalCats.filter(c => cats.includes(c)) };
}
