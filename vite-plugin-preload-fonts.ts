import type { Plugin } from 'vite'

/**
 * Injects <link rel="preload" as="font"> for New Spirit into the built
 * index.html. Filenames are content-hashed by Vite so they can't be
 * hardcoded in index.html; this reads the actual emitted names from the
 * bundle instead.
 */
export function preloadFonts(): Plugin {
  let fontFiles: string[] = []

  return {
    name: 'preload-fonts',
    generateBundle(_options, bundle) {
      fontFiles = Object.keys(bundle).filter(
        (name) => name.startsWith('assets/NewSpirit-') && name.endsWith('.woff2')
      )
    },
    transformIndexHtml() {
      return fontFiles.map((file) => ({
        tag: 'link',
        attrs: {
          rel: 'preload',
          as: 'font',
          type: 'font/woff2',
          href: `/${file}`,
          crossorigin: '',
        },
        injectTo: 'head' as const,
      }))
    },
  }
}
