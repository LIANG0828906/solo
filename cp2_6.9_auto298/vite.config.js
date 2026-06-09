import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `$primary: #5d4037; $secondary: #8d6e63; $accent: #d4a373;`
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
