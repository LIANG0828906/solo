import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 25274,
    strictPort: false,
    open: false
  },
  preview: {
    port: 25274,
    strictPort: false
  }
});
