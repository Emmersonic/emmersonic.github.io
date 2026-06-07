import { motion, useReducedMotion } from 'motion/react'
import { Text } from '@/components/primitives'
import { Reveal } from '@/motion/Reveal'
import { site } from '@/content'

/** A single big blurred pastel blob in the hero's background field. */
interface Blob {
  /** Background utility (solid swatch or the blue radial gradient). */
  bg: string
  /** Squircle/circle radius utility. */
  radius: string
  /** Blur amount in px (applied via inline filter). */
  blur: number
  /** Diameter in px. */
  size: number
  /** Position utilities — overlapping in the left/center of the band. */
  position: string
}

/**
 * The four overlapping blobs that make up the hero's soft warm glow. Solid
 * swatch colors + the blue radial gradient, heavily blurred, clustered toward
 * the left/center so the white headline reads over them. (REFERENCE.md §Hero.)
 */
const blobs: Blob[] = [
  {
    bg: 'bg-swatch-green',
    radius: 'rounded-[42%]',
    blur: 34,
    size: 560,
    position: 'left-8 bottom-[-120px]',
  },
  {
    bg: 'bg-swatch-red',
    radius: 'rounded-[34%]',
    blur: 26,
    size: 340,
    position: '-left-10 top-24',
  },
  {
    bg: 'bg-orb-blue',
    radius: 'rounded-full',
    blur: 30,
    size: 300,
    position: 'left-1/3 top-1/4',
  },
  {
    bg: 'bg-swatch-yellow',
    radius: 'rounded-[42%]',
    blur: 28,
    size: 300,
    position: 'left-20 -top-12',
  },
]

/**
 * The opening hero band: a full-width rounded warm panel with big blurred
 * pastel gradient blobs, and the greeting + headline statement laid over them
 * in the lower-left. Width-agnostic — fills its parent container. Drifting
 * blobs are disabled under `prefers-reduced-motion`.
 */
export function Hero() {
  const reduced = useReducedMotion()

  return (
    <section className="relative overflow-hidden rounded-card bg-paper-2 min-h-[480px] tablet:min-h-[620px]">
      {/* Blurred blob field (decorative). Clipped by overflow-hidden above. */}
      <div aria-hidden className="absolute inset-0">
        {blobs.map((blob, i) =>
          reduced ? (
            <div
              key={i}
              className={`absolute ${blob.bg} ${blob.radius} ${blob.position}`}
              style={{ width: blob.size, height: blob.size, filter: `blur(${blob.blur}px)` }}
            />
          ) : (
            <motion.div
              key={i}
              className={`absolute ${blob.bg} ${blob.radius} ${blob.position}`}
              style={{ width: blob.size, height: blob.size, filter: `blur(${blob.blur}px)` }}
              animate={{ x: [0, 18, -12, 0], y: [0, -14, 10, 0] }}
              transition={{ duration: 16 + i * 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          )
        )}
      </div>

      {/* Content sits above the blobs, pushed to the lower-left. */}
      <Reveal className="relative flex min-h-[480px] tablet:min-h-[620px] flex-col justify-center p-8 pb-32 tablet:p-12 tablet:pb-44">
        <Text as="p" variant="hiya" className="text-ink-strong/75">
          {site.hero}
        </Text>
        <Text as="h1" variant="hero" className="mt-2 max-w-[560px] text-white">
          {site.intro}
        </Text>
      </Reveal>
    </section>
  )
}
