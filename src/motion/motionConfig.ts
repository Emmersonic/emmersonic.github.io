import { useReducedMotion } from 'motion/react'

/** Global easing curve extracted from the live site: cubic-bezier(.44,0,.56,1). */
export const easeStandard = [0.44, 0, 0.56, 1] as const

export const durations = {
  /** Hover / color transitions — matches `.3s` on the live site. */
  fast: 0.3,
  /** Scroll-reveal entrance. */
  reveal: 0.6,
} as const

/** Stagger step between sequential children (seconds). */
export const staggerStep = 0.08

/**
 * The load cascade (seconds): when each section's Reveal starts. The page
 * animates once on load; this is the single place the choreography lives —
 * reorder sections by editing here, not by hunting magic delays.
 * Sidebar blocks start at `sidebar` and stagger by {@link staggerStep}.
 */
export const revealAt = {
  about: 1.0,
  knownFor: 1.25,
  sidebar: 1.3,
  tools: 1.45,
  sites: 1.6,
  footer: 1.75,
} as const

/**
 * Springs lifted verbatim from the live site's Framer `appear` JSON.
 * `hero` drives the whole header unit's drop-in; `card` drives every other
 * entrance (text, cards, sidebar).
 */
export const springHero = { type: 'spring', stiffness: 293, damping: 79, mass: 3.2 } as const
export const springCard = { type: 'spring', stiffness: 500, damping: 60, mass: 1 } as const

export { useReducedMotion }
