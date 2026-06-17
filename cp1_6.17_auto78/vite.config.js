import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'three': path.resolve(__dirname, 'node_modules/three'),
      '@tweenjs/tween.js': path.resolve(__dirname, 'node_modules/@tweenjs/tween.js')
    }
  },
  server: {
    port: 8080,
    host: true
  }
});
