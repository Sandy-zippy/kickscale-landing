# ZippyScale Automation Homepage Redesign

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static HTML automate.html with a React (Vite) homepage featuring 21st.dev motion components, applying all changes from Bhargav's revision doc. Move the current growth offer to /growth-offer.

**Architecture:** Vite + React SPA with react-router for two routes (/ and /growth-offer). 21st.dev components via MCP for animated hero, stat counters, cards, and scroll animations. Framer Motion for page-level transitions. Static export via `vite build` for GitHub Pages deployment. Form submits to existing n8n webhook.

**Tech Stack:** Vite, React 18, TypeScript, Framer Motion, react-router-dom, 21st.dev components (via MCP), Tailwind CSS, GitHub Pages

---

## File Structure

```
zippyscale-landing/
├── index.html                    # Vite entry point (replaces old)
├── vite.config.ts                # Vite config with static export
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind config (required by 21st.dev components)
├── postcss.config.js             # PostCSS config for Tailwind
├── public/
│   ├── CNAME                     # zippyscale.in
│   ├── favicon.png               # From assets/
│   ├── og-image.png              # Social preview
│   └── logos/                    # Logo kit (copy from /tmp/logo-exports/ or regenerate)
│       ├── icon-64.png
│       ├── avatar-darkbg-120.png
│       ├── avatar-limebg-120.png
│       └── wm-lightbg-horiz-300w.png
├── src/
│   ├── main.tsx                  # React entry
│   ├── App.tsx                   # Router: / and /growth-offer
│   ├── styles/
│   │   └── globals.css           # CSS variables, fonts, base styles
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Nav.tsx           # Fixed nav with CTA
│   │   │   ├── Footer.tsx        # Footer with address + social
│   │   │   ├── ScarcityBanner.tsx # Lime sticky banner
│   │   │   └── StickyCTA.tsx     # Mobile sticky CTA
│   │   ├── sections/
│   │   │   ├── Hero.tsx          # Animated hero with ₹18L stat
│   │   │   ├── ProofOfWork.tsx   # 4 stat cards (NEW)
│   │   │   ├── PainSection.tsx   # "What Manual Work Costs You"
│   │   │   ├── AutomationGrid.tsx # 8 cards (4 updated)
│   │   │   ├── HowItWorks.tsx    # 3 steps
│   │   │   ├── ROIComparison.tsx # Manual vs AI table
│   │   │   ├── WhoIsThisFor.tsx  # 4 audience cards
│   │   │   ├── QuizForm.tsx      # 3-step form with waitlist CTA
│   │   │   ├── FAQ.tsx           # Accordion FAQ
│   │   │   └── FinalCTA.tsx      # Bottom CTA with FOMO
│   │   └── ui/                   # 21st.dev components land here
│   │       ├── AnimatedCounter.tsx
│   │       ├── ScrollReveal.tsx
│   │       ├── GlowCard.tsx
│   │       └── ... (from 21st.dev MCP)
│   ├── pages/
│   │   ├── AutomationHome.tsx    # Main page assembling all sections
│   │   └── GrowthOffer.tsx       # Old index.html content (static embed)
│   │   └── Toast.tsx             # Toast notification for validation
│   └── lib/
│       └── analytics.ts          # FB Pixel init, UTM capture, event helpers
├── growth-offer-legacy/
│   └── index.html                # Backup of old index.html
└── old-static/                   # Backup of old automate.html
    └── automate.html
```

---

## Task 1: Scaffold Vite + React Project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`, `src/App.tsx`, `index.html`
- Backup: `index.html` → `growth-offer-legacy/index.html`, `automate.html` → `old-static/automate.html`

- [ ] **Step 1: Backup existing files**
```bash
mkdir -p growth-offer-legacy old-static
cp index.html growth-offer-legacy/index.html
cp automate.html old-static/automate.html
```

