import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: '/',
  plugins: [
    viteStaticCopy({
      targets: []
    })
  ],
  server: {
    port: 5173,
    open: true
  }
});
