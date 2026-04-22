import { chromium } from 'playwright'

const slugs = process.argv.slice(2).length > 0 ? process.argv.slice(2) : [
  'coaching-institute-admission-to-enrollment',
  'auto-parts-distribution-order-automation',
  'd2c-apparel-beauty-retention-automation',
  'pharma-distributor-field-orders',
]

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

for (const slug of slugs) {
  await page.goto(`http://localhost:5173/case-studies/${slug}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `/tmp/cs-${slug}.png`, fullPage: false })
  console.log(`saved /tmp/cs-${slug}.png`)
}

await browser.close()
