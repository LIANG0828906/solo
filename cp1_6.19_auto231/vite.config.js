import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    target: 'es2020',
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
  server: {
    port: 5173,
    open: true,
  },
});
