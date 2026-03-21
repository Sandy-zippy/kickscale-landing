# AISensy WhatsApp Sequence for ZippyScale Automation Audit

## Overview

5-message drip sequence triggered after quiz submission. Sent via AISensy API using pre-approved WhatsApp Business templates. Each message has trigger conditions and skip logic to avoid spamming engaged leads.

**AISensy API endpoint:** `POST https://backend.aisensy.com/campaign/t1/api/v2`

---

## Template 1: Welcome + Waitlist Confirmation

**Trigger:** Immediately on quiz submission (t=0)
**Template name:** `zs_audit_welcome`
**Category:** UTILITY

**Header:** TEXT
```
Audit Request Received
```

**Body:**
```
Hi {{1}},

Your automation audit for {{2}} is confirmed. You're #{{3}} in our current review queue.

Here's what happens next:
1. Our team reviews your business profile
2. We identify your top 3 automation opportunities
3. You get a personalized report within 48 hours

Your lead score: {{4}}/100. The higher it is, the faster we prioritize your audit.
```

**Variables:**
- `{{1}}` = First name
- `{{2}}` = Business name
- `{{3}}` = Waitlist number (sequential counter from GHL or n8n)
- `{{4}}` = Lead score

**Footer:**
```
ZippyScale | Attribution-First Growth Marketing
```

**CTA Buttons:**
1. URL: "View Our Work" → `https://zippyscale.in/playbook`

**Trigger conditions:**
- Always send on quiz completion
- Phone number must be valid 10-digit Indian mobile

**Skip conditions:**
- None (always sends)

---

## Template 2: Review Summary + Automation Opportunities

**Trigger:** 24 hours after Template 1
**Template name:** `zs_audit_review`
**Category:** MARKETING

**Header:** TEXT
```
Your Audit Preview is Ready
```

**Body:**
```
Hi {{1}},

We've done an initial review of {{2}}. Based on what you told us, here are the areas where automation can save you time and money:

Areas you want to automate: {{3}}

Your current tools: {{4}}

Quick insight: Businesses in {{5}} with your team size typically save 15-20 hours/week after automating just 2-3 of these areas.

Want to see the full breakdown? Reply "YES" and we'll fast-track your detailed audit.
```

**Variables:**
- `{{1}}` = First name
- `{{2}}` = Business name
- `{{3}}` = Automation areas (from quiz)
- `{{4}}` = Tools used (from quiz)
- `{{5}}` = Industry

**Footer:**
```
Reply STOP to unsubscribe
```

**CTA Buttons:**
1. QUICK_REPLY: "Yes, show me"
2. QUICK_REPLY: "Not now"

**Trigger conditions:**
- 24 hours elapsed since Template 1
- Lead has not already replied to Template 1
- Lead has not booked a call

