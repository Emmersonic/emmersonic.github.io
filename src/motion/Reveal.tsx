import { motion, useReducedMotion } from 'motion/react'
import type { ElementType, ReactNode } from 'react'
import { durations, easeStandard } from './motionConfig'

interface RevealProps {
  children: ReactNode
  /** Start offset in px. Sections use 50; larger blocks 70. */
  y?: number
  /** Delay for stagger (seconds). */
  delay?: number
  /** Animate only the first time it enters the viewport. */
  once?: boolean
  /** Element to render (e.g. 'section', 'li'). Defaults to 'div'. */
  as?: ElementType
  className?: string
}

/**
 * The single scroll/load reveal wrapper. All entrance motion goes through here
 * so behavior is consistent and `prefers-reduced-motion` is handled in one place.
 */
export function Reveal({
  children,
  y = 50,
  delay = 0,
  once = true,
  as = 'div',
  className,
}: RevealProps) {
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
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-10% 0px' }}
      transition={{ duration: durations.reveal, ease: easeStandard, delay }}
    >
      {children}
    </MotionTag>
  )
}
