import { AnimatedLink, Text } from '@/components/primitives'
import { Reveal } from '@/motion/Reveal'
import { footer } from '@/content'
import shapes from '@/assets/logos/shapes.svg'

/**
 * The closing note: a single centered serif line with a final `mailto:` CTA.
 * AnimatedLink with `external={false}` so it opens in the same tab. Width-agnostic.
 */
export function Footer({ delay = 0 }: { delay?: number }) {
  return (
    <footer className="w-full pt-16 tablet:pt-20 text-center">
      <Reveal delay={delay}>
        <Text as="p" variant="lead" className="text-ink-strong">
          {footer.text}{' '}
          <AnimatedLink
            href={'mailto:' + footer.email}
            external={false}
            className="font-display text-lead font-normal"
          >
            {footer.email}
          </AnimatedLink>
        </Text>
      </Reveal>
      <Reveal delay={delay + 0.15}>
        <img src={shapes} alt="" aria-hidden="true" className="mx-auto mt-10 w-20" />
      </Reveal>
    </footer>
  )
}
