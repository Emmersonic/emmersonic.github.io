import { LoveCard } from '@/components/cards/LoveCard'
import { Reveal } from '@/motion/Reveal'
import { tools } from '@/content'

/** "Tools I love" — a solid gold card with a vertical label and link list. */
export function ToolsILove({ delay = 0 }: { delay?: number }) {
  return (
    <Reveal delay={delay}>
      <LoveCard label="Tools I love" items={tools} />
    </Reveal>
  )
}
