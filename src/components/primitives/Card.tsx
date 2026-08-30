import type { ReactNode } from 'react'
import { Squircle } from '@squircle-js/react'
import { cn } from '@/lib/cn'

/** Card surfaces, matching the live site's three papers. */
export type CardTone = 'paper' | 'warm' | 'white'

const toneClasses: Record<CardTone, string> = {
  paper: 'bg-paper-0', // light "About" card
  warm: 'bg-paper-2', // slightly darker "known for" card
  // Squircle's clip-path drops a real `border`, so fake the hairline with an
  // inset shadow — it still gets clipped to the curve along with everything else.
  white: 'shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] bg-white',
}

const CARD_RADIUS = 40

interface CardProps {
  children: ReactNode
  /** Surface color. Defaults to the light paper. */
  tone?: CardTone
  className?: string
}

/**
 * The one card surface: the site's big 40px squircle radius and generous
 * padding, with `tone` picking which paper it sits on. Layout/overflow
 * tweaks go through `className` (cn dedupes any padding overrides).
 */
export function Card({ children, tone = 'paper', className }: CardProps) {
  return (
    <Squircle
      cornerRadius={CARD_RADIUS}
      cornerSmoothing={1}
      className={cn('p-8 tablet:p-11', toneClasses[tone], className)}
    >
      {children}
    </Squircle>
  )
}
