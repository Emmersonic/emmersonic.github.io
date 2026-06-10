import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * ShapeBlur (React Bits) — a WebGL plane that paints one SDF shape (rounded
 * rect / circle / triangle) which *sharpens where the pointer passes* and stays
 * soft-blurred elsewhere. Adapted from the JS original with two changes for this
 * project: TypeScript types, and a `u_color` uniform so each instance can be
 * tinted (the upstream shader hard-codes white). Experimental hero accent.
 */

const vertexShader = /* glsl */ `
varying vec2 v_texcoord;
void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_texcoord = uv;
}
`

const fragmentShader = /* glsl */ `
varying vec2 v_texcoord;

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_pixelRatio;

uniform vec3 u_color;
uniform vec3 u_color2;
uniform float u_baseBlur;
uniform float u_shapeSize;
uniform float u_roundness;
uniform float u_borderSize;
uniform float u_circleSize;
uniform float u_circleEdge;
uniform float u_grainAmount;
uniform float u_grainScale;

#ifndef PI
#define PI 3.1415926535897932384626433832795
#endif
#ifndef TWO_PI
#define TWO_PI 6.2831853071795864769252867665590
#endif

#ifndef VAR
#define VAR 0
#endif

#ifndef FNC_COORD
#define FNC_COORD
vec2 coord(in vec2 p) {
    p = p / u_resolution.xy;
    if (u_resolution.x > u_resolution.y) {
        p.x *= u_resolution.x / u_resolution.y;
        p.x += (u_resolution.y - u_resolution.x) / u_resolution.y / 2.0;
    } else {
        p.y *= u_resolution.y / u_resolution.x;
        p.y += (u_resolution.x - u_resolution.y) / u_resolution.x / 2.0;
    }
    p -= 0.5;
    p *= vec2(-1.0, 1.0);
    return p;
}
#endif

#define st0 coord(gl_FragCoord.xy)
#define mx coord(u_mouse * u_pixelRatio)

float sdRoundRect(vec2 p, vec2 b, float r) {
    vec2 d = abs(p - 0.5) * 4.2 - b + vec2(r);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
}
float sdCircle(in vec2 st, in vec2 center) {
    return length(st - center) * 2.0;
}
float sdPoly(in vec2 p, in float w, in int sides) {
    float a = atan(p.x, p.y) + PI;
    float r = TWO_PI / float(sides);
    float d = cos(floor(0.5 + a / r) * r - a) * length(max(abs(p) * 1.0, 0.0));
    return d * 2.0 - w;
}
// iq's exact equilateral-triangle SDF — a true Euclidean distance, so
// subtracting a radius rounds the corners of the geometry itself.
float sdEquilateralTriangle(in vec2 p, in float s) {
    const float k = sqrt(3.0);
    p.x = abs(p.x) - s;
    p.y = p.y + s / k;
    if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
    p.x -= clamp(p.x, -2.0 * s, 0.0);
    return -length(p) * sign(p.y);
}

float aastep(float threshold, float value) {
    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
    return smoothstep(threshold - afwidth, threshold + afwidth, value);
}
float fill(in float x) { return 1.0 - aastep(0.0, x); }
float fill(float x, float size, float edge) {
    return 1.0 - smoothstep(size - edge, size + edge, x);
}
float stroke(in float d, in float t) { return (1.0 - aastep(t, abs(d))); }
float stroke(float x, float size, float w, float edge) {
    float d = smoothstep(size - edge, size + edge, x + w * 0.5) - smoothstep(size - edge, size + edge, x - w * 0.5);
    return clamp(d, 0.0, 1.0);
}

float strokeAA(float x, float size, float w, float edge) {
    float afwidth = length(vec2(dFdx(x), dFdy(x))) * 0.70710678;
    float d = smoothstep(size - edge - afwidth, size + edge + afwidth, x + w * 0.5)
            - smoothstep(size - edge - afwidth, size + edge + afwidth, x - w * 0.5);
    return clamp(d, 0.0, 1.0);
}

void main() {
    vec2 st = st0 + 0.5;
    vec2 posMouse = mx * vec2(1., -1.) + 0.5;

    float size = u_shapeSize;
    float roundness = u_roundness;
    float borderSize = u_borderSize;
    float circleSize = u_circleSize;
    float circleEdge = u_circleEdge;

    float sdfCircle = fill(
        sdCircle(st, posMouse),
        circleSize,
        circleEdge
    );

    // Edge softness fed to fill/stroke: a constant baseline (always blurred) plus
    // a damped pointer reveal on top, so hover *increases* an ever-present blur.
    float edge = u_baseBlur + sdfCircle * 0.5;

    float sdf;
    if (VAR == 0) {
        sdf = sdRoundRect(st, vec2(size), roundness);
        sdf = strokeAA(sdf, 0.0, borderSize, edge) * 4.0;
    } else if (VAR == 1) {
        // Circle radius scales with shapeSize so a smaller shapeSize leaves room
        // for the hover bloom to fade out inside the canvas (no hard clip).
        sdf = sdCircle(st, vec2(0.5));
        sdf = fill(sdf, size * 0.65, edge) * 1.2;
    } else if (VAR == 2) {
        sdf = sdCircle(st, vec2(0.5));
        sdf = strokeAA(sdf, 0.58, 0.02, edge) * 4.0;
    } else if (VAR == 3) {
        sdf = sdPoly(st - vec2(0.5, 0.45), 0.3, 3);
        sdf = fill(sdf, 0.05, edge) * 1.4;
    } else if (VAR == 4) {
        // Filled rounded rect (project addition — upstream var 0 is stroke-only).
        sdf = sdRoundRect(st, vec2(size), roundness);
        sdf = fill(sdf, 0.0, edge) * 1.2;
    } else if (VAR == 5) {
        // Filled rounded triangle (project addition). Exact triangle SDF minus a
        // radius = a genuine corner border-radius baked into the geometry,
        // independent of the blur. roundness drives the corner radius.
        float tri = sdEquilateralTriangle((st - vec2(0.5, 0.5)) * 2.0, 0.28) - roundness * 0.38;
        sdf = fill(tri, 0.0, edge) * 1.3;
    }

    // Gradient fill: diagonal mix from u_color (top-left) to u_color2
    // (bottom-right). With color2 == color this collapses to a flat tint.
    float g = clamp((v_texcoord.x + (1.0 - v_texcoord.y)) * 0.5, 0.0, 1.0);
    vec3 fillColor = mix(u_color, u_color2, g);

    // GRAIN mode: screen-space hash film grain composited *in this GPU pass*,
    // replacing the CSS mix-blend grain divs that re-raster the panel each frame.
    // gl_FragCoord is device px → /u_pixelRatio gives stable CSS-px cells so the
    // grain frequency doesn't change with DPR. Gated by u_grainAmount (0 = no-op).
    if (u_grainAmount > 0.0) {
        vec2 grainUv = (gl_FragCoord.xy / u_pixelRatio) * u_grainScale;
        float grain = fract(sin(dot(grainUv, vec2(12.9898, 78.233))) * 43758.5453);
        fillColor += (grain - 0.5) * u_grainAmount;
    }

    float alpha = sdf;
    gl_FragColor = vec4(fillColor.rgb, alpha);
}
`

