import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'
import { easeStandard, durations } from '@/motion/motionConfig'
import { Text, BrandLogo } from '@/components/primitives'

interface LinkCardProps {
  name: string
  href: string
  desc: string
  className?: string
}

/** Shared surface for both "Tools I love" and "Sites I love". */
const surface =
  'group flex items-center gap-4 rounded-card border border-hairline/40 bg-paper-1 p-5 tablet:p-6 transition-colors duration-fast ease-standard hover:border-hairline'

interface CardBodyProps {
  name: string
  desc: string
}

/** Inner content shared by the animated and reduced-motion variants. */
function CardBody({ name, desc }: CardBodyProps) {
  return (
    <>
      <BrandLogo
        name={name}
        size={28}
        className="shrink-0 text-ink-strong transition-colors duration-fast ease-standard group-hover:text-accent"
      />
      <span className="flex min-w-0 flex-col">
        <Text
          variant="body"
          className="font-medium text-ink-strong transition-colors duration-fast ease-standard group-hover:text-accent"
        >
          {name}
        </Text>
        <Text variant="body" className="text-ink-muted">
          {desc}
        </Text>
      </span>
    </>
  )
}

/**
 * The whole card is one external link, so the entire surface reacts on hover:
 * the border warms and the name + logo ease to accent. With motion enabled it
 * also lifts slightly; under prefers-reduced-motion it renders a plain `<a>`
 * with no transform. This card *is* the anchor, so we never nest AnimatedLink.
 */
export function LinkCard({ name, href, desc, className }: LinkCardProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(surface, className)}
      >
        <CardBody name={name} desc={desc} />
      </a>
    )
  }

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.03 }}
      transition={{ duration: durations.fast, ease: easeStandard }}
      className={cn(surface, className)}
    >
      <CardBody name={name} desc={desc} />
    </motion.a>
  )
}
