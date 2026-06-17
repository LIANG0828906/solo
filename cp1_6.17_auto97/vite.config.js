import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    target: 'es2020',
    modulePreload: false,
    rollupOptions: {
      output: {
        format: 'es'
      }
    }
  },
  server: {
    port: 5173,
    open: false
  }
});
