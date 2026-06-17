import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5180,
    host: true,
    strictPort: true,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
});
