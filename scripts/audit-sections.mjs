import { chromium } from 'playwright'

const slug = process.argv[2] || 'homeopathic-clinic-patient-flow'
const sections = ['hero', 'summary', 'who', 'pain', 'before', 'stack', 'tech', 'sprint', 'outcomes', 'roi', 'pricing', 'vs', 'objections', 'proof', 'faq', 'audit-timeline']

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto(`https://zippyscale.in/case-studies/${slug}`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// Hero: viewport as-is
await page.screenshot({ path: `/tmp/sec-${slug}-hero.png`, fullPage: false })
console.log(`saved /tmp/sec-${slug}-hero.png`)

// Each section: scroll + screenshot the section element
for (const s of sections.slice(1)) {
  const el = page.locator(`#${s}`).first()
  if (await el.count() === 0) continue
  await el.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  try {
    await el.screenshot({ path: `/tmp/sec-${slug}-${s}.png`, timeout: 10000 })
    console.log(`saved /tmp/sec-${slug}-${s}.png`)
  } catch (e) {
    console.log(`skip ${s}: ${e.message.split('\n')[0]}`)
  }
}

await browser.close()
