import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  server: {
    port: 3000,
    open: true
  }
});
