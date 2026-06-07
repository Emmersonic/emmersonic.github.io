import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type TextVariant = 'hero' | 'hiya' | 'lead' | 'serif' | 'kicker' | 'ui' | 'meta'

interface TextProps {
  children: ReactNode
  /** Element to render. Defaults to 'p'. */
  as?: ElementType
  /** Typographic role — maps to the site's type scale + font. */
  variant: TextVariant
  className?: string
}

/**
 * Variant → token classes, matching the live site's real roles. Color/weight
 * can be overridden via `className` (e.g. white text on the dark/gold cards).
 */
const variantClasses: Record<TextVariant, string> = {
  hero: 'font-display text-hero font-normal text-ink-strong', // 56px serif hero statement
  hiya: 'font-display text-hiya font-medium', // 28px serif greeting
  lead: 'font-display text-lead font-normal text-ink-strong', // 20px serif lead / footer
  serif: 'font-display text-serif font-normal text-ink-strong', // 16px serif body
  kicker: 'font-body text-kicker uppercase text-ink-muted', // Inter 12 / lh24 / +1.2px tracked gray eyebrow
  ui: 'font-body text-ui font-medium', // 14px Inter links/labels
  meta: 'font-body text-meta text-ink-muted', // 12px Inter meta/desc
}

/**
 * The one typographic primitive. Picks the right font + size + default color
 * for a given role; consumers pass `as` for semantics and `className` to tweak.
 */
export function Text({ children, as, variant, className, ...rest }: TextProps) {
  const Tag = as ?? 'p'
  return (
    <Tag className={cn(variantClasses[variant], className)} {...rest}>
      {children}
    </Tag>
  )
}
