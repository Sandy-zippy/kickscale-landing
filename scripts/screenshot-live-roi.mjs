import { chromium } from 'playwright'

const slug = process.argv[2] || 'homeopathic-clinic-patient-flow'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

await page.goto(`https://zippyscale.in/case-studies/${slug}#roi`, { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)
const roi = await page.locator('#roi').first()
await roi.scrollIntoViewIfNeeded()
await page.waitForTimeout(500)
await roi.screenshot({ path: `/tmp/live-roi-${slug}.png` })
console.log(`saved /tmp/live-roi-${slug}.png`)

await browser.close()
