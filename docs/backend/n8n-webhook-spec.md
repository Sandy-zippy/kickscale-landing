# n8n Webhook Enhancement Spec

## Webhook Endpoint

**URL:** `https://sandyautomations.app.n8n.cloud/webhook/zippyscale-quiz`
**Method:** POST
**Content-Type:** application/json
**Source Identifier:** `automation-lp-v3`

---

## Payload Schema

```json
{
  "name": "string",
  "phone": "string",
  "email": "string",
  "business_name": "string",
  "automate_areas": "comma-separated string",
  "team_size": "1 to 3 people | 4 to 10 people | 10+ people",
  "industry": "string (dropdown)",
  "revenue_range": "₹50L-1Cr | ₹1-3Cr | ₹3-5Cr | ₹5-10Cr | ₹10Cr+",
  "marketing_spend": "₹0 | Under ₹50K | ₹50K-2L | ₹2L-5L | ₹5L+",
  "tools_used": "comma-separated: Excel, Tally, WhatsApp groups, CRM, ERP, None",
  "tried_before": "comma-separated: Hired more people, Tried a freelancer, Tried an agency, Nothing yet",
  "urgency": "1-10 integer",
  "source": "automation-lp-v3",
  "utm_source": "string",
  "utm_medium": "string",
  "utm_campaign": "string",
  "utm_content": "string"
}
```

### Field Validation Rules

| Field | Required | Validation |
|---|---|---|
| name | Yes | Min 2 chars, trim whitespace |
| phone | Yes | 10-digit Indian mobile (strip +91/0 prefix) |
| email | Yes | Valid email format |
| business_name | Yes | Min 2 chars |
| automate_areas | Yes | At least 1 area selected |
| team_size | Yes | Must match one of 3 enum values |
| industry | Yes | Must match dropdown options |
| revenue_range | Yes | Must match one of 5 enum values |
| marketing_spend | Yes | Must match one of 5 enum values |
| tools_used | Yes | At least 1 selection |
| tried_before | Yes | At least 1 selection |
| urgency | Yes | Integer 1-10 |
| source | Auto | Hardcoded by frontend |
| utm_* | Optional | Captured from URL params |

---

## Lead Scoring Formula (0-100)

### Component Breakdown

#### 1. Revenue Range (max 30 pts)

| Value | Points |
|---|---|
| ₹10Cr+ | 30 |
| ₹5-10Cr | 25 |
| ₹3-5Cr | 20 |
| ₹1-3Cr | 10 |
| ₹50L-1Cr | 5 |

#### 2. Team Size (max 15 pts)

| Value | Points |
|---|---|
| 10+ people | 15 |
| 4 to 10 people | 10 |
| 1 to 3 people | 5 |

#### 3. Urgency (max 20 pts)

Formula: `urgency_value × 2`

Example: urgency = 8 yields 16 pts.

#### 4. Marketing Spend (max 15 pts)

| Value | Points |
|---|---|
| ₹5L+ | 15 |
| ₹2L-5L | 12 |
| ₹50K-2L | 8 |
| Under ₹50K | 4 |
| ₹0 | 0 |

#### 5. Automation Areas Count (max 10 pts)

Count the comma-separated values in `automate_areas`:

| Count | Points |
|---|---|
| 5+ areas | 10 |
| 3-4 areas | 7 |
| 1-2 areas | 3 |

#### 6. Tools Sophistication (max 10 pts)

Evaluate `tools_used` comma-separated list:

| Condition | Points |
|---|---|
| Contains "CRM" or "ERP" | 10 |
| 2+ tools selected (excluding None) | 7 |
| Only "Excel" selected | 3 |
| "None" only | 0 |

**Total possible: 100 pts**

### Tag Assignment

| Score Range | Tag | Classification |
|---|---|---|
| 70-100 | `hot-lead` | Hot |
| 40-69 | `warm-lead` | Warm |
| 0-39 | `cool-lead` | Cool |

