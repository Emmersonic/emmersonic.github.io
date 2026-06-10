import { useCallback, useEffect, useMemo, useRef } from 'react'
import { motion, useAnimation, useInView, useMotionValue, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'

type HoverMode = 'speedUp' | 'slowDown' | 'pause' | 'goBonkers'

const SPRING = { type: 'spring' as const, damping: 20, stiffness: 300 }

interface CircularTextProps {
  /** Text laid out around the ring. Repeats once around the full circle. */
  text: string
  /** Seconds for one full revolution. */
  spinDuration?: number
  /** What hovering does. Defaults to pausing the spin. */
  onHover?: HoverMode
  /** Ring radius in px — how far each letter sits from the centre. */
  radius?: number
  className?: string
}

const rotationTween = (duration: number, from: number) => ({
  from,
  to: from + 360,
  ease: 'linear' as const,
  duration,
  type: 'tween' as const,
  repeat: Infinity,
})

const getTransition = (duration: number, from: number) => ({
  rotate: rotationTween(duration, from),
  scale: SPRING,
})

/**
 * Reactbits-style ring of text that rotates forever. Each character is
 * absolutely placed at its angle around the circle. Hovering changes the
 * spin (pause by default). `prefers-reduced-motion` renders a static ring.
 */
export function CircularText({
  text,
  spinDuration = 20,
  onHover = 'pause',
  radius = 70,
  className,
}: CircularTextProps) {
  const letters = useMemo(() => Array.from(text), [text])
  const controls = useAnimation()
  const rotation = useMotionValue(0)
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  // The tween is JS-driven (main-thread work every frame, forever) — park it
  // while the ring is scrolled out of view and resume from the same angle.
  const inView = useInView(ref)

  // Restart the steady forever-spin from the current angle (mount, scroll back
  // into view, and after hover).
  const startSpin = useCallback(() => {
    const start = rotation.get()
    controls.start({
      rotate: start + 360,
      scale: 1,
      transition: getTransition(spinDuration, start),
    })
  }, [controls, rotation, spinDuration])

  useEffect(() => {
    if (reduced) return
    if (!inView) {
      controls.stop()
      return
    }
    startSpin()
  }, [reduced, inView, controls, startSpin])

  const handleHoverStart = () => {
    if (reduced || !onHover) return
    const start = rotation.get()
    let transition
    let scale = 1
    switch (onHover) {
      case 'slowDown':
        transition = getTransition(spinDuration * 2, start)
        break
      case 'speedUp':
        transition = getTransition(spinDuration / 4, start)
        break
      case 'goBonkers':
        transition = getTransition(spinDuration / 20, start)
        scale = 0.8
        break
      case 'pause':
      default:
        transition = { rotate: SPRING, scale: SPRING }
    }
    controls.start({ rotate: start + 360, scale, transition })
  }

  const handleHoverEnd = () => {
    if (reduced) return
    startSpin()
  }

  return (
    <motion.div
      ref={ref}
      aria-hidden
      className={cn('relative size-full origin-center', className)}
      style={{ rotate: rotation }}
      initial={{ rotate: 0 }}
      animate={controls}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
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
    </motion.div>
  )
}
