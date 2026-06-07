# emmersonic.com — React Rebuild: Execution Spec

**Audience:** an AI/engineer implementing this from scratch. Self-contained — you do not need any other file.
**Goal:** rebuild Taylor Emmerson's portfolio (currently a Framer site at https://emmersonic.com/) as a hand-coded React app with a real design system, preserving its warm-paper aesthetic, serif/grotesque type, glassmorphism, floating gradient orbs, and staggered scroll-reveal motion.

---

## 0. Ground rules (read first)

1. **The live site is the visual source of truth for LAYOUT.** This spec captures content, tokens, type, color, and motion values precisely (extracted from the Framer source), but spatial composition (grid columns, orb placement, card proportions, exact spacing) was **not** pixel-captured. Open https://emmersonic.com/ in a browser, screenshot each section at Desktop (1440), Tablet (900), Phone (390), and match layout against those. When this spec and the live site disagree on layout, **the live site wins**.
2. **Do not hotlink or copy assets from `framerusercontent.com`** (fonts, logos, images) into production. Re-source them (details below).
3. **Commercial fonts must be licensed or substituted** before shipping — see §5.
4. **Content is data, never inline JSX.** All copy lives in typed files under `src/content/`. Sections render by mapping over arrays.
5. Honor `prefers-reduced-motion` everywhere motion is used.
6. Single page, no router. One long vertical scroll.

---

## 1. Stack & dependencies

```
Vite + React 18 + TypeScript
Tailwind CSS (v3) + CSS custom properties for tokens
motion (Framer Motion v11+, package name "motion")  — scroll reveal, hover, orbs
Selective Radix primitives (see §3) — only where interaction/a11y is real
ESLint + Prettier
Deploy: Vercel (static)
```

Install:
```bash
npm create vite@latest . -- --template react-ts
npm i motion clsx tailwind-merge
npm i -D tailwindcss postcss autoprefixer eslint prettier
# Radix — install ONLY the primitives you actually use:
npm i @radix-ui/react-visually-hidden
# optional, only if you implement these interactions:
# npm i @radix-ui/react-collapsible @radix-ui/react-tooltip @radix-ui/react-dialog
```

> Alternative: Next.js App Router (static export) if best-in-class SEO/OG/`next/image` matters more than simplicity. For a one-page portfolio, **Vite is the recommended default.** If you choose Next, keep everything below; swap Vite scaffolding for `create-next-app` and use the `app/` dir with a single `page.tsx`.

---

## 2. File / folder structure

```
src/
  main.tsx
  App.tsx                      # PageShell + ordered <Section>s
  styles/
    tokens.css                 # CSS custom properties (§4)
    fonts.css                  # @font-face (§5)
    globals.css                # Tailwind directives + base
  lib/
    cn.ts                      # clsx + tailwind-merge helper
  motion/
    Reveal.tsx                 # scroll/load reveal wrapper (§6)
    motionConfig.ts            # eases, durations, reduced-motion hook
  components/
    primitives/                # Text, AnimatedLink, Pill, GlassCard, GradientOrb, BrandLogo
    cards/                     # TraitCard, LinkCard, HiringCard
    timeline/                  # TimelineRow, TimelineSubRole
    layout/                    # PageShell, Section, SectionHeader
    sections/                  # Hero, About, KnownFor, ToolsILove, SitesILove,
                               # WorkTimeline, Education, Contact, Footer
  content/
    site.ts traits.ts tools.ts sites.ts work.ts socials.ts hiring.ts
  assets/
    fonts/ logos/ og/
```

---

## 3. Radix usage policy

Default to plain semantic HTML + Tailwind + `motion`. Reach for Radix **only** for the cases below. Install per-primitive packages, style entirely with your own Tailwind classes, compose with `motion` via `asChild`.

| Need | Primitive | Use it? |
|---|---|---|
| Accessible hidden labels (icon-only social links) | `react-visually-hidden` | ✅ yes |
| Meta sub-roles expand/collapse | `react-collapsible` | ⚠️ only if you make them collapsible; live site shows them always-open → default **skip** |
| Hover tooltip on tool/site cards | `react-tooltip` | ⚠️ only if you add tooltips (not on live site) |
| Hiring/contact modal | `react-dialog` | ⚠️ only if redesigned as modal (currently inline) → default **skip** |

`asChild` + motion pattern:
```tsx
import * as Tooltip from "@radix-ui/react-tooltip";
import { motion } from "motion/react";
// <Tooltip.Trigger asChild><motion.button whileHover={{ scale: 1.05 }} className="...">…</motion.button></Tooltip.Trigger>
```

