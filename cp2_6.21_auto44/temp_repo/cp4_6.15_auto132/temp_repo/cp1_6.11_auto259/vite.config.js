import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname),
  base: './',
  server: {
    port: 3000,
    open: false,
    host: true
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false
  }
});
