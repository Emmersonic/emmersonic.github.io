import { cn } from '@/lib/cn'
import { AnimatedLink, Card, Text } from '@/components/primitives'
import { CircularText } from '@/motion/CircularText'

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
  /** 'vertical' = rotated edge label (live site). 'circular' = spinning ring. */
  labelVariant?: 'vertical' | 'circular'
  className?: string
}

/**
 * White card with dark text. A vertical rotated label ("TOOLS I LOVE" /
 * "SITES I LOVE") sits on the right edge reading bottom-to-top, tinted by tone
 * (gold for Tools, blue for Sites), beside a stack of external links (tone-
 * coloured name + muted one-line description). Right padding keeps the items
 * clear of the label.
 */
export function LoveCard({
  label,
  items,
  tone = 'gold',
  labelVariant = 'vertical',
  className,
}: LoveCardProps) {
  const toneText = tone === 'blue' ? 'text-accent' : 'text-gold-1'
  const circular = labelVariant === 'circular'
  // Repeat the label around the ring with bullet separators so it reads as a loop.
  const ringText = `${label.toUpperCase()} • RECOMMENDED • `
  return (
    <Card
      tone="white"
      className={cn(
        'relative h-full overflow-hidden',
        circular ? 'pr-8 tablet:pr-11' : 'pr-14 tablet:pr-16',
        className
      )}
    >
      {circular ? (
        <CircularText
          text={ringText}
          radius={98}
          spinDuration={18}
          onHover="pause"
          className={cn(
            // Bleed off the bottom-right corner; the card's overflow clips it.
            'pointer-events-auto absolute -bottom-24 -right-24 size-[290px] font-mono text-base font-bold uppercase tablet:-bottom-20 tablet:-right-20',
            toneText
          )}
        />
      ) : (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute right-7 top-1/2 -translate-y-1/2 text-center font-display font-medium text-kicker uppercase [writing-mode:vertical-rl]',
            toneText
          )}
        >
          {label}
        </span>
      )}

      <ul className="space-y-5">
        {items.map((item) => (
          <li key={item.name}>
            <AnimatedLink href={item.href}>
              {item.name}
            </AnimatedLink>
            <Text as="p" variant="meta" className="mt-0.5 max-w-[60ch] text-ink-muted">
              {item.desc}
            </Text>
          </li>
        ))}
      </ul>
    </Card>
  )
}
