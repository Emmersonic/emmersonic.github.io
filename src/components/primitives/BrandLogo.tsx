import {
  siArc,
  siCodesandbox,
  siFramer,
  siInstagram,
  siMeta,
  siThreads,
  siVsco,
} from 'simple-icons'
import { cn } from '@/lib/cn'

interface SimpleIcon {
  path: string
  hex: string
}

interface BrandLogoProps {
  /** Lowercase brand name as used on this site (see registry below). */
  name: string
  /** Square size in px. Defaults to 24. */
  size?: number
  /** Use the brand's official color instead of `currentColor`. */
  brandColor?: boolean
  className?: string
  /** Accessible title; falls back to the brand name. */
  title?: string
}

/**
 * Registry of names → simple-icons marks. Only names that exist as slugs in
 * simple-icons live here; everything else falls back to a text wordmark.
 *
 * Verified present: framer, arc, meta, instagram, threads, codesandbox, vsco.
 * Falls back to wordmark: linkedin, heptabase, homebase, format,
 * futurefonts.xyz, typewolf.com, are.na (none have simple-icons slugs).
 */
const iconRegistry: Record<string, SimpleIcon> = {
  framer: siFramer,
  arc: siArc,
  meta: siMeta,
  instagram: siInstagram,
  threads: siThreads,
  'codesandbox.io': siCodesandbox,
  vsco: siVsco,
}

/** Pretty wordmark labels for names without an icon (strips domain suffixes). */
const wordmarkLabels: Record<string, string> = {
  'futurefonts.xyz': 'Future Fonts',
  'typewolf.com': 'Typewolf',
  'are.na': 'Are.na',
  heptabase: 'Heptabase',
  homebase: 'Homebase',
  format: 'Format',
  linkedin: 'LinkedIn',
}

/**
 * Renders a small brand mark by name. Uses a monochrome simple-icons glyph
 * (inheriting `currentColor`) when one exists, otherwise a clean tracked
 * wordmark so unknown / icon-less brands still read as logos.
 */
export function BrandLogo({ name, size = 24, brandColor = false, className, title }: BrandLogoProps) {
  const key = name.toLowerCase()
  const icon = iconRegistry[key]
  const label = title ?? name

  if (icon) {
    return (
      <svg
        role="img"
        aria-label={label}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={brandColor ? `#${icon.hex}` : 'currentColor'}
        className={className}
      >
        <title>{label}</title>
        <path d={icon.path} />
      </svg>
    )
  }

  const text = wordmarkLabels[key] ?? name
  return (
    <span
      className={cn('font-wide text-label uppercase tracking-wider', className)}
      style={{ fontSize: size * 0.6 }}
      title={title}
    >
      {text}
    </span>
  )
}
