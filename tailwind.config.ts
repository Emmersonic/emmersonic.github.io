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
        'display-xl': ['clamp(64px, 10vw, 140px)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'display-l': ['clamp(32px, 5vw, 56px)', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
        kicker: ['13px', { lineHeight: '1.2', letterSpacing: '0.14em' }],
        'body-l': ['clamp(20px, 2.4vw, 22px)', { lineHeight: '1.5' }],
        body: ['17px', { lineHeight: '1.6' }],
        label: ['14px', { lineHeight: '1.4' }],
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
