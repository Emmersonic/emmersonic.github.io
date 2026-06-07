import { cn } from '@/lib/cn'
import { Text } from '@/components/primitives'

interface TraitCardProps {
  emoji: string
  label: string
  body: string
  className?: string
}

/**
 * A single cell in the "I'm also known for being…" 2×2 grid. Soft warm card
 * with the emoji in a rounded tile, a bold label, and a muted body. Sizes
 * fluidly so it reads well at any column width.
 */
export function TraitCard({ emoji, label, body, className }: TraitCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-card border border-hairline/40 bg-paper-1 p-6 tablet:p-8',
        className
      )}
    >
      <span
        aria-hidden
        className="flex h-11 w-11 items-center justify-center rounded-pill bg-paper-2 text-[22px] leading-none"
      >
        {emoji}
      </span>
      <Text
        as="h3"
        variant="body"
        className="mt-5 font-display font-semibold text-ink-strong"
      >
        {label}
      </Text>
      <Text variant="body" className="mt-2">
        {body}
      </Text>
    </div>
  )
}
