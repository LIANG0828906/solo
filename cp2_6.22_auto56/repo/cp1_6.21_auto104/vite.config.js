import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 5180,
    open: true,
    host: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
