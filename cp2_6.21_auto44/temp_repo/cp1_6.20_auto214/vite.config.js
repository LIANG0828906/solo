import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': 'http://localhost:3002',
      '/ws': {
        target: 'ws://localhost:3002',
        ws: true
      }
    }
  }
})
