import { chromium } from 'playwright'

const BASE = 'https://zippyscale.in'
const STAMP = Date.now()

const SHOTS = [
  { url: `${BASE}/case-studies/?v=${STAMP}`, name: 'hub-desktop', viewport: { width: 1440, height: 900 } },
  { url: `${BASE}/case-studies/?v=${STAMP}`, name: 'hub-mobile', viewport: { width: 390, height: 844 } },
  { url: `${BASE}/case-studies/homeopathic-clinic-patient-flow?v=${STAMP}`, name: 'homeo-hero-desktop', viewport: { width: 1440, height: 900 } },
  { url: `${BASE}/case-studies/homeopathic-clinic-patient-flow?v=${STAMP}`, name: 'homeo-hero-mobile', viewport: { width: 390, height: 844 } },
  { url: `${BASE}/case-studies/homeopathic-clinic-patient-flow#outcomes?v=${STAMP}`, name: 'homeo-outcomes-desktop', viewport: { width: 1440, height: 900 } },
  { url: `${BASE}/case-studies/homeopathic-clinic-patient-flow#outcomes?v=${STAMP}`, name: 'homeo-outcomes-mobile', viewport: { width: 390, height: 844 } },
]

const browser = await chromium.launch()
for (const s of SHOTS) {
  const ctx = await browser.newContext({ viewport: s.viewport })
  const page = await ctx.newPage()
  await page.goto(s.url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  const path = `/tmp/design-${s.name}.png`
  await page.screenshot({ path, fullPage: false })
  console.log(`✓ ${s.name} → ${path}`)
  await ctx.close()
}
await browser.close()