/**
 * Shared event fan-out: four ShapeBlur instances each need pointermove/scroll/
 * resize, but four document/window listeners doing identical work is waste.
 * One real listener per event type, attached while any instance is subscribed.
 * Targets are resolved lazily (inside the subscribe call, which only runs in
 * an effect) so module evaluation never touches `document`.
 */
function makeSharedListener(getTarget: () => EventTarget, type: string) {
  const subs = new Set<(e: Event) => void>()
  const handler = (e: Event) => subs.forEach((fn) => fn(e))
  return (fn: (e: Event) => void) => {
    if (subs.size === 0) getTarget().addEventListener(type, handler, { passive: true })
    subs.add(fn)
    return () => {
      subs.delete(fn)
      if (subs.size === 0) getTarget().removeEventListener(type, handler)
    }
  }
}
const subscribePointerMove = makeSharedListener(() => document, 'pointermove')
const subscribeScroll = makeSharedListener(() => window, 'scroll')
const subscribeResize = makeSharedListener(() => window, 'resize')

/** Resolve a CSS color that may be a `var(--token)` reference against `el`. */
function resolveColor(color: string, el: Element): string {
  const c = color.trim()
  if (!c.startsWith('var(')) return c
  const name = c.slice(4, -1).split(',')[0].trim()
  return getComputedStyle(el).getPropertyValue(name).trim() || '#ffffff'
}

