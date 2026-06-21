import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5200,
    open: true,
    strictPort: true
  }
});
