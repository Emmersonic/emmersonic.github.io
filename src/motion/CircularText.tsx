import type { CSSProperties } from 'react'
import { cn } from '@/lib/cn'

interface CircularTextProps {
  /** Text laid out around the ring. Repeats once around the full circle. */
  text: string
  /** Seconds for one full revolution. */
  spinDuration?: number
  /** Ring radius in px — how far each letter sits from the centre. */
  radius?: number
  className?: string
}

/**
 * Reactbits-style ring of text that rotates forever. Each character is
 * absolutely placed at its angle around the circle; the ring itself spins via
 * a compositor-only CSS animation (`animate-circular-spin`, defined in
 * globals.css) rather than main-thread JS, so it costs nothing while
 * off-screen. Hovering pauses the spin (`:hover { animation-play-state:
 * paused }`); `prefers-reduced-motion` is handled by the sitewide rule in
 * globals.css.
 */
export function CircularText({ text, spinDuration = 20, radius = 70, className }: CircularTextProps) {
  const letters = Array.from(text)

  return (
    <div
      aria-hidden
      className={cn('relative size-full origin-center animate-circular-spin', className)}
      style={{ '--spin-duration': `${spinDuration}s` } as CSSProperties}
    >
      {letters.map((letter, i) => {
        const deg = (360 / letters.length) * i
        // Centre each glyph on the spoke (translate -50%/-50%), swing it around
        // the ring centre (rotate), then push it out to the radius. Centring the
        // box — not its corner — keeps the angular spacing even, like the example.
        const transform = `translate(-50%, -50%) rotate(${deg}deg) translateY(-${radius}px)`
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 inline-block leading-none"
            style={{ transform }}
          >
            {letter}
          </span>
        )
      })}
    </div>
  )
}
