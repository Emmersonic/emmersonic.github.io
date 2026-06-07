import { cn } from '@/lib/cn'
import { Text } from '@/components/primitives'

interface TimelineSubRoleProps {
  title: string
  period: string
  className?: string
}

/**
 * One nested role beneath a company (e.g. Meta's several tenures). A quiet,
 * compact Inter row — role title on the left, period on the right — that sits
 * visually below the company's serif header. Presentational only.
 */
export function TimelineSubRole({ title, period, className }: TimelineSubRoleProps) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4', className)}>
      <Text as="span" variant="body" className="flex items-baseline gap-2.5 text-ink">
        <span aria-hidden className="select-none text-ink-muted">
          —
        </span>
        {title}
      </Text>
      <Text as="span" variant="label" className="shrink-0 tabular-nums">
        {period}
      </Text>
    </div>
  )
}
