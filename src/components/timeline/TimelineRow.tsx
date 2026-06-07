import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { AnimatedLink, BrandLogo, Text } from '@/components/primitives'

interface TimelineRowProps {
  /** Lowercase brand name (e.g. 'homebase', 'meta', 'format') — rendered as given. */
  company: string
  href: string
  period: string
  location: string
  /** Nested sub-roles (TimelineSubRole) for this company. */
  children?: ReactNode
  className?: string
}

/**
 * One company entry in the work timeline. Editorial two-column header — company
 * (large serif link, with an optional brand mark) on the left, period + location
 * (muted labels) on the right — over an indented block of nested sub-roles.
 *
 * Presentational only: the WorkTimeline section maps `work` → TimelineRow and
 * wraps each in <Reveal>, so no entrance motion lives here.
 */
export function TimelineRow({
  company,
  href,
  period,
  location,
  children,
  className,
}: TimelineRowProps) {
  return (
    <div className={cn('border-t border-hairline/60 pt-6 tablet:pt-8', className)}>
      <div className="flex flex-col gap-2 tablet:flex-row tablet:items-baseline tablet:justify-between tablet:gap-8">
        <AnimatedLink
          href={href}
          underline
          className="font-display text-display-l font-semibold leading-none text-ink-strong"
        >
          <span className="inline-flex items-center gap-3">
            <BrandLogo name={company} size={24} aria-hidden className="shrink-0" />
            {company}
          </span>
        </AnimatedLink>

        <div className="flex flex-col gap-0.5 tablet:shrink-0 tablet:items-end tablet:text-right">
          <Text as="span" variant="label">
            {period}
          </Text>
          <Text as="span" variant="label">
            {location}
          </Text>
        </div>
      </div>

      {children ? (
        <div className="mt-5 flex flex-col gap-2.5 tablet:mt-6 tablet:gap-3 tablet:pl-10">
          {children}
        </div>
      ) : null}
    </div>
  )
}
