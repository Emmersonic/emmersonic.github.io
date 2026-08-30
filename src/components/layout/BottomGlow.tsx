import { useTransform, useScroll, motion } from 'motion/react'

/**
 * Soft radial brown glow pinned to the bottom of the viewport. Fixed (not
 * scrolled with content); drifts by only ~50px across the whole page
 * (a fraction of actual scroll travel) so it reads as a backdrop layer
 * sitting behind the content rather than an element scrolling with it.
 * Fades in as the page nears the bottom of its scroll range. Both driven
 * directly off scroll progress (no spring/easing) so neither reads as a
 * triggered animation.
 *
 * Hidden below `tablet` — iOS Safari's dynamic toolbar resizes the vh
 * viewport under a `fixed` element, exposing a gap under the glow.
 */
export function BottomGlow() {
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0.75, 1], [0, 1])
  const y = useTransform(scrollYProgress, [0, 1], [40, 0])

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[-1] hidden h-[60vh] tablet:block"
      style={{
        opacity,
        y,
        background:
          'radial-gradient(55% 85% at 0% 100%, rgba(145, 110, 73, 0.25) 0%, transparent 70%), ' +
          'radial-gradient(55% 85% at 100% 100%, rgba(145, 110, 73, 0.25) 0%, transparent 70%), ' +
          'radial-gradient(60% 45% at 50% 100%, rgba(145, 110, 73, 0.18) 0%, transparent 70%)',
      }}
    />
  )
}
