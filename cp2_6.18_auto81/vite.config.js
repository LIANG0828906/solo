import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5181,
    host: true,
    open: false
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    minify: 'esbuild'
  }
});
