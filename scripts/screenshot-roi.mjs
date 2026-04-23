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
  await page.goto(`http://localhost:5173/case-studies/${slug}#roi`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  const roi = await page.locator('#roi').first()
  if (await roi.count() === 0) {
    console.log(`  MISSING ROI section on ${slug}`)
    continue
  }
  await roi.scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  await roi.screenshot({ path: `/tmp/roi-${slug}.png` })
  console.log(`saved /tmp/roi-${slug}.png`)
}

await browser.close()
