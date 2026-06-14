import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const DEFAULT_PORT = 5180;

export default defineConfig({
  plugins: [react()],
  server: {
    port: DEFAULT_PORT,
    strictPort: false,
    host: true,
    open: false,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
});
