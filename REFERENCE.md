# emmersonic.com — extracted ground truth (desktop 1440)

Measured from the live site's own DOM/computed styles (served locally as `public/reference.html`).
This supersedes IMPLEMENTATION.md's invented type scale where they disagree. **Reproduce, don't reimagine.**

## Layout — asymmetric 2-column collage (NOT a vertical stack)
- Page bg: `#f7f4f1` (paper-1). Content frame centered, ~1020px wide (≈210px side margins at 1440).
- **Hero band (top):** big blurred gradient blobs filling a rounded area; hero text sits over them, left.
- **Left column (~700px):** stacked rounded cards (radius 40px), each overlapping/below the hero:
  About (paper-0 / light) → Known-for (black) → Tools I love (gold) → Sites I love (gold).
  The About card pulls UP and overlaps the bottom of the hero blob field.
- **Right column (~280px sidebar, starts ~y750):** text lists — WORK, SCHOOL, EMAIL, INTERNET, HIRING?.
- **Footer:** centered serif line.
- Mobile (<810): single column — cards full width, sidebar lists stack below.

## Hero
- Blobs (large, solid swatch colors, big squircle radii, heavily blurred 7–30px via wrapper), overlapping left-center:
  - green `#4af78a` ~709px (radius 161)
  - red `#f74a4a` ~456px (radius 91)
  - blue gradient `radial-gradient(65.8% 78.7% at 25.5% 21.5%, #38c0ff, #0f8bff)` (radius 241)
  - yellow `#fff04d`
- "Hiya!" — New Spirit **Medium 28px**, color `rgba(18,18,18,.74)`.
- "I'm Taylor, a product designer and systems thinker — currently making at Homebase in Toronto" —
  New Spirit **Regular 56px**, **white**, over the blobs. (responsive: clamp down on mobile)

## Cards
- **About** — bg `#fbfaf9`, radius 40, pad 44/48, w700. New Spirit:
  - lead (para 1) 20px / lh30 / `#141414`, with **bold** phrases.
  - paras 2–3: 16px / lh26 / `#141414`.
- **Known-for** — bg `#1f1f1f` (ink), white text, radius 40, pad 44/48.
  - title "I'm also known for being…" New Spirit Medium 16px white.
  - 4 traits: emoji + Inter 14px / lh24 white — "**Label:** body" (label weight 500, body 400). A LIST, not a grid.
- **Tools I love / Sites I love** — bg `#926f49` (gold-1), white text, radius 40.
  - Vertical rotated label "TOOLS I LOVE" / "SITES I LOVE" (wide grotesque).
  - items: name = Inter 14px/500 white, underlined (external link); desc = Inter 12px white/muted.

## Right sidebar (Inter)
- Kickers (WORK / SCHOOL / EMAIL / INTERNET / HIRING?): ~12px uppercase, tracked, gray `#747472` (wide grotesque feel).
- Links (homebase, meta, format, school name, socials, hiring links, email): Inter **14px / 500, blue `#1586f8`**.
- Meta/period ("2026 — Present · Toronto, Canada"): Inter 12px `#747472` (middle dot `·`).
- Work sub-roles (Title Case): title + period ("'25 — '26"), indented under company.
- Hiring body: Inter 12px / lh20 `#747472`.
- INTERNET socials laid out in a small 2-column grid.

## Footer
- New Spirit Regular 20px / lh30 `#1f1f1f`, centered: "Still here? Get in touch, tayloremmerson@me.com".

## Copy corrections vs IMPLEMENTATION.md §8
- Intro (hero 56px): "I'm Taylor, a product designer and systems thinker — currently making at Homebase in Toronto" (no trailing period).
- About = **3 paragraphs** (career[]):
  1. "My career journey so far has been a balance between **building and scaling design systems** and **shipping product work**."
  2. "No matter the focus, I approach problems with a system thinking mindset, allowing me focus on impactful opportunities to leverage and simply existing experiences, or set up new ones for scale, with the ultimate goal of shipping quality products for users."
  3. "As a senior contributor, I have experience **shipping zero-to-one products**, **leading design visions**, and being a collaborative team-member who **fosters learning and development** in myself and others."
- Work sub-roles Title Case: "Recruiting Products", "Design Tools", "Facebook Groups", "Business Design Systems", "Business Suite".
- Section is **"School"** (not "Education"). Meta location "New York, USA".
- Email: live site has typo `tayloremmeson@me.com`; we ship the correct `tayloremmerson@me.com`.

## Fonts
- New Spirit (commercial) → **Fraunces** substitute. Inter (exact). Obviously Extended → **Archivo** (wide) for kickers/vertical labels.
