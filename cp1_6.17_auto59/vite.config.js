import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      three: 'three',
      'dat.gui': 'dat.gui'
    }
  },
  server: {
    port: 5173,
    host: true
  },
  build: {
    target: 'es2020',
    sourcemap: true
  },
  worker: {
    format: 'es'
  }
});
