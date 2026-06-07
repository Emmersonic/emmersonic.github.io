# emmersonic.com → React Reimplementation Plan

Audit of the live site (built in **Framer**) and a plan to rebuild it as a hand-coded React app with a real design system, preserving the fine-grained motion, transitions, and blur details.

---

## 1. Audit — what the site is

Single-page personal portfolio for **Taylor Emmerson, product designer** (Toronto, ex-Meta, now Homebase). One long scroll, no routing. Currently Framer-generated (auto-emitted DOM + Framer Motion runtime).

### Information architecture (top → bottom)

| # | Section | Content |
|---|---------|---------|
| 1 | **Hero** | "Hiya!" oversized greeting |
| 2 | **Intro / About** | "I'm Taylor, a product designer and systems thinker — currently making at Homebase in Toronto." + paragraph on career (design systems ⇄ product work, zero-to-one, leading visions, mentoring) |
| 3 | **"Known for being…"** | 4 trait cards — 💭 Process-driven, 🕵️ Technical, 👨‍💻 A prototyper, 📝 The PM-hybrid (emoji + bold label + description) |
| 4 | **Tools I love** | Link cards: heptabase, framer, arc (logo + name + one-liner) |
| 5 | **Sites I love** | Link cards: futurefonts.xyz, typewolf.com, codesandbox.io |
| 6 | **Work** | Timeline. Homebase (2026–Present), Meta (2016–2026) with nested sub-roles (Recruiting products '25–'26, Design tools '22–'25, Facebook Groups '21–'22, Business design systems '18–'21, Business Suite '16–'18), Format (2015–2016) |
| 7 | **School** | York University & Sheridan College, B.Des (Hons), 2012–2016 |
| 8 | **Contact** | Email block + "Internet" social links (LinkedIn, VSCO, Threads, are.na, Instagram) |
| 9 | **Hiring?** | CTA card pointing to blackswho.design, queerdesign.club, womenwho.design |
| 10 | **Footer** | "Still here? Get in touch, tayloremmerson@me.com" |

> Note: extracted text appears duplicated because Framer emits separate desktop + phone variant trees. The real content set is the list above (single source of truth in React).

---

## 2. Design language extracted

### Color (from CSS custom-prop tokens + computed styles)

**Neutrals (warm paper palette — this is the signature):**
- `#fafafa` / `#fbfaf9` / `#f7f4f1` — page backgrounds (warm off-white, slightly creamy)
- `#eee6dd` — warm card / divider tint
- Ink `#1f1f1f` (headings), `rgb(20,20,20)` near-black
- Muted text `rgb(116,116,114)` — the dominant secondary/body gray (warm gray, used everywhere)
- `#cfcfcf` hairlines

**Accent blue (links / highlights):**
- `#1586f8` primary, `#1491ff`, `#0f8bff`, `#38c0ff` (used as a blue radial gradient)

**Playful swatch accents (tags / emoji chips / decorative):**
- Red `#f74a4a` / `#fd6d6d`, Green `#4af78a`, Yellow `#fff04d`, Peach `#ffd59e`, Purple `#541feb`

**Warm gold/brown (decorative gradient borders + glows):**
- `#916e49` → `#926f49`, highlight `#edd7a1`

**Glass / overlay:**
- `rgba(18,18,18,0.74)` dark glass, `#1f1f1fbf`, low-alpha overlays `#0000001a`

### Gradients (decorative orbs + masks)
```
radial-gradient(65.8% 78.7% at 25.5% 21.5%, #38c0ff 0%, #0f8bff 100%)   /* blue orb */
radial-gradient(...at 91.1% 64.3%, #ff971747 0%, #ababab00 100%)         /* peach glow */
radial-gradient(...at 62.1% 0,   #edd7a114 0%, #ababab00 100%)           /* gold glow */
linear-gradient(#916e4900 6%, #916e4905 37%, #926f4933 100%)             /* gold card sheen */
linear-gradient(#000 0%, #0000 19.9%)                                     /* scroll fade masks */
```

