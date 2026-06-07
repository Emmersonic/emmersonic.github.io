import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Blur = 'sm' | 'md' | 'lg'

interface GlassCardProps {
  children: ReactNode
  /** Backdrop blur strength. Defaults to 'md'. */
  blur?: Blur
  /** Overlay a soft gold sheen across the surface. */
  sheen?: boolean
  /** Element to render. Defaults to 'div'. */
  as?: ElementType
  className?: string
}

const blurClasses: Record<Blur, string> = {
  sm: 'backdrop-blur-glass-sm',
  md: 'backdrop-blur-glass-md',
  lg: 'backdrop-blur-glass-lg',
}

/**
 * Glassmorphic container: warm translucent fill, hairline border, and a
 * backdrop blur. With `sheen`, a gold gradient is layered on top (clipped to
 * the card radius and non-interactive).
 */
export function GlassCard({ children, blur = 'md', sheen = false, as, className }: GlassCardProps) {
  const Tag = as ?? 'div'
  return (
    <Tag
      className={cn(
        'rounded-card border border-hairline/40 bg-paper-1/70',
        blurClasses[blur],
        sheen && 'relative overflow-hidden',
        className
      )}
    >
      {sheen && (
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-card bg-sheen-gold" />
      )}
      {children}
    </Tag>
  )
}
