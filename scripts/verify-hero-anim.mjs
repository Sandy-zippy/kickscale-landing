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
const ctxM = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const mobile = await ctxM.newPage()
const v = Date.now()

for (const slug of slugs) {
  await mobile.goto(`https://zippyscale.in/case-studies/${slug}?v=${v}`, { waitUntil: 'networkidle' })
  await mobile.waitForTimeout(1500)
  // The motion graphic is the [role="img"] inside the hero — scroll it into view + screenshot.
  const anim = mobile.locator('#hero [role="img"]').first()
  if (await anim.count() === 0) { console.log(`  no anim for ${slug}`); continue }
  await anim.scrollIntoViewIfNeeded()
  await mobile.waitForTimeout(2200) // let bubbles, counter, banner cycle
  await anim.screenshot({ path: `/tmp/v2-${slug}-m-anim-chaos.png`, timeout: 8000 })
  console.log(`chaos ${slug}`)

  // Wait for resolve phase (cycle is 9s, chaos 0-5s, resolve 5-9s)
  await mobile.waitForTimeout(4000)
  await anim.screenshot({ path: `/tmp/v2-${slug}-m-anim-resolve.png`, timeout: 8000 })
  console.log(`resolve ${slug}`)
}

// Same for desktop
const ctxD = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const desktop = await ctxD.newPage()
for (const slug of slugs) {
  await desktop.goto(`https://zippyscale.in/case-studies/${slug}?v=${v}`, { waitUntil: 'networkidle' })
  await desktop.waitForTimeout(1500)
  const anim = desktop.locator('#hero [role="img"]').first()
  if (await anim.count() === 0) continue
  await anim.scrollIntoViewIfNeeded()
  await desktop.waitForTimeout(2200)
  await anim.screenshot({ path: `/tmp/v2-${slug}-d-anim.png`, timeout: 8000 })
  console.log(`d-anim ${slug}`)
}

await browser.close()
console.log('DONE')
