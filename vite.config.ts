import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'release/kumquat-offline/app',
    assetsInlineLimit: 0,
  },
})
