import { Text } from '@/components/primitives'
import { Reveal } from '@/motion/Reveal'
import { cn } from '@/lib/cn'

interface SectionHeaderProps {
  kicker?: string
  title?: string
  className?: string
}

/**
 * The kicker + title block that opens most sections. Wrapped in `<Reveal>` so
 * headers animate in on scroll. Renders nothing when neither is provided.
 */
export function SectionHeader({ kicker, title, className }: SectionHeaderProps) {
  if (!kicker && !title) return null

  return (
    <Reveal className={cn('mb-10 tablet:mb-14', className)}>
      {kicker ? (
        <Text variant="kicker" as="p">
          {kicker}
        </Text>
      ) : null}
      {title ? (
        <Text variant="title" as="h2" className="mt-3">
          {title}
        </Text>
      ) : null}
    </Reveal>
  )
}
