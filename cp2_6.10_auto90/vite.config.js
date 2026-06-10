import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.glsl', '**/*.hdr', '**/*.env'],
  server: {
    port: 3000,
    open: true
  }
})