- [ ] **Step 2: Initialize Vite + React project in temp dir, then move**
```bash
# Scaffold in temp dir (non-empty dir will fail without this)
cd /tmp && npm create vite@latest zs-scaffold -- --template react-ts
# Copy scaffold files into project (preserving existing files)
cp /tmp/zs-scaffold/package.json .
cp /tmp/zs-scaffold/tsconfig.json .
cp /tmp/zs-scaffold/tsconfig.app.json .
cp /tmp/zs-scaffold/tsconfig.node.json .
cp /tmp/zs-scaffold/vite.config.ts .
cp -r /tmp/zs-scaffold/src ./src
rm -rf /tmp/zs-scaffold
# Install deps including Tailwind (required by 21st.dev components)
npm install
npm install framer-motion react-router-dom
npm install -D tailwindcss @tailwindcss/vite
# Initialize Tailwind
npx tailwindcss init -p
```
Note: Preserve existing files — CNAME, assets/, brand-assets/, docs/, playbooks/, *.html backups.

- [ ] **Step 3: Configure vite.config.ts for static export + Tailwind**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
})
```

- [ ] **Step 4: Set up src/main.tsx entry**
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 5: Set up src/App.tsx with router**
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AutomationHome from './pages/AutomationHome'
import GrowthOffer from './pages/GrowthOffer'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AutomationHome />} />
        <Route path="/growth-offer" element={<GrowthOffer />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 6: Create globals.css with brand variables and font imports**
Port CSS variables from existing automate.html (--dark-bg, --lime, fonts, etc.)

- [ ] **Step 7: Copy public assets (logos, favicon, og-image, CNAME)**
```bash
mkdir -p public/logos
cp assets/favicon.png public/favicon.png
cp CNAME public/CNAME
# og-image: if exists at root, copy; otherwise create placeholder
cp og-image.png public/og-image.png 2>/dev/null || echo "TODO: create og-image.png"
# Logo assets: copy from /tmp/logo-exports/ if available, otherwise regenerate
# using the Python script from the logo kit session (see brand-assets/ for source SVGs)
cp /tmp/logo-exports/icon-64.png public/logos/ 2>/dev/null
cp /tmp/logo-exports/avatar-darkbg-120.png public/logos/ 2>/dev/null
cp /tmp/logo-exports/avatar-limebg-120.png public/logos/ 2>/dev/null
cp /tmp/logo-exports/wm-lightbg-horiz-300w.png public/logos/ 2>/dev/null
# Fallback: regenerate from brand-assets/ SVGs using rsvg-convert if /tmp is gone
```

- [ ] **Step 7b: Create src/lib/analytics.ts**
```typescript
// FB Pixel initialization
export function initPixel(pixelId: string) {
  // fbq init code here — commented out until pixel ID provided
}

// UTM capture from URL params to sessionStorage
export function captureUTM() {
  const params = new URLSearchParams(window.location.search)
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  keys.forEach(key => {
    const val = params.get(key)
    if (val) sessionStorage.setItem(key, val)
  })
}

