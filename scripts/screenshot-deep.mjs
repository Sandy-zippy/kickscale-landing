import { chromium } from 'playwright'

const slug = process.argv[2] || 'homeopathic-clinic-patient-flow'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto(`http://localhost:5173/case-studies/${slug}`, { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)

// Full page
await page.screenshot({ path: `/tmp/cs-${slug}-FULL.png`, fullPage: true })

// Scroll-based section captures
const sections = ['hero', 'summary', 'who', 'pain', 'before', 'stack', 'sprint', 'outcomes', 'pricing', 'vs', 'objections', 'proof', 'faq', 'audit-timeline', 'cta']
for (const id of sections) {
  try {
    const el = page.locator(`#${id}`).first()
    if (await el.count() === 0) continue
    await el.scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    await el.screenshot({ path: `/tmp/cs-${slug}-${id}.png` })
  } catch (e) {
    console.log(`  skip ${id}: ${e.message}`)
  }
}

await browser.close()
console.log(`done ${slug}`)
