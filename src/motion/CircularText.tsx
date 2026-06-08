import { useEffect } from 'react'
import { motion, useAnimation, useMotionValue, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'

type HoverMode = 'speedUp' | 'slowDown' | 'pause' | 'goBonkers'

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
  scale: { type: 'spring' as const, damping: 20, stiffness: 300 },
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
  const letters = Array.from(text)
  const controls = useAnimation()
  const rotation = useMotionValue(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const start = rotation.get()
    controls.start({
      rotate: start + 360,
      scale: 1,
      transition: getTransition(spinDuration, start),
    })
  }, [spinDuration, text, reduced, controls, rotation])

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
        transition = {
          rotate: { type: 'spring' as const, damping: 20, stiffness: 300 },
          scale: { type: 'spring' as const, damping: 20, stiffness: 300 },
        }
    }
    controls.start({ rotate: start + 360, scale, transition })
  }

  const handleHoverEnd = () => {
    if (reduced) return
    const start = rotation.get()
    controls.start({
      rotate: start + 360,
      scale: 1,
      transition: getTransition(spinDuration, start),
    })
  }

  return (
    <motion.div
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
