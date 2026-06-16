import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: false
  },
  build: {
    target: 'es2020',
    sourcemap: true
  },
  optimizeDeps: {
    include: ['three', 'zustand', 'uuid', 'tweakpane']
  }
});
