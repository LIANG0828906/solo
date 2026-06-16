import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  server: {
    port: 5173,
    host: true,
    open: true
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['phaser', 'zustand', 'uuid', 'idb-keyval']
  }
});