---

## n8n Workflow Design (6 Nodes)

### Node 1: Webhook Receive

- **Type:** Webhook
- **Method:** POST
- **Path:** `/zippyscale-quiz`
- **Authentication:** None (public endpoint)
- **Response mode:** Immediately respond with `{ "status": "ok", "message": "Received" }`
- **Output:** Full JSON payload passed downstream

### Node 2: Score Calculation (Code Node)

**Type:** Code (JavaScript)

```javascript
const data = $input.first().json;

// 1. Revenue score
const revenueMap = {
  '₹10Cr+': 30,
  '₹5-10Cr': 25,
  '₹3-5Cr': 20,
  '₹1-3Cr': 10,
  '₹50L-1Cr': 5
};
const revenueScore = revenueMap[data.revenue_range] || 0;

// 2. Team size score
const teamMap = {
  '10+ people': 15,
  '4 to 10 people': 10,
  '1 to 3 people': 5
};
const teamScore = teamMap[data.team_size] || 0;

// 3. Urgency score
const urgencyScore = Math.min(parseInt(data.urgency) * 2, 20);

// 4. Marketing spend score
const spendMap = {
  '₹5L+': 15,
  '₹2L-5L': 12,
  '₹50K-2L': 8,
  'Under ₹50K': 4,
  '₹0': 0
};
const spendScore = spendMap[data.marketing_spend] || 0;

// 5. Automation areas count
const areas = data.automate_areas.split(',').map(s => s.trim()).filter(Boolean);
let areasScore = 3;
if (areas.length >= 5) areasScore = 10;
else if (areas.length >= 3) areasScore = 7;

// 6. Tools sophistication
const tools = data.tools_used.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
let toolsScore = 0;
if (tools.includes('crm') || tools.includes('erp')) {
  toolsScore = 10;
} else if (tools.filter(t => t !== 'none').length >= 2) {
  toolsScore = 7;
} else if (tools.length === 1 && tools[0] === 'excel') {
  toolsScore = 3;
}

const totalScore = revenueScore + teamScore + urgencyScore + spendScore + areasScore + toolsScore;

// Tag assignment
let tag = 'cool-lead';
if (totalScore >= 70) tag = 'hot-lead';
else if (totalScore >= 40) tag = 'warm-lead';

return [{
  json: {
    ...data,
    lead_score: totalScore,
    lead_tag: tag,
    score_breakdown: {
      revenue: revenueScore,
      team: teamScore,
      urgency: urgencyScore,
      spend: spendScore,
      areas: areasScore,
      tools: toolsScore
    }
  }
}];
```

**Output:** Original payload + `lead_score`, `lead_tag`, `score_breakdown`

### Node 3: Tag Assignment (Set Node)

**Type:** Set
- Sets `lead_tag` as a top-level field for downstream branching
- Adds `scored_at` timestamp: `{{ $now.toISO() }}`

### Node 4: GHL Contact Create (HTTP Request)

**Type:** HTTP Request
**Method:** POST
**URL:** `https://services.leadconnectorhq.com/contacts/`
**Headers:**
- `Authorization: Bearer {{$credentials.ghlApiKey}}`
- `Content-Type: application/json`
- `Version: 2021-07-28`

**Body:**
```json
{
  "locationId": "DSK3kgZgwWoIRnAYf9uC",
  "firstName": "{{ $json.name.split(' ')[0] }}",
  "lastName": "{{ $json.name.split(' ').slice(1).join(' ') || '' }}",
  "email": "{{ $json.email }}",
  "phone": "+91{{ $json.phone }}",
  "companyName": "{{ $json.business_name }}",
  "tags": ["{{ $json.lead_tag }}", "automation-lp-v3"],
  "customFields": [
    { "key": "lead_score", "value": "{{ $json.lead_score }}" },
    { "key": "automation_areas", "value": "{{ $json.automate_areas }}" },
    { "key": "team_size", "value": "{{ $json.team_size }}" },
    { "key": "revenue_range", "value": "{{ $json.revenue_range }}" },
    { "key": "industry", "value": "{{ $json.industry }}" },
    { "key": "marketing_spend", "value": "{{ $json.marketing_spend }}" },
    { "key": "tools_used", "value": "{{ $json.tools_used }}" },
    { "key": "urgency_level", "value": "{{ $json.urgency }}" }
  ],
  "source": "automation-lp-v3",
  "pipelineId": "aTzYNdImLeTlbuaGyUEw",
  "pipelineStageId": "APPLIED_STAGE_ID"
}
```

