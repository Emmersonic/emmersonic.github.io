import { Text } from '@/components/primitives'
import { Reveal } from '@/motion/Reveal'
import { footer } from '@/content'

/**
 * The closing note: a single centered serif line with a final `mailto:` CTA.
 * Plain `<a>` (not AnimatedLink) so it opens in the same tab. Width-agnostic.
 */
export function Footer() {
  return (
    <footer className="w-full py-16 tablet:py-20 text-center">
      <Reveal>
        <Text as="p" variant="lead" className="text-ink">
          {footer.text}{' '}
          <a
            href={'mailto:' + footer.email}
            className="font-display text-lead text-ink transition-colors duration-fast ease-standard hover:text-accent"
          >
            {footer.email}
          </a>
        </Text>
      </Reveal>
    </footer>
  )
}