// Event helpers
export function trackEvent(event: string) {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', event)
  }
}
```

- [ ] **Step 8: Verify dev server starts**
```bash
npm run dev
# Should open localhost:5173 with blank React app
```

- [ ] **Step 9: Commit**
```bash
git add -A && git commit -m "scaffold: Vite + React + TypeScript project for homepage redesign"
```

---

## Task 2: Build Layout Components (Nav, Footer, ScarcityBanner, StickyCTA)

**Files:**
- Create: `src/components/layout/Nav.tsx`, `Footer.tsx`, `ScarcityBanner.tsx`, `StickyCTA.tsx`

- [ ] **Step 1: Use 21st.dev MCP to find animated navbar component**
Search: "navbar dark animated" — get a component with glassmorphism backdrop blur.

- [ ] **Step 2: Build Nav.tsx**
Adapt the 21st.dev navbar with ZippyScale branding:
- Logo (icon-64.png + "Zippyscale" text in Space Grotesk)
- CTA button: "Book Your Free Automation Audit" (lime bg)
- Fixed position, backdrop blur, dark bg

- [ ] **Step 3: Build ScarcityBanner.tsx**
Lime green sticky bar at very top (above nav):
- Text: "Only 10 spots · Execution starts April 1st · Join the waitlist"
- Space Grotesk 700, dark text on lime bg
- Dismissible with X button (stores in sessionStorage)

- [ ] **Step 4: Build Footer.tsx**
From Bhargav's doc:
- © 2026 ZippyScale
- "Data Finds Money. AI Multiplies It."
- Office address (placeholder for Sandy's input)
- Instagram link: @zippy.scale
- Email: hello@zippyscale.in

- [ ] **Step 5: Build StickyCTA.tsx**
Mobile-only sticky bottom bar:
- "Join the Waitlist" (per Bhargav's CTA table)
- Hidden when quiz section is in viewport (IntersectionObserver)

- [ ] **Step 6: Verify all layout components render in dev**

- [ ] **Step 7: Commit**
```bash
git commit -m "feat: layout components — nav, footer, scarcity banner, sticky CTA"
```

---

## Task 3: Build Hero Section with Motion Graphics

**Files:**
- Create: `src/components/sections/Hero.tsx`, `src/components/ui/AnimatedCounter.tsx`

- [ ] **Step 1: Use 21st.dev MCP to find hero section with animated background**
Search: "hero section animated gradient" — get a component with particle/orb/mesh animations.

- [ ] **Step 2: Use 21st.dev MCP to find animated number counter**
Search: "animated counter number" — for the ₹18L stat.

- [ ] **Step 3: Build Hero.tsx assembling the pieces**
Content from Bhargav's doc:
- Headline: "We Build AI Automations That Run Your Business While You Scale"
- Sub-headline (3 stats): "Save 18 Lakhs/Year. Cut 40 Hours/Week. Same Team. 10x Output."
  - Display as animated counter elements
- Primary CTA: "Book Your Free Automation Audit" (lime button)
- Secondary CTA: "Join the Waitlist" (small text link below button)
- Background: animated gradient orbs or mesh (from 21st.dev)
- Badge: "AI-Powered Automation" with pulsing dot

- [ ] **Step 4: Add Framer Motion entrance animations**
- Stagger children reveal (badge → headline → stats → CTA)
- Use `motion.div` with `initial`, `animate`, `transition`

- [ ] **Step 5: Verify hero renders with animations in dev**

- [ ] **Step 6: Commit**
```bash
git commit -m "feat: hero section with animated counters and motion background"
```

---

## Task 4: Build Proof of Work + Pain Sections

**Files:**
- Create: `src/components/sections/ProofOfWork.tsx`, `src/components/sections/PainSection.tsx`, `src/components/ui/ScrollReveal.tsx`, `src/components/ui/GlowCard.tsx`

- [ ] **Step 1: Use 21st.dev MCP for scroll-triggered reveal component**
Search: "scroll reveal animation" — for section entrance animations.

- [ ] **Step 2: Use 21st.dev MCP for glowing stat card**
Search: "stats card" or "metric card" — for the proof of work metrics.

- [ ] **Step 3: Build ProofOfWork.tsx (NEW section from Bhargav's doc)**
Title: "What Our Automations Have Delivered"
4 stat cards:
1. "₹1.6 Cr+" — saved across clients
2. "8,000+" — hours of manual work eliminated
3. "20+" — businesses automated
4. "10x" — output, same team, zero new hires
- Animated counters on scroll into view
- Lime accent on numbers

- [ ] **Step 4: Build PainSection.tsx**
Port from existing automate.html "What Manual Work Costs You":
- 4 pain cards with red stats
- 3D tilt on hover (port existing JS or use Framer Motion)
- Light section background

- [ ] **Step 5: Verify both sections render with scroll animations**

- [ ] **Step 6: Commit**
```bash
git commit -m "feat: proof of work stats + pain section with scroll animations"
```

---

## Task 5: Build Automation Grid + How It Works

**Files:**
- Create: `src/components/sections/AutomationGrid.tsx`, `src/components/sections/HowItWorks.tsx`

- [ ] **Step 1: Use 21st.dev MCP for card grid with hover effects**
Search: "bento grid cards" — for the 8 automation cards.

- [ ] **Step 2: Build AutomationGrid.tsx with Bhargav's 4 updated cards**
Title: "8 Areas Where AI Replaces Busywork"
Cards (with updates per doc):
1. **Complete Lead Flow** (UPDATED) — "End-to-end lead capture, qualification, assignment, and CRM sync."
2. Invoice & Payment Processing (no change)
3. **Daily, Weekly & Monthly Report Generation** (UPDATED)
4. Email & WhatsApp Follow-ups (no change)
5. **Customer Engagement & Retention Automation** (UPDATED)
6. **AI Voice Agent + AI Messaging Agent + Appointment Scheduling** (UPDATED)
7. Inventory & Order Management (no change)
8. HR & Payroll Processing (no change)

- [ ] **Step 3: Build HowItWorks.tsx**
Port from existing: 3 steps (Tell us → We build → You scale)
- Step cards with numbered badges
- Connection lines between steps

- [ ] **Step 4: Verify in dev**

- [ ] **Step 5: Commit**
```bash
git commit -m "feat: automation grid (4 cards updated) + how it works section"
```

---

## Task 6: Build ROI Table + Who Is This For + FAQ

**Files:**
- Create: `src/components/sections/ROIComparison.tsx`, `src/components/sections/WhoIsThisFor.tsx`, `src/components/sections/FAQ.tsx`

- [ ] **Step 1: Build ROIComparison.tsx**
Port existing Manual vs AI comparison table.
- Red highlights for manual, green/lime for automated
- Dark section

- [ ] **Step 2: Build WhoIsThisFor.tsx**
Port existing 4 audience cards (₹5Cr+ businesses, WhatsApp/Excel teams, etc.)

- [ ] **Step 3: Use 21st.dev MCP for accordion component**
Search: "accordion faq" — for FAQ section.

- [ ] **Step 4: Build FAQ.tsx**
Port existing 5 FAQ items into accordion component.

- [ ] **Step 5: Verify all three sections**

- [ ] **Step 6: Commit**
```bash
git commit -m "feat: ROI comparison, audience section, FAQ accordion"
```

---

## Task 7: Build Quiz/Form with Waitlist CTA

**Files:**
- Create: `src/components/sections/QuizForm.tsx`

- [ ] **Step 1a: Build QuizForm.tsx — Step 1 UI (multi-select options)**
Create the multi-select grid with 10 options (renamed per Bhargav's doc):
- Complete Lead Flow (renamed)
- Invoice & Payment Processing (no change)
- Daily, Weekly & Monthly Report Generation (renamed)
- Email & WhatsApp Follow-ups (no change)
- Customer Engagement & Retention Automation (renamed)
- AI Voice Agent + AI Messaging Agent + Appointment Scheduling (renamed)
- Inventory & Order Management (no change)
- HR & Payroll Processing (no change)
- **Special Internal Operations** (NEW)
- **Others** (NEW — with free-text input that appears when selected)

- [ ] **Step 1b: Build QuizForm.tsx — Step 2 + Step 3 UI**
Step 2: Team size (single select, 3 options — no change)
Step 3: Contact info (name, email, phone, business — no change to fields)
Progress bar showing 3 steps.

- [ ] **Step 1c: Build QuizForm.tsx — state management + validation**
- React state for currentStep, multiSelections, answers
- Validation: step 1 requires ≥1 selection, step 3 validates phone (Indian 10-digit), email
- Auto-advance on step 2 selection (400ms delay)
- Toast component for validation errors (port from existing)

- [ ] **Step 2: Update CTA button text**
Submit button: "Join the Waitlist"
Add FOMO text above: "Only 10 client slots for the next 3 months. Execution starts April 1st."

- [ ] **Step 3: Wire form submission to n8n webhook**
Endpoint: `https://sandyautomations.app.n8n.cloud/webhook/zippyscale-quiz`
Same payload structure as existing, add `source: 'automation-lp-v2'`

