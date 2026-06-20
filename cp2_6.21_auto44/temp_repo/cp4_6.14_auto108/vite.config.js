import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const DEFAULT_PORT = 3001;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.API_PORT || DEFAULT_PORT}`,
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error, retrying...');
          });
        },
      },
    },
  },
});
