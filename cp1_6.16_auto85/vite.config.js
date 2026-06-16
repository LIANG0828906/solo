import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [glsl()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
});
