import type { ReactNode } from 'react'
import { Reveal } from '@/motion/Reveal'
import { staggerStep } from '@/motion/motionConfig'
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
      <div className="mt-3">{children}</div>
    </div>
  )
}

/**
 * The right-column sidebar: vertical list of small Inter text blocks —
 * Work, School, Email, Internet, Hiring?. Width-agnostic; fills its column.
 */
export function Sidebar() {
  return (
    <Reveal>
      <aside className="space-y-10">
        <Reveal delay={0 * staggerStep}>
          <Block label="Work">
            {work.map((c) => (
              <div key={c.company} className="mt-5 first:mt-0">
                <AnimatedLink href={c.href}>{c.company}</AnimatedLink>
                <Text as="p" variant="meta" className="mt-0.5">
                  {c.period} · {c.location}
                </Text>
                {c.roles.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {c.roles.map((role) => (
                      <li
                        key={role.title}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <Text as="span" variant="meta" className="text-ink">
                          {role.title}
                        </Text>
                        <Text as="span" variant="meta" className="shrink-0 tabular-nums">
                          {role.period}
                        </Text>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Block>
        </Reveal>

        <Reveal delay={1 * staggerStep}>
          <Block label="School">
            <AnimatedLink href={education.href}>{education.school}</AnimatedLink>
            <Text as="p" variant="meta" className="mt-0.5">
              {education.period}
            </Text>
            <Text as="p" variant="meta">
              {education.degree} · {education.location}
            </Text>
          </Block>
        </Reveal>

        <Reveal delay={2 * staggerStep}>
          <Block label="Email">
            <a
              href={'mailto:' + site.email}
              className="font-body text-ui font-medium text-accent transition-colors duration-fast ease-standard hover:text-accent-3"
            >
              {site.email}
            </a>
          </Block>
        </Reveal>

        <Reveal delay={3 * staggerStep}>
          <Block label="Internet">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
              {socials.map((s) => (
                <li key={s.name}>
                  <AnimatedLink href={s.href}>{s.name}</AnimatedLink>
                </li>
              ))}
            </ul>
          </Block>
        </Reveal>

        <Reveal delay={4 * staggerStep}>
          <Block label="Hiring?">
            <Text as="p" variant="meta" className="max-w-[40ch]">
              {hiring.body}
            </Text>
            <ul className="mt-3 space-y-1">
              {hiring.links.map((l) => (
                <li key={l.name}>
                  <AnimatedLink href={l.href}>{l.name}</AnimatedLink>
                </li>
              ))}
            </ul>
          </Block>
        </Reveal>
      </aside>
    </Reveal>
  )
}
