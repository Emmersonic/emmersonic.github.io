import { useState } from 'react'
import { useMotionValueEvent, useScroll } from 'motion/react'

/**
 * The fixed progressive-blur strip at the top of the page (the live site's
 * Framer "Blur" element). Four stacked backdrop-filter layers, each masked to
 * fade out at a staggered stop, so the blur is strongest at the very top edge
 * and clears by ~87% down — content frosts progressively as it scrolls under.
 * Decorative and non-interactive. Values lifted from the live site.
 */
const layers = [
  { blur: 30, stop: 19.9 },
  { blur: 15, stop: 39.3 },
  { blur: 8, stop: 56.9 },
  { blur: 2, stop: 86.7 },
]

/**
 * Perf gate: at scrollY === 0 the hero panel top is flush with the viewport,
 * so there's nothing under the strip for these 4 backdrop-filter layers to
 * frost — they're visually inert. Backdrop blur re-samples its backdrop every
 * frame content moves under it, so paying for 4 stacked passes (30/15/8/2px)
 * during the hero's load animation is pure waste. Mount the layers only once
 * the page has scrolled past the top; unmount them again if it returns to 0.
 * This is a no-op on the scrolled appearance — same layers, same stops.
 *
 * Reuses the app's existing window-scroll tracking (the same `useScroll()`
 * from motion/react used in App.tsx/Hero.tsx) rather than adding a second,
 * competing native scroll listener.
 */
export function TopBlur() {
  const { scrollY } = useScroll()
  const [atTop, setAtTop] = useState(() => (typeof window === 'undefined' ? true : window.scrollY <= 0))

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setAtTop(latest <= 0)
  })

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[224px]">
      {!atTop &&
        layers.map((l) => (
          <div
            key={l.blur}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${l.blur}px)`,
              WebkitBackdropFilter: `blur(${l.blur}px)`,
              maskImage: `linear-gradient(#000 0%, transparent ${l.stop}%)`,
              WebkitMaskImage: `linear-gradient(#000 0%, transparent ${l.stop}%)`,
            }}
          />
        ))}
    </div>
  )
}
