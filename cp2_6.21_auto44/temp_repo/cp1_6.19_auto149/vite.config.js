import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: './',
  base: './',
  server: {
    port: 5173,
    open: true,
    host: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020'
  }
});
