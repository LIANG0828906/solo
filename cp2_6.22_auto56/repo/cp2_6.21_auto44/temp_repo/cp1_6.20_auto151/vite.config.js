import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    assetsInlineLimit: 10 * 1024,
    sourcemap: false,
  },
})
