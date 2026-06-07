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

export { useReducedMotion }
