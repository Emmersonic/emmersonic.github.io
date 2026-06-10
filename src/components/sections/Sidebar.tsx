import type { ReactNode } from 'react'
import { Reveal } from '@/motion/Reveal'
import { revealAt, staggerStep } from '@/motion/motionConfig'
import { AnimatedLink, Text } from '@/components/primitives'
import { education, hiring, site, socials, work } from '@/content'

interface BlockProps {
  label: string
  children: ReactNode
}

/** One labelled sidebar block: a tracked gray kicker, then its content. */
function Block({ label, children }: BlockProps) {
  return (
    <div>
      <Text variant="kicker" as="h2">
        {label}
      </Text>
      <div className="mt-1">{children}</div>
    </div>
  )
}

/**
 * The right-column sidebar: vertical list of small Inter text blocks —
 * Work, School, Email, Internet, Hiring?. Width-agnostic; fills its column.
 */
export function Sidebar() {
  return (
    <aside className="relative z-0 space-y-10 pr-12 desktop:pt-[122px]">
      <Reveal delay={revealAt.sidebar + 0 * staggerStep}>
        <Block label="Work">
          <div className="space-y-2">
            {work.map((c) => (
              <div key={c.company}>
                <AnimatedLink href={c.href}>{c.company}</AnimatedLink>
                <Text as="p" variant="meta" className="mt-0.5">
                  {c.period} · {c.location}
                </Text>
                {c.roles.length > 0 && (
                  <ul className="mt-1 space-y-1 pl-2">
                    {c.roles.map((role) => (
                      <li key={role.title} className="flex items-baseline gap-2 whitespace-nowrap">
                        <Text as="span" variant="meta" className="text-ink">
                          {role.title}
                        </Text>
                        <Text as="span" variant="meta">
                          {role.period}
                        </Text>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Block>
      </Reveal>

      <Reveal delay={revealAt.sidebar + 1 * staggerStep}>
        <Block label="School">
          <AnimatedLink href={education.href}>{education.school}</AnimatedLink>
          <Text as="p" variant="meta" className="mt-[5px]">
            {education.period}
          </Text>
          <Text as="p" variant="meta" className="mt-[5px]">
            {education.degree} · {education.location}
          </Text>
        </Block>
      </Reveal>

      <Reveal delay={revealAt.sidebar + 2 * staggerStep}>
        <Block label="Email">
          <AnimatedLink href={'mailto:' + site.email} external={false}>
            {site.email}
          </AnimatedLink>
        </Block>
      </Reveal>

      <Reveal delay={revealAt.sidebar + 3 * staggerStep}>
        <Block label="Internet">
          <ul className="grid grid-cols-2 gap-2">
            {socials.map((s) => (
              <li key={s.name}>
                <AnimatedLink href={s.href}>{s.name}</AnimatedLink>
              </li>
            ))}
          </ul>
        </Block>
      </Reveal>

      <Reveal delay={revealAt.sidebar + 4 * staggerStep}>
        <Block label="Hiring?">
          <Text as="p" variant="meta">
            {hiring.body}
          </Text>
          <ul className="mt-2 space-y-2">
            {hiring.links.map((l) => (
              <li key={l.name}>
                <AnimatedLink href={l.href}>{l.name}</AnimatedLink>
              </li>
            ))}
          </ul>
        </Block>
      </Reveal>
    </aside>
  )
}
