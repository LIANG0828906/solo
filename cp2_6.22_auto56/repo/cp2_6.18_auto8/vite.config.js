import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 8888,
    strictPort: true
  },
  cacheDir: '.vite-flowscape-cache'
});
