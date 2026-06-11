import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: false
  },
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
