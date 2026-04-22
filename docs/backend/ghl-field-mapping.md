# GHL Field Mapping: AI Automation Audit Funnel

**Location:** DSK3kgZgwWoIRnAYf9uC
**Pipeline:** aTzYNdImLeTlbuaGyUEw (Zippy Sales)
**PIT Token:** pit-add82ec0-12f5-4e34-9e2f-e636dadce75c
**API Endpoint:** https://zippyscale-api.vercel.app/api/quiz
**Last Updated:** 2026-03-22

---

## Custom Fields

### Pre-existing Fields

| Field Name | ID | Data Type | Field Key |
|---|---|---|---|
| Lead Score | `i00K84Mmu7UH9uJ13UlR` | NUMERICAL | contact.lead_score |
| Contact Industry | `1G1IrP5TC05vSCjuWIXl` | SINGLE_OPTIONS | contact.contact_industry |
| Company Revenue | `Fa51cUFvQRgvjArrlBLW` | SINGLE_OPTIONS | contact.company_revenue |
| Product Interest | `vBPxrZErtM43uEBY4eyu` | TEXT | contact.product_interest |
| Lead Source | `U4lCawFkdTlKGUFMACdU` | SINGLE_OPTIONS | contact.lead_source |

### New Fields (Created 2026-03-22)

| Field Name | ID | Data Type | Field Key |
|---|---|---|---|
| Automation Areas | `3kFfjrcLQjoHsiXhRhOA` | LARGE_TEXT | contact.automation_areas |
| Team Size | `twNXt510xQEyd4LLq1A8` | SINGLE_OPTIONS | contact.team_size |
| Marketing Spend | `BBRVKcf4Dy0wemsmFfm2` | SINGLE_OPTIONS | contact.marketing_spend |
| Tools Used | `UjJgqly3N24YlcUAw3t6` | LARGE_TEXT | contact.tools_used |
| Tried Before | `sKrHEKiNfbL37kLZ9DzT` | LARGE_TEXT | contact.tried_before |
| Urgency Level | `S8HJ8VDg0xJmL5synnCL` | NUMERICAL | contact.urgency_level |
| Awareness Level | `IcU2GqKV41bDHXcUcfEU` | SINGLE_OPTIONS | contact.awareness_level |
| Quiz Source | `r7eqW0tqsmOfDp1r6hj2` | TEXT | contact.quiz_source |

### Picklist Options

**Team Size:** 1 to 3 people, 4 to 10 people, 10+ people

**Marketing Spend:** ₹0, Under ₹50K, ₹50K-2L, ₹2L-5L, ₹5L+

**Awareness Level:** unaware, problem-aware, solution-aware, product-aware, brand-aware

**Contact Industry:** Healthcare, Real Estate, D2C, SaaS, B2B, Education, Other, FMCG

**Company Revenue:** Below 50L, 50L-2Cr, 2Cr-10Cr, 10Cr-50Cr, 50Cr+

**Lead Source:** Website, Referral, Social, Ads, Outbound, Event, Other

---

## Pipeline Stage Mapping (Zippy Sales)

| Stage Name | Stage ID | Audit Funnel Role |
|---|---|---|
| Warm leads | `b06d3ff1-f951-4cfb-9f9b-7606b3a18ee0` | New Lead (quiz submission entry point) |
| Contacted | `7b3ef7c2-e8d2-4a1f-94a4-66161a599473` | Contacted (first outreach done) |
| Discovery Meet Done | `e8014442-2913-4db0-b526-7cbd205f90f5` | Qualified (discovery call completed) |
| Pitch Meet Done | `cdffd1f6-39c8-4259-9e97-9b269b07f937` | Audit Scheduled |
| Closed | `a7602281-01ac-4104-8c78-651852387365` | Audit Delivered |
| Onboarding | `73f95e2b-37aa-4895-88dd-ff0d02f2800d` | Audit Sent (report delivered) |
| Client | `723dabce-fe7e-498a-bc5c-afb4237a45b0` | Execution Proposed |
| Negotiation | `12a805b0-e455-4283-b838-ddd18d7d41b0` | Negotiation |
| Lost | `391156ac-3836-46a9-b494-6bf2175da79e` | Closed Lost |
| No Response | `0322cb3e-af36-4a93-8172-2005cd9b41ce` | No Response |
| Not Potential | `6dba1aba-cccc-42e1-a86d-4a0bdabf5092` | Not Potential |

---

## Tags

| Tag | Purpose |
|---|---|
| audit-waitlist | All quiz submissions |
| hot-lead | Lead score >= 70 |
| warm-lead | Lead score 40-69 |
| cool-lead | Lead score < 40 |
| automation-lp-v3 | Source: automation landing page v3 |
| manufacturing | Industry tag (auto-generated from quiz) |
| healthcare | Industry tag |
| it-software | Industry tag |
| education | Industry tag |
| real-estate | Industry tag |
| retail-e-commerce | Industry tag |

---

## Lead Scoring (quiz.js)

| Signal | Values & Points |
|---|---|
| Revenue Range | ₹10Cr+: 30, ₹5Cr-10Cr: 25, ₹3Cr-5Cr: 20, ₹1Cr-3Cr: 10, ₹50L-1Cr: 5 |
| Team Size | 10+: 15, 4-10: 10, 1-3: 5 |
| Urgency | urgency * 2, max 20 |
| Marketing Spend | ₹5L+: 15, ₹2L-5L: 12, ₹50K-2L: 8, Under ₹50K: 4, ₹0: 0 |
| Automation Areas | 5+ areas: 10, 3-4: 7, 1-2: 3 |
| Tools Used | CRM/ERP: 10, 3+ tools: 7, Excel/Tally: 3 |
| **Max Score** | **100** |

---

## Test Results (2026-03-22)

**Test Contact:**
- Name: GHL Test Lead
- Email: ghltest@zippyscale.com
- Contact ID: `drU1dj5WNoGjlOJ3Cmtc`
- Opportunity ID: `GZV1WK6YT6f2g4tbfwgx`
- Lead Score: 82/100 (hot-lead)
- All 13 custom fields populated correctly
- Tags applied: automation-lp-v3, audit-waitlist, hot-lead, manufacturing
- Meta CAPI: event received (fbtrace_id: AnJgUNJ1HOm6PkxRtHcnFTl)
- Pipeline stage: Warm leads (entry point)
- Notes added with full quiz data

**Status: PASS** - Full end-to-end flow verified.
