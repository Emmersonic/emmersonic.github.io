import { useRef, type AnchorHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface AnimatedLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  children: ReactNode
  /** External links open a new tab with rel guards (default). Pass `false` for
   *  same-tab destinations like `mailto:`. */
  external?: boolean
  className?: string
}

const EASE = 'clip-path 350ms cubic-bezier(0.44,0,0.56,1)'

export function AnimatedLink({
  href,
  children,
  external = true,
  className,
  // Consumed so they don't conflict with the sweep handlers below.
  onMouseEnter: _ome,
  onMouseLeave: _oml,
  ...rest
}: AnimatedLinkProps) {
  const sweepRef = useRef<HTMLSpanElement>(null)

  function handleEnter() {
    const el = sweepRef.current
    if (!el) return
    // Snap to right-clipped (no transition), then animate open left → right.
    el.style.transition = 'none'
    el.style.clipPath = 'inset(0 100% 0 0)'
    el.getBoundingClientRect() // force reflow so the snap registers
    el.style.transition = EASE
    el.style.clipPath = 'inset(0 0% 0 0%)'
  }

  function handleLeave() {
    const el = sweepRef.current
    if (!el) return
    // Animate to left-clipped — exits left → right.
    el.style.transition = EASE
    el.style.clipPath = 'inset(0 0% 0 100%)'
  }

  return (
    <a
      href={href}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={cn(
        'group relative inline-block font-body text-ui font-medium',
        'text-[#8a6642] hover:text-[#a07850] [transition:color_350ms_cubic-bezier(0.44,0,0.56,1)]',
        className
      )}
      {...rest}
    >
      {children}
      {/* Faint dotted underline — always visible at rest */}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-0 w-full border-b-2 border-dotted border-[#c4bbb0]"
      />
      {/* Active sweep — JS controls clip-path for asymmetric in/out directions */}
      <span
        ref={sweepRef}
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-0 w-full border-b-2 border-dotted border-[#8a6642] [clip-path:inset(0_100%_0_0)]"
      />
    </a>
  )
}
