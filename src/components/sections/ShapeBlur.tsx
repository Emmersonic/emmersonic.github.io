import { useEffect, useRef } from 'react'

/**
 * ShapeBlur (React Bits) — a WebGL plane that paints one SDF shape (rounded
 * rect / circle / triangle) which *sharpens where the pointer passes* and stays
 * soft-blurred elsewhere. Adapted from the JS original with two changes for this
 * project: TypeScript types, and a `u_color` uniform so each instance can be
 * tinted (the upstream shader hard-codes white). Experimental hero accent.
 *
 * Implemented in raw WebGL (no three.js): the GPU work is one fullscreen quad
 * + one fragment shader per instance, which doesn't need a scene graph. This
 * keeps the lazy hero chunk a few kB instead of ~515 kB of three.js.
 */

const vertexShader = /* glsl */ `
attribute vec2 a_position;
attribute vec2 a_uv;
varying vec2 v_texcoord;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texcoord = a_uv;
}
`

// Fragment shader body is untouched from the three.js version — it's the visual
// definition of the blobs (GLSL ES 1.00: `varying`/`uniform`/`gl_FragColor`, no
// `#version`). three.js used to auto-prepend a `precision` line and, on WebGL1,
// the derivatives `#extension`; raw WebGL does not, so those are injected at
// compile time (see `fragSrc` assembly below) — without them the shader fails to
// compile ("No precision specified for (float)" + dFdx/dFdy not found).
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

/** Fullscreen triangle-strip quad: NDC (x, y) + matching UV (u, v), interleaved.
 *  UV = (ndc + 1) / 2 on both axes — the same linear NDC↔UV correspondence the
 *  old three.js OrthographicCamera + PlaneGeometry(1,1) pairing produced (the
 *  camera bounds exactly matched the scaled plane, so it degenerated to this). */
const QUAD_VERTS = new Float32Array([
  // x,  y,  u, v
  -1, -1, 0, 0,
  1, -1, 1, 0,
  -1, 1, 0, 1,
  1, 1, 1, 1,
])

type GL = WebGLRenderingContext | WebGL2RenderingContext

function compileShader(gl: GL, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('ShapeBlur: failed to create shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`ShapeBlur: shader compile error: ${info ?? 'unknown'}`)
  }
  return shader
}

function createProgram(gl: GL, vertSrc: string, fragSrc: string): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertSrc)
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc)
  const program = gl.createProgram()
  if (!program) throw new Error('ShapeBlur: failed to create program')
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  // Once attached + linked, the program keeps the shaders alive by refcount —
  // safe to flag them for deletion now instead of holding handles for teardown.
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program)
    gl.deleteProgram(program)
    throw new Error(`ShapeBlur: program link error: ${info ?? 'unknown'}`)
  }
  return program
}

interface Uniforms {
  u_mouse: WebGLUniformLocation | null
  u_resolution: WebGLUniformLocation | null
  u_pixelRatio: WebGLUniformLocation | null
  u_color: WebGLUniformLocation | null
  u_color2: WebGLUniformLocation | null
  u_baseBlur: WebGLUniformLocation | null
  u_shapeSize: WebGLUniformLocation | null
  u_roundness: WebGLUniformLocation | null
  u_borderSize: WebGLUniformLocation | null
  u_circleSize: WebGLUniformLocation | null
  u_circleEdge: WebGLUniformLocation | null
  u_grainAmount: WebGLUniformLocation | null
  u_grainScale: WebGLUniformLocation | null
}

function getUniforms(gl: GL, program: WebGLProgram): Uniforms {
  const g = (name: string) => gl.getUniformLocation(program, name)
  return {
    u_mouse: g('u_mouse'),
    u_resolution: g('u_resolution'),
    u_pixelRatio: g('u_pixelRatio'),
    u_color: g('u_color'),
    u_color2: g('u_color2'),
    u_baseBlur: g('u_baseBlur'),
    u_shapeSize: g('u_shapeSize'),
    u_roundness: g('u_roundness'),
    u_borderSize: g('u_borderSize'),
    u_circleSize: g('u_circleSize'),
    u_circleEdge: g('u_circleEdge'),
    u_grainAmount: g('u_grainAmount'),
    u_grainScale: g('u_grainScale'),
  }
}

// A shape's own variation may dead-code-eliminate uniforms used only in other
// VAR branches (e.g. u_borderSize is only read when VAR == 0) — the driver is
// free to optimize the uniform away entirely, same as it could under three.js.
// three.js's uniform system already no-ops silently in that case; these small
// setters replicate that instead of throwing on a null location.
function setU1f(gl: GL, loc: WebGLUniformLocation | null, v: number) {
  if (loc) gl.uniform1f(loc, v)
}
function setU2f(gl: GL, loc: WebGLUniformLocation | null, a: number, b: number) {
  if (loc) gl.uniform2f(loc, a, b)
}
function setU3f(gl: GL, loc: WebGLUniformLocation | null, a: number, b: number, c: number) {
  if (loc) gl.uniform3f(loc, a, b, c)
}