**Note:** Replace `APPLIED_STAGE_ID` with the actual stage ID for "Applied" once created in GHL.

**Error handling:** On 409 (duplicate), use PUT to update existing contact instead.

### Node 5: AISensy WhatsApp Trigger (HTTP Request)

**Type:** HTTP Request
**Method:** POST
**URL:** `https://backend.aisensy.com/campaign/t1/api/v2`
**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "apiKey": "{{ $credentials.aisensyApiKey }}",
  "campaignName": "zs_audit_welcome",
  "destination": "91{{ $json.phone }}",
  "userName": "{{ $json.name }}",
  "templateParams": [
    "{{ $json.name.split(' ')[0] }}",
    "{{ $json.business_name }}",
    "{{ $json.lead_score }}"
  ]
}
```

This sends the immediate welcome message (Template 1 from the WhatsApp sequence).

### Node 6: Slack Notification (Conditional: Hot Leads Only)

**Type:** IF → Slack

**IF condition:** `{{ $json.lead_tag }}` equals `hot-lead`

**True branch → Slack Message:**
- **Channel:** `#hot-leads` (or `#zippyscale-leads`)
- **Message:**

```
:fire: *Hot Lead Alert* (Score: {{ $json.lead_score }}/100)

*Name:* {{ $json.name }}
*Business:* {{ $json.business_name }}
*Industry:* {{ $json.industry }}
*Revenue:* {{ $json.revenue_range }}
*Spend:* {{ $json.marketing_spend }}
*Team:* {{ $json.team_size }}
*Urgency:* {{ $json.urgency }}/10
*Areas:* {{ $json.automate_areas }}
*Tools:* {{ $json.tools_used }}
*Tried:* {{ $json.tried_before }}

*UTM:* {{ $json.utm_source }} / {{ $json.utm_medium }} / {{ $json.utm_campaign }}

<https://app.gohighlevel.com/v2/location/DSK3kgZgwWoIRnAYf9uC/contacts/smart_list/All|View in GHL>
```

**False branch:** No action (warm/cool leads do not trigger Slack).

---

## Workflow Diagram

```
[Webhook Receive]
       |
[Score Calculation]
       |
[Tag Assignment]
       |
[GHL Contact Create/Update]
       |
[AISensy WhatsApp Welcome]
       |
[IF hot-lead?]
  |         |
 Yes       No
  |         |
[Slack]   [End]
```

---

## Testing Checklist

1. POST a test payload to webhook URL with all fields populated
2. Verify score calculation matches manual calculation
3. Confirm GHL contact created with correct custom fields and tags
4. Confirm AISensy API returns 200 and WhatsApp message delivered
5. Confirm Slack notification fires only for score >= 70
6. Test edge cases: urgency = 1, urgency = 10, empty UTM fields
7. Test duplicate phone number handling (should update, not create duplicate)
8. Verify phone number normalization (+91 prefix, strip leading 0)

## Error Handling

- **Webhook timeout:** n8n responds immediately, processing is async
- **GHL API failure:** Retry 2x with 5s delay, then log to error channel in Slack
- **AISensy failure:** Retry 1x, log error. Do not block GHL creation
- **Slack failure:** Non-critical, log and continue
- **Invalid payload:** Return 400 with field-level error messages
