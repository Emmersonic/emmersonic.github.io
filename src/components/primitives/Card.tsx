import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Card surfaces, matching the live site's three papers. */
export type CardTone = 'paper' | 'warm' | 'white'

const toneClasses: Record<CardTone, string> = {
  paper: 'bg-paper-0', // light "About" card
  warm: 'bg-paper-2', // slightly darker "known for" card
  white: 'border border-black/5 bg-white', // hairline-bordered love cards
}

interface CardProps {
  children: ReactNode
  /** Surface color. Defaults to the light paper. */
  tone?: CardTone
  className?: string
}

/**
 * The one card surface: the site's big 40px radius and generous padding, with
 * `tone` picking which paper it sits on. Layout/overflow tweaks go through
 * `className` (cn dedupes any padding overrides).
 */
export function Card({ children, tone = 'paper', className }: CardProps) {
  return (
    <div className={cn('rounded-card p-8 tablet:p-11', toneClasses[tone], className)}>
      {children}
    </div>
  )
}
