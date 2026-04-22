// ══════════════════════════════════════════════
// ZippyScale Quiz API — Google Apps Script
// Replaces Vercel quiz.js
// Deploy as Web App: Execute as Me, Anyone can access
// ══════════════════════════════════════════════

// ── Config (store sensitive values in Script Properties) ──
// Go to Project Settings → Script Properties and add:
//   META_ACCESS_TOKEN, GHL_PIT, SHEETS_ID

function getConfig() {
  const props = PropertiesService.getScriptProperties()
  return {
    META_PIXEL_ID: '961643772929674',
    META_ACCESS_TOKEN: props.getProperty('META_ACCESS_TOKEN') || '',
    GHL_PIT: props.getProperty('GHL_PIT') || 'pit-add82ec0-12f5-4e34-9e2f-e636dadce75c',
    GHL_LOCATION_ID: 'DSK3kgZgwWoIRnAYf9uC',
    GHL_BHARGAV_ID: 'DWsVEAIiC5tYCO6Judqn',
    SHEETS_ID: props.getProperty('SHEETS_ID') || '1x33H0rto0yWQrw7TcnUgNrzR2Pu5S7_SStO3h2iMSXM',
  }
}

// ── Web App Entry Point ──

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents)
    const config = getConfig()

    // Score the lead
    const score = scoreLeads(data)
    const leadTag = score >= 70 ? 'hot-lead' : score >= 40 ? 'warm-lead' : 'cool-lead'

    // Fire all integrations
    const results = {}

    // 1. Meta CAPI
    try {
      results.capi = sendMetaCAPI(data, score, leadTag, config)
    } catch (err) {
      results.capi = { status: 'error', error: err.message }
    }

    // 2. GHL Contact Upsert
    try {
      results.ghl = upsertGHLContact(data, score, leadTag, config)
    } catch (err) {
      results.ghl = { status: 'error', error: err.message }
    }

    // 3. Google Sheets Backup
    try {
      results.sheets = backupToSheets(data, score, leadTag, config)
    } catch (err) {
      results.sheets = { status: 'error', error: err.message }
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      score,
      tag: leadTag,
      integrations: results,
    })).setMimeType(ContentService.MimeType.JSON)

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.message,
    })).setMimeType(ContentService.MimeType.JSON)
  }
}

// Health check
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    service: 'ZippyScale Quiz API',
    version: 'apps-script-v1',
  })).setMimeType(ContentService.MimeType.JSON)
}

// ── Lead Scoring ──

function scoreLeads(data) {
  let score = 0

  const rev = { '₹10Cr+': 30, '₹5Cr - 10Cr': 25, '₹3Cr - 5Cr': 20, '₹1Cr - 3Cr': 10, '₹50L - 1Cr': 5 }
  score += rev[data.revenue_range] || 0

  const team = { '10+ people': 15, '4 to 10 people': 10, '1 to 3 people': 5 }
  score += team[data.team_size] || 0

  score += Math.min((parseInt(data.urgency) || 5) * 2, 20)

  const spend = { '₹5L+': 15, '₹2L - 5L': 12, '₹50K - 2L': 8, 'Under ₹50K': 4, '₹0 (No marketing spend)': 0 }
  score += spend[data.marketing_spend] || 0

  const areas = (data.automate_areas || '').split(', ').filter(Boolean)
  score += areas.length >= 5 ? 10 : areas.length >= 3 ? 7 : areas.length >= 1 ? 3 : 0

  // Base score for contact-only submissions (hero form)
  if (!data.revenue_range && !data.team_size && !data.automate_areas) {
    score = 20 // Default score for leads captured at hero form (no qualifying data yet)
  }

  return Math.min(score, 100)
}

// ── Meta CAPI ──

function sendMetaCAPI(data, score, leadTag, config) {
  if (!config.META_ACCESS_TOKEN) return { status: 'skipped', reason: 'no token' }

  const nameParts = (data.name || '').trim().split(' ')
  let phone = (data.phone || '').replace(/[^0-9]/g, '')
  if (phone.length === 10) phone = '91' + phone

  const payload = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: data.event_id || 'lead_' + Date.now(),
      event_source_url: data.page_url || 'https://zippyscale.in',
      action_source: 'website',
      user_data: {
        em: [sha256(data.email || '')],
        ph: [sha256(phone)],
        fn: [sha256(nameParts[0] || '')],
        ln: [sha256(nameParts.slice(1).join(' ') || '')],
        country: [sha256('in')],
        client_user_agent: data.client_user_agent || '',
        fbp: data.fbp || '',
        fbc: data.fbc || '',
      },
      custom_data: {
        lead_score: score,
        lead_tag: leadTag,
        industry: data.industry || '',
        content_name: 'AI Automation Audit',
        content_category: 'quiz_submission',
      },
    }],
  }

  const url = 'https://graph.facebook.com/v21.0/' + config.META_PIXEL_ID + '/events?access_token=' + config.META_ACCESS_TOKEN
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  })

  const code = res.getResponseCode()
  if (code !== 200) throw new Error('Meta CAPI ' + code + ': ' + res.getContentText())

  return { status: 'ok', ...JSON.parse(res.getContentText()) }
}

// ── GHL Contact Upsert ──

