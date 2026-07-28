import { CLIENTS } from '../../data/growth'

/**
 * Continuous logo marquee — replaces the 4x4 static grid, which ate a screen
 * of vertical space to say one thing.
 *
 * Two rows travelling in opposite directions. Each track holds the row twice
 * and translates exactly -50%, so the second copy lands where the first began
 * and the loop is seamless. CSS animation rather than JS/framer: this runs for
 * the life of the page and belongs on the compositor.
 *
 * Hovering pauses both rows (and the hovered tile lifts) so a visitor can
 * actually read a logo that caught their eye.
 */

const ROW_A = CLIENTS.slice(0, 7)
const ROW_B = CLIENTS.slice(7)

function Tile({ slug, name, vertical }: { slug: string; name: string; vertical: string }) {
  return (
    <div
      title={`${name} — ${vertical}`}
      className="group/tile mx-3 flex h-[88px] w-[190px] shrink-0 items-center justify-center rounded-[14px] border border-white/80 bg-white/75 px-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#D5EB4B]"
      style={{ boxShadow: '0 20px 50px -38px rgba(52,69,92,0.5), inset 0 1px 0 rgba(255,255,255,0.86)' }}
    >
      <img
        src={`/logos/clients/${slug}.png`}
        alt={name}
        /* not lazy: the belt scrolls tiles in from off-screen, so a lazy image
           pops in as an empty card. All 13 are ~165KB total and every one is
           guaranteed to be shown, so load them up front. Both copies share the
           same URLs, so each file is still fetched only once. */
        decoding="async"
        className="max-h-10 w-auto object-contain opacity-90 transition-opacity duration-300 group-hover/tile:opacity-100"
      />
    </div>
  )
}

function Row({ items, reverse = false, seconds }: { items: typeof CLIENTS; reverse?: boolean; seconds: number }) {
  return (
    <div className="zs-marquee flex w-max" style={{ animationDuration: `${seconds}s`, animationDirection: reverse ? 'reverse' : 'normal' }}>
      {/* the row, twice — the animation moves exactly one copy's width */}
      {[0, 1].map(copy => (
        <div key={copy} className="flex" aria-hidden={copy === 1}>
          {items.map(c => <Tile key={`${copy}-${c.slug}`} {...c} />)}
        </div>
      ))}
    </div>
  )
}

export default function ClientMarquee() {
  return (
    <div
      className="zs-marquee-mask group relative -mx-5 space-y-4 overflow-hidden py-2"
      role="list"
      aria-label="Clients we build for"
    >
      <Row items={ROW_A} seconds={44} />
      <Row items={ROW_B} seconds={38} reverse />
    </div>
  )
}
