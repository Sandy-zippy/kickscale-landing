# 40 Ad Angles + Creatives + AI Automation LP

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 40 Meta ad angles with HTML static creatives across all ZippyScale funnels, plus a new AI Automation landing page.

**Architecture:** Ad copy in markdown, HTML ad creatives in gallery files per funnel (1080x1080 feed + 1080x1920 story sizes), AI Automation LP as standalone HTML. All use ZippyScale brand system.

**Tech Stack:** HTML/CSS (inline), ZippyScale design system (dark bg, lime accent, Space Grotesk/Inter/JetBrains Mono)

---

## File Structure

```
ads/
  copy.md                     (all 40 angles, full copy)
  main-lp/gallery.html        (10 creatives, feed + story sizes)
  calculator/gallery.html     (8 creatives)
  audit/gallery.html          (8 creatives)
  playbooks/gallery.html      (8 creatives)
  automation/gallery.html     (6 creatives)
automate.html                 (AI Automation landing page)
```

## Funnel URLs & Offers

| Funnel | URL | Offer | CTA |
|--------|-----|-------|-----|
| Main LP | zippyscale.in | ₹999 Growth Blueprint | Book Now |
| Calculator | zippyscale.in/calculator.html | Free Ad Spend Leak Diagnostic | Find Your Leaks |
| Audit | zippyscale.in/audit.html | Free Marketing Maturity Score | Score Your Marketing |
| Playbooks | zippyscale.in/playbook.html | Free Industry Playbook | Download Free |
| Automation | zippyscale.in/automate.html | AI Automation Setup | Get Started |

---

## Task 1: Write All 40 Ad Copy Angles

**Files:**
- Create: `ads/copy.md`

All 40 angles with: Primary Text, Headline, Description, CTA Button, Target Audience note.

### Main LP (10 angles)
1. Pain: "You spent ₹50L on marketing. Where did it go?"
2. Curiosity: "3 numbers that predict if your ad spend will 3x or burn"
3. Case Study: "₹12Cr D2C brand found ₹2.3L/mo waste in 48 hours"
4. Controversy: "Your agency shows impressions. We show revenue."
5. Educational: "Why blended ROAS is lying to you"
6. Scarcity: "10 spots this month. Data-first founders only."
7. Comparison: "Agency vs. ZippyScale: what you actually get"
8. Identity: "For founders tired of paying for marketing theater"
9. Fear of Loss: "Every month without attribution = lakhs lost"
10. Transformation: "From guessing to knowing, in 48 hours"

### Calculator (8 angles)
11. Pain: "How much of your ad spend is going to waste?"
12. Curiosity: "Can you tell which ad channel is actually making you money?"
13. Educational: "The 4 leaks bleeding your Meta/Google budget"
14. Comparison: "Your CPL vs industry average. Free check."
15. Identity: "Smart founders audit before they scale"
16. Fear of Loss: "₹2L/mo wasted is the average. What's yours?"
17. Data: "We analyzed 500 Indian ad accounts. Here's the waste pattern."
18. Quick Win: "Find your biggest ad leak in 2 minutes. Free."

### Audit (8 angles)
19. Pain: "Your marketing team says it's working. Can you verify?"
20. Curiosity: "What's your marketing maturity score? Most founders score 35/100."
21. Educational: "5 dimensions that separate ₹5Cr businesses from ₹50Cr ones"
22. Comparison: "Level 2 marketing vs Level 5. Which are you?"
23. Identity: "Founders who know their numbers grow 3x faster"
24. Challenge: "10 questions your CMO can't answer about your marketing"
25. Benchmark: "How does your marketing stack against your industry?"
26. Quick Win: "2-minute audit. Instant score. Free."

### Playbooks (8 angles)
27. Healthcare: "Healthcare marketing in India: what ₹370 CPL looks like"
28. D2C: "How Mamaearth spends ₹744Cr on ads. Your playbook inside."
29. Real Estate: "Real estate leads at ₹100-500 CPL. The channel breakdown."
30. Education: "EdTech CAC dropped 40% with this channel mix. Free playbook."
31. General: "₹10,000 of marketing research. Free for your industry."
32. Data: "CPL, CPC, ROAS benchmarks for 8 Indian industries. Free PDF."
33. Curiosity: "What your competitors spend on ads. We researched it."
34. Identity: "Data-driven founders don't guess channel allocation."

### Automation (6 angles)
35. Pain: "Your team spends 40 hours/week on tasks AI can do in 4"
36. Curiosity: "What if your ops ran on autopilot while you scaled?"
37. ROI: "₹50K/mo in AI automation replaces ₹3L/mo in manual labor"
38. Fear of Loss: "Your competitor already automated this. You're still doing it manually."
39. Transformation: "From 50 manual tasks to 5. Same team, 10x output."
40. Identity: "The ₹10Cr+ founders who automated first are pulling ahead."

---

## Task 2: Create Ad Creative Galleries (5 funnels)

Each gallery.html file contains all creatives for that funnel, displayed as cards that can be opened at exact Facebook dimensions for screenshotting.

**Creative Design System:**
- Background: #141418 (dark) or #1A1A2E (dark blue variant)
- Accent: #D5EB4B (lime)
- Headline font: Space Grotesk 700
- Body font: Inter 400/500
- Stats font: JetBrains Mono 700
- Logo: brand-assets/zippyscale-logo-for-dark-bg.png
- Sizes: 1080x1080 (feed), 1080x1920 (story)

**Creative templates per angle:**
- Big stat + headline + subtext + CTA bar
- Question hook + pain description + offer + CTA
- Before/After comparison split
- Testimonial/case study card with numbers
- Educational list (3 points) + CTA

---

## Task 3: Build AI Automation Landing Page

**Files:**
- Create: `automate.html`

**Page structure:**
1. Hero: "We Build AI Automations for Your Business" / "Cut 40 hours/week. Same team. 10x output."
2. Pain section: Manual processes killing Indian businesses (data entry, reports, follow-ups, scheduling)
3. What We Automate: Lead capture, CRM updates, reporting, email/WhatsApp, invoicing, data sync
4. How It Works: Audit → Design → Build → Deploy → Monitor
5. ROI Calculator: "Manual cost vs automation cost" simple comparison
6. Case examples (generic): "Invoice processing: 4 hours → 5 minutes" etc.
7. Pricing: "Starting ₹50K setup + ₹15K/mo management"
8. Quiz/Form: Name, Email, Phone, Business, "What do you want to automate?" (multi-select)
9. FAQ
10. Footer CTA

Form submits to n8n webhook with source: 'automation-lp'

---

## Task 4: Push to GitHub + Review

- Commit all ad assets + automation LP
- Push to GitHub Pages
- Open all galleries + automation LP in Chrome for review

---

## Execution Order (parallel)

- **Agent 1:** Write all 40 ad copy angles (ads/copy.md)
- **Agent 2:** Build main-lp + calculator + audit creative galleries (3 gallery files)
- **Agent 3:** Build playbooks + automation creative galleries (2 gallery files)
- **Agent 4:** Build AI Automation landing page (automate.html)
