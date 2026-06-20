import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    include: ['three']
  },
  server: {
    host: '0.0.0.0',
    port: 5180,
    open: false
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false
  }
});
