/**
 * The fixed progressive-blur strip at the top of the page (the live site's
 * Framer "Blur" element). Four stacked backdrop-filter layers, each masked to
 * fade out at a staggered stop, so the blur is strongest at the very top edge
 * and clears by ~87% down — content frosts progressively as it scrolls under.
 * Decorative and non-interactive. Values lifted from the live site.
 */
const layers = [
  { blur: 30, stop: 19.9 },
  { blur: 15, stop: 39.3 },
  { blur: 8, stop: 56.9 },
  { blur: 2, stop: 86.7 },
]

export function TopBlur() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[224px]">
      {layers.map((l) => (
        <div
          key={l.blur}
          className="absolute inset-0"
          style={{
            backdropFilter: `blur(${l.blur}px)`,
            WebkitBackdropFilter: `blur(${l.blur}px)`,
            maskImage: `linear-gradient(#000 0%, transparent ${l.stop}%)`,
            WebkitMaskImage: `linear-gradient(#000 0%, transparent ${l.stop}%)`,
          }}
        />
      ))}
    </div>
  )
}
