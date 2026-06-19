import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 8765,
    strictPort: true,
    open: false,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020'
  }
});
