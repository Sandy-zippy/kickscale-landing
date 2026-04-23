import { chromium } from 'playwright'

const slugs = [
  'homeopathic-clinic-patient-flow',
  'coaching-institute-admission-to-enrollment',
  'auto-parts-distribution-order-automation',
  'hvac-manufacturing-po-to-production-automation',
  'rice-mill-fmcg-production-distributor-automation',
  'pharma-distributor-field-orders',
  'd2c-apparel-beauty-retention-automation',
  'professional-services-lead-to-cash',
  'hospitality-fnb-reservations-loyalty-stack',
  'corporate-travel-quotes-reconciliation',
]

const sections = ['hero', 'pain', 'stack', 'sprint', 'outcomes', 'roi', 'pricing', 'vs', 'objections', 'faq']

const browser = await chromium.launch()

// Desktop full-page screenshots
const ctxDesktop = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const desktop = await ctxDesktop.newPage()

// Mobile full-page screenshots
const ctxMobile = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 })
const mobile = await ctxMobile.newPage()

for (const slug of slugs) {
  const url = `https://zippyscale.in/case-studies/${slug}`

  // Desktop full
  await desktop.goto(url, { waitUntil: 'networkidle' })
  await desktop.waitForTimeout(1500)
  await desktop.screenshot({ path: `/tmp/audit-${slug}-desktop.png`, fullPage: true })
  console.log(`saved /tmp/audit-${slug}-desktop.png`)

  // Mobile full
  await mobile.goto(url, { waitUntil: 'networkidle' })
  await mobile.waitForTimeout(1500)
  await mobile.screenshot({ path: `/tmp/audit-${slug}-mobile.png`, fullPage: true })
  console.log(`saved /tmp/audit-${slug}-mobile.png`)
}

await browser.close()
