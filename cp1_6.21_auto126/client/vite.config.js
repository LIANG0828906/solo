import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    react(),
    tsconfigPaths()
  ],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3002',
        ws: true
      }
    }
  }
})
