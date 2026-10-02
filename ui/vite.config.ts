import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// The UI is server-rendered (internal/web); this builds only its islands —
// the flow designer and the dependency graph — as one module the pages load
// on demand, embedded from internal/web/assets/islands.
export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [svelte()],
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: '../internal/web/assets/islands',
    emptyOutDir: true,
    minify: true,
    chunkSizeWarningLimit: 900,
    lib: {
      entry: 'src/islands.svelte.ts',
      formats: ['es'],
      fileName: () => 'islands.js',
      cssFileName: 'islands',
    },
  },
});
