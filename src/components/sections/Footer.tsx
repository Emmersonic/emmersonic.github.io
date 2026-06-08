import { Text } from '@/components/primitives'
import { Reveal } from '@/motion/Reveal'
import { footer } from '@/content'
import shapes from '@/assets/logos/shapes.svg'

/**
 * The closing note: a single centered serif line with a final `mailto:` CTA.
 * Plain `<a>` (not AnimatedLink) so it opens in the same tab. Width-agnostic.
 */
export function Footer({ delay = 0 }: { delay?: number }) {
  return (
    <footer className="w-full py-16 tablet:py-20 text-center">
      <Reveal delay={delay}>
        <Text as="p" variant="lead" className="text-ink-strong">
          {footer.text}{' '}
          <a
            href={'mailto:' + footer.email}
            className="font-display text-lead text-ink-strong transition-colors duration-fast ease-standard hover:text-accent"
          >
            {footer.email}
          </a>
        </Text>
      </Reveal>
      <Reveal delay={delay + 0.15}>
        <img
          src={shapes}
          alt=""
          aria-hidden="true"
          className="mx-auto mt-10 w-20"
        />
      </Reveal>
    </footer>
  )
}
