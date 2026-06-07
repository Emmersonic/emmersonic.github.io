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
  className?: string
}

/**
 * Solid gold card with white text, as on the live site. A vertical rotated
 * label ("TOOLS I LOVE" / "SITES I LOVE") sits on the right edge reading
 * bottom-to-top, beside a stack of external links (underlined name + muted
 * one-line description). Right padding keeps the items clear of the label.
 */
export function LoveCard({ label, items, className }: LoveCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-card bg-gold-1 p-8 pr-14 tablet:p-11 tablet:pr-16 text-white',
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-8 right-5 font-wide font-stretch-wide text-kicker uppercase tracking-[0.12em] text-white/70 [writing-mode:vertical-rl] rotate-180"
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
