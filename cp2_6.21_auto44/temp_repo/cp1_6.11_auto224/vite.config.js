import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 8765,
    host: true
  },
  build: {
    target: 'es2020',
    outDir: 'dist'
  },
  esbuild: {
    target: 'es2020'
  }
});
