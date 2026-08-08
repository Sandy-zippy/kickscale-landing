// ══════════════════════════════════════════════
// ZippyScale Luxury Retail Master Class — lead capture
// Dedicated to public/giveaways/luxury-retail-masterclass/index.html.
//
// Writes into its OWN TAB ("Masterclass Leads") inside the SAME spreadsheet
// Client Retention OS already uses ("Clinic Leads Organic",
// 1XaZiIX492tLK5GVx6PnaQID1A8HI_A2H6UeSu1OYs9U) — per Sandy: one sheet file,
// not a second one. The tab is created automatically on first write
// (SpreadsheetApp.insertSheet), so nothing needs to be pre-made by hand.
// Never writes into the "Leads" tab — that's the clinic funnel's data.
//
// This is still its OWN standalone Apps Script project + deployment,
// completely separate from whatever script (if any) already answers for
// Retention OS, and separate from apps-script/Code.gs (the AI-automation
// quiz funnel). Reusing the SHEET as a write target carries zero risk to
// either of those; reusing their SCRIPT would. That file is shared
// "anyone with the link can edit", so any account deploying this can write
// to it with no sharing step required.
//
// Receives a standard HTML form POST (application/x-www-form-urlencoded),
// NOT JSON — the page's logLead() submits a hidden <form>, same mechanism
// as clinic-retention-os/index.html. Fields land in e.parameter.*.
//
// Deploy as Web App: Execute as Me, Anyone can access.
// ══════════════════════════════════════════════

function getConfig() {
  var props = PropertiesService.getScriptProperties()
  return {
    GHL_PIT: props.getProperty('GHL_PIT') || 'pit-add82ec0-12f5-4e34-9e2f-e636dadce75c',
    GHL_LOCATION_ID: 'DSK3kgZgwWoIRnAYf9uC',
    GHL_BHARGAV_ID: 'DWsVEAIiC5tYCO6Judqn',
    // "Clinic Leads Organic" — the SAME spreadsheet Client Retention OS
    // writes into. We only ever touch our own tab within it (see TAB_NAME).
    SHEETS_ID: props.getProperty('MASTERCLASS_SHEETS_ID') || '1XaZiIX492tLK5GVx6PnaQID1A8HI_A2H6UeSu1OYs9U',
  }
}

var TAB_NAME = 'Masterclass Leads'
var HEADER = ['Timestamp', 'Name', 'Mobile', 'Brand', 'Designation', 'Area', 'Revenue', 'Playbook', 'Event', 'Page']

function doPost(e) {
  try {
    var data = e.parameter || {}
    var config = getConfig()
    var results = {}

    try { results.sheet = appendRow(data, config) } catch (err) { results.sheet = { status: 'error', error: err.message } }

    // Only upsert into GHL on the gate unlock — a playbook_view ping every
    // time someone switches the dropdown would spam duplicate contact writes.
    if (data.event === 'gate_unlock') {
      try { results.ghl = upsertGHLContact(data, config) } catch (err) { results.ghl = { status: 'error', error: err.message } }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, results: results }))
      .setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok', service: 'ZippyScale Luxury Retail Master Class API', version: 'v1',
  })).setMimeType(ContentService.MimeType.JSON)
}

function appendRow(data, config) {
  var ss = SpreadsheetApp.openById(config.SHEETS_ID)
  var sheet = ss.getSheetByName(TAB_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(TAB_NAME)
    sheet.appendRow(HEADER)
  }
  sheet.appendRow([
    new Date().toISOString(),
    data.name || '', data.mobile || '', data.brand || '', data.designation || '',
    data.area || '', data.revenue || '',
    data.playbook || '', data.event || '', data.page || '',
  ])
  return { status: 'ok', row: sheet.getLastRow() }
}

// Rupee sign and en-dashes show up in the revenue band text (e.g. "₹50L – ₹1Cr"),
// so a plain whitespace/slash replace isn't enough to get a clean ASCII tag.
function slugify(s) {
  return (s || '').toLowerCase().replace(/₹/g, 'rs').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function upsertGHLContact(data, config) {
  var nameParts = (data.name || '').trim().split(' ')
  var phone = (data.mobile || '').replace(/[^0-9]/g, '')
  if (phone.length === 10) phone = '+91' + phone
  else if (phone.length === 12 && phone.indexOf('91') === 0) phone = '+' + phone

  var designationSlug = slugify(data.designation)
  var areaSlug = slugify(data.area)
  var revenueSlug = slugify(data.revenue)
  var playbookSlug = slugify(data.playbook)
  var tags = ['masterclass-lead', 'source-luxury-retail-masterclass']
  if (designationSlug) tags.push('designation-' + designationSlug)
  if (areaSlug) tags.push('area-' + areaSlug)
  if (revenueSlug) tags.push('revenue-' + revenueSlug)
  if (playbookSlug) tags.push('playbook-' + playbookSlug)

  var contactPayload = {
    locationId: config.GHL_LOCATION_ID,
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    phone: phone,
    companyName: data.brand || '',
    tags: tags,
    source: 'luxury-retail-masterclass',
    assignedTo: config.GHL_BHARGAV_ID,
  }

  var res = UrlFetchApp.fetch('https://services.leadconnectorhq.com/contacts/upsert', {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + config.GHL_PIT,
      'Version': '2021-07-28',
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify(contactPayload),
    muteHttpExceptions: true,
  })

  var code = res.getResponseCode()
  if (code !== 200 && code !== 201) throw new Error('GHL ' + code + ': ' + res.getContentText())
  var result = JSON.parse(res.getContentText())
  return { status: 'ok', contactId: result.contact ? result.contact.id : null }
}
