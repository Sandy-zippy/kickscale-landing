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

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

for (const slug of slugs) {
  await page.goto(`https://zippyscale.in/case-studies/${slug}?v=${Date.now()}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: `/tmp/herofix-${slug}.png`, fullPage: false })
  console.log(`saved /tmp/herofix-${slug}.png`)
}

await browser.close()
