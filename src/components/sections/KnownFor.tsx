import { Text } from '@/components/primitives'
import { Reveal } from '@/motion/Reveal'
import { traits } from '@/content'

/**
 * The black "known for" card. Traits render as a list (not a grid): each row is
 * an emoji plus an Inter line with a bold label and regular body, in white.
 */
export function KnownFor() {
  return (
    <Reveal>
      <div className="rounded-card bg-ink p-8 tablet:p-11">
        <Text as="h2" variant="serif" className="font-medium text-white">
          I’m also known for being…
        </Text>
        <ul className="mt-6 space-y-4">
          {traits.map((trait) => (
            <li key={trait.label} className="flex items-start gap-3">
              <span aria-hidden className="shrink-0 text-base leading-6">
                {trait.emoji}
              </span>
              <Text as="p" variant="ui" className="text-white">
                <strong className="font-semibold">{trait.label}:</strong> {trait.body}
              </Text>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  )
}