**Do not** install shadcn/ui or a full Radix theme — its neutral app aesthetic clashes with this warm editorial design and you'd restyle everything anyway.

---

## 4. Design tokens — `src/styles/tokens.css`

Extracted from the live site's CSS custom properties and computed styles. Surface these in `tailwind.config.ts` via `theme.extend` so utilities map to vars.

```css
:root {
  /* Warm paper neutrals — the signature; never pure white */
  --paper-0: #fbfaf9;
  --paper-1: #f7f4f1;
  --paper-2: #eee6dd;
  --hairline: #cfcfcf;

  /* Ink + text */
  --ink: #1f1f1f;
  --ink-strong: #141414;
  --ink-muted: rgb(116,116,114);   /* dominant body/secondary gray (warm) */

  /* Accent blue (links, highlights) */
  --accent: #1586f8;
  --accent-2: #38c0ff;
  --accent-3: #0f8bff;

  /* Playful swatch accents (emoji chips, tags, decorative dots) */
  --swatch-red: #f74a4a;
  --swatch-red-soft: #fd6d6d;
  --swatch-green: #4af78a;
  --swatch-yellow: #fff04d;
  --swatch-peach: #ffd59e;
  --swatch-purple: #541feb;

  /* Warm gold/brown (decorative gradient sheen + glows) */
  --gold-0: #916e49;
  --gold-1: #926f49;
  --gold-hi: #edd7a1;

  /* Glass / overlay */
  --glass-dark: rgba(18,18,18,.74);
  --overlay-1a: rgba(0,0,0,.10);

  /* Radius */
  --radius-card: 40px;
  --radius-pill: 999px;

  /* Blur */
  --blur-glass-sm: 8px;
  --blur-glass-md: 15px;
  --blur-glass-lg: 30px;

  /* Motion */
  --ease-standard: cubic-bezier(.44,0,.56,1);
  --dur-fast: .3s;

  /* Decorative gradients */
  --orb-blue:  radial-gradient(65.8% 78.7% at 25.5% 21.5%, #38c0ff 0%, #0f8bff 100%);
  --orb-peach: radial-gradient(77.3% 90.4% at 91.1% 64.3%, #ff971747 0%, #ababab00 100%);
  --orb-gold:  radial-gradient(77.3% 90.4% at 62.1% 0, #edd7a114 0%, #ababab00 100%);
  --sheen-gold: linear-gradient(#916e4900 6%, #916e4905 37%, #926f4933 100%);
}
```

**Type scale** (New Spirit display vs Inter body — confirm exact px against live site):
```
display-xl  (hero "Hiya!")     New Spirit, clamp(64px,10vw,140px)
display-l   (section titles)   New Spirit SemiBold, clamp(32px,5vw,56px)
kicker      (eyebrow labels)   Obviously Extended Medium, 13–14px, tracked, uppercase
body-l      (intro paragraph)  Inter 400, 20–22px
body        (descriptions)     Inter 400, 16–17px, color var(--ink-muted)
label       (dates/meta)       Inter 500, 14px, var(--ink-muted)
```
**Spacing:** 4px base scale (4/8/12/16/24/32/48/64/96/128).

---

## 5. Fonts — `src/styles/fonts.css`

| Role | Family on live site | License | Action |
|---|---|---|---|
| Body / UI | **Inter** (400/500/700, variable) | OFL (free) ✅ | `@fontsource-variable/inter` or Google Fonts |
| Display serif | **New Spirit** (Reg/Med/SemiBold/Bold) | **Commercial** (DJR / Type Network) | License + self-host, **or** substitute |
| Wide grotesque (kickers) | **Obviously Extended** (Med/Semibold) | **Commercial** (OH no Type Co) | License + self-host, **or** substitute |
| Accent | **Dolph_v02** (Reg/Med/Bold) | **Commercial** | License, **or** drop/substitute |

**Free substitutes (use until licensed, keeps build unblocked):**
- New Spirit → **Fraunces** (variable serif, OFL) or **Newsreader**.
- Obviously Extended → **Anton** / **Archivo Expanded** (OFL).
- Dolph_v02 → fold into Inter or a free display; lowest priority, used sparingly.

Set up CSS variables so swapping families later is one-line:
```css
:root { --font-display: "New Spirit", "Fraunces", serif;
        --font-body: "Inter", system-ui, sans-serif;
        --font-wide: "Obviously Extended", "Archivo Expanded", sans-serif; }
```
`font-display: swap`; preload the display face. **Flag to the human which substitutes (if any) shipped.**