- [ ] **Step 4: Build thank-you overlay with waitlist number**
From Bhargav's doc:
- "You're on the Waitlist!" heading
- Waitlist number: #[sequential counter from localStorage]
- "We review every submission. If there's a fit, we'll reach out before 31st March."
- Priority Audit upsell card (₹4,999, ₹9,999 strikethrough)
- CTA: "Get Priority Audit in 48 Hours" (links to Razorpay — URL TBD from Sandy)

- [ ] **Step 5: Add FB Pixel events**
- Quiz start: `fbq('track', 'Lead')`
- Submit: `fbq('track', 'SubmitApplication')`
- CTA click: `fbq('track', 'InitiateCheckout')`

- [ ] **Step 6: Verify full form flow in dev**

- [ ] **Step 7: Commit**
```bash
git commit -m "feat: quiz form with waitlist CTA and thank-you page upsell"
```

---

## Task 8: Build Final CTA + Assemble AutomationHome Page

**Files:**
- Create: `src/components/sections/FinalCTA.tsx`, `src/pages/AutomationHome.tsx`

- [ ] **Step 1: Build FinalCTA.tsx**
From Bhargav's doc:
- Headline: "Stop Paying People to Do What AI Can Do in Seconds"
- Sub: "Only 10 clients. 3-month engagement. Execution starts April 1st."
- CTA: "Book Your Free Automation Audit"
- Secondary: "Join the Waitlist" (small text, scrolls to form)
- Animated background orbs

