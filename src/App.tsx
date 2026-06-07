import { Reveal } from '@/motion/Reveal'

/**
 * Foundation smoke test. Replaced by the real PageShell + sections in phase 6.
 * Verifies: warm-paper bg, Fraunces display, Inter body, Archivo wide kicker,
 * the type scale, token colors, and the Reveal motion wrapper.
 */
export default function App() {
  return (
    <main className="min-h-screen bg-paper-0 text-ink">
      <div className="mx-auto max-w-container px-6 py-32 desktop:px-10">
        <Reveal>
          <p className="font-wide font-stretch-wide text-kicker uppercase text-ink-muted">
            Foundation check
          </p>
          <h1 className="mt-4 font-display text-display-xl font-semibold text-ink-strong">Hiya!</h1>
          <p className="mt-6 max-w-xl font-body text-body-l text-ink-muted">
            Warm paper background, Fraunces display serif, Inter body, Archivo wide kicker. If this
            reads correctly, the design-token + motion foundation is wired up.
          </p>
        </Reveal>
      </div>
    </main>
  )
}
