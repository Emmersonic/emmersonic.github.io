# Portfolio Audit — Code Quality & Performance

Date: 2026-08-29 · Branch: `source` · Auditor: Claude (fresh audit pass)

Context for agents: this project is a 1:1 rebuild of emmersonic.com (Framer original).
`public/reference.html` + `REFERENCE.md` are ground truth — reproduce, don't reimagine.
Visual output must not change unless a task explicitly says otherwise.
Build is clean (`tsc -b` passes); `npm run build` works. ESLint has 2 errors (task Q1).

Each task below is self-contained. Priority: **P1** = do first, **P2** = valuable, **P3** = polish.

---

## Performance

### P1-A · Replace three.js in `ShapeBlur` with raw WebGL (~500 kB chunk → ~0)

**File:** `src/components/sections/ShapeBlur.tsx` (614 lines)

The lazy `ShapeBlur` chunk is **515 kB min / 131 kB gzip** — almost entirely three.js.
The actual usage is trivial: one fullscreen quad + one fragment shader per instance.
Three.js APIs used: `WebGLRenderer` (alpha), `Scene`, `OrthographicCamera`,
`PlaneGeometry(1,1)`, `ShaderMaterial` (uniforms + `defines: { VAR }`),
`Mesh`, `Vector2`, `Color`, `MathUtils.damp`.

Rewrite with raw WebGL:
- One VBO with a fullscreen triangle/quad; compile the existing vertex/fragment shaders
  (they need only `projectionMatrix * modelViewMatrix` — replace with identity/NDC quad and
  drop the matrices; `v_texcoord` from attribute).
- `Vector2` → plain `{x, y}`. `Color` → tiny hex/rgb parser (colors arrive via
  `resolveColor()` as computed CSS values, typically `rgb(...)` or hex).
- `MathUtils.damp(a, b, λ, dt)` = `b + (a - b) * Math.exp(-λ * dt)` — inline it.
- Keep ALL existing behavior: shared event fan-out, event-driven render loop with
  settle-parking, 30fps auto cap, scroll suppression, pause/unpause via refs, uniform
  live-sync effect, IntersectionObserver visibility, `forceContextLoss` on teardown
  (raw equivalent: `getExtension('WEBGL_lose_context')?.loseContext()`).
- Verify: `npm run build` — ShapeBlur chunk should drop from ~515 kB to a few kB.
  Visually compare hero blobs against dev server before/after.

### P1-B · Consolidate 4 WebGL contexts into 1 canvas

**Files:** `src/components/sections/ShapeBlur.tsx`, `Hero.tsx` (`BlurShape`, `shapes` array)

Four `<ShapeBlur>` instances = 4 WebGL contexts, 4 rAF loops, 4 canvases composited
every parallax frame (each canvas is padded: e.g. blue shape 326px + 2×0.75 pad ≈ 815px²).
Browsers cap contexts (~8–16); Safari is aggressive about evicting them.

Consolidate: one canvas spanning the panel, one render loop, 4 draw calls (one per shape,
each with its own uniform set / `VAR` define, or a merged shader with per-quad uniforms).
Per-shape float/parallax offsets become quad position uniforms instead of CSS transforms
on 4 wrapper divs. This also deletes the shared-listener fan-out (one instance = one listener).

Note: do P1-A first (or together) — designing the raw-WebGL rewrite as single-canvas
multi-quad from the start avoids doing this twice. If done separately, keep per-shape
props table (`shapes` in Hero.tsx) as the single source.

Caution: the CSS-transform float currently composites without re-rendering GL. Moving
float into GL means re-rendering per frame while floating. Measure: 1 context × 4 quads
at panel size vs 4 contexts × padded canvases. If GPU cost regresses, keep CSS transforms
on a single canvas positioned per-frame — or keep 4 wrapper divs sharing one context via
scissor rects. Decide by profiling, and record the numbers in the PR description.

### P1-C · `TopBlur`: 4 stacked full-width `backdrop-filter` layers

**File:** `src/components/layout/TopBlur.tsx`

A fixed 224px-tall strip with **four** stacked `backdrop-filter: blur()` layers
(30/15/8/2px), each masked. Backdrop blur re-samples the backdrop every frame anything
under it changes — during scroll that's 4 full blur passes over a 100vw×224px region,
on top of the hero's own animation load. This is the single most expensive scroll-time
CSS on the page (blur cost grows with radius; the 30px pass dominates).

