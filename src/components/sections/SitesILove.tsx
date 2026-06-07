import { LoveCard } from '@/components/cards/LoveCard'
import { Reveal } from '@/motion/Reveal'
import { sites } from '@/content'

/** "Sites I love" — a solid gold card with a vertical label and link list. */
export function SitesILove({ delay = 0 }: { delay?: number }) {
  return (
    <Reveal delay={delay}>
      <LoveCard label="Sites I love" items={sites} tone="blue" />
    </Reveal>
  )
}
