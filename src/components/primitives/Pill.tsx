import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface PillProps {
  children: ReactNode
  /** Static tilt in degrees (e.g. -4). Applied as an inline transform. */
  rotate?: number
  /**
   * Background color. Accepts any CSS color string (e.g. '#fbd', 'var(--swatch-peach)').
   * Leave undefined to use the default `bg-paper-2`.
   */
  color?: string
  className?: string
  style?: CSSProperties
}

/**
 * A rounded sticker/tag. Used for scattered, lightly-rotated labels around the
 * editorial layout. `rotate` tilts it; `color` overrides the default warm bg.
 */
export function Pill({ children, rotate, color, className, style }: PillProps) {
  const mergedStyle: CSSProperties = {
    ...style,
    ...(rotate !== undefined ? { transform: `rotate(${rotate}deg)` } : null),
    ...(color !== undefined ? { backgroundColor: color } : null),
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-3 py-1 text-label',
        color === undefined && 'bg-paper-2',
        className
      )}
      style={mergedStyle}
    >
      {children}
    </span>
  )
}
