import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5180,
    open: false,
    host: true,
    strictPort: true
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  }
});
