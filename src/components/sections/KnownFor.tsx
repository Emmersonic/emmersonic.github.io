import { Card, Text } from '@/components/primitives'
import { Reveal } from '@/motion/Reveal'
import { traits } from '@/content'

/**
 * The "known for" card on warm paper-2 (slightly darker than the body). Traits
 * render as a list (not a grid): each row is an emoji plus an Inter line with a
 * bold label and regular body, in dark ink.
 */
export function KnownFor({ delay = 0 }: { delay?: number }) {
  return (
    <Reveal delay={delay}>
      <Card tone="warm">
        <Text as="h2" variant="serif" className="font-medium text-ink-strong">
          I’m also known for being…
        </Text>
        <ul className="mt-6 space-y-4">
          {traits.map((trait) => (
            <li key={trait.label} className="flex items-start gap-3">
              <span aria-hidden className="shrink-0 text-base leading-6">
                {trait.emoji}
              </span>
              <Text as="p" variant="ui" className="!font-normal leading-6 text-ink">
                <strong className="font-medium">{trait.label}:</strong> {trait.body}
              </Text>
            </li>
          ))}
        </ul>
      </Card>
    </Reveal>
  )
}
