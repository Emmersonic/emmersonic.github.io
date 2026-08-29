import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { preloadFonts } from './vite-plugin-preload-fonts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), preloadFonts()],
  // Honor an externally assigned port (e.g. preview tooling's PORT env).
  server: {
    port: Number(process.env.PORT) || 5173,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
