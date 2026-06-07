import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface AnimatedLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  children: ReactNode
  /** Show an underline that grows from left on hover. */
  underline?: boolean
  className?: string
}

/**
 * The most-used interaction on the site: an external link whose color eases to
 * `accent` on hover. Optional growing underline for inline emphasis. All
 * transitions are plain CSS (the design's `.3s` color ease) — no JS needed.
 */
export function AnimatedLink({
  href,
  children,
  underline = false,
  className,
  ...rest
}: AnimatedLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'text-ink transition-colors duration-fast ease-standard hover:text-accent',
        underline && 'group relative inline-flex',
        className
      )}
      {...rest}
    >
      {children}
      {underline && (
        <span
          aria-hidden
          className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-fast ease-standard group-hover:scale-x-100"
        />
      )}
    </a>
  )
}
