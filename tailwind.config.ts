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
          'red-soft': 'var(--swatch-red-soft)',
          green: 'var(--swatch-green)',
          yellow: 'var(--swatch-yellow)',
          peach: 'var(--swatch-peach)',
          purple: 'var(--swatch-purple)',
        },
        gold: {
          0: 'var(--gold-0)',
          1: 'var(--gold-1)',
          hi: 'var(--gold-hi)',
        },
        glass: {
          dark: 'var(--glass-dark)',
        },
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        wide: 'var(--font-wide)',
      },
      fontSize: {
        // Real scale measured from the live site (New Spirit / Inter).
        // Live: 56px / line-height 1.0em / no letter-spacing (white over blobs).
        hero: ['clamp(34px, 5.6vw, 56px)', { lineHeight: '1' }],
        // Live: New Spirit Medium 28px / line-height 1.4em.
        hiya: ['28px', { lineHeight: '1.4' }],
        lead: ['20px', { lineHeight: '30px' }],
        serif: ['16px', { lineHeight: '26px' }],
        // Live: Inter 12px / line-height 24px / letter-spacing 1.2px (kickers + love-card labels).
        kicker: ['12px', { lineHeight: '24px', letterSpacing: '1.2px' }],
        ui: ['14px', { lineHeight: '20px', letterSpacing: '0.1px' }],
        meta: ['12px', { lineHeight: '20px' }],
      },
      borderRadius: {
        card: 'var(--radius-card)',
        pill: 'var(--radius-pill)',
      },
      backdropBlur: {
        'glass-sm': '8px',
        'glass-md': '15px',
        'glass-lg': '30px',
      },
      transitionTimingFunction: {
        standard: 'var(--ease-standard)',
      },
      transitionDuration: {
        fast: '300ms',
      },
      maxWidth: {
        container: '1200px',
      },
      backgroundImage: {
        'orb-blue': 'var(--orb-blue)',
        'orb-peach': 'var(--orb-peach)',
        'orb-gold': 'var(--orb-gold)',
        'sheen-gold': 'var(--sheen-gold)',
      },
    },
  },
  plugins: [],
} satisfies Config
