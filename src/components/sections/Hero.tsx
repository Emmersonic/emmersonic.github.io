import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import { Text } from '@/components/primitives'
import { Reveal } from '@/motion/Reveal'
import { springHero } from '@/motion/motionConfig'
import { site } from '@/content'

/** One big blurred shape in the hero's warm panel. */
interface Shape {
  /** Background utility (solid swatch or the blue radial gradient). */
  bg: string
  /** Square side / circle diameter in px. */
  size: number
  /** Border-radius utility — big squircle radii, or `rounded-full` for the circle. */
  radius: string
  /** Static rotation in degrees. */
  rotate: number
  /** Net blur in px. */
  blur: number
  /** Absolute offset inside the panel (from its top-left). */
  top: number
  left: number
  /** Scroll-parallax drift in px over the hero's scroll range (depth cue). */
  drift: number
}

/**
 * Three of the four shapes that make the hero's soft glow, measured off the
 * live DOM: the green/red squircles and the blue radial-gradient circle. The
 * yellow "splat" is a rounded **triangle** (its own SVG, below) — not a
 * squircle — so it's rendered separately. Positions are px offsets within the
 * 1360-wide panel; each drifts at its own rate on scroll (parallax). The live
 * site moves these JS-side and the exact rates aren't in the static export, so
 * the drifts are tuned by eye for depth.
 */
// Order matters: it's the paint (DOM) order off the live site, bottom→top —
// blue, then green, then red, then the yellow triangle on top of all of them.
const shapes: Shape[] = [
  // Blue circle: no scale on the live site; blur is the wrapper's 22px stacked
  // over the circle's own 30px (≈37px combined, √(22²+30²)).
  { bg: 'bg-orb-blue', size: 326, radius: 'rounded-full', rotate: 0, blur: 37, top: 42, left: 400, drift: 50 },
  { bg: 'bg-swatch-green', size: 541, radius: 'rounded-[161px]', rotate: 67, blur: 12, top: 300, left: 360, drift: 80 },
  { bg: 'bg-swatch-red', size: 404, radius: 'rounded-[91px]', rotate: 8, blur: 12, top: 190, left: 80, drift: 130 },
]

/**
 * The live site's two grain assets, pulled from Framer and committed to
 * `public/images` so there's no runtime network dependency. The earlier
 * feTurbulence stand-in couldn't darken the field: `fractalNoise` is symmetric
 * about mid-grey, which is the neutral point of `mix-blend:overlay`, so it
 * netted ~zero luminance change. These PNGs have a dark-biased mean, so the
 * overlay/multiply passes tint the header slightly darker like the original.
 */
const NOISE_PNG = '/images/noise.png' // fine "Noise" layer (Hq35x5…)
const GRAIN_PNG = '/images/grain.png' // smooth film "Gradient" layer (uxNRuj…)

/** One full-bleed image-grain pass (`mix-blend` + opacity), matching a Framer layer. */
function Grain({ src, blend, opacity }: { src: string; blend: string; opacity: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: `url(${src})`, mixBlendMode: blend as never, opacity }}
    />
  )
}

/**
 * The yellow "splat": on the live site a 551×469 rounded-triangle SVG, heavily
 * blurred, anchored top-left (top:-78/left:-31) and rotated **96°** about its
 * centre, painted on top of the other blobs and mostly clipped by the panel.
 * Same color as the swatch (`hsl(55,100%,65%)` ≈ #fff04d). Drifts with scroll
 * like the other shapes.
 */
function YellowTriangle({ progress, reduced }: { progress: MotionValue<number>; reduced: boolean }) {
  const y = useTransform(progress, [0, 1], [0, 170])
  const base = { top: -78, left: -31, filter: 'blur(7px)' as const }
  const path = (
    <path
      d="M 232.092 70.325 C 250.297 38.978 295.57 38.978 313.774 70.325 L 504.101 398.053 C 522.386 429.539 499.67 469 463.26 469 L 82.607 469 C 46.197 469 23.481 429.539 41.766 398.053 Z"
      fill="#fff04d"
    />
  )
  if (reduced)
    return (
      <svg
        className="absolute"
        width={551}
        height={469}
        viewBox="0 0 546 469"
        style={{ ...base, transform: 'rotate(96deg)' }}
        aria-hidden
      >
        {path}
      </svg>
    )
  return (
    <motion.svg
      className="absolute"
      width={551}
      height={469}
      viewBox="0 0 546 469"
      style={{ ...base, rotate: 96, y }}
      aria-hidden
    >
      {path}
    </motion.svg>
  )
}

/** A single blurred shape; drifts vertically with scroll for parallax depth. */
function HeroShape({ shape, progress, reduced }: { shape: Shape; progress: MotionValue<number>; reduced: boolean }) {
  const y = useTransform(progress, [0, 1], [0, shape.drift])
  const base = {
    width: shape.size,
    height: shape.size,
    top: shape.top,
    left: shape.left,
    filter: `blur(${shape.blur}px)`,
  }
  const cls = `absolute ${shape.bg} ${shape.radius}`
  if (reduced) return <div className={cls} style={{ ...base, transform: `rotate(${shape.rotate}deg)` }} />
  return <motion.div className={cls} style={{ ...base, rotate: shape.rotate, y }} />
}

