import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  server: {
    port: 5173,
    open: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/frontend')
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          projects: ['./src/frontend/components/ProjectList'],
          wood: ['./src/frontend/components/WoodInventory'],
          tools: ['./src/frontend/components/ToolMaintenance']
        }
      }
    }
  }
});
