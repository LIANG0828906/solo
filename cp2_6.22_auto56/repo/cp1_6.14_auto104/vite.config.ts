import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  server: {
    port: 5173,
    host: true
  },
  build: {
    target: 'es2020',
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        manualChunks: {
          engine: ['./src/core/GameEngine', './src/core/AIStrategy'],
          motion: ['framer-motion']
        }
      }
    }
  },
  plugins: [react(), tsconfigPaths()]
})
