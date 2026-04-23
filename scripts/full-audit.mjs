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

const sections = ['summary', 'who', 'pain', 'before', 'stack', 'sprint', 'outcomes', 'roi', 'pricing', 'vs', 'objections', 'proof', 'faq', 'audit-timeline']

const browser = await chromium.launch()
const ctxDesktop = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const desktop = await ctxDesktop.newPage()
const ctxMobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const mobile = await ctxMobile.newPage()

for (const slug of slugs) {
  const v = Date.now()

  // Desktop hero (viewport)
  await desktop.goto(`https://zippyscale.in/case-studies/${slug}?v=${v}`, { waitUntil: 'networkidle' })
  await desktop.waitForTimeout(2200)
  await desktop.screenshot({ path: `/tmp/full-${slug}-d-hero.png`, fullPage: false })
  console.log(`saved /tmp/full-${slug}-d-hero.png`)

  // Per-section desktop
  for (const s of sections) {
    const el = desktop.locator(`#${s}`).first()
    if (await el.count() === 0) continue
    await el.scrollIntoViewIfNeeded()
    await desktop.waitForTimeout(1800)
    try {
      await el.screenshot({ path: `/tmp/full-${slug}-d-${s}.png`, timeout: 10000 })
      console.log(`saved /tmp/full-${slug}-d-${s}.png`)
    } catch (e) {
      console.log(`fail ${slug} d ${s}: ${e.message.split('\n')[0]}`)
    }
  }

  // Mobile hero
  await mobile.goto(`https://zippyscale.in/case-studies/${slug}?v=${v}`, { waitUntil: 'networkidle' })
  await mobile.waitForTimeout(2200)
  await mobile.screenshot({ path: `/tmp/full-${slug}-m-hero.png`, fullPage: false })
  console.log(`saved /tmp/full-${slug}-m-hero.png`)

  // Mobile pain (most likely to break on mobile)
  for (const s of ['pain', 'stack', 'roi']) {
    const el = mobile.locator(`#${s}`).first()
    if (await el.count() === 0) continue
    await el.scrollIntoViewIfNeeded()
    await mobile.waitForTimeout(1500)
    try {
      await el.screenshot({ path: `/tmp/full-${slug}-m-${s}.png`, timeout: 10000 })
      console.log(`saved /tmp/full-${slug}-m-${s}.png`)
    } catch (e) {}
  }
}

await browser.close()
