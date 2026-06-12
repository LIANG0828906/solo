import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    sourcemap: true,
    outDir: 'dist'
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    }
  },
  server: {
    port: 5173,
    open: false
  }
});
