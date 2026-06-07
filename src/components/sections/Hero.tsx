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
 * The four shapes that make the hero's soft glow, measured off the live DOM:
 * two rotated squircles (green/red), the blue radial-gradient circle, and a
 * blurred yellow squircle approximating the original's rotated SVG "splat".
 * Positions are px offsets within the 1360-wide panel. Each drifts at its own
 * rate on scroll (parallax) — the live site moves these JS-side; exact rates
 * aren't in the static export, so these are tuned by eye for depth.
 */
const shapes: Shape[] = [
  { bg: 'bg-swatch-green', size: 541, radius: 'rounded-[161px]', rotate: 67, blur: 12, top: 300, left: 360, drift: 80 },
  { bg: 'bg-swatch-red', size: 404, radius: 'rounded-[91px]', rotate: 8, blur: 12, top: 190, left: 80, drift: 130 },
  // Blue circle: no scale on the live site; blur is the wrapper's 22px stacked
  // over the circle's own 30px (≈37px combined).
  { bg: 'bg-orb-blue', size: 326, radius: 'rounded-full', rotate: 0, blur: 37, top: 42, left: 400, drift: 50 },
  // Splat: live is a 551×469 SVG at rotate(96deg); approximated as a squircle.
  { bg: 'bg-swatch-yellow', size: 540, radius: 'rounded-[44%]', rotate: 96, blur: 8, top: -78, left: -31, drift: 170 },
]

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
 *  - Background sits at a *constant* 3D tilt — `perspective(1077) scale(1.2)
 *    rotateX(-30)` — exactly the live rest state; only its translateY parallaxes
 *    on scroll (from −19.25px). A one-shot load "drop" springs into that tilt.
 *    The shapes parallax-drift independently inside it.
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
  // Background: tilt is constant; only translateY parallaxes (live: −19.25 → ~−11 and on).
  const bgY = useTransform(scrollYProgress, [0, 1], [-19.25, 24])
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
            : { rotateX: -30, scale: 1.2, y: bgY, transformPerspective: 1077, transformOrigin: 'center top' }
        }
      >
        <motion.div
          {...dropProps}
          className="relative h-[560px] overflow-hidden rounded-b-[48px] bg-paper-2 tablet:h-[680px]"
        >
          {/* Warm radial sheens (Highlight: gold top; Lowlight: peach lower-right). */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-orb-gold" />
          <div
            aria-hidden
            className="pointer-events-none absolute bg-orb-peach opacity-[.26]"
            style={{ inset: '-22px -74px 0 -31px' }}
          />
          {/* Blurred shape field (decorative). Clipped by overflow-hidden above. */}
          <div aria-hidden className="absolute inset-0">
            {shapes.map((s, i) => (
              <HeroShape key={i} shape={s} progress={scrollYProgress} reduced={!!reduced} />
            ))}
          </div>
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
