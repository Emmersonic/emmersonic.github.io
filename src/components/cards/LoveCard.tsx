import { cn } from '@/lib/cn'
import { AnimatedLink, Text } from '@/components/primitives'

interface LoveItem {
  name: string
  href: string
  desc: string
}

interface LoveCardProps {
  label: string
  items: LoveItem[]
  /** Card colour — gold (Tools) or blue (Sites), matching the live site. */
  tone?: 'gold' | 'blue'
  className?: string
}

/**
 * Solid gold card with white text, as on the live site. A vertical rotated
 * label ("TOOLS I LOVE" / "SITES I LOVE") sits on the right edge reading
 * bottom-to-top, beside a stack of external links (underlined name + muted
 * one-line description). Right padding keeps the items clear of the label.
 */
export function LoveCard({ label, items, tone = 'gold', className }: LoveCardProps) {
  return (
    <div
      className={cn(
        'relative h-full overflow-hidden rounded-card p-8 pr-14 tablet:p-11 tablet:pr-16 text-white',
        tone === 'blue' ? 'bg-accent' : 'bg-gold-1',
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute right-7 top-1/2 -translate-y-1/2 text-center font-display font-medium text-kicker uppercase text-white [writing-mode:vertical-rl]"
      >
        {label}
      </span>

      <ul className="space-y-6">
        {items.map((item) => (
          <li key={item.name}>
            <AnimatedLink href={item.href} underline className="text-white hover:text-white">
              {item.name}
            </AnimatedLink>
            <Text as="p" variant="meta" className="mt-1 max-w-[42ch] text-white/80">
              {item.desc}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  )
}