- [ ] **Step 2: Build AutomationHome.tsx — assemble all sections**
```tsx
<ScarcityBanner />
<Nav />
<Hero />
<ProofOfWork />
<PainSection />
<AutomationGrid />
<HowItWorks />
<ROIComparison />
<WhoIsThisFor />
<QuizForm />
<FAQ />
<FinalCTA />
<Footer />
<StickyCTA />
```
Note: Pricing section is REMOVED per Bhargav's doc.

- [ ] **Step 3: Verify full page scroll in dev — all sections, all animations**

- [ ] **Step 4: Commit**
```bash
git commit -m "feat: assemble automation homepage with all sections"
```

---

## Task 9: Growth Offer Legacy Page + Router Setup

**Files:**
- Create: `src/pages/GrowthOffer.tsx`

- [ ] **Step 1: Build GrowthOffer.tsx using iframe isolation**
The old index.html is 1655 lines with its own `<style>` and `<script>` blocks.
Using `dangerouslySetInnerHTML` would cause CSS/JS conflicts with the React app.
Use an iframe pointing to the backed-up HTML file instead:

```tsx
export default function GrowthOffer() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <iframe
        src="/growth-offer-legacy/index.html"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="ZippyScale Growth Offer"
      />
    </div>
  )
}
```

Copy the backed-up file to public: `cp growth-offer-legacy/index.html public/growth-offer-legacy/index.html`

- [ ] **Step 2: Verify /growth-offer route loads the old content with styles intact**

- [ ] **Step 3: Commit**
```bash
git commit -m "feat: growth offer page at /growth-offer (legacy content)"
```

---

## Task 10: Build, Deploy, Verify

**Files:**
- Modify: `vite.config.ts` (add 404.html copy for SPA routing on GitHub Pages)
- Modify: `package.json` (add deploy script)

- [ ] **Step 1: Add SPA routing support for GitHub Pages**
Create a 404.html that redirects to index.html (standard GH Pages SPA trick).
Add to vite.config.ts: copy CNAME to dist.

- [ ] **Step 2: Build static output**
```bash
npm run build
# Verify dist/ contains index.html, assets, CNAME
```

- [ ] **Step 3: Preview build locally**
```bash
npm run preview
# Check: /, /growth-offer, form submission, all animations
```

- [ ] **Step 4: Deploy to GitHub Pages**
```bash
# If using gh-pages branch:
npm install -D gh-pages
npx gh-pages -d dist
```

- [ ] **Step 5: Verify live at zippyscale.in**
- Homepage shows automation page
- /growth-offer shows old growth content
- Form submits to n8n webhook
- All animations work
- Mobile responsive
- Scarcity banner visible

- [ ] **Step 6: Final commit**
```bash
git commit -m "deploy: automation homepage live at zippyscale.in"
```

---

## Items Requiring Sandy's Input (from Bhargav's doc)

These are flagged as blockers/placeholders — implementation proceeds with placeholders:

1. **Proof of Work numbers** — ₹1.6Cr, 8000+ hours, 20+ businesses (need confirmation)
2. **Razorpay payment link** — for ₹4,999 priority audit upsell
3. **Calendly booking link** — 4 slots/day post-payment
4. **Office address** — Hyderabad street address for footer
5. **Pricing math** — ₹9,999 strikethrough + "15% off" badge but actual is ₹4,999 (~50% off)
6. **Additional social links** — LinkedIn, X beyond Instagram
