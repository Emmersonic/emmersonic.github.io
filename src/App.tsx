import { motion, useScroll, useTransform } from 'motion/react'
import { PageShell } from '@/components/layout'
import { revealAt } from '@/motion/motionConfig'
import {
  About,
  Footer,
  Hero,
  KnownFor,
  Sidebar,
  SitesILove,
  ToolsILove,
  // DSSection,
} from '@/components/sections'

/**
 * The single page, built as the live site's asymmetric collage: a blob hero
 * band, then a two-column layout (left stack of cards overlapping the hero,
 * right info sidebar), then a centered footer.
 */
export default function App() {
  // Right column parallax: the main card stack scrolls at 1x (normal flow);
  // the sidebar drifts down slightly as the page scrolls so it lags behind
  // the main content for depth.
  const { scrollY } = useScroll()
  const sidebarY = useTransform(scrollY, [0, 1000], [0, 80])

  return (
    <PageShell>
      {/* Outer frame ~1360 wide (live: 1400 page frame, 20px Header padding).
          No top padding — the hero panel meets the viewport top (top:0) as on
          the live site; only the sides and bottom are inset. */}
      <div className="mx-auto w-full max-w-[1400px] px-3 pb-6 tablet:px-5 tablet:pb-10">
        {/* Hero spans the full frame; its headline/cards live in a narrower column.
            z-10 so the right sidebar (z-0) scrolls *under* the hero background while
            the left card column (z-20) still overlaps on top. */}
        <Hero />

        {/* Centered 1020 column, pulled up to overlap the bottom of the hero panel.
            Desktop overlap is tuned so the first card clears the headline by the
            live site's ~100px (card top ≈ 597 against a 680-tall panel). */}
        <main className="relative mx-auto max-w-[1100px] -mt-24 grid grid-cols-1 tablet:-mt-40 desktop:-mt-[83px] desktop:grid-cols-[minmax(0,1fr)_340px] desktop:gap-x-[60px]">
          <div className="relative z-20 space-y-6 tablet:space-y-8">
            <About delay={revealAt.about} />
            <KnownFor delay={revealAt.knownFor} />
            {/* Tools (gold) + Sites (blue) sit side by side, as on the live site. */}
            <div className="grid grid-cols-1 gap-6">
              <ToolsILove delay={revealAt.tools} />
              <SitesILove delay={revealAt.sites} />
              {/* <DSSection delay={revealAt.designResources} /> */}
            </div>
          </div>
          {/* DOM order (content, sidebar, footer) drives both layouts: stacked
              top-to-bottom on mobile/tablet (grid-cols-1), and grid
              auto-placement fills col1/row1, col2/row1, col1/row2 on desktop —
              same visual result as before without needing explicit order.
              Explicit margins (not a uniform grid `gap`) so the mobile gap
              above the sidebar and below it can differ. */}
          <motion.div className="mt-4 tablet:mt-6 desktop:mt-0" style={{ y: sidebarY }}>
            <Sidebar />
          </motion.div>
          <div className="mt-20 tablet:mt-24 desktop:mt-8">
            <Footer delay={revealAt.footer} />
          </div>
        </main>
      </div>
    </PageShell>
  )
}