### Typography
| Role | Family | Notes |
|------|--------|-------|
| Display / headings | **New Spirit** (Regular/Medium/SemiBold/Bold) | Serif, the elegant display face |
| Body / UI | **Inter** (400/500/700, variable) | Open source ✅ |
| Accent / wide labels | **Obviously Extended** (Medium/Semibold) | Wide grotesque, likely for kicker labels |
| Accent / mono-ish | **Dolph_v02** (Regular/Medium/Bold) | Quirky display accent |

⚠️ **Licensing:** New Spirit, Obviously, and Dolph are **commercial fonts**. Do **not** copy the `.otf` files from Framer's CDN into production. Need licensed `@font-face` files (or substitute). Inter is free.

### Shape, blur & depth
- **Border radius:** `40px` large soft cards; big pills `81px` / `91px` / `161px` / `241px` (badges, buttons, blob shapes)
- **Backdrop blur (glass):** `2px`, `8px`, `15px`, `30px` — layered glassmorphism on overlays/nav/cards
- **Filter blur (orbs/shadows):** `7px`, `8px`, `12px`, `15px`, `22px`, `30px` — soft glowing background blobs

### Motion (Framer Motion under the hood)
- **Reveal-on-scroll / on-load:** elements start `translateY(50px)`–`translateY(70px)` + faded, settle to rest. `data-framer-appear-id` × multiple → staggered entrance. `will-change: transform` (×19) and `will-change: filter` (×3, blur reveals).
- **Link hover:** `transition: color .3s cubic-bezier(.44,0,.56,1)` — the global easing curve to reuse everywhere.
- **Decorative tilt:** static rotated stickers/cards — `rotate(8deg)`, `rotate(67deg)`, `rotate(90deg)`, `rotate(96deg)`.
- **Hover/parallax scale:** `scale(0.9 / 1.1 / 1.3 / 1.4)` on interactive/decorative elements.
- **Floating gradient orbs:** blurred radial blobs behind content, subtle drift.
- One `position: fixed` element — floating contact/nav affordance.

### Responsive breakpoints (Framer standard)
- **Desktop** ≥ 1200px
- **Tablet** 810–1199px
- **Phone** < 810px

---

## 3. Target stack

| Concern | Choice | Why |
|---------|--------|-----|
| Build | **Vite + React + TypeScript** | Single static page, no server needs, fastest DX |
| Styling | **Tailwind CSS** + CSS custom properties for tokens | Token-first, matches design-system goal |
| Motion | **`motion` (Framer Motion v11+)** | Re-creates the exact appear/scroll/spring behavior 1:1 |
| Lint/format | ESLint + Prettier | — |
| Deploy | **Vercel** (static) | Zero-config; SPA portfolio |

Alternative: **Next.js (App Router, static export)** if SSR/SEO/metadata + image optimization are priorities. For a one-page portfolio, Vite is leaner; Next is the safe call if you want best-in-class SEO/OG and `next/image`. Recommendation: **Vite** unless you specifically want Next's SEO tooling.

---

## 4. Design system (the core ask — componentize repeated patterns)

### Tier 0 — Tokens (`src/styles/tokens.css` as CSS vars, surfaced in `tailwind.config`)
```
--paper-0:#fbfaf9  --paper-1:#f7f4f1  --paper-2:#eee6dd
--ink:#1f1f1f      --ink-muted:rgb(116,116,114)   --hairline:#cfcfcf
--accent:#1586f8   --accent-2:#38c0ff
--swatch-red:#f74a4a --swatch-green:#4af78a --swatch-yellow:#fff04d --swatch-peach:#ffd59e --swatch-purple:#541feb
--gold-0:#916e49   --gold-hi:#edd7a1
--glass-dark:rgba(18,18,18,.74)
--radius-card:40px --radius-pill:999px
--ease-standard:cubic-bezier(.44,0,.56,1)
--blur-sm:8px --blur-md:15px --blur-lg:30px
type scale + spacing scale (4/8 base)
```

### Tier 1 — Primitives / atoms
- `<Text>` / heading components bound to the type scale (New Spirit vs Inter vs Obviously)
- `<AnimatedLink>` — color-transition + underline on hover (`--ease-standard`, .3s)
- `<Pill>` / `<Tag>` — rounded sticker label, optional `rotate` prop for the tilted look
- `<EmojiBadge>` — emoji in a soft chip
- `<Icon>` / `<BrandLogo>` — for tool/site/social marks

