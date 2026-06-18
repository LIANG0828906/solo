import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5174,
    open: true
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    target: 'es2020'
  }
});
