import { BottomGlow } from './BottomGlow'
import { TopBlur } from './TopBlur'

interface PageShellProps {
  children: React.ReactNode
}

/**
 * The outermost page wrapper: the warm paper canvas (#f7f4f1). The decorative
 * gradient blobs live inside the Hero band, not here. `overflow-x-clip` guards
 * against any bleed introducing horizontal scroll.
 */
export function PageShell({ children }: PageShellProps) {
  return (
    <div className="isolate min-h-screen overflow-x-clip [overflow-y:clip] bg-paper-1 text-ink">
      {/*
        iOS 26 Safari ("Liquid Glass") tints the top/bottom toolbar chrome by
        scanning for a fixed/sticky element that hugs the viewport edge
        (within ~4px of top, >=80% viewport width, >=3px tall) and reading
        *its own* background-color, ignoring <body> once such an element
        exists. TopBlur below is exactly this shape but paints no
        background-color of its own (its tint comes from child
        backdrop-filter layers), so Safari finds a qualifying edge element
        with no color and falls back to white instead of our paper tone.
        This sentinel gives Safari a real color to read; it sits behind the
        opaque Hero panel (z-index below Hero's z-10) so it's never actually
        visible on screen. See https://jahir.dev/blog/safari-toolbar.
      */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-0 h-1.5 bg-paper-1" />
      <BottomGlow />
      {children}
      <TopBlur />
    </div>
  )
}