### Tier 2 — Molecules
- `<GlassCard>` — `backdrop-filter: blur()` container, configurable blur level + warm border
- `<TraitCard>` — emoji + bold label + body (the "Known for being…" 4-up)
- `<LinkCard>` — logo + title + one-liner (powers **Tools I love** & **Sites I love**)
- `<TimelineRow>` — company + date range + location
- `<TimelineSubRole>` — nested role + year (Meta's children)
- `<SocialLink>` — labelled external link
- `<SectionHeader>` — kicker + title
- `<GradientOrb>` — absolutely-positioned blurred radial blob (decorative, drifts)

### Tier 3 — Organisms / sections
`<Hero>`, `<About>`, `<KnownFor>` (grid of TraitCard), `<ToolsILove>` / `<SitesILove>` (grid of LinkCard), `<WorkTimeline>` (TimelineRow + nested TimelineSubRole), `<Education>`, `<Contact>` (Email + Internet), `<HiringCard>`, `<Footer>`.

### Layout
- `<PageShell>` — warm-paper background + global orbs layer
- `<Section>` — consistent vertical rhythm + max-width container
- Responsive grid utilities matching the 3 breakpoints

### Motion system (shared, not per-component)
- `<Reveal>` — wrapper using `motion` + `whileInView`, props `{ y = 50, delay }`, replays the translateY+fade appear with stagger. Reused everywhere instead of re-coding.
- `<Tilt>` / `rotate` prop — static decorative tilt.
- Hover scale via `whileHover={{ scale }}`.
- `prefers-reduced-motion` guard baked into `<Reveal>`.

### Data, not markup
Content lives in typed data files (`src/content/*.ts`): `traits[]`, `tools[]`, `sites[]`, `work[]` (with `roles[]`), `socials[]`, `hiringLinks[]`. Sections map over data → no copy-paste duplication, easy edits.

---

## 5. Asset & font handling
- Pull **Inter** from Google Fonts / `@fontsource` (free).
- For **New Spirit / Obviously / Dolph**: acquire licenses and self-host `@font-face`, **or** substitute (e.g. a free serif display for New Spirit, a free wide grotesque for Obviously) until licensed. Flag to user before shipping.
- Re-export logos/marks (heptabase, framer, arc, company logos) as optimized SVG/PNG; don't hotlink Framer's CDN.
- `font-display: swap` + preload the display face.

---

## 6. Build phases

1. **Scaffold** — Vite + React + TS + Tailwind + motion; ESLint/Prettier; folder structure.
2. **Tokens + fonts** — `tokens.css`, Tailwind theme extension, `@font-face` (with placeholders for licensed faces), type scale.
3. **Primitives** — Text/headings, AnimatedLink, Pill, EmojiBadge, GlassCard, GradientOrb, `<Reveal>`.
4. **Content data files** — port all copy into typed `src/content`.
5. **Molecules** — TraitCard, LinkCard, TimelineRow/SubRole, SocialLink, SectionHeader.
6. **Sections / page assembly** — top-to-bottom, desktop first.
7. **Motion pass** — wire `<Reveal>` stagger, hover scales, tilts, floating orbs, glass blur; match `--ease-standard`.
8. **Responsive pass** — Tablet (810–1199) + Phone (<810); verify the 3 breakpoints.
9. **Polish** — reduced-motion, a11y (focus states, alt text, semantic landmarks), OG/meta, Lighthouse.
10. **Deploy** — Vercel static.

---

## 7. Detail-fidelity checklist (don't lose these)
- [ ] Warm paper background (not pure white) + warm gray body text `rgb(116,116,114)`
- [ ] New Spirit serif display vs Inter body contrast
- [ ] Floating blurred radial gradient orbs (blue / peach / gold) behind content
- [ ] Glassmorphism (`backdrop-filter: blur 8–30px`) on overlay/card surfaces
- [ ] Scroll/load reveal: translateY(50–70px) + fade, **staggered**
- [ ] Link hover color transition `.3s cubic-bezier(.44,0,.56,1)`
- [ ] Tilted decorative stickers (rotate 8–96°) + hover scale (0.9–1.4)
- [ ] 40px card radius + large pill shapes
- [ ] Gold gradient sheen on select cards
- [ ] `prefers-reduced-motion` honored
