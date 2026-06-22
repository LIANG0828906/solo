import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    host: true,
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020'
  },
  optimizeDeps: {
    include: ['three']
  }
});
