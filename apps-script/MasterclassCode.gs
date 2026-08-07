// ══════════════════════════════════════════════
// ZippyScale Luxury Retail Master Class — lead capture
// Dedicated to public/giveaways/luxury-retail-masterclass/index.html.
// Deliberately separate from Code.gs (the AI-automation quiz funnel) —
// different GHL pipeline concerns, and this keeps that live funnel untouched.
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
    // "Luxury Retail Masterclass Leads" — created 2026-08-07, owned by sandy@zippyscale.com
    SHEETS_ID: props.getProperty('MASTERCLASS_SHEETS_ID') || '1Sn86BWn-0ltHlRvG-eamOMsK04STTh99JVDshz0I7oI',
  }
}

var HEADER = ['Timestamp', 'Name', 'Mobile', 'Brand', 'Designation', 'Event', 'Playbook', 'Page']

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
  var sheet = ss.getSheets()[0]
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADER)
  sheet.appendRow([
    new Date().toISOString(),
    data.name || '', data.mobile || '', data.brand || '', data.designation || '',
    data.event || '', data.playbook || '', data.page || '',
  ])
  return { status: 'ok', row: sheet.getLastRow() }
}

function upsertGHLContact(data, config) {
  var nameParts = (data.name || '').trim().split(' ')
  var phone = (data.mobile || '').replace(/[^0-9]/g, '')
  if (phone.length === 10) phone = '+91' + phone
  else if (phone.length === 12 && phone.indexOf('91') === 0) phone = '+' + phone

  var designationSlug = (data.designation || '').toLowerCase().replace(/[\s\/]+/g, '-')
  var tags = ['masterclass-lead', 'source-luxury-retail-masterclass']
  if (designationSlug) tags.push('designation-' + designationSlug)

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
