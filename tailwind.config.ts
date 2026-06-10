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
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        // Real scale measured from the live site (New Spirit / Inter).
        // Live: 56px / line-height 1.0em / no letter-spacing (white over blobs).
        hero: ['clamp(34px, 5.6vw, 56px)', { lineHeight: '1' }],
        // Live measures New Spirit Medium 28px / lh 1.4em; rendered at 30px here.
        hiya: ['30px', { lineHeight: '1.4' }],
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
        'orb-gold': 'var(--orb-gold)',
      },
    },
  },
  plugins: [],
} satisfies Config