interface ShapeBlurProps {
  className?: string
  variation?: number
  pixelRatioProp?: number
  shapeSize?: number
  roundness?: number
  borderSize?: number
  circleSize?: number
  circleEdge?: number
  /** Tint applied to the shape — hex or `var(--token)` (upstream hard-codes white). */
  color?: string
  /** Second color for a diagonal gradient fill; omit/equal to color for flat. */
  color2?: string
  /** Constant edge softness present even without hover; the pointer adds more. */
  baseBlur?: number
  /** Skip the pointer-reveal loop entirely; paint one static frame. */
  reduced?: boolean
  /** Auto-drive the reveal point along a path (circle / figure-8) instead of the
   *  pointer — a virtual cursor sweeping the shapes. Path is panel-local so every
   *  canvas shares one moving point. Ignored when `reduced`. */
  autoMotion?: boolean
  /** Path shape for `autoMotion`. */
  autoShape?: 'circle' | 'figure8'
  /** Angular speed (rad/s) of the auto path. */
  autoSpeed?: number
  /** Path center as a fraction of the *panel* (offsetParent) size — left side by
   *  default so the virtual cursor orbits over the left shapes. */
  autoCenterX?: number
  autoCenterY?: number
  /** Path radius as a fraction of the panel size. */
  autoRadiusX?: number
  autoRadiusY?: number
  /** Film-grain intensity added in-shader (0 = off). Replaces the CSS mix-blend
   *  grain so it composites on the GPU with no per-frame backdrop re-raster. */
  grainAmount?: number
  /** Grain cell size in CSS px (lower = finer). Only used when grainAmount > 0. */
  grainScale?: number
  /** Hard-park the render loop (e.g. once the page is scrolled). The WebGL context
   *  is kept alive — only the rAF loop stops — so there's no teardown/rebuild jank
   *  when it toggles. Re-starts the loop when set back to false. */
  paused?: boolean
}

