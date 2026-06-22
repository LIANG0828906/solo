import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import traeBadge from 'vite-plugin-trae-solo-badge';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-dev-locator', { disableProps: true }],
        ],
      },
    }),
    tsconfigPaths(),
    traeBadge(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5188,
    strictPort: true,
    open: false,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          vendor: ['react', 'react-dom', 'uuid'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['three', 'three/examples/jsm/controls/OrbitControls.js'],
  },
});
