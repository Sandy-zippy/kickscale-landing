# ZippyScale Brand Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign ZippyScale's visual identity (colors, typography, logo, page layout) and rebuild the landing page with alternating dark/light sections, scroll animations, Instagram embed, and team-focused positioning.

**Architecture:** Single-page landing page rebuild with new CSS design system (Space Grotesk + Inter, alternating dark/light sections, softer color palette). New SVG logo. Brand guide document for consistency across all touchpoints.

**Tech Stack:** HTML, CSS, vanilla JS, Google Fonts (Space Grotesk, Inter, JetBrains Mono), CSS animations, IntersectionObserver for scroll effects.

---

### Task 1: Create Brand Guide Document

**Files:**
- Create: `docs/zippyscale-brand-guide.md`

- [ ] **Step 1: Write the brand guide with all color codes, font specs, logo usage rules, voice guidelines**

Contains: Color palette (dark + light modes), typography scale, logo SVG code, spacing system, voice & tone, do's and don'ts.

- [ ] **Step 2: Commit**

```bash
git add docs/zippyscale-brand-guide.md
git commit -m "docs: add ZippyScale brand identity guide v2"
```

---

### Task 2: Design New Logo SVG

**Files:**
- Create inline in `index.html` (nav, footer, favicon)

- [ ] **Step 1: Design the logo as SVG**

Requirements:
- Combination mark: "Z" data-pulse symbol + "ZippyScale" wordmark
- Symbol: zigzag upward trend line with node at peak, forming a stylized "Z"
- Uses Space Grotesk letterforms for wordmark
- Works at 32px (favicon) and 200px+ (hero)
- Lime #D5EB4B on dark backgrounds, dark version for light backgrounds

- [ ] **Step 2: Create favicon from symbol**

Inline SVG data URI for `<link rel="icon">`.

---

### Task 3: Rebuild Landing Page with New Brand System

**Files:**
- Modify: `index.html` (full rewrite of CSS + structural HTML changes)

- [ ] **Step 1: Replace CSS design system**

New color variables:
```css
--bg-dark: #141418;
--bg-dark-card: #1E1E24;
--bg-dark-border: #2E2E36;
--bg-light: #F8F9FA;
--bg-light-card: #FFFFFF;
--bg-light-border: #E5E7EB;
--lime: #D5EB4B;
--lime-dark: #B8CF2E;
--lime-glow: rgba(213, 235, 75, 0.12);
--text-on-dark: #FAFAFA;
--text-on-dark-secondary: #9CA3AF;
--text-on-light: #111827;
--text-on-light-secondary: #4B5563;
```

New fonts: Space Grotesk (headings), Inter (body), JetBrains Mono (stats/numbers).

- [ ] **Step 2: Implement alternating dark/light sections**

Layout:
1. Nav: dark
2. Hero: dark with subtle grid/particle background
3. Pain section: **light** (white bg)
4. Solution section: dark
5. How It Works: **light**
6. Social Proof: dark
7. Founder/Team: **light**
8. What You Get: dark
9. Guarantee: **light**
10. Quiz: dark
11. FAQ: **light**
12. Final CTA: dark
13. Footer: dark

- [ ] **Step 3: Fix specific content issues**

- "Scaling Fear" card: shorten copy to fit single line
- Founder section: change to "ZippyScale Team" with team credentials
- Email: change to hello@zippyscale.in
- Replace all logo instances with new SVG

- [ ] **Step 4: Add scroll-triggered animations**

CSS + IntersectionObserver:
- Fade-in-up for cards and sections (staggered)
- Counter animation for hero stats
- Subtle scale-in for proof cards
- Progress bar animation on quiz

- [ ] **Step 5: Add Instagram feed embed in social proof**

Embed ZippyScale Instagram (zippy.scale) as visual social proof. Use an iframe-based embed or static grid of latest posts with link to profile.

- [ ] **Step 6: Add visual richness**

- Subtle CSS grid/dot pattern in hero background
- Gradient border effects on key cards (offer box, quiz container)
- Animated lime accent line on section transitions
- Smooth hover states with transforms

- [ ] **Step 7: Test and commit**

Open in Chrome, verify:
- All sections alternate correctly
- Animations fire on scroll
- Quiz still works end-to-end
- Mobile responsive
- New logo renders at all sizes

```bash
git add index.html
git commit -m "feat: complete ZippyScale brand redesign v2"
```

---

### Task 4: Deploy and Verify

**Files:**
- Push to: Sandy-zippy/zippyscale-landing repo via GitHub API

- [ ] **Step 1: Push updated index.html to zippyscale-landing repo**
- [ ] **Step 2: Verify deployment at zippyscale.in**
- [ ] **Step 3: Run review agent, self-rate, iterate if below 8/10**
