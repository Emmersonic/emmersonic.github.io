import { LoveCard } from '@/components/cards/LoveCard'
import { Reveal } from '@/motion/Reveal'
import { tools } from '@/content'

/** "Tools I love" — a solid gold card with a vertical label and link list. */
export function ToolsILove() {
  return (
    <Reveal>
      <LoveCard label="Tools I love" items={tools} />
    </Reveal>
  )
}
