import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      three: 'three',
      d3: 'd3',
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'es2020',
  },
});
