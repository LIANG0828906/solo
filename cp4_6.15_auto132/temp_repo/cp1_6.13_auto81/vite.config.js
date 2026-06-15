import { defineConfig } from 'vite';

export default defineConfig({
  target: 'es2020',
  build: {
    target: 'es2020',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});