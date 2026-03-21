# GHL Pipeline Configuration for ZippyScale Automation Funnel

## Reference IDs

- **Location ID:** `DSK3kgZgwWoIRnAYf9uC`
- **Pipeline ID:** `aTzYNdImLeTlbuaGyUEw`

---

## Custom Fields to Create

Navigate to **Settings → Custom Fields** in the ZippyScale GHL location.

| Field Name | Field Key | Type | Options / Notes |
|---|---|---|---|
| Lead Score | `lead_score` | Number | Range 0-100, populated by n8n |
| Automation Areas | `automation_areas` | Multi-line Text | Comma-separated from quiz |
| Team Size | `team_size` | Dropdown | `1 to 3 people`, `4 to 10 people`, `10+ people` |
| Revenue Range | `revenue_range` | Dropdown | `₹50L-1Cr`, `₹1-3Cr`, `₹3-5Cr`, `₹5-10Cr`, `₹10Cr+` |
| Industry | `industry` | Dropdown | `E-commerce`, `SaaS`, `Real Estate`, `Healthcare`, `Education`, `Manufacturing`, `Professional Services`, `Retail`, `Hospitality`, `Other` |
| Marketing Spend | `marketing_spend` | Dropdown | `₹0`, `Under ₹50K`, `₹50K-2L`, `₹2L-5L`, `₹5L+` |
| Tools Used | `tools_used` | Multi-line Text | Comma-separated from quiz |
| Urgency Level | `urgency_level` | Number | Range 1-10 |
| Awareness Level | `awareness_level` | Dropdown | `unaware`, `problem-aware`, `solution-aware`, `brand-aware` |
| Visit Count | `visit_count` | Number | Incremented by tracking pixel/GTM |
| WhatsApp Step | `whatsapp_step` | Number | 0-5 (sequence tracking), 99 = opted out |
| Tried Before | `tried_before` | Multi-line Text | Comma-separated from quiz |
| UTM Source | `utm_source` | Single-line Text | From URL params |
| UTM Medium | `utm_medium` | Single-line Text | From URL params |
| UTM Campaign | `utm_campaign` | Single-line Text | From URL params |

### Steps to Create Each Field

1. Go to **Settings → Custom Fields → Contact**
2. Click **Add Field**
3. Select the appropriate field type
4. Enter the field name exactly as listed above
5. For Dropdown fields, add all options in order
6. Save and note the field ID (needed for API calls)

After creation, update the n8n webhook workflow with the actual GHL field IDs. The field IDs will look like: `contact.custom_field_name` or a UUID.

---

## Pipeline Stages

**Pipeline:** ZippyScale Sales Pipeline (`aTzYNdImLeTlbuaGyUEw`)

Create/update stages in this exact order:

| Order | Stage Name | Description | Auto-Move Trigger |
|---|---|---|---|
| 1 | **Applied** | Quiz submitted, awaiting review | Auto on webhook |
| 2 | **Reviewed** | Audit review completed, report sent | Manual or after Template 2 sent |
| 3 | **Qualified** | Lead score >= 40 and engaged (replied or clicked) | Auto when lead replies to WhatsApp |
| 4 | **Audit Scheduled** | Discovery/audit call booked | Auto on calendar booking |
| 5 | **Audit Delivered** | Audit walkthrough completed on call | Manual by Sandy/Bhargav |
| 6 | **Execution Proposed** | Proposal/SOW sent | Manual |
| 7 | **Won** | Deal closed, onboarding started | Manual |
| 8 | **Lost** | Did not convert | Manual, with lost reason required |

### Stage Configuration Steps

1. Go to **Opportunities → Pipelines**
2. Select the ZippyScale pipeline
3. Add/rename stages to match the above
4. Set stage order by dragging
5. For "Lost" stage, enable **Lost Reason** requirement

---

## Tags

Create these tags in **Settings → Tags**:

| Tag | Applied When |
|---|---|
| `hot-lead` | Lead score >= 70 |
| `warm-lead` | Lead score 40-69 |
| `cool-lead` | Lead score < 40 |
| `automation-lp-v3` | All quiz submissions from this LP version |
| `replied-whatsapp` | Lead replied to any WhatsApp template |
| `booked-audit` | Lead booked an audit call |
| `audit-delivered` | Audit completed and report sent |
| `nurture-sequence` | In WhatsApp drip sequence |

---

## GHL Workflow Automations

Create these automations in **Automation → Workflows**.

### Automation 1: Hot Lead Alert

