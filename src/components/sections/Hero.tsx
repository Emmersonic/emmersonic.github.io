import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react'
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react'
import { createNoise2D } from 'simplex-noise'
import { Text } from '@/components/primitives'
import { Reveal } from '@/motion/Reveal'
import { site } from '@/content'

// Lazy: ShapeBlur pulls in three.js (~600 kB min). Splitting it into an async
// chunk keeps the initial bundle lean; the shapes appear when the chunk lands
// (they fade up behind a heavy blur, so the late arrival isn't jarring).
const ShapeBlur = lazy(() => import('./ShapeBlur'))

/**
 * Continuous ambient "float" for the hero blobs. Each shape wanders along its
 * own 2D simplex-noise path (never loops, unlike keyframes), sampled per frame
 * and exposed as motion values that *layer on top of* the scroll-parallax drift.
 * One shared noise field; per-shape `seed` offsets pick out independent paths.
 */
const noise2D = createNoise2D()
const FLOAT_AMP = 55 // px of horizontal/vertical wander
const ROT_AMP = 8 // deg of rotational sway
const FLOAT_SPEED = 0.00011 // ms → noise-space; lower = slower, dreamier
const SCROLL_IDLE_MS = 90 // grace after the last scroll event before float resumes

/**
 * Ambient float, gated for scroll performance. The wander amplitude rides a
 * `gain` (0→1) that *eases* to 0 while the user is scrolling and eases back when
 * they stop. Asymmetric rates: drop fast (k≈9, ~110ms), resume gently (k≈4.5,
 * ~220ms). Skipped entirely when the hero is off-screen.
 *
 * `enabled` stays `true` for the lifetime of the shape — the gain mechanism owns
 * the scroll suppression. Keeping the hook running (vs. killing it when atTop
 * flips false) avoids the jank of shapes freezing at a non-zero float offset the
 * moment a scroll starts; they ease smoothly to 0 instead.
 */
function useFloat(
  seed: number,
  reduced: boolean,
  scrollAt: RefObject<number>,
  inView: boolean,
  enabled: boolean,
) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rot = useMotionValue(0)
  const gain = useRef(0)
  // True once the wander has fully eased to 0 during a scroll — see below.
  const frozen = useRef(false)
  useAnimationFrame((_t, delta) => {
    if (!enabled || reduced || !inView) return
    // Gate on performance.now(), the SAME clock the scroll listener stamps into
    // scrollAt. framer's `_t` is time-since-loop-start (a different origin), so
    // comparing it to scrollAt mis-timed the gate — resume lagged by the loop's
    // start offset. now-vs-now makes the 90ms grace exact.
    const now = performance.now()
    const idle = now - scrollAt.current > SCROLL_IDLE_MS
    const target = idle ? 1 : 0
    // Resume (rise) at k≈4.5 (~220ms), drop fast at k≈9 (~110ms). The float always
    // climbs back to full once scrolling stops — gain converges to target=1.
    const k = target > gain.current ? 4.5 : 9
    gain.current += (target - gain.current) * (1 - Math.exp(-(delta / 1000) * k))
    const g = gain.current
    // Frozen: mid-scroll and the wander has fully eased out. Zero the values once,
    // then skip the noise sampling + motion-value writes every frame until scrolling
    // stops — so the float costs nothing on the main thread *during* a scroll instead
    // of running 12 noise2D + 12 .set() per frame to produce ~0.
    if (!idle && g < 0.002) {
      if (!frozen.current) {
        x.set(0)
        y.set(0)
        rot.set(0)
        frozen.current = true
      }
      return
    }
    frozen.current = false
    const n = now * FLOAT_SPEED
    x.set(noise2D(n, seed) * FLOAT_AMP * g)
    y.set(noise2D(n, seed + 50) * FLOAT_AMP * g)
    rot.set(noise2D(n, seed + 100) * ROT_AMP * g)
  })
  return { x, y, rot }
}

