import { GradientOrb } from '@/components/primitives'

interface PageShellProps {
  children: React.ReactNode
}

/**
 * The outermost page wrapper. Establishes the warm paper canvas and lays a
 * faint, drifting orb field behind everything (at `-z-10`). `overflow-x-clip`
 * on the shell plus `overflow-hidden` on the orb layer keep the bleeding orbs
 * from ever introducing horizontal scroll. Children render directly so the
 * App can supply its own `<main>` / section semantics.
 */
export function PageShell({ children }: PageShellProps) {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-paper-0 text-ink">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Large cool glow anchoring the top-left of the hero. */}
        <GradientOrb variant="blue" size={520} blur={40} className="-left-32 -top-32" />
        {/* Soft warm wash drifting in from the right around mid-page. */}
        <GradientOrb variant="peach" size={480} blur={40} className="-right-24 top-[42%]" />
        {/* Faint gold accent near the top to warm the upper edge. */}
        <GradientOrb variant="gold" size={360} blur={40} className="right-1/4 -top-24" />
      </div>

      {children}
    </div>
  )
}
