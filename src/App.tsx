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
      <div className="mx-auto w-full max-w-[1080px] px-5 py-6 tablet:px-8 tablet:py-10">
        <Hero />

        {/* Pull the columns up so the cards overlap the bottom of the hero blobs. */}
        <main className="relative z-10 -mt-24 grid grid-cols-1 gap-8 tablet:-mt-40 desktop:grid-cols-[minmax(0,1fr)_300px] desktop:gap-12">
          <div className="space-y-6 tablet:space-y-8">
            <About />
            <KnownFor />
            <ToolsILove />
            <SitesILove />
          </div>
          <Sidebar />
        </main>

        <Footer />
      </div>
    </PageShell>
  )
}
