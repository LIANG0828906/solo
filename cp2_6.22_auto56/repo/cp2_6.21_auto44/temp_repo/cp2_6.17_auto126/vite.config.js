import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    host: true,
    port: 5180,
    open: false
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: ['three', 'three/addons/controls/OrbitControls.js']
    }
  },
  optimizeDeps: {
    exclude: ['three', 'three/addons/controls/OrbitControls.js']
  }
});
