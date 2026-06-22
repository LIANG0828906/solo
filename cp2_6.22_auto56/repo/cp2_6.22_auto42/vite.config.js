import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    open: false,
    hmr: true,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    outDir: 'dist',
  },
});
