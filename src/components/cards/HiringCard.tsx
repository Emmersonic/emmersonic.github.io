import { cn } from '@/lib/cn'
import { GlassCard, Text, AnimatedLink } from '@/components/primitives'
import type { HiringLink } from '@/content'

interface HiringCardProps {
  body: string
  links: HiringLink[]
  className?: string
}

/**
 * The "Hiring?" CTA: a sheened glass card with the intro paragraph followed by
 * a wrapping row of external links to other design directories.
 */
export function HiringCard({ body, links, className }: HiringCardProps) {
  return (
    <GlassCard blur="md" sheen className={cn('p-8 tablet:p-10', className)}>
      <Text variant="body-l" className="text-ink">
        {body}
      </Text>
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
        {links.map((link) => (
          <AnimatedLink key={link.href} href={link.href} underline>
            {link.name}
          </AnimatedLink>
        ))}
      </div>
    </GlassCard>
  )
}