/** b + (a - b) * exp(-lambda * dt) — inlined from three.js's MathUtils.damp. */
function damp(a: number, b: number, lambda: number, dt: number): number {
  return b + (a - b) * Math.exp(-lambda * dt)
}

// Reused 1×1 canvas: the browser's own CSS color parser is the most robust way
// to turn any resolveColor() output (hex, rgb()/rgba(), named colors, ...) into
// concrete sRGB bytes, matching exactly what the browser considers the color.
let colorCtx: CanvasRenderingContext2D | null | undefined
function parseCssColorBytes(css: string): [number, number, number] {
  if (colorCtx === undefined) {
    const c = document.createElement('canvas')
    c.width = 1
    c.height = 1
    colorCtx = c.getContext('2d', { willReadFrequently: true })
  }
  if (!colorCtx) return [255, 255, 255]
  colorCtx.fillStyle = '#000'
  colorCtx.fillStyle = css
  colorCtx.fillRect(0, 0, 1, 1)
  const [r, g, b] = colorCtx.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}

// three.js's `Color` linearizes sRGB input by default (ColorManagement is on
// in modern three): hex/rgb() strings are decoded sRGB → linear before landing
// in the uniform. This custom fragment shader never re-encodes on the way out
// (no colorspace_fragment chunk — that's only injected into three's built-in
// materials), so the *linear* values are what actually hit the framebuffer.
// Replicate the decode (three's SRGBToLinear) or the tint shifts visibly darker.
function srgbToLinear(c: number): number {
  return c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4)
}

function parseColor(css: string): { r: number; g: number; b: number } {
  const [r, g, b] = parseCssColorBytes(css)
  return { r: srgbToLinear(r / 255), g: srgbToLinear(g / 255), b: srgbToLinear(b / 255) }
}

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

/** Live uniform state + a redraw fn — the raw-WebGL analogue of the old
 *  `THREE.ShaderMaterial` handle: the sync effect mutates this object directly
 *  and calls `draw()`, no context teardown/rebuild involved. */
interface GLHandle {
  uniformState: {
    color: { r: number; g: number; b: number }
    color2: { r: number; g: number; b: number }
    baseBlur: number
    shapeSize: number
    roundness: number
    borderSize: number
    circleSize: number
    circleEdge: number
    grainAmount: number
    grainScale: number
  }
  draw: () => void
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
  const glHandleRef = useRef<GLHandle | null>(null)
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
    // Accumulated orbit phase — only advances when the loop actually renders a
    // frame. Wall-clock `time * autoSpeed` would jump after a pause/resume because
    // time kept moving while the loop was parked; phase stays frozen instead.
    let phase = 0

    // Auto mode runs a steady loop (the path never settles), so cap it at 30fps
    // to halve GPU/fill-rate cost — the heavy blur hides the lower cadence.
    const AUTO_FRAME_S = 1 / 30

    const vMouse = { x: 0, y: 0 }
    const vMouseDamp = { x: 0, y: 0 }
    // u_resolution value: w,h * dpr (unfloored — matches the old
    // `vResolution.set(w, h).multiplyScalar(dpr)`, distinct from the floored
    // canvas.width/height drawing-buffer size below).
    let resW = 0,
      resH = 0

    let w = 1,
      h = 1
    let dpr = pixelRatioProp

    const canvas = document.createElement('canvas')
    mount.appendChild(canvas)

    // Use WebGL1. The fragment shader is GLSL ES 1.00 and uses dFdx/dFdy
    // (aastep/strokeAA). On WebGL1 those come from the OES_standard_derivatives
    // extension — near-universally supported — enabled at runtime + via the
    // `#extension` pragma below. A WebGL2 context does NOT work here: it refuses
    // to expose OES_standard_derivatives (returns null) yet an ES 1.00 shader
    // under WebGL2 still doesn't get the derivative funcs as core, so dFdx fails
    // to compile ("no matching overloaded function found"). Matching ES 3.00
    // would mean rewriting the shader (in/out, #version 300 es) — not worth it
    // for one fullscreen quad, where WebGL1 perf is identical.
    const contextAttribs: WebGLContextAttributes = { alpha: true, antialias: false }
    const gl = canvas.getContext('webgl', contextAttribs) as WebGLRenderingContext | null
    if (!gl) {
      // No WebGL support at all — bail out quietly, nothing to tear down beyond the canvas.
      return () => {
        if (mount.contains(canvas)) mount.removeChild(canvas)
      }
    }
    gl.getExtension('OES_standard_derivatives')

    // Prelude three.js used to inject automatically and this raw port must supply:
    //  1. `#extension` — MUST precede any non-preprocessor token.
    //  2. `precision` — GLSL ES 1.00 fragment shaders have NO default float
    //     precision, so it must be declared or every `float` fails to compile.
    //     three.js's default renderer uses highp; match it.
    const derivativesPragma = '#extension GL_OES_standard_derivatives : enable\n'
    const precisionPrelude = 'precision highp float;\nprecision highp int;\n'
    const fragSrc = derivativesPragma + precisionPrelude + `#define VAR ${variation}\n` + fragmentShader
    const program = createProgram(gl, vertexShader, fragSrc)
    const u = getUniforms(gl, program)

