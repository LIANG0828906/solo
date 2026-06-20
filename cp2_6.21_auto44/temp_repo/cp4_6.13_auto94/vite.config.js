import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'three': path.resolve(__dirname, 'node_modules/three/build/three.module.js'),
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5188,
    host: '0.0.0.0'
  }
})
