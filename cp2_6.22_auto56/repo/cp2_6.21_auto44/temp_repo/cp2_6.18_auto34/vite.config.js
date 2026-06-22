import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  server: {
    port: 5286,
    host: true,
    open: false,
    strictPort: true
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true
  }
});
