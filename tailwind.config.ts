import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Framer-standard breakpoints (mobile-first; phone is the base).
    screens: {
      tablet: '810px',
      desktop: '1200px',
    },
    extend: {
      colors: {
        paper: {
          0: 'var(--paper-0)',
          1: 'var(--paper-1)',
          2: 'var(--paper-2)',
        },
        hairline: 'var(--hairline)',
        ink: {
          DEFAULT: 'var(--ink)',
          strong: 'var(--ink-strong)',
          muted: 'var(--ink-muted)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          2: 'var(--accent-2)',
          3: 'var(--accent-3)',
        },
        swatch: {
          red: 'var(--swatch-red)',
          green: 'var(--swatch-green)',
          yellow: 'var(--swatch-yellow)',
        },
        gold: {
          0: 'var(--gold-0)',
          1: 'var(--gold-1)',
          hi: 'var(--gold-hi)',
        },
        link: {
          DEFAULT: 'var(--link)',
          hover: 'var(--link-hover)',
          underline: 'var(--link-underline)',
        },
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        // Real scale measured from the live site (New Spirit / Inter).
        // Live: 56px / line-height 1.0em / no letter-spacing (white over blobs).
        // Fluid 320→800px viewport (old clamp pinned flat 34px across every
        // phone width — no scaling between an iPhone SE and a tablet); lands
        // on the measured 56px by ~800px so tablet+ matches desktop exactly.
        // lineHeight 1.05 on mobile (tight-1.0 collides on wrapped 2-3 line
        // headlines at small sizes); `tablet:leading-none` restores the
        // measured 1.0 once the size itself has reached full scale.
        hero: ['clamp(30px, calc(5.4vw + 12.7px), 56px)', { lineHeight: '1.05' }],
        // Live measures New Spirit Medium 28px / lh 1.4em; was a flat 30px
        // with zero mobile scaling. Same 320→800px fluid zone as `hero` so
        // the greeting and headline scale in lockstep.
        hiya: ['clamp(22px, calc(1.7vw + 16.6px), 30px)', { lineHeight: '1.4' }],
        lead: ['22px', { lineHeight: '1.5' }],
        serif: ['18px', { lineHeight: '1.6' }],
        // Live measures Inter 12px / lh 24px / ls 1.2px; rendered at 14px here (kickers + love-card labels).
        kicker: ['14px', { lineHeight: '2', letterSpacing: '1.2px' }],
        ui: ['16px', { lineHeight: '1.4', letterSpacing: '0.1px' }],
        meta: ['14px', { lineHeight: '1.6' }],
      },
      borderRadius: {
        card: 'var(--radius-card)',
        pill: 'var(--radius-pill)',
      },
      transitionTimingFunction: {
        standard: 'var(--ease-standard)',
      },
      transitionDuration: {
        fast: '300ms',
      },
      backgroundImage: {
        'orb-blue': 'var(--orb-blue)',
        'orb-peach': 'var(--orb-peach)',
        'orb-peach-left': 'var(--orb-peach-left)',
        'orb-gold': 'var(--orb-gold)',
      },
    },
  },
  plugins: [],
} satisfies Config