Options (in order of preference):
1. Drop to 2 layers (e.g. 24px @ 20% stop, 6px @ 60% stop) — progressive blur illusion
   usually survives; compare against `public/reference.html` rendering.
2. Gate rendering: `TopBlur` only matters once content scrolls under it. At
   `scrollY === 0` nothing is under the strip (hero panel top is flush) — mount/unmount
   or `visibility: hidden` the layers while at top, so hero load animation doesn't pay for it.
3. Keep 4 layers only on `desktop:` breakpoint; 2 on smaller screens.

Verify with Chrome DevTools > Performance: record a scroll before/after, compare GPU track.

### P2-D · `CircularText`: two JS-driven infinite spinners → CSS animation

**Files:** `src/motion/CircularText.tsx`, used by `LoveCard.tsx` (Tools + Sites cards → 2 live instances)

The ring rotation is a motion `useAnimation` tween — main-thread JS updating
`transform` every frame, forever (parked off-view via `useInView`, but runs whenever
visible). A CSS `@keyframes spin` + `animation-play-state: paused` on hover does the
same thing fully on the compositor with zero JS per frame:

- Keep the per-letter layout (static spans — fine).
- Replace controls/motionValue with a CSS class: `animation: spin 18s linear infinite`.
- Hover modes: `pause` → `animation-play-state: paused` (default used in app);
  `speedUp`/`slowDown` → `animation-duration` swap (accepting a phase jump — nothing
  in the app uses these; alternatively drop unused modes, see Q4).
- `prefers-reduced-motion` → `animation: none` (media query, can delete the JS hook).
- `useInView` parking becomes unnecessary — compositor animations off-screen are cheap;
  optionally keep `content-visibility: auto` on the card instead.
- Also fixes: `useAnimation` is the legacy API name in motion v12 (`useAnimationControls`).

### P2-E · Hero float: 4 `useAnimationFrame` subscriptions → 1

**File:** `src/components/sections/Hero.tsx` (`useFloat`)

Each `BlurShape` runs its own `useFloat` → 4 rAF callbacks each doing its own
gain easing + `performance.now()` + idle check per frame. Merge into one driver:
a single `useAnimationFrame` in `Hero` computing shared `now/idle/gain`, then writing
12 motion values (or one context object of MotionValues per shape). Small win
(~saves 3 redundant gain computations + subscription overhead per frame), low risk.
Do alongside P1-B if float moves into GL — then this task disappears.

### P3-F · Preload grain images

**Files:** `index.html`, `src/components/sections/Hero.tsx`

`/images/noise.webp` + `/images/grain.webp` are discovered late (CSS background-image
inside JS-rendered DOM) and used 3× as mix-blend layers over the hero. Add
`<link rel="preload" as="image" href="/images/noise.webp">` (+ grain) to `index.html`
so grain doesn't pop in after the hero paints.

### P3-G · Font subsetting / weight audit

**Files:** `src/styles/fonts.css`, `package.json`

Build ships 6 New Spirit weights (~39 kB each ≈ 234 kB) plus Inter + JetBrains Mono
variable in 10 unicode-range slices. Check which New Spirit weights are actually used
(`grep -rn "font-\(medium\|semibold\|bold\|light\|heavy\)" src` cross-referenced with
`font-display` usage — likely only Regular + Medium render). Delete unused `@font-face`
blocks + woff2 files. JetBrains Mono: used only for the CircularText ring label —
consider whether a system mono fallback is acceptable there (saves ~85 kB across slices).

---

## Code quality

### Q1 · ESLint errors (2) in `AnimatedLink`

**File:** `src/components/primitives/AnimatedLink.tsx:21-22`

```
21:17  error  '_ome' is defined but never used  @typescript-eslint/no-unused-vars
22:17  error  '_oml' is defined but never used  @typescript-eslint/no-unused-vars
```

Intentional destructure-to-discard. Fix by configuring the rule in `eslint.config.js`:

```js
'@typescript-eslint/no-unused-vars': ['error', {
  argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_',
  ignoreRestSiblings: true,
}]
```

(`ignoreRestSiblings: true` alone also covers this case and is the cleaner fix —
then the `_ome`/`_oml` renames can revert to `onMouseEnter`/`onMouseLeave`.)
Verify: `npx eslint .` → 0 problems.

### Q2 · Dead files: `MyWork.tsx`, `DesignResources.tsx` sections

**Files:** `src/components/sections/MyWork.tsx`, `src/components/sections/DesignResources.tsx`

