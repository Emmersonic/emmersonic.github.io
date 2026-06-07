import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type TextVariant = 'display' | 'title' | 'kicker' | 'body-l' | 'body' | 'label'

interface TextProps {
  children: ReactNode
  /** Element to render. Defaults to 'p'. */
  as?: ElementType
  /** Typographic role — maps to the site's type scale + font. */
  variant: TextVariant
  className?: string
}

/** Variant → token classes. Color/weight can be overridden via `className`. */
const variantClasses: Record<TextVariant, string> = {
  display: 'font-display text-display-xl font-semibold text-ink-strong',
  title: 'font-display text-display-l font-semibold text-ink-strong',
  kicker: 'font-wide font-stretch-wide text-kicker uppercase text-ink-muted',
  'body-l': 'font-body text-body-l text-ink-muted',
  body: 'font-body text-body text-ink-muted',
  label: 'font-body text-label text-ink-muted',
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
