# Meta Conversions API (CAPI) Audit Report

**Date:** 2026-03-22
**Auditor:** Claude (automated)
**Endpoint:** `https://zippyscale-api.vercel.app/api/quiz`

---

## 1. Token Validity: PASS

- Pixel ID: `961643772929674` (correct)
- Access token: starts with `EAAUuthVyuKI...` (correct, valid)
- Graph API version: `v21.0` (correct)
- Direct API test returned `events_received: 1` with no errors

## 2. Event Delivery: PASS

- Quiz endpoint test returned:
  - `success: true`
  - `capi.events_received: 1`
  - `ghl: "ok"`
  - No error messages
- `fbtrace_id` confirmed by Meta (event accepted and processed)

## 3. Event Deduplication: FIXED (was FAIL)

**Issue found:** The client-side Meta Pixel `Lead` event was NOT passing `eventID`, making it impossible for Meta to deduplicate browser pixel events against server CAPI events. This causes double-counting of conversions.

**Root cause:**
- `QuizForm.tsx` called `trackQuizSubmit({ lead_source: 'automation-lp-v3' })` without the `event_id`
- `tracking.ts` fired `fbq('track', 'Lead', {...})` without the 4th argument `{ eventID }`

**Fix applied:**
- `QuizForm.tsx`: Now passes `event_id: payload.event_id` to `trackQuizSubmit()`
- `tracking.ts`: Now extracts `event_id` from data and passes `{ eventID: eventId }` as the 4th argument to `fbq('track', 'Lead', ...)`
- The same `event_id` (e.g. `lead_1711094400000_a1b2c3`) is now sent to both the browser pixel and the server CAPI, enabling proper deduplication

**Status after fix:** PASS (deployed 2026-03-22)

## 4. User Data Completeness (Event Match Quality)

| Field | Status | Notes |
|---|---|---|
| Hashed email (em) | PASS | SHA256 of lowercased, trimmed email |
| Hashed phone (ph) | PASS | 10-digit prefixed with "91", then SHA256 |
| Hashed first name (fn) | PASS | SHA256 of first word of name |
| Hashed last name (ln) | PASS | SHA256 of remaining words |
| Country (country) | PASS | Hardcoded "in", SHA256 hashed |
| Client IP | PASS | From `x-forwarded-for` or `x-real-ip` headers |
| User agent | PASS | From payload `client_user_agent` or request header fallback |
| fbp cookie | PASS | Extracted from browser `_fbp` cookie, sent in payload |
| fbc cookie | PASS | Extracted from browser `_fbc` cookie, sent in payload |

**EMQ assessment:** All 9 user data parameters are present. This should yield a high Event Match Quality score (7+/10) in Meta Events Manager.

## 5. Hash Function Review: PASS

```js
const hash = (val) => val ? crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex') : '';
```

- Correctly lowercases and trims before hashing (Meta requirement)
- Returns empty string for falsy values (prevents hashing empty strings into a valid hash that would mismatch)
- Uses Node.js `crypto` module (server-side, correct)

## 6. Additional Observations

- **action_source:** Correctly set to `"website"`
- **event_time:** Uses `Math.floor(Date.now() / 1000)` (Unix timestamp in seconds, correct)
- **CORS:** Allows all origins (`*`) which is appropriate for a public quiz form
- **Error handling:** Uses `Promise.allSettled` so GHL failures don't block CAPI and vice versa
- **Fallback:** Frontend uses `sendBeacon` as fallback if `fetch` fails (good for page unload scenarios)

## 7. Fixes Applied

1. **Deduplication fix** in `src/components/sections/QuizForm.tsx` and `src/lib/tracking.ts`
2. Rebuilt and redeployed to GitHub Pages (2026-03-22)

## 8. Recommendations

- **Monitor EMQ in Meta Events Manager** weekly to ensure match quality stays above 6/10
- **Consider adding external_id:** Hash the GHL contact ID and send as `external_id` in CAPI for cross-device matching
- **Test mode:** Use Meta's Test Events tool in Events Manager to verify dedup is working with real browser traffic
- **Token rotation:** The system user token has no documented expiry, but verify it quarterly in Meta Business Settings
