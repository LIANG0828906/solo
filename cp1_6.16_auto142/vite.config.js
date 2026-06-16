import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          vendor: ['zustand', 'dat.gui']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['three', 'zustand', 'dat.gui']
  }
});
