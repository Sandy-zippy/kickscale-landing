import { chromium } from 'playwright'

const url = process.argv[2] || 'http://localhost:5173/case-studies/homeopathic-clinic-patient-flow'

const browser = await chromium.launch()

async function shot(width, height, suffix) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3500)
  await page.screenshot({ path: `/tmp/cs-${suffix}-viewport.png`, fullPage: false })
  await page.screenshot({ path: `/tmp/cs-${suffix}-full.png`, fullPage: true })
  await ctx.close()
  console.log(`${suffix}: viewport + full saved`)
}

await shot(1440, 900, 'desktop')
await shot(390, 844, 'mobile')

await browser.close()
console.log('all done')