---

## 6. Motion system

All reveal motion goes through ONE wrapper so behavior is consistent and reduced-motion is handled once.

`src/motion/Reveal.tsx` contract:
```tsx
interface RevealProps {
  children: React.ReactNode;
  y?: number;          // start offset, default 50 (sections use 50; larger blocks 70)
  delay?: number;      // for stagger, default 0
  once?: boolean;      // default true
  as?: React.ElementType;
}
// Implementation: motion element, initial {opacity:0, y}, whileInView {opacity:1, y:0},
// viewport {once, margin:"-10% 0px"}, transition {duration:.6, ease:[.44,0,.56,1], delay}.
// If useReducedMotion() → render static (no transform/opacity anim).
```

**Exact values from the source (preserve these):**
- Reveal start offsets: `translateY(50px)` and `translateY(70px)` + fade in.
- Stagger: sequential children offset by ~0.06–0.1s `delay` (e.g. trait cards, link cards, timeline rows).
- Global easing for hover transitions: `color .3s cubic-bezier(.44,0,.56,1)` — apply to all `<AnimatedLink>` and interactive color/opacity changes.
- Hover scale on cards/decorative: `whileHover={{ scale }}` with scales seen at `1.1`, `1.3`, `1.4` (interactive) and `0.9` (de-emphasis). Use ~`1.03–1.05` for subtle card hover; reserve big scales for decorative stickers.
- Decorative tilt: static `rotate` of `8°`, `67°`, `90°`, `96°` on sticker/badge elements (pass `rotate` prop, no animation needed).
- **Gradient orbs:** absolutely-positioned blurred radial blobs behind content. Filter blur values present: `7/8/12/15/22/30px`. Give them a slow infinite drift (`animate={{ x:[…], y:[…] }}`, 12–20s, ease in-out) — keep subtle.
- **Glass surfaces:** `backdrop-filter: blur()` at `8 / 15 / 30px` on overlay/elevated cards (`<GlassCard blur="sm|md|lg">`).

---

## 7. Responsive breakpoints (Framer standard — match these)

```
Desktop  >= 1200px
Tablet   810–1199px
Phone    < 810px
```
Tailwind config: set `screens` to `{ tablet: '810px', desktop: '1200px' }` (mobile-first; phone is the base). Verify each section at 390 / 900 / 1440 against the live site.

---

## 8. Content data (real copy — port verbatim)

`src/content/` — typed. Actual content extracted from the live site:

```ts
// site.ts
export const site = {
  name: "Taylor Emmerson",
  title: "Taylor Emmerson: Product Designer",
  description: "Product designer from Toronto, currently working at Homebase.",
  email: "tayloremmerson@me.com",       // NOTE: live site footer/body shows "tayloremmeson" (missing 'r') — TYPO. Use the correct address.
  hero: "Hiya!",
  intro: "I'm Taylor, a product designer and systems thinker — currently making at Homebase in Toronto.",
  bio: "My career journey so far has been a balance between building and scaling design systems and shipping product work. As a senior contributor, I have experience shipping zero-to-one products, leading design visions, and being a collaborative team-member who fosters learning and development in myself and others.",
};

// traits.ts  → "I'm also known for being…"
export const traits = [
  { emoji: "💭", label: "Process-driven", body: "Craft isn't just the end result — it's a reflection of how we work. I set up structure, document decisions, and simplify workflows to reduce unnecessary process." },
  { emoji: "🕵️", label: "Technical", body: "The age-old question “Should designers code?”. Yes! I write front-end code and collaborate with engineers on technical decisions and tradeoffs." },
  { emoji: "👨‍💻", label: "A prototyper", body: "If a picture's worth 1,000 words, a prototype's worth 10,000. I use the right tools for the fidelity we need — Origami, clickable Figma prototypes, or code." },
  { emoji: "📝", label: "The PM-hybrid", body: "I often write briefs and set strategic direction, making sure we define problems clearly and measure results accurately." },
];

// tools.ts  → "Tools I love"   (href + logo asset per item)
export const tools = [
  { name: "heptabase", href: "https://heptabase.com", desc: "A visual note-taking and organizational tool for all your thoughts" },
  { name: "framer", href: "https://framer.com", desc: "One of my favourite web design tools, built this site with it!" },
  { name: "arc", href: "https://arc.net", desc: "Finally got my browser organized" },
];

// sites.ts  → "Sites I love"
export const sites = [
  { name: "futurefonts.xyz", href: "https://futurefonts.xyz", desc: "I've spent way more money here than I'm proud to admit" },
  { name: "typewolf.com", href: "https://typewolf.com", desc: "Nice typefaces & sites" },
  { name: "codesandbox.io", href: "https://codesandbox.io", desc: "Great place to get started learning React without the environment setup" },
];

// work.ts  → "Work" timeline (company → nested roles)
export const work = [
  { company: "homebase", href: "https://joinhomebase.com/", period: "2026 — Present", location: "Toronto, Canada", roles: [] },
  { company: "meta", href: "https://design.facebook.com/", period: "2016 — 2026", location: "New York, USA", roles: [
    { title: "Recruiting products", period: "'25 — '26" },
    { title: "Design tools", period: "'22 — '25" },
    { title: "Facebook groups", period: "'21 — '22" },
    { title: "Business design systems", period: "'18 — '21" },
    { title: "Business suite", period: "'16 — '18" },
  ] },
  { company: "format", href: "https://format.com", period: "2015 — 2016", location: "Toronto, Canada", roles: [] },
];

export const education = { school: "York University & Sheridan College", period: "2012 - 2016", degree: "B.Des (Hons)", location: "Toronto, Canada" };

// socials.ts  → "Internet"
export const socials = [
  { name: "linkedin", href: "https://www.linkedin.com/in/taylor-emmerson/" },
  { name: "vsco", href: "https://vsco.co/emmersonic/gallery" },
  { name: "threads", href: "https://www.threads.com/@emmersonic" },
  { name: "are.na", href: "https://www.are.na/taylor-emmerson/channels" },
  { name: "instagram", href: "https://www.instagram.com/emmersonic/" },
];

// hiring.ts  → "Hiring?" CTA
export const hiring = {
  body: "If you have an opportunity that would be a good fit, I'd love to hear about it! Though please consider taking the time to check out some other fine folks from these sites.",
  links: [
    { name: "blackswho.design", href: "https://blackswho.design" },
    { name: "queerdesign.club", href: "https://queerdesign.club" },
    { name: "womenwho.design", href: "https://womenwho.design/" },
  ],
};

export const footer = { text: "Still here? Get in touch,", email: "tayloremmerson@me.com" };
```

> Extra links found in source not clearly placed: `design.facebook.com`, `ysdn.info` (York/Sheridan design program). Confirm placement against live site.

---

## 9. Component specs (contracts)

### Primitives
- **`<Text>` / headings** — variants bound to type scale (`display`, `title`, `kicker`, `body`, `label`). Picks `--font-display` / `--font-body` / `--font-wide` per variant.
- **`<AnimatedLink href>`** — external links (`target=_blank rel=noopener`). Hover = color shift to `--accent` over `.3s var(--ease-standard)` + optional underline grow. The single most-used interaction.
- **`<Pill rotate? color?>`** — rounded sticker/tag (`--radius-pill`). Optional `rotate` deg for the tilted decorative look; optional swatch background.
- **`<GlassCard blur="sm|md|lg">`** — container with `backdrop-filter: blur(var(--blur-glass-*))`, warm translucent bg, `--radius-card`, subtle border. Optional `sheen` (gold gradient overlay).
- **`<GradientOrb variant="blue|peach|gold" blur size pos>`** — absolutely-positioned blurred radial blob; slow drift animation; `aria-hidden`. Lives in `<PageShell>` and/or per-section backgrounds.
- **`<BrandLogo name>`** — renders the SVG mark for a tool/company/social (see §10).

### Cards
- **`<TraitCard {emoji,label,body}>`** — emoji chip + bold label (Inter 700 or display) + muted body. Renders the 4-up "Known for being…" grid (`tools`-style responsive grid; Desktop likely 2×2 or 4-col — confirm on live site).
- **`<LinkCard {name,href,desc,logo}>`** — logo + name + one-liner; whole card is an `<AnimatedLink>`, hover scale ~1.03. Powers **both** Tools I love and Sites I love.
- **`<HiringCard>`** — body text + row of `<AnimatedLink>`s; likely a `<GlassCard>` with sheen.

### Timeline
- **`<TimelineRow {company,period,location,href,children}>`** — company (display), period + location (label), optional `<BrandLogo>`. Renders nested `<TimelineSubRole>` children.
- **`<TimelineSubRole {title,period}>`** — indented role + year range.