**Trigger:** Contact tag added = `hot-lead`

**Actions:**
1. **Internal notification** to Sandy and Bhargav (email + GHL app notification)
2. **Send webhook** to Slack via n8n (fires the Slack node from the main workflow)
3. **Add to Smart List:** "Hot Leads - Immediate Follow-up"
4. **Create task:** "Call hot lead within 2 hours" assigned to Bhargav, due in 2 hours

**Conditions:**
- Contact source = `automation-lp-v3`

### Automation 2: Warm Lead Nurture

**Trigger:** Contact tag added = `warm-lead`

**Actions:**
1. **Add tag:** `nurture-sequence`
2. **Wait 24 hours** (handled by n8n, not GHL, but tag marks eligibility)
3. **Add to Smart List:** "Warm Leads - Nurture"

**Conditions:**
- Contact source = `automation-lp-v3`

### Automation 3: Cool Lead Long-Term Nurture

**Trigger:** Contact tag added = `cool-lead`

**Actions:**
1. **Add to Smart List:** "Cool Leads - Long Term"
2. **No WhatsApp sequence** beyond Template 1 (welcome only)
3. **Add to email nurture** (monthly value email, if/when set up)

**Conditions:**
- Contact source = `automation-lp-v3`

### Automation 4: Booking Confirmation Handler

**Trigger:** Calendar event created (ZippyScale Audit Calendar)

**Actions:**
1. **Move opportunity** to "Audit Scheduled" stage
2. **Add tag:** `booked-audit`
3. **Remove tag:** `nurture-sequence` (stop drip)
4. **Update custom field:** `whatsapp_step` = 99 (stop WhatsApp sequence)
5. **Notify Sandy + Bhargav** via internal notification
6. **Send webhook** to n8n to cancel any pending WhatsApp sends

### Automation 5: Stale Lead Cleanup

**Trigger:** Time-based, 30 days after entering "Applied" stage with no activity

**Actions:**
1. **IF** no reply, no booking, no engagement:
   - Move to "Lost" stage
   - Set lost reason: "No response after 30 days"
2. **IF** lead replied but didn't book:
   - Keep in current stage
   - Add tag: `needs-manual-followup`
   - Create task for Bhargav: "Follow up with stale lead"

---

## Smart Lists

Create these Smart Lists for quick filtering:

| Smart List Name | Filter Criteria |
|---|---|
| Hot Leads - Immediate | Tag = `hot-lead` AND Stage != Lost/Won |
| Warm Leads - Nurture | Tag = `warm-lead` AND Stage != Lost/Won |
| Cool Leads - Long Term | Tag = `cool-lead` AND Stage != Lost/Won |
| Audit Booked - Pending | Stage = "Audit Scheduled" |
| This Week's Submissions | Created in last 7 days AND tag = `automation-lp-v3` |
| High Revenue Leads | Revenue Range IN (`₹5-10Cr`, `₹10Cr+`) |
| No Response 7+ Days | Tag = `automation-lp-v3` AND WhatsApp Step >= 5 AND Tag != `replied-whatsapp` |

---

## Calendar Setup

Create an "Audit Call" calendar in GHL:

- **Name:** ZippyScale Automation Audit
- **Duration:** 30 minutes
- **Availability:** Mon-Fri, 10 AM - 6 PM IST
- **Buffer:** 15 minutes between appointments
- **Booking link:** Use as CTA in WhatsApp templates
- **Confirmation:** Auto-send WhatsApp confirmation via AISensy
- **Reminder:** 1 hour before via WhatsApp, 24 hours before via email
- **Assigned to:** Sandy (primary), Bhargav (overflow)

---

## Implementation Checklist

1. [ ] Create all custom fields in GHL (14 fields)
2. [ ] Note down field IDs and update n8n webhook workflow
3. [ ] Create/update pipeline stages (8 stages)
4. [ ] Create all tags (8 tags)
5. [ ] Build Automation 1: Hot Lead Alert
6. [ ] Build Automation 2: Warm Lead Nurture
7. [ ] Build Automation 3: Cool Lead Long-Term
8. [ ] Build Automation 4: Booking Confirmation
9. [ ] Build Automation 5: Stale Lead Cleanup
10. [ ] Create Smart Lists (7 lists)
11. [ ] Set up Audit Call calendar
12. [ ] Test end-to-end: quiz submit → GHL contact → correct tags → correct stage → notifications fire
13. [ ] Verify duplicate handling (same phone/email submits twice)
