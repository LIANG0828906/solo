import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ColorModule': path.resolve(__dirname, './src/ColorModule'),
      '@UIModule': path.resolve(__dirname, './src/UIModule'),
    },
  },
  worker: {
    format: 'es',
  },
})
