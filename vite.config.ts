import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [{
    name: 'local-file-entry',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (html) => html
        // Vite emits module and CORS attributes that prevent loading from file://.
        .replace('<script type="module" crossorigin src=', '<script defer src=')
        .replace('<link rel="stylesheet" crossorigin href=', '<link rel="stylesheet" href='),
    },
  }],
  build: {
    outDir: 'release/kumquat-offline/app',
    modulePreload: false,
    cssCodeSplit: false,
    // fetch() can read embedded data URLs from a local document.
    assetsInlineLimit: (filename) => filename.endsWith('.glb'),
    rollupOptions: {
      output: { format: 'iife', inlineDynamicImports: true },
    },
  },
})
