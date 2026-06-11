import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: '/',
  server: {
    port: 3001,
    host: true,
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