/**
 * True while the page is visible *and* the window has focus. Drives an extra gate
 * on the float loop: a backgrounded tab already throttles rAF, but an unfocused
 * yet visible window does not — this catches that case too.
 */
function usePageActive() {
  const [active, setActive] = useState(() =>
    typeof document === 'undefined'
      ? true
      : document.visibilityState === 'visible' && document.hasFocus(),
  )
  useEffect(() => {
    const update = () => setActive(document.visibilityState === 'visible' && document.hasFocus())
    update()
    window.addEventListener('focus', update)
    window.addEventListener('blur', update)
    document.addEventListener('visibilitychange', update)
    return () => {
      window.removeEventListener('focus', update)
      window.removeEventListener('blur', update)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  return active
}

/** Corner radius (px) for the clip-tilt trapezoid's bottom corners — matches the
 *  `rounded-b-[48px]` the panel uses. */
const CLIP_RADIUS = 48
/** Mask bottom as a fraction of panel height — <1 trims the bottom so the panel
 *  reads shorter and overlaps the section below less. */
const CLIP_BOTTOM = 0.9
/** px the panel extends past its column on each side (symmetric negative margin)
 *  so the masked panel reads a bit wider. */
const CLIP_WIDEN = 100
/** Extra inset (% width, each side) the BOTTOM edge gets so the trapezoid tapers
 *  inward going down. Top edge stays full-width (0 top inset). */
const CLIP_TAPER = 14
/** Scroll parallax: the hero background lags the page by this fraction of the
 *  scrolled distance (0 = moves with content, 0.25 ≈ scrolls at 75% speed). */
const PARALLAX_FACTOR = 0.25
/** Clip-path is the one scroll-driven property that *re-rasters* the panel (it's
 *  not GPU-composited like transform). Snap the scroll progress to this px grid so
 *  consecutive frames emit an identical `path()` string and the raster is skipped;
 *  the taper straightens in ~8px steps, which the heavy blur hides. */
const CLIP_QUANT_PX = 8

/**
 * A `clip-path: path()` string for the clip-tilt panel: full-width top, tapered
 * bottom. The bottom corners are inset by `bottomInsetPx` (= {@link CLIP_TAPER}%
 * of width × ease) and rounded by {@link CLIP_RADIUS}. The taper eases to 0 on
 * scroll so the shape straightens to a rectangle. Top corners stay sharp
 * (off-screen). `none` until measured.
 */
function clipTiltPath(w: number, h: number, topInsetPx: number, bottomInsetPx: number): string {
  if (w <= 0 || h <= 0) return 'none'
  const ti = Math.max(0, topInsetPx)
  const bi = Math.max(0, bottomInsetPx)
  const hb = h * CLIP_BOTTOM // mask bottom (trimmed shorter)
  // Clamp radius so it can't exceed the (narrow) bottom span or the height.
  const r = Math.min(CLIP_RADIUS, hb * 0.5, (w - 2 * bi) * 0.5)
  // Unit vector up each slant, from a bottom corner toward its top corner.
  const sl = Math.hypot(bi - ti, hb) || 1
  const ux = (bi - ti) / sl
  const uy = hb / sl
  const f = (n: number) => n.toFixed(2)
  return (
    `path("M${f(ti)} 0 L${f(w - ti)} 0 ` +
    `L${f(w - bi + r * ux)} ${f(hb - r * uy)} ` +
    `Q${f(w - bi)} ${f(hb)} ${f(w - bi - r)} ${f(hb)} ` +
    `L${f(bi + r)} ${f(hb)} ` +
    `Q${f(bi)} ${f(hb)} ${f(bi - r * ux)} ${f(hb - r * uy)} Z")`
  )
}

/** One big blurred shape in the hero's warm panel. */
interface Shape {
  /** Square side / circle diameter in px. */
  size: number
  /** Static rotation in degrees. */
  rotate: number
  /** Absolute offset inside the panel (from its top-left). */
  top: number
  left: number
  /** Scroll-parallax drift in px over the hero's scroll range (depth cue). */
  drift: number
  /** ShapeBlur tint — any CSS color, including `var(--token)` references
   *  (resolved against the mount element at context creation). */
  color: string
  /** Optional second tint for a gradient fill (defaults to flat `color`). */
  color2?: string
  variation: number
  /** Optional per-shape baseline blur override (defaults to 0.25). */
  baseBlur?: number
  /** Optional ShapeBlur shapeSize override (defaults to 0.9). */
  shapeSize?: number
  /** Optional canvas padding factor of `size` (defaults to 0.45) — bigger = more
   *  room for the auto-orbit bloom before the canvas edge clips it. */
  pad?: number
}

// Paint order matches the live site: blue, green, red blobs, then yellow on top.
const shapes: Shape[] = [
  // Blue circle: blur is the wrapper's 22px stacked over the circle's own 30px (≈37px combined).
  {
    size: 326,
    rotate: 0,
    top: 42,
    left: 400,
    drift: 50,
    color: 'var(--shape-blue-1)',
    color2: 'var(--shape-blue-2)',
    variation: 1,
    shapeSize: 0.5,
    pad: 0.75,
    baseBlur: 0.15,
  },
  {
    size: 541,
    rotate: 67,
    top: 300,
    left: 360,
    drift: 80,
    color: 'var(--shape-green-1)',
    color2: 'var(--shape-green-2)',
    variation: 4,
  },
  {
    size: 404,
    rotate: 8,
    top: 250,
    left: 80,
    drift: 130,
    color: 'var(--shape-red-1)',
    color2: 'var(--shape-red-2)',
    variation: 4,
  },
  // Yellow "splat": filled triangle (var 5), top-left, on top.
  {
    size: 520,
    rotate: 0,
    top: -100,
    left: -40,
    drift: 170,
    color: 'var(--shape-yellow-1)',
    color2: 'var(--shape-yellow-2)',
    variation: 5,
    baseBlur: 0.08,
  },
]

/**
 * The live site's two grain assets, pulled from Framer and committed to
 * `public/images`. CSS mix-blend grain (multiply .04 + overlay .15) composited
 * over the shape field, matching the live Framer DOM layer names "Gradient" and
 * "Noise".
 */
const NOISE_IMG = '/images/noise.webp' // fine "Noise" layer (Hq35x5…)
const GRAIN_IMG = '/images/grain.webp' // smooth film "Gradient" layer (uxNRuj…)

/** One full-bleed image-grain pass (`mix-blend` + opacity), matching a Framer layer. */
function Grain({
  src,
  blend,
  opacity,
}: {
  src: string
  blend: CSSProperties['mixBlendMode']
  opacity: number
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: `url(${src})`, mixBlendMode: blend, opacity }}
    />
  )
}

interface ShapeProps {
  shape: Shape
  progress: MotionValue<number>
  reduced: boolean
  /** Timestamp of the last scroll event; gates the float (see {@link useFloat}). */
  scrollAt: RefObject<number>
  /** False while the hero is off-screen — float work is skipped entirely. */
  inView: boolean
  /** Ambient noise wander enabled (true for the lifetime of the shape — the gain
   *  mechanism handles scroll suppression internally). */
  float: boolean
  /** Hard-park the WebGL auto-orbit loop (page scrolled off top). */
  paused: boolean
}

/** Per-shape seed so each blob wanders an independent noise path. */
const floatSeed = (shape: Shape) => shape.left * 0.013 + shape.top * 0.007

/**
 * WebGL ShapeBlur canvas: same position/size/drift as the shape, plus an
 * auto-orbit bloom (virtual cursor sweeps the shapes) and ambient noise float.
 */
function BlurShape({ shape, progress, reduced, scrollAt, inView, float, paused }: ShapeProps) {
  const yDrift = useTransform(progress, [0, 1], [0, shape.drift])
  const { x, y: fy, rot } = useFloat(floatSeed(shape), reduced, scrollAt, inView, float)
  // Float layers on top of scroll drift: combined y = parallax + noise.
  const y = useTransform([yDrift, fy], ([a, b]: number[]) => a + b)
  const rotate = useTransform(rot, (v) => shape.rotate + v)
  // Pad = transparent margin around the shape so the auto-orbit bloom doesn't clip
  // at the canvas edge. Trimmed from 0.6→0.45 (blue 1.0→0.75): the auto-orbit
  // bloom still clears, but each canvas layer is ~25-30% smaller area — less GPU
  // bandwidth to composite the 4 layers every scroll-parallax frame.
  const pad = shape.size * (shape.pad ?? 0.45)
  const base = {
    width: shape.size + pad * 2,
    height: shape.size + pad * 2,
    top: shape.top - pad,
    left: shape.left - pad,
  }
  const content = (
    <Suspense fallback={null}>
      <ShapeBlur
        variation={shape.variation}
        color={shape.color}
        color2={shape.color2}
        shapeSize={shape.shapeSize ?? 0.9}
        roundness={0.5}
        borderSize={0.09}
        circleSize={0.55}
        circleEdge={1}
        baseBlur={shape.baseBlur ?? 0.25}
        pixelRatioProp={1.5}
        reduced={reduced}
        autoMotion={true}
        paused={paused}
      />
    </Suspense>
  )
  if (reduced)
    return (
      <div className="absolute" style={{ ...base, transform: `rotate(${shape.rotate}deg)` }}>
        {content}
      </div>
    )
  // Own compositor layer: parallax/float moves re-composite, not re-raster.
  return (
    <motion.div className="absolute" style={{ ...base, x, rotate, y, willChange: 'transform' }}>
      {content}
    </motion.div>
  )
}

/**
 * The opening hero band. The **background** and the **text** are independent
 * layers (as on the live site), so the background transform never touches the text:
 *  - Background: flat 2D `scale + clip-path` trapezoid (no 3D context → canvases
 *    and grain composite independently). Scroll-driven scale/Y release from the
 *    live rest tilt; bottom taper eases to a rectangle on scroll. Shapes
 *    parallax-drift inside.
 *  - Text: flat overlay with its own translateY parallax over its own fade-up.
 */
export function Hero() {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLElement>(null)

  // Skip ambient float work whenever the hero isn't on screen. Margin keeps it
  // running slightly before/after the band is in view so re-entry isn't abrupt.
  const inView = useInView(ref, { margin: '200px' })
  // Also pause the float loop when the page is backgrounded or the window loses
  // focus. Hidden tabs already throttle rAF to ~0, but an unfocused-but-visible
  // window keeps firing — gate on focus so we don't animate where no one's looking.
  const active = usePageActive()
  // One passive scroll listener, shared with every shape's float (see useFloat),
  // so the wander eases off during scroll instead of fighting it each frame.
  const scrollAt = useRef(0)
  // Kill ALL ambient hero animation (simplex float + WebGL auto-orbit) once the
  // page is scrolled off the very top. Functional updater: re-renders Hero just
  // twice per round-trip (leave-top / return-top), not on every scroll event.
  const [atTop, setAtTop] = useState(true)
  // Same boolean as `atTop`, but a ref so the per-frame clip-path transform can
  // read it without the closure capturing a stale render's value (and without the
  // transform depending on React state).
  const atTopRef = useRef(true)
  useEffect(() => {
    const onScroll = () => {
      scrollAt.current = performance.now()
      const top = window.scrollY <= 0
      atTopRef.current = top
      setAtTop((prev) => (prev === top ? prev : top))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll progress: 0 → 1 as the panel scrolls up past the top.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.2, 1])
  // Clip-tilt: full-width top, tapered bottom. Needs px, so measured.
  const [panelSize, setPanelSize] = useState({ w: 0, h: 0 })
  const roRef = useRef<ResizeObserver | null>(null)
  const measureRef = useCallback((node: HTMLDivElement | null) => {
    roRef.current?.disconnect()
    if (!node) return
    const read = () => setPanelSize({ w: node.offsetWidth, h: node.offsetHeight })
    const ro = new ResizeObserver(read)
    ro.observe(node)
    roRef.current = ro
    read()
  }, [])
  useEffect(() => () => roRef.current?.disconnect(), [])
  // Last computed clip string: clip-path is the ONE scroll-driven property that
  // re-rasters the panel (4 WebGL canvases + sheens + grain). Freeze it the instant
  // we leave the top: the MotionValue dedupes the identical string, no DOM write
  // fires, no raster happens. scale/y keep animating as pure GPU matrix ops.
  const frozenClip = useRef('none')
  const clipPath = useTransform(scrollYProgress, (p) => {
    if (!atTopRef.current) return frozenClip.current
    // Snap progress to an ~8px grid so most frames reproduce the previous path()
    // string verbatim → no clip-path raster that tick.
    const step = panelSize.h > 0 ? CLIP_QUANT_PX / panelSize.h : 1
    const qp = step > 0 ? Math.round(p / step) * step : p
    const ease = 1 - qp
    // Top edge is full-width (0 inset); bottom tapers inward by CLIP_TAPER and
    // eases to 0 on scroll so the panel straightens to a rectangle.
    const bottomInset = (CLIP_TAPER / 100) * panelSize.w * ease
    const path = clipTiltPath(panelSize.w, panelSize.h, 0, bottomInset)
    frozenClip.current = path
    return path
  })
  // Background Y: the −19.25→0 tilt rest offset, plus a scroll parallax that lags
  // the panel behind the page.
  const bgY = useTransform(
    scrollYProgress,
    (p) => -19.25 * (1 - p) + PARALLAX_FACTOR * p * panelSize.h,
  )
  // Text parallax — independent of the tilt: drifts up, stays flat.
  const textY = useTransform(scrollYProgress, [0, 1], [0, -120])

  const baseShapeProps = {
    progress: scrollYProgress,
    reduced: !!reduced,
    scrollAt,
    inView: inView && active,
    // float stays true — the scroll-gain mechanism eases shapes smoothly to 0
    // during scroll rather than freezing them at their current float offset when
    // atTop flips false.
    float: true,
  }

  return (
    <section ref={ref} className="relative z-10">
      {/* BACKGROUND layer: flat 2D scale + clip-path + scroll translateY.
          No 3D context → canvases and grain composite independently. */}
      <motion.div
        ref={measureRef}
        style={
          reduced
            ? undefined
            : {
                scale: bgScale,
                y: bgY,
                width: `calc(100% + ${2 * CLIP_WIDEN}px)`,
                marginLeft: -CLIP_WIDEN,
                transformOrigin: 'center center',
                clipPath,
                willChange: 'transform, clip-path',
              }
        }
      >
        <div className="relative h-[560px] overflow-hidden rounded-b-[48px] bg-paper-2 tablet:h-[680px]">
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
          <Grain src={NOISE_IMG} blend="overlay" opacity={0.16} />
          {/* Blurred shape field (decorative). Clipped by overflow-hidden above.
              Paint order: blue, green, red blobs, then yellow on top. */}
          <div aria-hidden className="absolute inset-0">
            {shapes.map((s, i) => (
              <BlurShape key={i} shape={s} {...baseShapeProps} paused={!atTop} />
            ))}
          </div>
          {/* CSS grain stack *over* the shapes — mapped 1:1 from the live Framer DOM:
              "Gradient" film grain at `multiply .04` + "Noise" pass at `overlay .15`. */}
          <Grain src={GRAIN_IMG} blend="multiply" opacity={0.04} />
          <Grain src={NOISE_IMG} blend="overlay" opacity={0.15} />
        </div>
      </motion.div>

      {/* TEXT layer: an overlay, independent of the background transform.
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
