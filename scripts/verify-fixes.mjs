import { chromium } from 'playwright'

const targets = [
  { slug: 'homeopathic-clinic-patient-flow', sections: ['pain', 'summary', 'stack', 'proof'] },
  { slug: 'hospitality-fnb-reservations-loyalty-stack', sections: ['pain', 'stack'] },
  { slug: 'pharma-distributor-field-orders', sections: ['pain'] },
  { slug: 'd2c-apparel-beauty-retention-automation', sections: ['outcomes', 'proof'] },
  { slug: 'coaching-institute-admission-to-enrollment', sections: ['pain'] },
]

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

for (const { slug, sections } of targets) {
  await page.goto(`https://zippyscale.in/case-studies/${slug}?v=${Date.now()}`, { waitUntil: 'networkidle' })
  // Allow framer-motion animations to settle
  await page.waitForTimeout(2500)
  for (const s of sections) {
    const el = page.locator(`#${s}`).first()
    if (await el.count() === 0) { console.log(`skip ${slug}#${s}: not found`); continue }
    await el.scrollIntoViewIfNeeded()
    await page.waitForTimeout(2500)
    try {
      await el.screenshot({ path: `/tmp/verify-${slug}-${s}.png`, timeout: 10000 })
      console.log(`saved /tmp/verify-${slug}-${s}.png`)
    } catch (e) {
      console.log(`fail ${slug}#${s}: ${e.message.split('\n')[0]}`)
    }
  }
}

await browser.close()
