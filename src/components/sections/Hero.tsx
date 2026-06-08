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
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { createNoise2D } from 'simplex-noise'
import { Text } from '@/components/primitives'
import { Reveal } from '@/motion/Reveal'
import { springHero } from '@/motion/motionConfig'
import { site } from '@/content'
import ShapeBlur from './ShapeBlur'

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
 * they stop — so the shapes don't re-transform every frame (which would re-raster
 * the blend-mode panel) during a scroll, yet never snap on/off. Asymmetric rates:
 * drop fast (k≈9, ~110ms), resume gently (k≈3, ~330ms). Skipped entirely when the
 * hero is off-screen. `scrollAt` is the timestamp of the last scroll, shared from
 * the parent so a single passive listener feeds every shape.
 */
/**
 * True while the page is visible *and* the window has focus. Drives an extra gate
 * on the float loop: a backgrounded tab already throttles rAF, but an unfocused
 * yet visible window does not — this catches that case too.
 */
function usePageActive() {
  const [active, setActive] = useState(() =>
    typeof document === 'undefined' ? true : document.visibilityState === 'visible' && document.hasFocus(),
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

function useFloat(seed: number, reduced: boolean, scrollAt: RefObject<number>, inView: boolean, enabled: boolean) {
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
 * Default modes. These are the *initial* values — at runtime the dev panel
 * ({@link HeroDevPanel}, dev builds only) overrides them via state, persisted to
 * localStorage. Edit these to change the shipped defaults.
 *
 * - `SHAPE_BLUR`: WebGL **ShapeBlur** SDF shapes (`true`) vs the faithful 1:1
 *   Framer blurred swatches (`false`).
 * - `CLIP_TILT`: flat 2D `scale + clip-path` trapezoid (`true`, no 3D context →
 *   canvases/grain composite independently) vs the original 3D
 *   `perspective + rotateX` tilt (`false`). Trade-off: clip-tilt doesn't
 *   perspective-foreshorten the contents (invisible — all heavily blurred).
 * - `CLIP_INSET`: top-edge inset (% width, each side) at scroll 0; eases to 0
 *   (rectangle). Higher = more slant at start. Only used when `CLIP_TILT`.
 * - `FLOAT`: ambient simplex-noise wander on the shapes ({@link useFloat}).
 * - `HOVER_BLUR`: pointer-reveal bloom in the WebGL ShapeBlur canvases. Only has
 *   an effect when `SHAPE_BLUR` is on.
 * - `GRAIN`: composite the over-shape film grain *inside* the ShapeBlur shader
 *   (hash noise added per-pixel) instead of via the two CSS `mix-blend` grain
 *   divs. Drops the per-frame backdrop re-raster those blends force while the
 *   shapes move. Only meaningful with `SHAPE_BLUR` on (grain rides the canvases);
 *   when on, the two over-shape CSS grain layers are not rendered.
 */
const DEFAULT_MODES = { SHAPE_BLUR: true, CLIP_TILT: true, CLIP_INSET: 9, FLOAT: true, HOVER_BLUR: false, AUTO_BLUR: true, GRAIN: true }
// In-shader grain tuning (GRAIN mode): additive hash noise. Intensity ≈ the old
// CSS multiply .04 + overlay .15 pair; scale 1 = ~per-CSS-px cells (fine film).
const SHADER_GRAIN_AMOUNT = 0.09
const SHADER_GRAIN_SCALE = 1.0
const MODES_STORAGE_KEY = 'hero-modes'

type HeroModes = typeof DEFAULT_MODES

/** Read persisted dev-panel overrides, falling back to {@link DEFAULT_MODES}. */
function loadModes(): HeroModes {
  if (typeof window === 'undefined') return DEFAULT_MODES
  try {
    const raw = window.localStorage.getItem(MODES_STORAGE_KEY)
    return raw ? { ...DEFAULT_MODES, ...JSON.parse(raw) } : DEFAULT_MODES
  } catch {
    return DEFAULT_MODES
  }
}

/** Corner radius (px) for the clip-tilt trapezoid's bottom corners — matches the
 *  `rounded-b-[48px]` the panel uses in the 3D mode. */
const CLIP_RADIUS = 48
/** Mask bottom as a fraction of panel height — <1 trims the bottom so the panel
 *  reads shorter and overlaps the section below less. */
const CLIP_BOTTOM = 0.9
/** Clip-tilt only: px the panel extends past its column on each side (symmetric
 *  negative margin) so the masked panel reads a bit wider. */
const CLIP_WIDEN = 100
/** Extra inset (% width, each side) the BOTTOM edge gets beyond the top, so the
 *  trapezoid is wider at the top and tapers in toward a narrower bottom. */
const CLIP_TAPER = 14
/** Scroll parallax: the hero background lags the page by this fraction of the
 *  scrolled distance (0 = moves with content, 0.25 ≈ scrolls at 75% speed). */
const PARALLAX_FACTOR = 0.25
/** Clip-path is the one scroll-driven property that *re-rasters* the panel (it's
 *  not GPU-composited like transform). Recomputing it every frame re-rasters the
 *  whole decorative panel — 4 canvases + sheens + grain — on each scroll tick.
 *  Snap the scroll progress to this px grid so consecutive frames emit an
 *  identical `path()` string and the raster is skipped; the taper straightens in
 *  ~8px steps, which the heavy blur hides. Transform (scale/y) stays per-frame. */
const CLIP_QUANT_PX = 8

/**
 * A `clip-path: path()` string for the clip-tilt panel: **wide top, narrow
 * bottom**. The top corners are inset by `topInsetPx` (driven by the `CLIP_INSET`
 * slider) and the bottom corners by `bottomInsetPx` (= top + {@link CLIP_TAPER}),
 * so the sides taper inward going down. Both insets ease to 0 on scroll, so the
 * shape straightens to a rectangle. The narrow bottom edge sits at `CLIP_BOTTOM`·h
 * with both corners rounded by {@link CLIP_RADIUS} (quadratic curves — `polygon()`
 * can't round). px coordinates (path() has no `%`), origin top-left, measured
 * pre-transform. Top corners stay sharp (off-screen). `none` until measured.
 */
function clipTiltPath(w: number, h: number, topInsetPx: number, bottomInsetPx: number): string {
  if (w <= 0 || h <= 0) return 'none'
  const ti = Math.max(0, topInsetPx)
  const bi = Math.max(0, bottomInsetPx)
  const hb = h * CLIP_BOTTOM // mask bottom (trimmed shorter)
  // Clamp radius so it can't exceed the (narrow) bottom span or the height.
  const r = Math.min(CLIP_RADIUS, hb * 0.5, (w - 2 * bi) * 0.5)
  // Unit vector up each slant, from a bottom corner toward its top corner. The
  // slant's horizontal run is (bi − ti) over the height hb; mirror on both sides.
  const sl = Math.hypot(bi - ti, hb) || 1
  const ux = (bi - ti) / sl // horizontal step toward center going up the slant
  const uy = hb / sl // vertical step going up (subtracted from y)
  const f = (n: number) => n.toFixed(2)
  // M topL → L topR (wide) → down right slant to before BR → curve BR → along the
  // narrow bottom to before BL → curve BL → up left slant (Z closes to topL).
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
  /** ShapeBlur experiment: tint + SDF variation (0 rounded-rect, 1 circle). */
  color: string
  /** Optional second tint for a gradient fill (defaults to flat `color`). */
  color2?: string
  variation: number
  /** Optional per-shape baseline blur override (defaults to 0.25). */
  baseBlur?: number
  /** Optional ShapeBlur shapeSize override (defaults to 0.9). */
  shapeSize?: number
  /** Optional canvas padding factor of `size` (defaults to 0.6) — bigger = more
   *  room for the hover bloom before the canvas edge clips it. */
  pad?: number
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
  { bg: 'bg-orb-blue', size: 326, radius: 'rounded-full', rotate: 0, blur: 37, top: 42, left: 400, drift: 50, color: '#38c0ff', color2: '#0f8bff', variation: 1, shapeSize: 0.5, pad: 0.75, baseBlur: 0.15 },
  { bg: 'bg-swatch-green', size: 541, radius: 'rounded-[161px]', rotate: 67, blur: 12, top: 300, left: 360, drift: 80, color: '#5bff97', color2: '#22d36e', variation: 4 },
  { bg: 'bg-swatch-red', size: 404, radius: 'rounded-[91px]', rotate: 8, blur: 12, top: 250, left: 80, drift: 130, color: '#fd6d6d', color2: '#f53a3a', variation: 4 },
  // Yellow "splat": filled triangle (var 3), top-left, on top — matches the
  // live site's yellow rounded-triangle in the blur experiment.
  { bg: 'bg-swatch-yellow', size: 520, radius: '', rotate: 0, blur: 7, top: -100, left: -40, drift: 170, color: '#fff7a0', color2: '#ffe34d', variation: 5, baseBlur: 0.08 },
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

// Static, prop-independent splat geometry — hoisted so it isn't rebuilt per render.
const YELLOW_BASE = { top: -78, left: -31, filter: 'blur(7px)' as const }
const yellowPath = (
  <path
    d="M 232.092 70.325 C 250.297 38.978 295.57 38.978 313.774 70.325 L 504.101 398.053 C 522.386 429.539 499.67 469 463.26 469 L 82.607 469 C 46.197 469 23.481 429.539 41.766 398.053 Z"
    fill="#fff04d"
  />
)
const yellowSvgProps = { className: 'absolute', width: 551, height: 469, viewBox: '0 0 546 469', 'aria-hidden': true }

/**
 * The yellow "splat": on the live site a 551×469 rounded-triangle SVG, heavily
 * blurred, anchored top-left (top:-78/left:-31) and rotated **96°** about its
 * centre, painted on top of the other blobs and mostly clipped by the panel.
 * Same color as the swatch (`hsl(55,100%,65%)` ≈ #fff04d). Drifts with scroll
 * like the other shapes.
 */
function YellowTriangle({ progress, reduced }: { progress: MotionValue<number>; reduced: boolean }) {
  const y = useTransform(progress, [0, 1], [0, 170])
  if (reduced)
    return (
      <svg {...yellowSvgProps} style={{ ...YELLOW_BASE, transform: 'rotate(96deg)' }}>
        {yellowPath}
      </svg>
    )
  return (
    <motion.svg {...yellowSvgProps} style={{ ...YELLOW_BASE, rotate: 96, y }}>
      {yellowPath}
    </motion.svg>
  )
}

/** Per-shape seed so each blob wanders an independent noise path. */
const floatSeed = (shape: Shape) => shape.left * 0.013 + shape.top * 0.007

interface ShapeProps {
  shape: Shape
  progress: MotionValue<number>
  reduced: boolean
  /** Timestamp of the last scroll event; gates the float (see {@link useFloat}). */
  scrollAt: RefObject<number>
  /** False while the hero is off-screen — float work is skipped entirely. */
  inView: boolean
  /** Ambient noise wander on/off (dev-panel `FLOAT`). */
  float: boolean
  /** Pointer-reveal bloom on/off (dev-panel `HOVER_BLUR`); BlurShape only. */
  hoverBlur: boolean
  /** Auto-orbit reveal (virtual cursor sweeps the left shapes); BlurShape only. */
  autoBlur: boolean
  /** In-shader film grain on/off (dev-panel `GRAIN`); BlurShape only. */
  grain: boolean
  /** Hard-park the WebGL auto-orbit loop (page scrolled off top); BlurShape only. */
  paused: boolean
}

/** A single blurred shape; scroll-parallax drift + ambient noise float. */
function HeroShape({ shape, progress, reduced, scrollAt, inView, float }: ShapeProps) {
  const yDrift = useTransform(progress, [0, 1], [0, shape.drift])
  const { x, y: fy, rot } = useFloat(floatSeed(shape), reduced, scrollAt, inView, float)
  // Float layers on top of scroll drift: combined y = parallax + noise.
  const y = useTransform([yDrift, fy], ([a, b]: number[]) => a + b)
  const rotate = useTransform(rot, (v) => shape.rotate + v)
  const base = {
    width: shape.size,
    height: shape.size,
    top: shape.top,
    left: shape.left,
    filter: `blur(${shape.blur}px)`,
  }
  const cls = `absolute ${shape.bg} ${shape.radius}`
  if (reduced) return <div className={cls} style={{ ...base, transform: `rotate(${shape.rotate}deg)` }} />
  // Own compositor layer: parallax/float moves re-composite, not re-raster.
  return <motion.div className={cls} style={{ ...base, x, rotate, y, willChange: 'transform' }} />
}

/**
 * Experimental ShapeBlur variant of {@link HeroShape}: same position/size/drift,
 * but a pointer-reactive WebGL canvas instead of a static blurred swatch. The
 * box is padded out so the shape's soft edge isn't clipped by the canvas bounds.
 */
function BlurShape({ shape, progress, reduced, scrollAt, inView, float, hoverBlur, autoBlur, grain, paused }: ShapeProps) {
  const yDrift = useTransform(progress, [0, 1], [0, shape.drift])
  const { x, y: fy, rot } = useFloat(floatSeed(shape), reduced, scrollAt, inView, float)
  const y = useTransform([yDrift, fy], ([a, b]: number[]) => a + b)
  const rotate = useTransform(rot, (v) => shape.rotate + v)
  // Pad = transparent margin around the shape so the auto/hover bloom doesn't clip
  // at the canvas edge. Trimmed from 0.6→0.45 (and blue 1.0→0.75): the auto-orbit
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
      reduced={reduced || (!hoverBlur && !autoBlur)}
      autoMotion={autoBlur}
      grainAmount={grain ? SHADER_GRAIN_AMOUNT : 0}
      grainScale={SHADER_GRAIN_SCALE}
      paused={paused}
    />
  )
  if (reduced) return <div className="absolute" style={{ ...base, transform: `rotate(${shape.rotate}deg)` }}>{content}</div>
  return (
    <motion.div className="absolute" style={{ ...base, x, rotate, y, willChange: 'transform' }}>
      {content}
    </motion.div>
  )
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

  // Runtime-switchable modes (dev panel below). Lazy-init from localStorage so a
  // chosen mode survives reload; setModes persists on every change.
  const [modes, setModes] = useState<HeroModes>(loadModes)
  const updateModes = (patch: Partial<HeroModes>) =>
    setModes((m) => {
      const next = { ...m, ...patch }
      try {
        window.localStorage.setItem(MODES_STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* ignore quota / private-mode failures */
      }
      return next
    })

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
  // Aggressive perf gate: ALL ambient hero animation (simplex float + WebGL
  // auto-orbit) is killed the moment the page is scrolled off the very top, and
  // only restored when scrolled back to 0. The functional updater returns the same
  // value while it hasn't crossed the boundary, so this re-renders Hero just twice
  // per round-trip (leave-top / return-top), not on every scroll event.
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
  // Background: the whole 3D tilt is scroll-driven and *releases to identity* as
  // you scroll. At scroll 0 it sits at the live rest tilt
  // (`translateY(-19.1) scale(1.2) rotateX(-30)`); by the time the panel scrolls
  // past, it has flattened to `translateY(0) scale(1) rotateX(0)`. These must be
  // MotionValues — as literals they'd freeze the tilt and never transition back.
  const bgRotateX = useTransform(scrollYProgress, [0, 1], [-30, 0])
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.2, 1])
  // Clip-tilt variant: wide top, narrow bottom. The TOP edge width is driven by
  // the `CLIP_INSET` slider; the bottom is inset further (+CLIP_TAPER) so the sides
  // taper inward. Both ease to 0 on scroll (straighten to a rectangle). No 3D
  // context. Built as a `path()` ({@link clipTiltPath}); needs px, so measured.
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
  // Last computed clip string, so we can return it verbatim once the page is
  // scrolled. clip-path is the ONE scroll-driven property that re-rasters the
  // panel (4 WebGL canvases + sheens + grain) — it can't be GPU-composited like a
  // transform. Recomputing it per scroll frame is the hero's main scroll jank, so
  // we FREEZE it the instant we leave the top: the transform short-circuits to the
  // cached string, the MotionValue dedupes the identical value, no DOM write fires,
  // no raster happens. The straighten-on-scroll only ever ran at scrollY≈0 anyway
  // (atTop), so nothing visible is lost. scale/y keep animating — with a static
  // clip they're pure compositor matrix ops, no raster.
  const frozenClip = useRef('none')
  const clipPath = useTransform(scrollYProgress, (p) => {
    if (!atTopRef.current) return frozenClip.current
    // Snap progress to an ~8px grid (see CLIP_QUANT_PX) so most frames reproduce
    // the previous path() string verbatim → no clip-path raster that tick.
    const step = panelSize.h > 0 ? CLIP_QUANT_PX / panelSize.h : 1
    const qp = step > 0 ? Math.round(p / step) * step : p
    const ease = 1 - qp
    const topInset = (modes.CLIP_INSET / 100) * panelSize.w * ease
    const bottomInset = ((modes.CLIP_INSET + CLIP_TAPER) / 100) * panelSize.w * ease
    const path = clipTiltPath(panelSize.w, panelSize.h, topInset, bottomInset)
    frozenClip.current = path
    return path
  })
  // Background Y: the −19.25→0 tilt rest offset, plus a scroll parallax that lags
  // the panel behind the page. The scroll range spans the panel height, so a
  // downward shift of PARALLAX_FACTOR·p·h makes the hero scroll that fraction
  // slower than the surrounding content.
  const bgY = useTransform(
    scrollYProgress,
    (p) => -19.25 * (1 - p) + PARALLAX_FACTOR * p * panelSize.h,
  )
  // Text parallax — independent of the tilt: drifts up, stays flat.
  const textY = useTransform(scrollYProgress, [0, 1], [0, -120])

  // Load "drop": composes with the constant tilt below (scale 0.75 × 1.2 = 0.9
  // start → 1 × 1.2 = 1.2 rest; y −80 from the −19.25 rest ≈ the live −100 start).
  // Disabled in clip-tilt mode — the drop's scale animates the panel size, which
  // makes the clip-mask edge visibly grow on load. (Temporary; revisit once the
  // mask shape is locked in.)
  const dropProps =
    reduced || modes.CLIP_TILT
      ? {}
      : {
          initial: { opacity: 0.001, y: -80, scale: 0.75 },
          animate: { opacity: 1, y: 0, scale: 1 },
          transition: { ...springHero, delay: 0.2 },
        }

  return (
    <section ref={ref} className="relative z-10">
      {/* BACKGROUND layer: tilt (3D rotateX, or flat scale + clip-path trapezoid)
          + scroll translateY → load drop → shapes. The `key` forces a remount when
          the tilt mode flips so no inline style (clip-path / perspective) from the
          other mode lingers — and keeps clip mode strictly 2D (no perspective). */}
      <motion.div
        key={modes.CLIP_TILT ? 'tilt-clip' : 'tilt-3d'}
        ref={measureRef}
        style={
          reduced
            ? undefined
            : modes.CLIP_TILT
              ? {
                  // Flat 2D: scale + translateY, with the edge angle carried by an
                  // animated clip-path instead of a 3D rotateX. No perspective →
                  // no 3D context flattening the canvases/grain into one layer.
                  // A bit wider than its column (symmetric negative margin) so the
                  // masked panel reads wider; height is trimmed in the clip itself.
                  scale: bgScale,
                  y: bgY,
                  width: `calc(100% + ${2 * CLIP_WIDEN}px)`,
                  marginLeft: -CLIP_WIDEN,
                  transformOrigin: 'center center',
                  clipPath,
                  willChange: 'transform, clip-path',
                }
              : {
                  rotateX: bgRotateX,
                  scale: bgScale,
                  y: bgY,
                  transformPerspective: 1077,
                  transformOrigin: 'center center',
                  // Promote to a compositor layer so the scroll-driven scale/tilt is
                  // a GPU matrix on a cached texture, not a per-frame re-raster of the
                  // whole decorative panel (4 canvases + blend-mode grain).
                  willChange: 'transform',
                  backfaceVisibility: 'hidden',
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
            {modes.SHAPE_BLUR ? (
              shapes.map((s, i) => (
                <BlurShape key={i} shape={s} progress={scrollYProgress} reduced={!!reduced} scrollAt={scrollAt} inView={inView && active} float={modes.FLOAT && atTop} hoverBlur={modes.HOVER_BLUR} autoBlur={modes.AUTO_BLUR} grain={modes.GRAIN} paused={!atTop} />
              ))
            ) : (
              <>
                {shapes.map((s, i) => (
                  <HeroShape key={i} shape={s} progress={scrollYProgress} reduced={!!reduced} scrollAt={scrollAt} inView={inView && active} float={modes.FLOAT && atTop} hoverBlur={modes.HOVER_BLUR} autoBlur={modes.AUTO_BLUR} grain={modes.GRAIN} paused={!atTop} />
                ))}
                <YellowTriangle progress={scrollYProgress} reduced={!!reduced} />
              </>
            )}
          </div>
          {/* Grain stack *over* the shapes, mapped 1:1 off the live DOM's two
              named layers: "Gradient" film grain at `multiply .04` (the gentle
              darkener that tints the header) + a second "Noise" pass at
              `overlay .15`. (An earlier `overlay .74` here was wrong — that
              opacity belonged to an unrelated element — and made it too intense.)
              GRAIN mode moves this grain into the ShapeBlur shader, so the two
              backdrop-reading mix-blend layers are dropped to avoid the per-frame
              re-raster while the shapes move. */}
          {!(modes.GRAIN && modes.SHAPE_BLUR) && (
            <>
              <Grain src={GRAIN_PNG} blend="multiply" opacity={0.04} />
              <Grain src={NOISE_PNG} blend="overlay" opacity={0.15} />
            </>
          )}
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

      <HeroDevPanel modes={modes} onChange={updateModes} />
    </section>
  )
}

/**
 * Dev-only overlay to flip hero modes live (dev builds only — `import.meta.env.DEV`
 * compiles to `false` in prod, so this whole tree is dead-code-eliminated). Fixed
 * bottom-right; choices persist via {@link updateModes} → localStorage. Reset
 * clears the override so the page falls back to {@link DEFAULT_MODES}.
 */
function HeroDevPanel({ modes, onChange }: { modes: HeroModes; onChange: (patch: Partial<HeroModes>) => void }) {
  if (!import.meta.env.DEV) return null
  const row = 'flex items-center justify-between gap-3'
  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-56 select-none rounded-xl bg-black/80 p-3 font-mono text-[11px] text-white shadow-lg backdrop-blur"
      style={{ lineHeight: 1.4 }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold uppercase tracking-wide opacity-70">hero modes</span>
        <button
          type="button"
          className="rounded px-1.5 py-0.5 text-[10px] opacity-60 hover:bg-white/10 hover:opacity-100"
          onClick={() => {
            try {
              window.localStorage.removeItem(MODES_STORAGE_KEY)
            } catch {
              /* ignore */
            }
            onChange(DEFAULT_MODES)
          }}
        >
          reset
        </button>
      </div>

      <label className={`${row} mb-1.5 cursor-pointer`}>
        <span>shapes: {modes.SHAPE_BLUR ? 'WebGL blur' : '1:1 Framer'}</span>
        <input type="checkbox" checked={modes.SHAPE_BLUR} onChange={(e) => onChange({ SHAPE_BLUR: e.target.checked })} />
      </label>

      <label className={`${row} mb-1.5 cursor-pointer`}>
        <span>tilt: {modes.CLIP_TILT ? '2D clip' : '3D rotateX'}</span>
        <input type="checkbox" checked={modes.CLIP_TILT} onChange={(e) => onChange({ CLIP_TILT: e.target.checked })} />
      </label>

      <label className={`${row} mb-1.5 cursor-pointer`}>
        <span>float: {modes.FLOAT ? 'on' : 'off'}</span>
        <input type="checkbox" checked={modes.FLOAT} onChange={(e) => onChange({ FLOAT: e.target.checked })} />
      </label>

      <label className={`${row} mb-1.5 cursor-pointer ${modes.SHAPE_BLUR ? '' : 'pointer-events-none opacity-40'}`}>
        <span>hover blur: {modes.HOVER_BLUR ? 'on' : 'off'}</span>
        <input type="checkbox" checked={modes.HOVER_BLUR} onChange={(e) => onChange({ HOVER_BLUR: e.target.checked })} />
      </label>

      <label className={`${row} mb-1.5 cursor-pointer ${modes.SHAPE_BLUR ? '' : 'pointer-events-none opacity-40'}`}>
        <span>auto blur: {modes.AUTO_BLUR ? 'on' : 'off'}</span>
        <input type="checkbox" checked={modes.AUTO_BLUR} onChange={(e) => onChange({ AUTO_BLUR: e.target.checked })} />
      </label>

      <label className={`${row} mb-1.5 cursor-pointer ${modes.SHAPE_BLUR ? '' : 'pointer-events-none opacity-40'}`}>
        <span>grain: {modes.GRAIN && modes.SHAPE_BLUR ? 'shader' : 'CSS blend'}</span>
        <input type="checkbox" checked={modes.GRAIN} onChange={(e) => onChange({ GRAIN: e.target.checked })} />
      </label>

      <label className={`${row} ${modes.CLIP_TILT ? '' : 'pointer-events-none opacity-40'}`}>
        <span>inset: {modes.CLIP_INSET}%</span>
        <input
          type="range"
          min={0}
          max={20}
          step={1}
          value={modes.CLIP_INSET}
          onChange={(e) => onChange({ CLIP_INSET: Number(e.target.value) })}
          className="w-24"
        />
      </label>
    </div>
  )
}
