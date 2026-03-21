# Stape Server-Side Tracking Setup Guide

Server-side tracking for ZippyScale landing page. Routes GA4 and Meta CAPI events through a first-party domain to improve data accuracy, bypass ad blockers, and maintain attribution fidelity.

---

## Step 1: Create Stape.io Account + Server Container

1. Go to [stape.io](https://stape.io) and sign up
2. Choose the **Pro plan** ($20/mo, handles up to 10M requests/month, more than enough)
3. Click **Create Container**
4. Settings:
   - **Container name:** `zippyscale-sgtm`
   - **Server location:** Mumbai (ap-south-1) for lowest latency to Indian users
   - **Container type:** Google Tag Manager Server-Side
5. Stape will provision a server-side GTM container and give you:
   - **Server container URL** (e.g., `https://sgtm-xxxxx.stape.io`)
   - **GTM Server Container ID** (e.g., `GTM-XXXXXXX`)
6. Save both values. You'll need them in later steps.

---

## Step 2: Set Up Custom Domain

Route tracking through a first-party subdomain to avoid ad blockers and improve cookie accuracy.

### Option A: data.zippyscale.in (Recommended)

1. In Stape dashboard, go to **Container → Custom Domain**
2. Enter: `data.zippyscale.in`
3. Stape will provide DNS records to add. Typically:
   - **CNAME record:** `data` → `sgtm-xxxxx.stape.io`
4. Go to your DNS provider (wherever zippyscale.in is managed):
   - Add CNAME record: `data` pointing to `sgtm-xxxxx.stape.io`
   - TTL: 300 (5 minutes)
5. Wait for DNS propagation (usually 5-30 minutes)
6. Back in Stape, click **Verify Domain**
7. Stape auto-provisions SSL via Let's Encrypt

### Verification

```bash
curl -I https://data.zippyscale.in/healthy
```

Expected response: `HTTP/2 200` with `x-]stape` header.

### Option B: t.zippyscale.in (Alternative)

Same steps as above, just use `t` as the subdomain. Shorter URL but less descriptive.

---

## Step 3: Configure Server-Side GA4 Tag

### 3a: Set Up GTM Server Container

1. Go to [tagmanager.google.com](https://tagmanager.google.com)
2. You should see your server container (created by Stape). If not:
   - Click **Create Container**
   - Name: `ZippyScale Server`
   - Target platform: **Server**
3. Open the server container

### 3b: Create GA4 Client

1. In server container, go to **Clients**
2. Click **New → GA4 Client** (built-in)
3. Configure:
   - **Client name:** `GA4 Client`
   - Leave default path: `/g/collect`
   - Check: **Set cookie on the incoming HTTP request's domain** (enables first-party cookies)
4. Save

### 3c: Create GA4 Server-Side Tag

1. Go to **Tags → New**
2. Tag type: **Google Analytics: GA4**
3. Configure:
   - **Measurement ID:** Your GA4 measurement ID (e.g., `G-XXXXXXXXXX`)
   - **Event name:** `{{Event Name}}` (pass through from client)
   - Check: **Send to Google Analytics**
4. Trigger: **All Pages** (or create custom trigger matching GA4 client)
5. Save

### 3d: GA4 Measurement Protocol (for server-side events from n8n)

For sending conversion events directly from n8n (e.g., when a lead is qualified):

**Endpoint:** `POST https://www.google-analytics.com/mp/collect?measurement_id=G-XXXXXXXXXX&api_secret=YOUR_API_SECRET`

**Get API Secret:**
1. GA4 Admin → Data Streams → Your stream → Measurement Protocol API secrets
2. Create a new secret, name it `n8n-server-events`
3. Copy the secret value

**Example n8n HTTP Request for a conversion event:**

```json
{
  "client_id": "{{ $json.email }}",
  "events": [
    {
      "name": "generate_lead",
      "params": {
        "lead_score": "{{ $json.lead_score }}",
        "revenue_range": "{{ $json.revenue_range }}",
        "source": "automation-lp-v3"
      }
    }
  ]
}
```

---

## Step 4: Configure Meta Conversions API (CAPI) Server-Side Tag

### 4a: Get Meta Credentials

1. Go to [business.facebook.com](https://business.facebook.com) → Events Manager
2. Select the ZippyScale pixel
3. Go to **Settings**
4. Note your **Pixel ID** (e.g., `123456789`)
5. Generate an **Access Token**:
   - Scroll to "Conversions API" section
   - Click **Generate Access Token**
   - Copy and save securely (you won't see it again)

### 4b: Install Meta CAPI Tag in Server GTM

1. In your GTM server container, go to **Tags → New**
2. Search Community Template Gallery for **"Facebook Conversions API"** by Stape
   - Or use the official Meta tag if available
3. Install the Stape Facebook CAPI tag
4. Configure:
   - **API Access Token:** Paste the token from step 4a
   - **Pixel ID:** Your pixel ID
   - **Action source:** `website`
   - **Event name mapping:**
     - `page_view` → `PageView`
     - `quiz_start` → `InitiateCheckout` (or custom `QuizStart`)
     - `quiz_complete` → `Lead`
     - `book_call` → `Schedule` (or custom `BookCall`)
   - **User data parameters:**
     - Email: `{{Email}}` (hashed automatically)
     - Phone: `{{Phone}}` (hashed automatically)
     - First name: `{{First Name}}`
     - Country: `IN` (hardcoded)
     - Client IP: `{{Client IP}}`
     - User Agent: `{{User Agent}}`
     - FBC: `{{FBC Cookie}}` (Facebook click ID)
     - FBP: `{{FBP Cookie}}` (Facebook browser ID)
5. Trigger: Create triggers matching each event type
6. Save

### 4c: Event Deduplication

Critical to avoid double-counting (browser pixel + server CAPI):

1. In every event sent from the browser, include an `event_id` parameter:
   ```javascript
   // In your web GTM dataLayer push
   dataLayer.push({
     event: 'quiz_complete',
     event_id: crypto.randomUUID(), // unique per event
     user_data: {
       email: userEmail,
       phone: userPhone
     }
   });
   ```
2. The same `event_id` must be passed to both:
   - Browser pixel (via web GTM)
   - Server CAPI tag (via server GTM)
3. Meta will automatically deduplicate events with the same `event_id` + `event_name`

---

## Step 5: GTM Web Container to Stape Transport

### 5a: Update Web GTM Container

1. Open your **web** GTM container (the one on zippyscale.in)
2. Go to **Tags** and find your existing GA4 Configuration tag

### 5b: Route GA4 Through Server Container

1. Edit the GA4 Configuration tag
2. Under **Tag Configuration → Send to:**
   - Change **Transport URL** to: `https://data.zippyscale.in`
   - This routes all GA4 hits through your server container
3. Under **Fields to Set**, add:
   - `server_container_url` = `https://data.zippyscale.in`
4. Save

### 5c: Route Meta Pixel Through Server Container

1. If using the standard Meta Pixel base code, you need to modify it to send through the server:
   - Replace the pixel base code's endpoint
   - Or better: use GTM's built-in Meta Pixel tag and configure it to send data via your GA4 transport (the server container will handle conversion to CAPI)

2. **Recommended approach:** Use the Stape "Data Tag" in web GTM:
   - Install **Stape Data Tag** from Community Template Gallery in web GTM
   - Configure it to send events to `https://data.zippyscale.in/data`
   - Map all relevant events (PageView, QuizStart, Lead, etc.)
   - The server container's CAPI tag picks these up automatically

### 5d: Set Up Event Tags in Web GTM

Create these event tags in web GTM:

| Tag Name | Trigger | Event Name | Key Parameters |
|---|---|---|---|
| GA4 - Page View | All Pages | page_view | page_location, page_title |
| GA4 - Quiz Start | Custom Event: quiz_start | quiz_start | event_id |
| GA4 - Quiz Step | Custom Event: quiz_step | quiz_step | step_number, step_name, event_id |
| GA4 - Quiz Complete | Custom Event: quiz_complete | quiz_complete | lead_score, revenue_range, event_id |
| GA4 - Book Call | Custom Event: book_call | book_call | event_id |

All GA4 tags should use the same server container transport URL.

---

## Step 6: Testing + Validation

### 6a: Server Container Preview Mode

1. In GTM server container, click **Preview**
2. This opens Tag Assistant for server-side
3. Keep this open while testing

### 6b: Web Container Preview Mode

1. In GTM web container, click **Preview**
2. Navigate to `https://zippyscale.in` in the preview browser
3. Complete the quiz flow

### 6c: Validate GA4 Hits

1. Check Tag Assistant (server) for incoming GA4 requests
2. Verify the GA4 tag fires with correct measurement ID
3. In GA4, go to **Admin → DebugView**
4. Confirm events appear: `page_view`, `quiz_start`, `quiz_complete`
5. Check that events have correct parameters

### 6d: Validate Meta CAPI

1. Go to **Events Manager → Test Events**
2. Enter your server URL or use the test event code
3. Complete the quiz flow
4. Verify events appear in Events Manager with:
   - "Server" badge (not just "Browser")
   - Event Match Quality score (aim for 6+)
   - Correct deduplication (no double-counted events)

### 6e: Validate First-Party Cookies

1. Open browser DevTools on zippyscale.in
2. Go to **Application → Cookies**
3. Verify `_ga` and `_fbp` cookies are set on `.zippyscale.in` domain (not a third-party domain)
4. These should have an expiry of 2 years (GA) and 90 days (Meta)

### 6f: Test Ad Blocker Bypass

1. Enable an ad blocker (uBlock Origin)
2. Navigate to zippyscale.in
3. Check Network tab: requests to `data.zippyscale.in` should still go through
4. Verify GA4 events still register in DebugView

### 6g: End-to-End Validation Checklist

| Test | Expected Result | Status |
|---|---|---|
| Page view fires on load | GA4 + Meta PageView in server container | [ ] |
| Quiz start event | quiz_start in GA4 DebugView | [ ] |
| Quiz completion | Lead event in Meta Events Manager (server) | [ ] |
| Deduplication | Same event_id not counted twice | [ ] |
| First-party cookies | .zippyscale.in domain cookies | [ ] |
| Ad blocker bypass | Events still fire with uBlock enabled | [ ] |
| n8n server event | generate_lead in GA4 via Measurement Protocol | [ ] |
| Custom domain SSL | https://data.zippyscale.in loads with valid cert | [ ] |

---

## Environment Variables / Secrets to Store

Keep these in a secure location (not in code):

| Secret | Where Used | Notes |
|---|---|---|
| GA4 Measurement ID | Web GTM, Server GTM | `G-XXXXXXXXXX` |
| GA4 API Secret | n8n (Measurement Protocol) | For server-side events |
| Meta Pixel ID | Server GTM CAPI tag | `123456789` |
| Meta Access Token | Server GTM CAPI tag | Generate in Events Manager |
| Stape Container URL | Web GTM transport | `https://data.zippyscale.in` |
| GTM Server Container ID | Stape dashboard | `GTM-XXXXXXX` |

---

## Cost Estimate

| Component | Cost | Notes |
|---|---|---|
| Stape Pro | $20/month | Up to 10M requests |
| Custom domain | Free | Just DNS config |
| GTM | Free | Web + Server containers |
| GA4 | Free | Standard tier |
| Meta CAPI | Free | Part of Business Manager |
| **Total** | **$20/month** | |

---

## Maintenance

- **Monthly:** Check Stape dashboard for error rates (aim for < 0.1%)
- **Quarterly:** Verify Meta Event Match Quality score (aim for 6+)
- **On pixel/tag changes:** Always test in preview mode before publishing
- **SSL renewal:** Automatic via Stape/Let's Encrypt, but verify cert expiry quarterly
