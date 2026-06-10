import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Custom color tokens (see tailwind.config.ts). Registered with tailwind-merge
 * so it classifies `text-/bg-/border-<token>` as colors — otherwise it can't
 * tell e.g. `text-ink-strong` (color) from `text-display-xl` (font-size) and
 * silently drops one when both appear in a merged className.
 */
const colorTokens = [
  'ink',
  'ink-strong',
  'ink-muted',
  'paper-0',
  'paper-1',
  'paper-2',
  'hairline',
  'accent',
  'accent-2',
  'accent-3',
  'swatch-red',
  'swatch-green',
  'swatch-yellow',
  'gold-0',
  'gold-1',
  'gold-hi',
]

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['hero', 'hiya', 'lead', 'serif', 'kicker', 'ui', 'meta'] }],
      'font-family': [{ font: ['display', 'body', 'mono'] }],
      'text-color': [{ text: colorTokens }],
      'bg-color': [{ bg: colorTokens }],
      'border-color': [{ border: colorTokens }],
    },
  },
})

/** Merge Tailwind classes safely (clsx for conditionals, twMerge to dedupe conflicts). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
