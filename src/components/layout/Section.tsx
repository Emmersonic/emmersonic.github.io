import { cn } from '@/lib/cn'
import { SectionHeader } from './SectionHeader'

interface SectionProps {
  id?: string
  kicker?: string
  title?: string
  children: React.ReactNode
  className?: string
  containerClassName?: string
}

/**
 * The consistent section wrapper that gives every block the same vertical
 * rhythm and centered, max-width container. Pass `kicker`/`title` to render a
 * `<SectionHeader>` above the content; both are optional.
 */
export function Section({
  id,
  kicker,
  title,
  children,
  className,
  containerClassName,
}: SectionProps) {
  return (
    <section id={id} className={cn('w-full py-16 tablet:py-24 desktop:py-28', className)}>
      <div
        className={cn(
          'mx-auto w-full max-w-container px-6 tablet:px-8 desktop:px-10',
          containerClassName
        )}
      >
        <SectionHeader kicker={kicker} title={title} />
        {children}
      </div>
    </section>
  )
}
