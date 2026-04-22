import { chromium } from 'playwright'
import fs from 'node:fs/promises'

const BASE = 'https://zippyscale.in'
const slugs = [
  '',
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

await fs.mkdir('/tmp/cs-audit', { recursive: true })

const browser = await chromium.launch()
const report = []

for (const slug of slugs) {
  const url = slug ? `${BASE}/case-studies/${slug}` : `${BASE}/case-studies`
  const label = slug || 'index'
  const findings = { url, label, issues: [] }

  // Desktop 1440
  const ctxDesktop = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctxDesktop.newPage()

  const consoleErrors = []
  const pageErrors = []
  const failedRequests = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  page.on('requestfailed', (req) => failedRequests.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText}`))
  page.on('response', (res) => {
    const s = res.status()
    if (s >= 400 && s !== 404 /* ignore SPA 404 shell */) {
      if (!res.url().includes('fonts.googleapis') && !res.url().includes('fonts.gstatic')) {
        failedRequests.push(`HTTP ${s} ${res.url()}`)
      }
    }
  })

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2500)

    const title = await page.title()
    findings.title = title

    // Viewport screenshot
    await page.screenshot({ path: `/tmp/cs-audit/${label}-desktop.png`, fullPage: false })

    // Body scroll width vs viewport width (horizontal overflow detection)
    const overflow = await page.evaluate(() => ({
      bodyScroll: document.body.scrollWidth,
      window: window.innerWidth,
      overflowX: document.documentElement.scrollWidth > window.innerWidth,
    }))
    if (overflow.overflowX) {
      findings.issues.push(`Desktop horizontal overflow: body=${overflow.bodyScroll}px, viewport=${overflow.window}px`)
    }

    // Check CTAs
    const brokenLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'))
      const out = []
      for (const a of anchors) {
        const href = a.getAttribute('href')
        if (!href) out.push({ text: a.textContent?.trim().slice(0, 40), reason: 'empty href' })
        if (href === '#' || href === 'javascript:void(0)') out.push({ text: a.textContent?.trim().slice(0, 40), reason: `inert href: ${href}` })
      }
      return out
    })
    brokenLinks.forEach((b) => findings.issues.push(`Inert link: "${b.text}" — ${b.reason}`))

    // Check for placeholder or debug text
    const pageText = await page.evaluate(() => document.body.innerText)
    const placeholderPatterns = [
      /\[XXXXX+\]/gi,
      /TODO/g,
      /\bTBD\b/g,
      /PLACEHOLDER/gi,
      /\[founder\]/gi,
      /\[institute\]/gi,
      /\[distributor\]/gi,
      /\[manufacturer\]/gi,
      /\[brand\]/gi,
      /\[mill\]/gi,
      /undefined\b/g,
      /\bnull\b/g,
      /Lorem ipsum/i,
    ]
    for (const p of placeholderPatterns) {
      const m = pageText.match(p)
      if (m) findings.issues.push(`Placeholder in body text: ${[...new Set(m)].slice(0, 3).join(', ')}`)
    }

    // em-dash / en-dash in rendered body text (user-facing only)
    const dashes = pageText.match(/[—–]/g)
    if (dashes) findings.issues.push(`${dashes.length} em/en-dash character(s) in rendered text (forbidden per feedback_no_dashes_in_copy)`)

    // Check that CTAs to /#quiz exist and hero headline exists
    const ctaToQuiz = await page.locator('a[href="/#quiz"]').count()
    if (slug && ctaToQuiz === 0) findings.issues.push('No /#quiz CTA found on page')

    const hasH1 = await page.locator('h1').count()
    if (hasH1 === 0) findings.issues.push('No H1 heading on page')

    findings.consoleErrors = consoleErrors
    findings.pageErrors = pageErrors
    findings.failedRequests = failedRequests

    // Mobile 390
    await ctxDesktop.close()
    const ctxMobile = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const pageM = await ctxMobile.newPage()
    await pageM.goto(url, { waitUntil: 'networkidle' })
    await pageM.waitForTimeout(2000)
    await pageM.screenshot({ path: `/tmp/cs-audit/${label}-mobile.png`, fullPage: false })
    const mobileOverflow = await pageM.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    if (mobileOverflow) findings.issues.push('Mobile horizontal overflow (< 390px viewport)')
    await ctxMobile.close()
  } catch (err) {
    findings.issues.push(`NAVIGATION_ERROR: ${err.message}`)
  }

  report.push(findings)
  console.log(`${label}: ${findings.issues.length} issues`)
}

await browser.close()

// Write report
await fs.writeFile('/tmp/cs-audit/report.json', JSON.stringify(report, null, 2))

// Markdown summary
const md = []
md.push('# Case Studies Audit — zippyscale.in')
md.push(`\nAudited ${report.length} pages on ${new Date().toISOString()}\n`)
for (const f of report) {
  md.push(`## ${f.label}\n`)
  md.push(`URL: ${f.url}`)
  md.push(`Title: ${f.title || '(missing)'}`)
  if (f.issues.length === 0) md.push(`**Issues:** none found`)
  else {
    md.push(`**Issues (${f.issues.length}):**`)
    f.issues.forEach((i) => md.push(`- ${i}`))
  }
  if (f.consoleErrors?.length) {
    md.push(`**Console errors:**`)
    f.consoleErrors.slice(0, 5).forEach((e) => md.push(`- \`${e.slice(0, 200)}\``))
  }
  if (f.pageErrors?.length) {
    md.push(`**Page errors:**`)
    f.pageErrors.slice(0, 3).forEach((e) => md.push(`- \`${e.slice(0, 200)}\``))
  }
  if (f.failedRequests?.length) {
    md.push(`**Failed requests:**`)
    f.failedRequests.slice(0, 5).forEach((r) => md.push(`- ${r}`))
  }
  md.push('')
}
await fs.writeFile('/tmp/cs-audit/report.md', md.join('\n'))
console.log('report at /tmp/cs-audit/report.md')
