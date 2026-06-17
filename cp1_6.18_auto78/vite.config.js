import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@network': path.resolve(__dirname, './src/network'),
      '@engine': path.resolve(__dirname, './src/engine'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@data': path.resolve(__dirname, './src/data'),
      '@scheduler': path.resolve(__dirname, './src/scheduler'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  build: {
    sourcemap: false,
    target: 'ES2020',
  },
  server: {
    port: 5173,
  },
})
