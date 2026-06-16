import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: true
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          xstate: ['xstate']
        }
      }
    }
  },
  esbuild: {
    target: 'es2020'
  }
});
