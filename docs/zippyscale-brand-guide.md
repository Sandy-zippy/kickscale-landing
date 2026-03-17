# ZippyScale Brand Identity Guide v2

**Version:** 2.0
**Date:** March 17, 2026
**Status:** Active

---

## Brand Positioning

**For** growth-stage Indian businesses doing ₹5Cr+ revenue
**Who** are frustrated with marketing agencies that can't prove ROI
**ZippyScale is** the growth marketing partner
**That** delivers attribution clarity and predictable scaling
**Because** we fix tracking before spending and focus on revenue, not vanity metrics

**Tagline:** Data Finds Money. AI Multiplies It.
**Secondary:** We make founders Money. FAST.
**Scarcity:** Selective Partnership | 10 spots

---

## Brand Personality

**Archetype:** Sage (data expertise) + Magician (transformative results)

**Personality Spectrum:**
- Formal 3 ←→ 7 Casual
- Traditional 2 ←→ 8 Modern
- Serious 4 ←→ 6 Playful
- Reserved 2 ←→ 8 Bold
- Corporate 3 ←→ 7 Friendly

**Voice Attributes:** Confident, Data-Driven, Direct, Bold, Approachable

---

## Color System

### Dark Mode (Primary)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-dark` | #141418 | Page background (dark sections) |
| `--bg-dark-elevated` | #1E1E24 | Cards, surfaces |
| `--bg-dark-border` | #2E2E36 | Borders, dividers |
| `--text-on-dark` | #FAFAFA | Primary text |
| `--text-on-dark-secondary` | #9CA3AF | Secondary text |
| `--text-on-dark-muted` | #6B7280 | Muted/tertiary text |

### Light Mode (Alternating Sections)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-light` | #F8F9FA | Page background (light sections) |
| `--bg-light-card` | #FFFFFF | Cards, surfaces |
| `--bg-light-border` | #E5E7EB | Borders, dividers |
| `--text-on-light` | #111827 | Primary text |
| `--text-on-light-secondary` | #4B5563 | Secondary text |
| `--text-on-light-muted` | #9CA3AF | Muted text |

### Accent Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--lime` | #D5EB4B | Primary accent, CTAs, highlights |
| `--lime-hover` | #E4F57A | Hover states |
| `--lime-dark` | #B8CF2E | Text on light backgrounds |
| `--lime-glow` | rgba(213,235,75,0.12) | Glows, subtle backgrounds |
| `--green` | #22C55E | Success, guarantee |
| `--red` | #EF4444 | Errors, pain points |

### Color Ratio

- 60% Neutral (dark bg + light bg alternating)
- 30% Supporting (card surfaces, borders)
- 10% Accent (lime CTAs, highlights)

---

## Typography

### Font Stack

| Role | Font | Weights | Fallback |
|------|------|---------|----------|
| Headlines | Space Grotesk | 500, 600, 700 | system-ui, sans-serif |
| Body | Inter | 400, 500, 600 | system-ui, sans-serif |
| Data/Stats | JetBrains Mono | 500, 700 | monospace |

### Type Scale

| Element | Size | Weight | Font |
|---------|------|--------|------|
| Display (hero) | clamp(36px, 6vw, 64px) | 700 | Space Grotesk |
| H2 (sections) | clamp(28px, 4vw, 42px) | 700 | Space Grotesk |
| H3 (cards) | 18-20px | 600 | Space Grotesk |
| Body | 16px | 400 | Inter |
| Small | 14px | 400 | Inter |
| Tiny | 12-13px | 500 | Inter |
| Stats | 28-48px | 700 | JetBrains Mono |
| Labels | 12px, uppercase, 2px tracking | 700 | Space Grotesk |

### Line Heights

- Headlines: 1.1 to 1.2
- Body: 1.6
- Small: 1.4

---

## Logo

### Primary (Combination Mark)

Symbol: Stylized "Z" formed by an upward-trending data pulse line with a node at peak. Represents speed (zigzag), growth (upward), and data (node/point).

Wordmark: "ZippyScale" in Space Grotesk Bold.

### Variants

1. **Full logo:** Symbol + Wordmark (horizontal)
2. **Symbol only:** For favicon, app icon, social profile pictures
3. **Wordmark only:** For horizontal tight spaces

### Logo Colors

- On dark backgrounds: Lime (#D5EB4B)
- On light backgrounds: Dark (#141418)
- Monochrome: White or Black

### Clear Space

Minimum clear space = height of the "Z" symbol on all sides.

### Minimum Size

- Symbol only: 24px
- Full logo: 120px wide

---

## Section Layout Pattern

Landing pages use **alternating dark/light sections** for visual rhythm:

```
Dark  → Hero
Light → Problem/Pain
Dark  → Solution
Light → How It Works
Dark  → Social Proof
Light → Team/Founder
Dark  → Offer/Pricing
Light → Guarantee
Dark  → Quiz/Form
Light → FAQ
Dark  → Final CTA
Dark  → Footer
```

---

## Motion & Animation

- **Scroll reveals:** Fade-in-up with 20px offset, 0.6s duration, staggered 100ms per card
- **Stat counters:** Animated count-up on viewport entry
- **Hover states:** translateY(-2px) + shadow increase, 0.2s ease
- **Gradient borders:** Animated border on key containers (offer box, quiz)
- **No autoplaying video backgrounds.** Performance first.

---

## Voice & Tone

### We ARE:
- Direct, clear, no jargon
- Data-backed, specific with numbers
- Confident but not arrogant
- Concise (half the words)

### We are NOT:
- Buzzword-heavy ("synergy", "leverage", "paradigm")
- Vague ("industry-leading", "best-in-class")
- Aggressive or confrontational
- Using em dashes or dash dividers

### By Context:
- **Website:** Confident + Bold
- **Social:** Confident + Playful
- **Ads:** Pain-aware + Direct
- **Email:** Helpful + Concise
- **Sales:** Authoritative + Empathetic

---

## Digital Applications

### Email Signature
```
[Name] | ZippyScale
[Role]
hello@zippyscale.in | zippyscale.in
```

### Social Media Profile
Bio structure (4 elements):
1. Identity: Growth marketing for ₹5Cr+ businesses
2. Differentiator: Attribution-first, AI-powered
3. Filter: Selective Partnership | 10 spots
4. CTA: Link to quiz/LP

### Instagram Embed
Embed @zippy.scale feed on landing page as social proof.
