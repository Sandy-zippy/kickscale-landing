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

// Desktop context
const ctxD = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const desktop = await ctxD.newPage()
// Mobile context (iPhone 14 Pro size)
const ctxM = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const mobile = await ctxM.newPage()

const v = Date.now()

// 1. Hub page desktop + mobile
await desktop.goto(`https://zippyscale.in/case-studies?v=${v}`, { waitUntil: 'networkidle' })
await desktop.waitForTimeout(1500)
await desktop.screenshot({ path: `/tmp/v2-hub-desktop.png`, fullPage: true })
console.log('saved hub desktop')

await mobile.goto(`https://zippyscale.in/case-studies?v=${v}`, { waitUntil: 'networkidle' })
await mobile.waitForTimeout(1500)
await mobile.screenshot({ path: `/tmp/v2-hub-mobile.png`, fullPage: true })
console.log('saved hub mobile')

// 2. Hub form — scroll to #audit-form and screenshot
await desktop.goto(`https://zippyscale.in/case-studies?v=${v}#audit-form`, { waitUntil: 'networkidle' })
await desktop.waitForTimeout(1500)
const formD = desktop.locator('#audit-form').first()
if (await formD.count() > 0) {
  await formD.scrollIntoViewIfNeeded()
  await desktop.waitForTimeout(1000)
  await formD.screenshot({ path: `/tmp/v2-hub-form-desktop.png` })
  console.log('saved hub form desktop')
}

// 3. Each case study: mobile hero + mobile pricing + mobile audit-form
for (const slug of slugs) {
  // Mobile hero (the main complaint area)
  await mobile.goto(`https://zippyscale.in/case-studies/${slug}?v=${v}`, { waitUntil: 'networkidle' })
  await mobile.waitForTimeout(2200)
  await mobile.screenshot({ path: `/tmp/v2-${slug}-m-hero.png`, fullPage: false })
  console.log(`m hero ${slug}`)

  // Mobile pricing
  const pricingM = mobile.locator('#pricing').first()
  if (await pricingM.count() > 0) {
    await pricingM.scrollIntoViewIfNeeded()
    await mobile.waitForTimeout(1500)
    try {
      await pricingM.screenshot({ path: `/tmp/v2-${slug}-m-pricing.png`, timeout: 8000 })
      console.log(`m pricing ${slug}`)
    } catch {}
  }

  // Mobile audit-form
  const formM = mobile.locator('#audit-form').first()
  if (await formM.count() > 0) {
    await formM.scrollIntoViewIfNeeded()
    await mobile.waitForTimeout(1200)
    try {
      await formM.screenshot({ path: `/tmp/v2-${slug}-m-form.png`, timeout: 8000 })
      console.log(`m form ${slug}`)
    } catch {}
  }
}

// 4. Spot check: homeopathy desktop pricing + audit-form
await desktop.goto(`https://zippyscale.in/case-studies/homeopathic-clinic-patient-flow?v=${v}`, { waitUntil: 'networkidle' })
await desktop.waitForTimeout(2200)
await desktop.screenshot({ path: `/tmp/v2-homeo-d-hero.png`, fullPage: false })
const pricingD = desktop.locator('#pricing').first()
await pricingD.scrollIntoViewIfNeeded()
await desktop.waitForTimeout(1500)
await pricingD.screenshot({ path: `/tmp/v2-homeo-d-pricing.png`, timeout: 8000 })
const formD2 = desktop.locator('#audit-form').first()
await formD2.scrollIntoViewIfNeeded()
await desktop.waitForTimeout(1200)
await formD2.screenshot({ path: `/tmp/v2-homeo-d-form.png`, timeout: 8000 })
console.log('saved homeo d hero+pricing+form')

await browser.close()
console.log('\nDONE')
