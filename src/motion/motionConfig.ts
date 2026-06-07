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
 * Springs lifted verbatim from the live site's Framer `appear` JSON.
 * `hero` drives the whole header unit's drop-in; `card` drives every other
 * entrance (text, cards, sidebar).
 */
export const springHero = { type: 'spring', stiffness: 293, damping: 79, mass: 3.2 } as const
export const springCard = { type: 'spring', stiffness: 500, damping: 60, mass: 1 } as const

export { useReducedMotion }
