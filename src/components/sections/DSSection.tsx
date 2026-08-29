import { Card, Text, AnimatedLink } from '@/components/primitives'
import { Reveal } from '@/motion/Reveal'
import { designResources, myWork } from '@/content'

export function DSSection({ delay = 0 }: { delay?: number }) {
  return (
    <Reveal delay={delay}>
      <Card tone="warm" className="space-y-6">
        <div className="space-y-1">
          <Text as="h2" variant="lead" className="text-ink">
            Design Systems
          </Text>
          <Text as="p" variant="meta" className="text-ink-muted max-w-[55ch]">
            Resources I keep coming back to, and things I've built — all in the design systems space.
          </Text>
        </div>

        <div className="grid grid-cols-1 gap-8 tablet:grid-cols-2">
          <div className="space-y-4">
            <Text as="h3" variant="kicker" className="text-ink-muted uppercase tracking-widest border-b border-ink-muted/20 pb-2">
              Resources
            </Text>
            <ul className="space-y-4">
              {designResources.map((item) => (
                <li key={item.name}>
                  <AnimatedLink href={item.href}>{item.name}</AnimatedLink>
                  <Text as="p" variant="meta" className="mt-0.5 text-ink-muted">
                    {item.desc}
                  </Text>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <Text as="h3" variant="kicker" className="text-ink-muted uppercase tracking-widest border-b border-ink-muted/20 pb-2">
              Things I've made
            </Text>
            <ul className="space-y-4">
              {myWork.map((item) => (
                <li key={item.name}>
                  <AnimatedLink href={item.href}>{item.name}</AnimatedLink>
                  <Text as="p" variant="meta" className="mt-0.5 text-ink-muted">
                    {item.desc}
                  </Text>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </Reveal>
  )
}
