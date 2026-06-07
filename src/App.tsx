import { PageShell } from '@/components/layout'
import {
  About,
  Footer,
  Hero,
  KnownFor,
  Sidebar,
  SitesILove,
  ToolsILove,
} from '@/components/sections'

/**
 * The single page, built as the live site's asymmetric collage: a blob hero
 * band, then a two-column layout (left stack of cards overlapping the hero,
 * right info sidebar), then a centered footer.
 */
export default function App() {
  return (
    <PageShell>
      {/* Outer frame ~1360 wide (live: 1400 page frame, 20px Header padding). */}
      <div className="mx-auto w-full max-w-[1400px] px-5 py-6 tablet:py-10">
        {/* Hero spans the full frame; its headline/cards live in a narrower column. */}
        <Hero />

        {/* Centered 1020 column, pulled up to overlap the bottom of the hero panel. */}
        <main className="relative z-10 mx-auto max-w-[1020px] -mt-24 grid grid-cols-1 gap-8 tablet:-mt-40 desktop:grid-cols-[minmax(0,1fr)_260px] desktop:gap-[60px]">
          <div className="space-y-6 tablet:space-y-8">
            <About delay={1.0} />
            <KnownFor delay={1.25} />
            {/* Tools (gold) + Sites (blue) sit side by side, as on the live site. */}
            <div className="grid grid-cols-1 gap-6 tablet:grid-cols-2 tablet:gap-5">
              <ToolsILove delay={1.45} />
              <SitesILove delay={1.6} />
            </div>
          </div>
          <Sidebar />
        </main>

        <div className="mx-auto max-w-[1020px]">
          <Footer delay={1.75} />
        </div>
      </div>
    </PageShell>
  )
}
