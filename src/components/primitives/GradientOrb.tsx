import { motion, useReducedMotion } from 'motion/react'
import type { CSSProperties } from 'react'
import { cn } from '@/lib/cn'

type OrbVariant = 'blue' | 'peach' | 'gold'

interface GradientOrbProps {
  /** Which decorative gradient to use. */
  variant: OrbVariant
  /** Diameter. Number → px, or any CSS length string. Defaults to 480. */
  size?: number | string
  /** Blur radius in px. Defaults to 30. */
  blur?: number
  className?: string
  style?: CSSProperties
}

const variantClasses: Record<OrbVariant, string> = {
  blue: 'bg-orb-blue',
  peach: 'bg-orb-peach',
  gold: 'bg-orb-gold',
}

/**
 * A purely decorative, blurred radial blob that slowly drifts behind content.
 * Position is the caller's job (pass `top-…`/`left-…` via className or `style`).
 * Honors `prefers-reduced-motion` by rendering a static blob.
 */
export function GradientOrb({ variant, size = 480, blur = 30, className, style }: GradientOrbProps) {
  const reduced = useReducedMotion()

  const dimension = typeof size === 'number' ? `${size}px` : size
  const mergedStyle: CSSProperties = {
    width: dimension,
    height: dimension,
    filter: `blur(${blur}px)`,
    ...style,
  }

  const classes = cn(
    'pointer-events-none absolute rounded-full',
    variantClasses[variant],
    className
  )

  if (reduced) {
    return <div aria-hidden className={classes} style={mergedStyle} />
  }

  return (
    <motion.div
      aria-hidden
      className={classes}
      style={mergedStyle}
      animate={{ x: [0, 20, -10, 0], y: [0, -15, 10, 0] }}
      transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}
