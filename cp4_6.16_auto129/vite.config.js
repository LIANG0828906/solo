import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: false
  },
  optimizeDeps: {
    include: ['phaser', 'zustand', 'uuid', 'idb-keyval']
  }
});
