import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5190,
    strictPort: true,
    open: true,
    hmr: {
      port: 5191
    }
  },
  build: {
    target: 'es2020'
  }
});
