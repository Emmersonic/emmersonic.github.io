import { motion, useReducedMotion } from 'motion/react'
import type { ElementType, ReactNode } from 'react'
import { springCard } from './motionConfig'

interface RevealProps {
  children: ReactNode
  /** Start offset in px. Cards use 50; hero text uses 70 (matches the live site). */
  y?: number
  /** Cascade delay in seconds — how the staggered load sequence is built. */
  delay?: number
  /** Element to render (e.g. 'section', 'li'). Defaults to 'div'. */
  as?: ElementType
  className?: string
}

/**
 * The single entrance wrapper. Mirrors the live site's Framer "appear" model:
 * everything animates once **on load** (not on scroll) as a staggered spring
 * cascade. `prefers-reduced-motion` renders the element statically.
 */
export function Reveal({ children, y = 50, delay = 0, as = 'div', className }: RevealProps) {
  const reduced = useReducedMotion()

  if (reduced) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  // motion's proxy resolves any intrinsic tag string (motion.div, motion.section, …).
  const MotionTag = motion[as as 'div']

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0.001, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springCard, delay }}
    >
      {children}
    </MotionTag>
  )
}