Both are untracked, not exported from `sections/index.ts`, not imported anywhere —
superseded by `DSSection.tsx` (which renders both `designResources` + `myWork` content).
Delete both files. Also remove the now-unused `revealAt.myWork` key in
`src/motion/motionConfig.ts` (keep `designResources` — `DSSection` uses it, though the
name now mismatches; optionally rename key to `dsSection` in both files).

### Q3 · Hardcoded colors bypassing the token system

**Files:** `src/components/primitives/AnimatedLink.tsx`, `src/components/sections/Hero.tsx`

- `AnimatedLink`: `#8a6642`, `#a07850`, `#c4bbb0` inline in Tailwind arbitrary values.
  Every link on the site uses these. Promote to tokens in `src/styles/tokens.css`
  (e.g. `--link`, `--link-hover`, `--link-underline`) + `tailwind.config.ts` colors,
  then use `text-link hover:text-link-hover` etc. Zero visual change.
- `Hero.tsx` third sheen layer: inline `radial-gradient(... #ff971747 ... #ababab00)` —
  sibling layers use `bg-orb-*` tokens. Add an `--orb-peach-left` (or similar) token
  and a `bg-orb-*` entry to match the existing pattern.

### Q4 · `CircularText` unused hover modes

**File:** `src/motion/CircularText.tsx`

`speedUp` / `slowDown` / `goBonkers` hover modes are never used (both call sites use
default `pause`). If P2-D (CSS rewrite) lands, drop the unused modes and the `HoverMode`
type entirely; smaller and honest. Skip if you want to keep the reactbits parity.

### Q5 · `Text` primitive: `...rest` is untyped

**File:** `src/components/primitives/Text.tsx`

`Text` spreads `{...rest}` onto the rendered tag but `TextProps` declares no HTML
attributes, so consumers get no type checking/autocomplete for `id`, `aria-*`, etc.
Extend: `interface TextProps extends HTMLAttributes<HTMLElement>` (keeps `as`/`variant`/
`className` as-is). Verify `tsc -b` still passes — some call sites may surface real
attr typos once typed.

### Q6 · Missing `og.png`

**File:** `index.html:22` references `/og.png`; `public/og.png` does not exist.

Social shares get a broken image. Either add a real 1200×630 `public/og.png`
(screenshot of the hero works) or remove the `og:image` + `twitter:card` meta until
one exists. Also note `og:image` should be an absolute URL for most scrapers:
`https://emmersonic.com/og.png`.

### Q7 · `AnimatedLink` underline uses `h-0` + `border-b-2`

**File:** `src/components/primitives/AnimatedLink.tsx`

Both underline spans are `h-0` with a 2px dotted bottom border positioned at
`bottom-0` — works, but the sweep animates `clip-path` on a zero-height box whose
border juts below; subtle cross-browser rendering risk (Safari rounds borders on
zero-height boxes differently). Low priority: if the dotted sweep ever renders
inconsistently, switch to `height: 2px` + `background-image: repeating-linear-gradient`
or `border-top`. No change needed if it currently matches reference — verify against
`public/reference.html` first.

---

## Explicitly fine (audited, no action)

- **Hero scroll pipeline** — clip-path quantization, frozen-clip-on-leave-top,
  scroll-gain float suppression, `atTopRef` pattern: sophisticated and correct.
  Don't "simplify" these; the comments explain each mechanism.
- **`ShapeBlur` effect structure** — uniform-sync vs rebuild split, pause refs,
  settle-parking: correct; preserve semantics through any P1 rewrite.
- **`key={i}`** on the static `shapes` array and CircularText letters: arrays never
  reorder; fine.
- **Lazy-loading of ShapeBlur** with fade-in behind blur: right call, keep it
  (even after P1-A shrinks the chunk, keeping the split defers WebGL init).
- **`Reveal` / load-cascade choreography** (`revealAt`): clean single source of truth.
- **Vite/TS config, StrictMode, a11y basics** (`aria-hidden` on decorative layers,
  `useReducedMotion` respected everywhere): good.

## Suggested execution order

1. Q1, Q2, Q6 (quick hygiene — one small PR)
2. P1-C (TopBlur — biggest scroll-time win, small diff)
3. P1-A + P1-B together (ShapeBlur raw-WebGL single-canvas rewrite — biggest bundle win)
4. P2-D + Q4 (CircularText CSS rewrite)
5. Q3, Q5, P2-E, P3-F, P3-G as follow-ups

Verify every visual task against the dev server and `public/reference.html`
(remember: headless/hidden tabs pause framer-motion animations — measure layout via
`offsetTop`, not screenshots; see project memory).