### Layout
- **`<PageShell>`** — `--paper-0` background, global `<GradientOrb>` layer, font + token providers.
- **`<Section id, kicker?, title?>`** — vertical rhythm + max-width container (~1100–1200px), optional `<SectionHeader>`.
- **`<SectionHeader {kicker,title}>`** — kicker (wide grotesque, uppercase) + title (serif display).

### Sections (compose the above, map over §8 data)
`<Hero>` `<About>` `<KnownFor>` `<ToolsILove>` `<SitesILove>` `<WorkTimeline>` `<Education>` `<Contact>` (Email + Internet socials) `<HiringCard>` `<Footer>`. Each top-level block wrapped in `<Reveal>` with staggered children.

---

## 10. Asset sourcing
- **Logos** (heptabase, framer, arc, homebase, meta, format, social icons): use official brand SVGs or **Simple Icons** (`simple-icons`, free) where available; otherwise recreate as clean SVG. Optimize with SVGO. Store in `src/assets/logos/`. **Do not** pull from Framer's CDN.
- **OG image + favicon:** generate a simple branded OG (1200×630) and favicon set; reference in `<head>`.
- Any photographic imagery: re-export optimized WebP/AVIF; do not hotlink.

---

## 11. Build phases (ordered, each with an exit check)

1. **Scaffold** — Vite+React+TS+Tailwind+motion+ESLint/Prettier; folder structure; `cn.ts`. ✅ dev server runs blank PageShell.
2. **Tokens + fonts** — `tokens.css`, Tailwind theme extension, `fonts.css` with Inter + chosen display/wide faces (or substitutes). ✅ a test block shows serif title + Inter body in warm-paper colors.
3. **Content data** — port all of §8 into `src/content/`, typed. ✅ types compile.
4. **Primitives** — Text, AnimatedLink, Pill, GlassCard, GradientOrb, BrandLogo, `<Reveal>`. ✅ a primitives sandbox page renders each.
5. **Cards + timeline molecules** — TraitCard, LinkCard, TimelineRow/SubRole, HiringCard. ✅ render from data.
6. **Sections, desktop-first** — assemble top→bottom in `App.tsx`. ✅ full page scrolls, content matches live site order.
7. **Motion pass** — wire `<Reveal>` stagger, hover scales, decorative tilts, floating orbs, glass blur, link color easing. ✅ scroll reveals + hovers feel like the live site.
8. **Responsive pass** — Tablet (810–1199) + Phone (<810). ✅ matches live site at 390/900/1440.
9. **Polish** — `prefers-reduced-motion`, a11y (focus states, `VisuallyHidden` labels on icon links, semantic landmarks, alt text), OG/meta/favicon, Lighthouse ≥95. ✅
10. **Deploy** — Vercel static. ✅ production URL live.

---

## 12. Acceptance criteria (fidelity checklist)

- [ ] Background warm paper (`#fbfaf9`/`#f7f4f1`), **not** pure white; body text warm gray `rgb(116,116,114)`.
- [ ] Serif display (New Spirit/substitute) for hero + section titles; Inter body; wide grotesque kickers.
- [ ] Floating blurred radial gradient orbs (blue / peach / gold) drift behind content.
- [ ] Glassmorphism (`backdrop-filter: blur 8–30px`) on elevated/overlay surfaces.
- [ ] Scroll-reveal: `translateY(50–70px)` + fade, **staggered** across grouped children.
- [ ] Link hover color transition exactly `.3s cubic-bezier(.44,0,.56,1)`.
- [ ] Decorative tilted stickers (rotate 8–96°) + tasteful hover scale.
- [ ] `40px` card radius + large pill shapes; gold gradient sheen on select cards.
- [ ] All content from §8 present, in live-site order, correct external links, email typo fixed.
- [ ] `prefers-reduced-motion` disables transforms/opacity reveals.
- [ ] Layout visually matches live site at Desktop / Tablet / Phone.
- [ ] No assets hotlinked from `framerusercontent.com`; fonts licensed or substituted (substitutes flagged to human).

---

## 13. Open items needing human input
1. **Font licenses** — buy New Spirit / Obviously / Dolph, or approve free substitutes (Fraunces / Archivo Expanded). Until resolved, ship substitutes.
2. **Exact layout** — confirm grid column counts and spacing from live-site screenshots (not captured in this spec).
3. **Logos** — confirm which brand marks may be reproduced; supply any that aren't on Simple Icons.
4. **Scope creep** — decide whether Meta sub-roles should be collapsible (Radix Collapsible) or static (default static, matching live site).