export default function ShapeBlur({
  className = '',
  variation = 0,
  pixelRatioProp = 2,
  shapeSize = 1.2,
  roundness = 0.4,
  borderSize = 0.05,
  circleSize = 0.3,
  circleEdge = 0.5,
  color = '#ffffff',
  color2 = '',
  baseBlur = 0.2,
  reduced = false,
  autoMotion = false,
  autoShape = 'figure8',
  autoSpeed = 0.6,
  autoCenterX = 0.25,
  autoCenterY = 0.5,
  autoRadiusX = 0.18,
  autoRadiusY = 0.28,
  grainAmount = 0,
  grainScale = 1,
  paused = false,
}: ShapeBlurProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  // Park-state for the render loop, read inside the rAF closure. Held in a ref so
  // toggling `paused` parks/unparks the loop WITHOUT re-running the main effect
  // (which would dispose + rebuild the WebGL context — exactly the jank we're
  // avoiding). `startRef` lets the sync effect below kick the loop back to life.
  const pausedRef = useRef(false)
  const startRef = useRef<() => void>(() => {})

  // Pure-uniform props, kept out of the main effect's deps: changing a tint or
  // grain setting must update GPU uniforms + repaint one frame, NOT dispose and
  // rebuild the whole WebGL context. The ref gives the main effect the latest
  // values at (re)build time; the small sync effect below applies live changes.
  const uniformProps = {
    color,
    color2,
    baseBlur,
    shapeSize,
    roundness,
    borderSize,
    circleSize,
    circleEdge,
    grainAmount,
    grainScale,
  }
  const uniformPropsRef = useRef(uniformProps)
  // Declared BEFORE the main effect so, in any commit, the ref holds this
  // render's values by the time the main effect (re)builds the material.
  useEffect(() => {
    uniformPropsRef.current = uniformProps
  })
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const redrawRef = useRef<() => void>(() => {})

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Auto-orbit: a virtual cursor traces a path over the shapes (no pointer).
    // Disabled when the user prefers reduced motion.
    const AUTO = autoMotion && !reduced

    let active = true
    let running = false
    let visible = true
    let animationFrameId = 0
    let time = 0,
      lastTime = 0,
      lastDraw = 0

    // Auto mode runs a steady loop (the path never settles), so cap it at 30fps
    // to halve GPU/fill-rate cost — the heavy blur hides the lower cadence.
    const AUTO_FRAME_S = 1 / 30

    const vMouse = new THREE.Vector2()
    const vMouseDamp = new THREE.Vector2()
    const vResolution = new THREE.Vector2()

    let w = 1,
      h = 1

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera()
    camera.position.z = 1

    const renderer = new THREE.WebGLRenderer({ alpha: true })
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const geo = new THREE.PlaneGeometry(1, 1)
    const up = uniformPropsRef.current
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_mouse: { value: vMouseDamp },
        u_resolution: { value: vResolution },
        u_pixelRatio: { value: pixelRatioProp },
        u_color: { value: new THREE.Color(resolveColor(up.color, mount)) },
        u_color2: { value: new THREE.Color(resolveColor(up.color2 || up.color, mount)) },
        u_baseBlur: { value: up.baseBlur },
        u_shapeSize: { value: up.shapeSize },
        u_roundness: { value: up.roundness },
        u_borderSize: { value: up.borderSize },
        u_circleSize: { value: up.circleSize },
        u_circleEdge: { value: up.circleEdge },
        u_grainAmount: { value: up.grainAmount },
        u_grainScale: { value: up.grainScale },
      },
      defines: { VAR: variation },
      transparent: true,
    })
    materialRef.current = material

    const quad = new THREE.Mesh(geo, material)
    scene.add(quad)

    // Pointer position is read against a cached rect so a global pointermove
    // (one per instance) never forces a layout. Refreshed on resize + scroll.
    let rect = mount.getBoundingClientRect()
    // Stamp of the last scroll: pointer-reveal is suppressed mid-scroll (the rect
    // is moving and there's no real hover intent), so we don't wake the render
    // loop on every pointermove fired while the page is scrolling under the cursor.
    let lastScrollAt = -Infinity
    const SCROLL_IDLE_MS = 120
    const updateRect = () => {
      rect = mount.getBoundingClientRect()
    }
    // Scroll handler: stamp the time cheaply (no layout) so pointer-reveal stays
    // suppressed mid-scroll, but defer the actual getBoundingClientRect to a
    // debounced scroll-END read. The rect only feeds pointer hover (off during
    // scroll), so reading it every scroll event was 4× forced layout per tick for
    // nothing. One read once the page settles is enough.
    let rectTimer = 0
    const onScroll = () => {
      lastScrollAt = performance.now()
      clearTimeout(rectTimer)
      rectTimer = window.setTimeout(updateRect, SCROLL_IDLE_MS)
    }

    // The shape is static until the pointer perturbs it, so the render loop is
    // event-driven: it spins up on pointer input and parks itself once the
    // damped mouse has settled — idle GPU cost drops to zero instead of 60fps.
    const DAMP_EPS = 0.05
    const settled = () =>
      Math.abs(vMouseDamp.x - vMouse.x) < DAMP_EPS && Math.abs(vMouseDamp.y - vMouse.y) < DAMP_EPS

    const update = () => {
      if (!active) return
      // Hard-parked (page scrolled): stop the loop entirely — no GPU work, no next
      // frame requested. The sync effect restarts it via startRef when unpaused.
      if (pausedRef.current) {
        running = false
        return
      }
      time = performance.now() * 0.001

      // Auto mode: skip this frame's GPU work but keep the loop alive when either
      //   (a) the page is mid-scroll — pause the orbit like the other hero anims so
      //       we don't render/re-raster while scrolling, or
      //   (b) we're inside the 30fps throttle window.
      // dt is measured draw-to-draw below, so damping stays time-correct (it eases
      // the cursor back onto the path after a scroll pause rather than snapping).
      if (AUTO && visible) {
        const scrolling = performance.now() - lastScrollAt < SCROLL_IDLE_MS
        if (scrolling || time - lastDraw < AUTO_FRAME_S) {
          animationFrameId = requestAnimationFrame(update)
          return
        }
      }
      lastDraw = time

      const dt = time - lastTime
      lastTime = time

      // Drive the reveal point along a panel-local path. offsetParent is the
      // shape container that fills the panel, so the same path → the same world
      // point across every canvas: one virtual cursor sweeping the left shapes.
      if (AUTO) {
        const parent = mount.offsetParent as HTMLElement | null
        const pw = parent ? parent.clientWidth : w
        const ph = parent ? parent.clientHeight : h
        const cx = pw * autoCenterX
        const cy = ph * autoCenterY
        const rx = pw * autoRadiusX
        const ry = ph * autoRadiusY
        const th = time * autoSpeed
        const px = autoShape === 'figure8' ? cx + rx * Math.sin(th) : cx + rx * Math.cos(th)
        const py = autoShape === 'figure8' ? cy + ry * Math.sin(2 * th) : cy + ry * Math.sin(th)
        vMouse.set(px - mount.offsetLeft, py - mount.offsetTop)
      }

      ;(['x', 'y'] as const).forEach((k) => {
        vMouseDamp[k] = THREE.MathUtils.damp(vMouseDamp[k], vMouse[k], 8, dt)
      })

      renderer.render(scene, camera)

      // Auto mode never settles — the target path keeps moving — so the loop
      // runs continuously while visible (parks only when scrolled off-screen).
      if (visible && (AUTO || !settled())) {
        animationFrameId = requestAnimationFrame(update)
      } else {
        running = false
      }
    }

    const start = () => {
      if (running || !active || !visible || reduced || pausedRef.current) return
      running = true
      lastTime = performance.now() * 0.001
      animationFrameId = requestAnimationFrame(update)
    }
    // Expose start so the paused-sync effect can wake the loop without re-running
    // this effect (which would rebuild the WebGL context). Same for redraw, which
    // the uniform-sync effect uses to repaint a parked static shape.
    startRef.current = start
    redrawRef.current = () => renderer.render(scene, camera)

    const onPointerMove = (e: Event) => {
      const pe = e as PointerEvent
      if (!visible || reduced || performance.now() - lastScrollAt < SCROLL_IDLE_MS) return
      vMouse.set(pe.clientX - rect.left, pe.clientY - rect.top)
      start()
    }

    const unsubPointer = subscribePointerMove(onPointerMove)
    const unsubScroll = subscribeScroll(onScroll)

    const resize = () => {
      if (!active) return
      w = mount.clientWidth
      h = mount.clientHeight
      const dpr = Math.min(window.devicePixelRatio, pixelRatioProp)

      renderer.setSize(w, h)
      renderer.setPixelRatio(dpr)

      camera.left = -w / 2
      camera.right = w / 2
      camera.top = h / 2
      camera.bottom = -h / 2
      camera.updateProjectionMatrix()

      quad.scale.set(w, h, 1)
      vResolution.set(w, h).multiplyScalar(dpr)
      material.uniforms.u_pixelRatio.value = dpr
      updateRect()
      renderer.render(scene, camera) // repaint the static shape at the new size
    }

    resize()
    const unsubResize = subscribeResize(resize)

    const ro = new ResizeObserver(() => {
      if (!active) return
      resize()
    })
    ro.observe(mount)

    // Pause everything while the hero is scrolled off-screen — no point running
    // four WebGL contexts for shapes no one can see.
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible) start()
      },
      { rootMargin: '100px' }
    )
    io.observe(mount)

    // Auto mode runs without pointer input — kick the loop off now.
    if (AUTO) start()

    return () => {
      active = false
      running = false

      cancelAnimationFrame(animationFrameId)
      clearTimeout(rectTimer)
      unsubResize()
      unsubScroll()
      unsubPointer()
      ro.disconnect()
      io.disconnect()
      materialRef.current = null
      redrawRef.current = () => {}
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
      geo.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    }
  }, [
    variation,
    pixelRatioProp,
    reduced,
    autoMotion,
    autoShape,
    autoSpeed,
    autoCenterX,
    autoCenterY,
    autoRadiusX,
    autoRadiusY,
  ])

  // Live uniform sync: tint/blur/grain changes flow straight to the GPU and one
  // repaint — no context teardown. (The main effect re-reads these via
  // uniformPropsRef when it does rebuild, so the two paths can't disagree.)
  useEffect(() => {
    const material = materialRef.current
    const mount = mountRef.current
    if (!material || !mount) return
    const u = material.uniforms
    u.u_color.value.set(resolveColor(color, mount))
    u.u_color2.value.set(resolveColor(color2 || color, mount))
    u.u_baseBlur.value = baseBlur
    u.u_shapeSize.value = shapeSize
    u.u_roundness.value = roundness
    u.u_borderSize.value = borderSize
    u.u_circleSize.value = circleSize
    u.u_circleEdge.value = circleEdge
    u.u_grainAmount.value = grainAmount
    u.u_grainScale.value = grainScale
    redrawRef.current()
  }, [
    color,
    color2,
    baseBlur,
    shapeSize,
    roundness,
    borderSize,
    circleSize,
    circleEdge,
    grainAmount,
    grainScale,
  ])

  // Park / un-park the loop when `paused` flips, without disposing the context.
  useEffect(() => {
    pausedRef.current = paused
    if (!paused) startRef.current()
  }, [paused])

  return <div className={className} ref={mountRef} style={{ width: '100%', height: '100%' }} />
}
