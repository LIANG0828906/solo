import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  optimizeDeps: {
    include: ['pdfjs-dist', 'epubjs']
  },
  server: {
    port: 5173,
    open: true
  }
});
