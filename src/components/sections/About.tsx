import type { ReactNode } from 'react'
import { Text } from '@/components/primitives'
import { Reveal } from '@/motion/Reveal'
import { career, type TextRun } from '@/content'

/** Render a run of mixed-weight copy; bold runs are emphasised in strong ink. */
function renderRuns(runs: TextRun[]): ReactNode {
  return runs.map((run, i) =>
    run.bold ? (
      <strong key={i} className="font-semibold text-ink-strong">
        {run.text}
      </strong>
    ) : (
      <span key={i}>{run.text}</span>
    )
  )
}

/**
 * The light "About" card. The first paragraph reads as the serif lead; the
 * remaining two sit below as calmer 16px serif body. All dark ink on paper.
 */
export function About({ delay = 0 }: { delay?: number }) {
  const [lead, ...rest] = career

  return (
    <Reveal delay={delay}>
      <div className="rounded-card bg-paper-0 p-8 tablet:p-11">
        <Text as="p" variant="lead">
          {renderRuns(lead)}
        </Text>
        {rest.map((paragraph, i) => (
          <Text key={i} as="p" variant="serif" className="mt-5">
            {renderRuns(paragraph)}
          </Text>
        ))}
      </div>
    </Reveal>
  )
}
