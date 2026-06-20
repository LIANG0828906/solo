import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    open: false
  },
  build: {
    target: 'es2020',
    outDir: 'dist'
  }
})
