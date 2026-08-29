import type { Plugin } from 'vite'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Injects <link rel="preload" as="font"> for New Spirit into the built
 * index.html. Filenames are content-hashed by Vite so they can't be
 * hardcoded in index.html; this reads the actual emitted names from the
 * bundle instead.
 *
 * Uses writeBundle (not generateBundle) so it runs strictly after
 * index.html is written to disk, regardless of plugin hook ordering —
 * this project's Vite 8 build runs on Rolldown, which doesn't guarantee
 * the same sequential generateBundle ordering across plugins that
 * classic Rollup does, so relying on generateBundle timing to beat the
 * internal html plugin was a race (worked with a stale .vite cache
 * locally, silently dropped the tags on every clean CI build).
 */
export function preloadFonts(): Plugin {
  return {
    name: 'preload-fonts',
    writeBundle(options, bundle) {
      const outDir = options.dir
      if (!outDir) return

      const fontFiles = Object.keys(bundle).filter(
        (name) => name.startsWith('assets/NewSpirit-') && name.endsWith('.woff2')
      )
      if (fontFiles.length === 0) return

      const htmlPath = join(outDir, 'index.html')
      if (!existsSync(htmlPath)) return

      const links = fontFiles
        .map(
          (file) =>
            `    <link rel="preload" as="font" type="font/woff2" href="/${file}" crossorigin />`
        )
        .join('\n')

      const html = readFileSync(htmlPath, 'utf-8')
      writeFileSync(htmlPath, html.replace('</head>', `${links}\n  </head>`))
    },
  }
}
