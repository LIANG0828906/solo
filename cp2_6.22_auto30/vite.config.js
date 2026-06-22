import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 5180,
    strictPort: true,
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
