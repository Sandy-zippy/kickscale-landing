/**
 * CSS the homepage redesign needs and nothing else uses. It lives here rather than in
 * globals.css because globals.css is shared with /agency and /giveaways, and nothing
 * on those pages should change because the homepage did.
 *
 * Reduced motion: shimmer and the underline draw are light changing in place, so they
 * stay. Only the grain shift (a full-screen jitter) is switched off.
 */
export default function CockpitStyles() {
  return (
    <style>{`
@keyframes zs-shine {
  0%   { background-position: 160% 0; }
  55%  { background-position: -60% 0; }
  100% { background-position: -60% 0; }
}
.zs-shine {
  background-image: linear-gradient(110deg, transparent 38%, rgba(255,255,255,0.55) 50%, transparent 62%);
  background-size: 220% 100%;
  background-repeat: no-repeat;
  animation: zs-shine 3.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
.zs-shine-ink {
  background-image: linear-gradient(110deg, transparent 38%, rgba(213,235,75,0.35) 50%, transparent 62%);
}

/* nav links on the homepage: a lime line draws in under the word */
.zs-navlink { position: relative; }
.zs-navlink::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: -6px; height: 2px;
  border-radius: 2px; background: #D5EB4B;
  transform: scaleX(0); transform-origin: left;
  transition: transform .35s cubic-bezier(0.16, 1, 0.3, 1);
}
.zs-navlink:hover::after, .zs-navlink:focus-visible::after { transform: scaleX(1); }

/* film grain over the ink hero, so the black has depth instead of being flat */
@keyframes zs-grain {
  0%, 100% { transform: translate3d(0, 0, 0); }
  25% { transform: translate3d(-2%, 1%, 0); }
  50% { transform: translate3d(1%, -2%, 0); }
  75% { transform: translate3d(2%, 2%, 0); }
}
.zs-grain {
  position: absolute; inset: -10%; pointer-events: none; opacity: .07; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: zs-grain 1.2s steps(4) infinite;
}

@media (prefers-reduced-motion: reduce) {
  .zs-grain { animation: none; }
}
`}</style>
  )
}
