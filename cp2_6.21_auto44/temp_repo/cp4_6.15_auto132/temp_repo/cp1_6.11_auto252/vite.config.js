import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  server: {
    port: 3001,
    host: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