/**
 * The opening hero band. The **background** and the **text** are independent
 * layers (as on the live site), so the background's 3D transform never touches
 * the text:
 *  - Background carries a **scroll-driven** 3D tilt that *releases to identity*.
 *    At scroll 0 it sits at the live rest tilt — measured
 *    `perspective(1077px) translateY(-19.1px) scale(1.2) rotateX(-30deg)` — and
 *    as the panel scrolls past it flattens to `translateY(0) scale(1)
 *    rotateX(0)`. This is a Framer **scroll-transform effect** (the appear JSON
 *    ends at identity because the scroll effect, not the load, owns the tilt).
 *    rotateX/scale/y are all MotionValues bound to scroll — as constant literals
 *    the tilt would freeze and never transition back. A one-shot load "drop"
 *    springs in on top; the shapes parallax-drift independently inside it.
 *  - Text is a flat overlay with its own translateY parallax (no tilt/scale)
 *    over its own fade-up — different load and scroll motion from the background.
 * The panel is a fixed-height warm field (#eee6dd) spanning the full frame; the
 * text sits in a centered 1020 column, pinned low. Bottom corners only.
 */
export function Hero() {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLElement>(null)

  // Scroll progress: 0 → 1 as the panel scrolls up past the top.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  // Background: the whole 3D tilt is scroll-driven and *releases to identity* as
  // you scroll. At scroll 0 it sits at the live rest tilt
  // (`translateY(-19.1) scale(1.2) rotateX(-30)`); by the time the panel scrolls
  // past, it has flattened to `translateY(0) scale(1) rotateX(0)`. These must be
  // MotionValues — as literals they'd freeze the tilt and never transition back.
  const bgRotateX = useTransform(scrollYProgress, [0, 1], [-30, 0])
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.2, 1])
  const bgY = useTransform(scrollYProgress, [0, 1], [-19.25, 0])
  // Text parallax — independent of the tilt: drifts up, stays flat.
  const textY = useTransform(scrollYProgress, [0, 1], [0, -120])

  // Load "drop": composes with the constant tilt below (scale 0.75 × 1.2 = 0.9
  // start → 1 × 1.2 = 1.2 rest; y −80 from the −19.25 rest ≈ the live −100 start).
  const dropProps = reduced
    ? {}
    : {
        initial: { opacity: 0.001, y: -80, scale: 0.75 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { ...springHero, delay: 0.2 },
      }

  return (
    <section ref={ref} className="relative">
      {/* BACKGROUND layer: constant 3D tilt + scroll translateY → load drop → shapes. */}
      <motion.div
        style={
          reduced
            ? undefined
            : {
                rotateX: bgRotateX,
                scale: bgScale,
                y: bgY,
                transformPerspective: 1077,
                transformOrigin: 'center center',
              }
        }
      >
        <motion.div
          {...dropProps}
          className="relative h-[560px] overflow-hidden rounded-b-[48px] bg-paper-2 tablet:h-[680px]"
        >
          {/* Warm radial sheens: Highlight (gold, top) + two Lowlights (peach,
              lower-right and lower-left) — the live site has both sides. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-orb-gold" />
          <div
            aria-hidden
            className="pointer-events-none absolute bg-orb-peach opacity-[.26]"
            style={{ inset: '-22px -74px 0 -31px' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute opacity-[.26]"
            style={{
              inset: '-22px -74px 0 -31px',
              background: 'radial-gradient(20% 88% at -7.8% 69.6%, #ff971747 0%, #ababab00 100%)',
            }}
          />
          {/* First "Noise" layer: sits *under* the shapes on the live site. */}
          <Grain src={NOISE_PNG} blend="overlay" opacity={0.16} />
          {/* Blurred shape field (decorative). Clipped by overflow-hidden above.
              Paint order matches the live site: blue, green, red blobs, then the
              yellow triangle on top. Each parallax-drifts on scroll. */}
          <div aria-hidden className="absolute inset-0">
            {shapes.map((s, i) => (
              <HeroShape key={i} shape={s} progress={scrollYProgress} reduced={!!reduced} />
            ))}
            <YellowTriangle progress={scrollYProgress} reduced={!!reduced} />
          </div>
          {/* Grain stack *over* the shapes, mapped 1:1 off the live DOM's two
              named layers: "Gradient" film grain at `multiply .04` (the gentle
              darkener that tints the header) + a second "Noise" pass at
              `overlay .15`. (An earlier `overlay .74` here was wrong — that
              opacity belonged to an unrelated element — and made it too intense.) */}
          <Grain src={GRAIN_PNG} blend="multiply" opacity={0.04} />
          <Grain src={NOISE_PNG} blend="overlay" opacity={0.15} />
        </motion.div>
      </motion.div>

      {/* TEXT layer: an overlay, independent of the background's 3D transform.
          Its own flat scroll parallax wraps its own one-shot fade-up. */}
      <div className="absolute inset-0">
        <motion.div
          style={reduced ? undefined : { y: textY }}
          className="mx-auto flex h-full max-w-[1020px] flex-col items-start px-8 pb-[90px] pt-[180px] tablet:px-12 tablet:pt-[280px]"
        >
          <Reveal y={70} delay={0.45}>
            <Text as="p" variant="hiya" className="text-ink-strong/75">
              {site.hero}
            </Text>
          </Reveal>
          <Reveal y={70} delay={0.55}>
            <Text
              as="h1"
              variant="hero"
              className="mt-2 max-w-[900px] text-white [text-shadow:0_1px_8px_#0000001a,0_2px_2px_#4541410a]"
            >
              {site.intro}
            </Text>
          </Reveal>
        </motion.div>
      </div>
    </section>
  )
}
