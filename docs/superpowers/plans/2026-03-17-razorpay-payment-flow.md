# Razorpay Payment Link + GHL Lead Capture Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture lead data in GHL FIRST, then redirect to Razorpay Payment Link. Tag paid customers differently.

**Architecture:** LP submits quiz → n8n webhook → GHL contact created → LP redirects to Razorpay Payment Link. Separate n8n workflow receives Razorpay payment webhook → finds contact by email → adds `paid-blueprint` tag.

**Tech Stack:** HTML/JS (LP), n8n workflows, GHL API, Razorpay Payment Links + Webhooks

---

## Task 1: Update LP Quiz Flow

**Files:**
- Modify: `index.html` (submitQuiz function, lines ~1433-1504)

- [ ] **Step 1: Replace submitQuiz() to capture lead THEN redirect to payment**
- [ ] **Step 2: Remove Razorpay SDK script tag**
- [ ] **Step 3: Update button text from "Pay ₹999" to "Get Blueprint → ₹999"**

## Task 2: Create n8n Razorpay Payment Webhook

**n8n workflow:** "Razorpay Payment → GHL Tag"
- Webhook trigger: POST /razorpay-payment
- Code: Extract email/phone from Razorpay payload
- HTTP: Search GHL contact by email
- HTTP: Add `paid-blueprint` tag
- Respond OK

## Task 3: Razorpay Dashboard Setup (manual)

Sandy configures in Razorpay Dashboard:
- Settings → Webhooks → Add
- URL: `https://sandyautomations.app.n8n.cloud/webhook/razorpay-payment`
- Event: `payment_link.paid`
- Secret: (note it for webhook verification)
