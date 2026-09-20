import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  base: './',
  plugins: [svelte()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
  },
  server: {
    port: 5174,
    proxy: {
      // NIFI_API overrides the backend (default: the standalone `go run ./cmd/nifi` on :8090).
      '/api': { target: process.env.NIFI_API || 'http://localhost:8090', changeOrigin: true },
    },
  },
});