function upsertGHLContact(data, score, leadTag, config) {
  const nameParts = (data.name || '').trim().split(' ')
  let phone = (data.phone || '').replace(/[^0-9]/g, '')
  if (phone.length === 10) phone = '+91' + phone
  else if (phone.length === 12 && phone.indexOf('91') === 0) phone = '+' + phone

  const industryMap = { 'Manufacturing': 'Other', 'IT/Software': 'SaaS', 'Healthcare': 'Healthcare', 'Education': 'Education', 'Real Estate': 'Real Estate', 'Retail/E-commerce': 'D2C', 'Other': 'Other' }

  const tags = [data.source || 'automation-lp-v5', 'audit-waitlist', leadTag]
  if (data.industry) tags.push(data.industry.toLowerCase().replace(/[\s\/]+/g, '-'))
  if (data.utm_source) tags.push('utm-' + data.utm_source)
  if (data.utm_medium) tags.push('medium-' + data.utm_medium)

  const customFields = [
    { id: 'i00K84Mmu7UH9uJ13UlR', field_value: score },
    { id: 'U4lCawFkdTlKGUFMACdU', field_value: 'Website' },
  ]
  if (data.industry) customFields.push({ id: '1G1IrP5TC05vSCjuWIXl', field_value: industryMap[data.industry] || 'Other' })
  if (data.automate_areas) customFields.push({ id: '3kFfjrcLQjoHsiXhRhOA', field_value: data.automate_areas })
  customFields.push({ id: 'IcU2GqKV41bDHXcUcfEU', field_value: data.awareness || 'solution-aware' })
  if (data.source) customFields.push({ id: 'r7eqW0tqsmOfDp1r6hj2', field_value: data.source })
  const engagement = (parseInt(data.visit_count) || 1) > 2 ? 'Active' : 'Lead'
  customFields.push({ id: 'ZogN3buTYDdnFxvrhwvD', field_value: engagement })

  const contactPayload = {
    locationId: config.GHL_LOCATION_ID,
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    phone: phone,
    email: (data.email || '').trim() || undefined,
    companyName: data.business_name || '',
    tags: tags,
    source: data.source || 'automation-lp-v5',
    customFields: customFields,
    assignedTo: config.GHL_BHARGAV_ID,
  }

  // Remove email if empty (GHL rejects empty string as invalid email)
  if (!contactPayload.email) delete contactPayload.email

  const res = UrlFetchApp.fetch('https://services.leadconnectorhq.com/contacts/upsert', {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + config.GHL_PIT,
      'Version': '2021-07-28',
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify(contactPayload),
    muteHttpExceptions: true,
  })

  const code = res.getResponseCode()
  if (code !== 200 && code !== 201) throw new Error('GHL ' + code + ': ' + res.getContentText())

  const result = JSON.parse(res.getContentText())
  var contactId = result.contact ? result.contact.id : null

  // Create opportunity in pipeline
  if (contactId) {
    var oppPayload = {
      locationId: config.GHL_LOCATION_ID,
      pipelineId: 'aTzYNdImLeTlbuaGyUEw',
      pipelineStageId: 'b06d3ff1-f951-4cfb-9f9b-7606b3a18ee0',
      name: (data.name || 'Unknown') + ' — AI Automation Audit',
      status: 'open',
      monetaryValue: 0,
      contactId: contactId,
      assignedTo: config.GHL_BHARGAV_ID,
    }

    var oppRes = UrlFetchApp.fetch('https://services.leadconnectorhq.com/opportunities/', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + config.GHL_PIT,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify(oppPayload),
      muteHttpExceptions: true,
    })

    var oppCode = oppRes.getResponseCode()
    var oppBody = oppRes.getContentText()
    if (oppCode !== 200 && oppCode !== 201) {
      return { status: 'ok', contactId: contactId, oppError: oppCode + ': ' + oppBody }
    }
    var oppResult = JSON.parse(oppBody)
    return { status: 'ok', contactId: contactId, opportunityId: oppResult.opportunity ? oppResult.opportunity.id : null }
  }

  return { status: 'ok', contactId: contactId }
}

// ── Google Sheets Backup ──

function backupToSheets(data, score, leadTag, config) {
  const ss = SpreadsheetApp.openById(config.SHEETS_ID)
  const sheet = ss.getSheetByName('Sheet1') || ss.getSheets()[0]

  const row = [
    new Date().toISOString(),
    data.name || '',
    data.email || '',
    data.phone || '',
    data.business_name || '',
    data.industry || '',
    data.revenue_range || '',
    data.team_size || '',
    data.marketing_spend || '',
    data.automate_areas || '',
    data.tools_used || '',
    data.tried_before || '',
    data.urgency || '',
    score,
    leadTag,
    data.utm_source || '',
    data.utm_medium || '',
    data.utm_campaign || '',
    data.utm_content || '',
    data.visit_count || '',
    data.time_on_page || '',
    data.source || '',
    data.event_id || '',
  ]

  sheet.appendRow(row)
  return { status: 'ok' }
}

// ── Utility: SHA256 hash ──

function sha256(value) {
  if (!value) return ''
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value.trim().toLowerCase())
  return raw.map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2) }).join('')
}
