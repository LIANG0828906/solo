import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    },
    cssCodeSplit: false
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
