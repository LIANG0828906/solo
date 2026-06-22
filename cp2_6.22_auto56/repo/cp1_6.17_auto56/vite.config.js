import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      three: resolve(__dirname, 'node_modules/three'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
