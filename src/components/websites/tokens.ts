/**
 * Design tokens for /websites. Same family as the homepage (kinetic.tsx easing,
 * Space Grotesk 700 display, Inter body, JetBrains Mono labels); brand lime + black
 * per the ZippyScale identity. Lime is a fill or an accent on ink, never text on white.
 */
export { EASE_OUT } from '../growth/kinetic'
export const LIME = '#D9EA66'
export const INK = '#111111'
export const INK_2 = '#1A1A1D'
export const BONE = '#F5F5F0'
export const SPRING = { type: 'spring', stiffness: 380, damping: 30 } as const
export const MONO = "font-['JetBrains_Mono']"
export const DISPLAY_FONT = "font-['Space_Grotesk'] font-bold"

/* Phones only (below 640px): a card grid becomes a swipe row, the next card peeking in.
   Desktop and tablet keep their grids untouched. */
export const SWIPE = 'max-sm:relative max-sm:-mx-4 max-sm:flex max-sm:snap-x max-sm:snap-mandatory max-sm:items-stretch max-sm:gap-3 max-sm:overflow-x-auto max-sm:scroll-px-4 max-sm:px-4 max-sm:pb-2 max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden'
export const SLIDE = 'max-sm:w-[84%] max-sm:shrink-0 max-sm:snap-start'
/** Same swipe row for pages whose gutter is 20px (the Band wrapper's px-5). */
export const SWIPE_5 = SWIPE.replace('max-sm:-mx-4', 'max-sm:-mx-5').replace('max-sm:scroll-px-4', 'max-sm:scroll-px-5').replace('max-sm:px-4', 'max-sm:px-5')
