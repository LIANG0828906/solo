import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          zustand: ['zustand'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['three', 'zustand', 'uuid'],
  },
});
