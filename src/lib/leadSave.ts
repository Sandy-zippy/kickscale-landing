/* Save at every Continue (house rule, 28 Oct 2026).
 *
 * One lead id per form session, kept in sessionStorage so a reload keeps it. Each
 * Continue posts { action: 'save', lead_id, partial: true, stage, ...answers } and the
 * Apps Script upserts the same Sheet row and cockpit deal by lead_id. Fire and forget:
 * it never blocks or delays the visitor, and a failed save is covered by the next one
 * (every save carries every answer so far). The final 'book' / 'lead' carries the same
 * lead_id with partial: false, stage: 'final', then the id is dropped so a second
 * enquiry from the same tab is a new record.
 *
 * 'website' is shared by the /websites form and the Zippy bot, so a visitor who talks
 * to Zippy and then fills the form lands as one record. 'cockpit' is the homepage form.
 */
import { BOOKING_ENDPOINT } from '../data/discovery'

export type LeadForm = 'website' | 'cockpit'
export type Stage = 'details' | 'needs' | 'final'

const KEY = (f: LeadForm) => `zs_lead_id_${f}`
const memo: Partial<Record<LeadForm, string>> = {}

export function leadId(f: LeadForm): string {
  try {
    let id = sessionStorage.getItem(KEY(f))
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(KEY(f), id) }
    return id
  } catch {
    return (memo[f] ??= crypto.randomUUID())   // storage blocked: one id for this page view
  }
}

/** After a finished submission: the next enquiry gets a fresh id. */
export function finishLead(f: LeadForm) {
  try { sessionStorage.removeItem(KEY(f)) } catch { /* nothing stored */ }
  delete memo[f]
}

/* Posts for one lead_id must reach the backend one after another (the cockpit's
   index is not unique), so every save is chained after the previous one, and the
   final submit waits for the chain via afterSaves(). */
let chain: Promise<unknown> = Promise.resolve()

/** Background save. Never awaited by the visitor, never throws. keepalive lets it
 *  outlive a closing tab. */
export function saveStep(payload: object, f: typeof fetch = fetch) {
  if (!BOOKING_ENDPOINT) return
  chain = chain
    .then(() => f(BOOKING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(payload),
      keepalive: true,
    }))
    .catch(() => { /* the next save or the final submit carries everything */ })
}

/** Resolves once every queued save has finished (or failed). */
export const afterSaves = () => chain
