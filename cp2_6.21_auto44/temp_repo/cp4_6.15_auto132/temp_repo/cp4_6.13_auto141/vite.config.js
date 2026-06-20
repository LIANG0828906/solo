import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    host: true,
    open: false
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      external: ['three', 'three/addons/']
    }
  },
  optimizeDeps: {
    exclude: ['three', 'three/addons/']
  }
});
