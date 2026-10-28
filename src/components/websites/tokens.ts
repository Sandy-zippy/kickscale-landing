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
