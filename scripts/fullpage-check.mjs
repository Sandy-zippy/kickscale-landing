import { chromium } from 'playwright'

const STAMP = Date.now()
const browser = await chromium.launch()

// Desktop fullpage of homeopathy
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(`https://zippyscale.in/case-studies/homeopathic-clinic-patient-flow?v=${STAMP}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  // Scroll to trigger lazy-loaded variants + reveal animations
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(1500)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(1200)
  await page.screenshot({ path: '/tmp/design-homeo-full-desktop.png', fullPage: true })
  console.log('✓ homeo-full-desktop')
  await ctx.close()
}

// Mobile fullpage of hub
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await page.goto(`https://zippyscale.in/case-studies/?v=${STAMP}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: '/tmp/design-hub-full-mobile.png', fullPage: true })
  console.log('✓ hub-full-mobile')
  await ctx.close()
}

// Jump to outcomes directly
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(`https://zippyscale.in/case-studies/homeopathic-clinic-patient-flow?v=${STAMP}#outcomes`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  await page.screenshot({ path: '/tmp/design-homeo-outcomes-proper.png', fullPage: false })
  console.log('✓ outcomes-proper')
  await ctx.close()
}

await browser.close()