    const vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, QUAD_VERTS, gl.STATIC_DRAW)
    const a_position = gl.getAttribLocation(program, 'a_position')
    const a_uv = gl.getAttribLocation(program, 'a_uv')

    // One-time GL state: this context is dedicated to this single instance (one
    // quad, one draw call), so blend mode / clear color never change between
    // frames. Blend func matches three.js's default NormalBlending (separate
    // alpha factors — correct premultiplied compositing against premultipliedAlpha
    // canvas contexts, which is also the WebGL default this project relies on).
    gl.enable(gl.BLEND)
    gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD)
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0, 0, 0, 0)

    const up = uniformPropsRef.current
    const uniformState: GLHandle['uniformState'] = {
      color: parseColor(resolveColor(up.color, mount)),
      color2: parseColor(resolveColor(up.color2 || up.color, mount)),
      baseBlur: up.baseBlur,
      shapeSize: up.shapeSize,
      roundness: up.roundness,
      borderSize: up.borderSize,
      circleSize: up.circleSize,
      circleEdge: up.circleEdge,
      grainAmount: up.grainAmount,
      grainScale: up.grainScale,
    }

    const draw = () => {
      gl.useProgram(program)
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
      gl.enableVertexAttribArray(a_position)
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 16, 0)
      gl.enableVertexAttribArray(a_uv)
      gl.vertexAttribPointer(a_uv, 2, gl.FLOAT, false, 16, 8)

      setU2f(gl, u.u_mouse, vMouseDamp.x, vMouseDamp.y)
      setU2f(gl, u.u_resolution, resW, resH)
      setU1f(gl, u.u_pixelRatio, dpr)
      setU3f(gl, u.u_color, uniformState.color.r, uniformState.color.g, uniformState.color.b)
      setU3f(gl, u.u_color2, uniformState.color2.r, uniformState.color2.g, uniformState.color2.b)
      setU1f(gl, u.u_baseBlur, uniformState.baseBlur)
      setU1f(gl, u.u_shapeSize, uniformState.shapeSize)
      setU1f(gl, u.u_roundness, uniformState.roundness)
      setU1f(gl, u.u_borderSize, uniformState.borderSize)
      setU1f(gl, u.u_circleSize, uniformState.circleSize)
      setU1f(gl, u.u_circleEdge, uniformState.circleEdge)
      setU1f(gl, u.u_grainAmount, uniformState.grainAmount)
      setU1f(gl, u.u_grainScale, uniformState.grainScale)

      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    glHandleRef.current = { uniformState, draw }

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

      // Cap rawDt at 100ms so scroll-throttle gaps (where lastTime isn't updated
      // during the early-return loop) don't cause a large phase jump on the first
      // rendered frame after scroll ends.
      const rawDt = time - lastTime
      lastTime = time
      const dt = Math.min(rawDt, 0.1)
      if (AUTO) phase += dt * autoSpeed

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
        const th = phase
        const px = autoShape === 'figure8' ? cx + rx * Math.sin(th) : cx + rx * Math.cos(th)
        const py = autoShape === 'figure8' ? cy + ry * Math.sin(2 * th) : cy + ry * Math.sin(th)
        vMouse.x = px - mount.offsetLeft
        vMouse.y = py - mount.offsetTop
      }

      vMouseDamp.x = damp(vMouseDamp.x, vMouse.x, 8, dt)
      vMouseDamp.y = damp(vMouseDamp.y, vMouse.y, 8, dt)

      draw()

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
    redrawRef.current = () => draw()

    const onPointerMove = (e: Event) => {
      const pe = e as PointerEvent
      if (!visible || reduced || performance.now() - lastScrollAt < SCROLL_IDLE_MS) return
      vMouse.x = pe.clientX - rect.left
      vMouse.y = pe.clientY - rect.top
      start()
    }

    const unsubPointer = subscribePointerMove(onPointerMove)
    const unsubScroll = subscribeScroll(onScroll)

    const resize = () => {
      if (!active) return
      w = mount.clientWidth
      h = mount.clientHeight
      dpr = Math.min(window.devicePixelRatio, pixelRatioProp)

      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)

      resW = w * dpr
      resH = h * dpr
      updateRect()
      draw() // repaint the static shape at the new size
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
      glHandleRef.current = null
      redrawRef.current = () => {}
      if (mount.contains(canvas)) {
        mount.removeChild(canvas)
      }
      gl.deleteBuffer(vbo)
      gl.deleteProgram(program)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
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
    const handle = glHandleRef.current
    const mount = mountRef.current
    if (!handle || !mount) return
    const s = handle.uniformState
    s.color = parseColor(resolveColor(color, mount))
    s.color2 = parseColor(resolveColor(color2 || color, mount))
    s.baseBlur = baseBlur
    s.shapeSize = shapeSize
    s.roundness = roundness
    s.borderSize = borderSize
    s.circleSize = circleSize
    s.circleEdge = circleEdge
    s.grainAmount = grainAmount
    s.grainScale = grainScale
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