**Skip conditions:**
- Skip if lead replied to Template 1 (they're already engaged, handle via live chat)
- Skip if lead has booked an audit call in GHL

---

## Template 3: Engagement Nudge

**Trigger:** 48 hours after Template 1 (24 hours after Template 2)
**Template name:** `zs_audit_nudge`
**Category:** MARKETING

**Header:** TEXT
```
Quick Question, {{1}}
```

**Body:**
```
Hi {{1}},

One question that helps us build a better audit for you:

What's the ONE task in {{2}} that eats up the most time every week?

Just type it out. Even a one-line answer helps us pinpoint exactly where to start.

Most of our clients say it's either:
- Manual follow-ups with leads
- Reporting and data entry
- Coordinating between team members

What's yours?
```

**Variables:**
- `{{1}}` = First name
- `{{2}}` = Business name

**Footer:**
```
Reply STOP to unsubscribe
```

**CTA Buttons:**
None (encourage free-text reply)

**Trigger conditions:**
- 48 hours elapsed since Template 1
- Lead has not replied to any previous template
- Lead has not booked a call

**Skip conditions:**
- Skip if lead replied to Template 1 or 2
- Skip if lead has booked an audit call
- Skip if lead score < 20 (very low intent, don't push)

---

## Template 4: Industry Case Study

**Trigger:** Day 5 after Template 1
**Template name:** `zs_audit_casestudy`
**Category:** MARKETING

**Header:** IMAGE
Upload a branded case study card (1024x512px) to AISensy media library. Use the ZippyScale lime (#D5EB4B) branded template.

**Body:**
```
Hi {{1}},

Here's something relevant for {{2}}:

We helped a {{3}} business automate their {{4}} workflow. Results after 60 days:

- 22 hours/week saved on manual tasks
- 3.2x faster lead response time
- 40% reduction in missed follow-ups

The best part? Setup took under 2 weeks.

Your audit is still waiting. Want us to walk you through what this could look like for {{2}}?
```

**Variables:**
- `{{1}}` = First name
- `{{2}}` = Business name
- `{{3}}` = Industry (matched to their quiz answer)
- `{{4}}` = Primary automation area (first item from their automate_areas)

**Footer:**
```
Reply STOP to unsubscribe
```

**CTA Buttons:**
1. URL: "Book Your Audit Call" → `https://zippyscale.in/book` (or GHL booking link)
2. QUICK_REPLY: "Tell me more"

**Trigger conditions:**
- Day 5 after Template 1
- Lead has not booked a call
- Lead has not replied "stop" or unsubscribed

**Skip conditions:**
- Skip if audit already delivered
- Skip if lead booked a call
- Skip if lead replied to Template 3 (they're engaged, handle via live chat)

---

## Template 5: Final Urgency + Booking

**Trigger:** Day 7 after Template 1
**Template name:** `zs_audit_final`
**Category:** MARKETING

**Header:** TEXT
```
Last Call, {{1}}
```

**Body:**
```
Hi {{1}},

Your automation audit for {{2}} has been sitting in our queue for 7 days. We keep audit slots limited to maintain quality, and yours expires in 48 hours.

After that, you'd need to re-apply and wait for the next batch.

If you're still interested, book your 30-min audit call now. We'll walk through your personalized automation roadmap live.

No pitch. No pressure. Just a clear plan for what to automate first.
```

**Variables:**
- `{{1}}` = First name
- `{{2}}` = Business name

**Footer:**
```
Reply STOP to unsubscribe
```

**CTA Buttons:**
1. URL: "Book Audit Call" → `https://zippyscale.in/book`
2. QUICK_REPLY: "Not interested"

**Trigger conditions:**
- Day 7 after Template 1
- Lead has not booked a call
- Lead has not replied "stop" or unsubscribed
- Lead score >= 30 (don't waste urgency on very cold leads)

**Skip conditions:**
- Skip if audit already delivered
- Skip if lead booked a call
- Skip if lead explicitly replied "not interested" or "stop" at any point

---

## n8n Scheduling Implementation

The drip sequence requires scheduled triggers. Two approaches:

### Option A: n8n Cron + GHL Query (Recommended)

Create a separate n8n workflow with a Cron trigger that runs every hour:

1. **Cron node:** Runs hourly
2. **GHL API call:** Query contacts with tag `automation-lp-v3` and filter by `created_at` timestamps
3. **Code node:** For each contact, determine which template is due based on elapsed time
4. **IF branches:** Route to correct AISensy API call
5. **GHL update:** Mark which templates have been sent (use a custom field `whatsapp_step` with values 1-5)

### Option B: n8n Wait Nodes

In the main quiz workflow, after Template 1 sends, use n8n Wait nodes:
- Wait 24h → Send Template 2
- Wait 24h → Send Template 3
- Wait 72h → Send Template 4
- Wait 48h → Send Template 5

**Downside:** Wait nodes hold executions open. For high volume, Option A is better.

---

## GHL Custom Field for Sequence Tracking

**Field name:** `whatsapp_step`
**Type:** Number
**Values:**
- 0 = Not started
- 1 = Welcome sent
- 2 = Review sent
- 3 = Nudge sent
- 4 = Case study sent
- 5 = Final urgency sent
- 99 = Opted out / unsubscribed

---

## AISensy Template Submission Checklist

Before templates go live, they need Meta approval via AISensy dashboard:

1. [ ] Submit `zs_audit_welcome` (UTILITY) for approval
2. [ ] Submit `zs_audit_review` (MARKETING) for approval
3. [ ] Submit `zs_audit_nudge` (MARKETING) for approval
4. [ ] Submit `zs_audit_casestudy` (MARKETING) for approval
5. [ ] Upload case study header image to AISensy media library
6. [ ] Submit `zs_audit_final` (MARKETING) for approval
7. [ ] Test each template with a personal number after approval
8. [ ] Verify variable substitution works correctly
9. [ ] Confirm CTA button URLs resolve correctly

**Approval timeline:** UTILITY templates typically approve in 1-2 hours. MARKETING templates can take 24-48 hours. Submit all at once.
