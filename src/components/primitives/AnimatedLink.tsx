import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface AnimatedLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  children: ReactNode
  /** Show an underline that grows from left on hover. */
  underline?: boolean
  /** External links open a new tab with rel guards (default). Pass `false` for
   *  same-tab destinations like `mailto:`. */
  external?: boolean
  className?: string
}

/**
 * The most-used interaction on the site: a link whose color eases to `accent`
 * on hover. Optional growing underline for inline emphasis. All transitions
 * are plain CSS (the design's `.3s` color ease) — no JS needed.
 */
export function AnimatedLink({
  href,
  children,
  underline = false,
  external = true,
  className,
  ...rest
}: AnimatedLinkProps) {
  return (
    <a
      href={href}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      className={cn(
        'font-body text-ui font-medium text-accent transition-colors duration-fast ease-standard hover:text-accent-3',
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
