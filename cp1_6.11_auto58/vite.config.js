import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  server: {
    port: 3000,
    strictPort: true,
    hmr: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
