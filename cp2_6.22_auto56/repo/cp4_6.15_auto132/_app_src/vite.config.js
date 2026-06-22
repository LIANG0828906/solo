import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.',
  server: {
    port: 5180,
    host: true,
    fs: {
      allow: ['.']
    },
    watch: {
      ignored: ['**/temp_repo/**', '**/_temp_archive/**', '**/node_modules/**']
    }
  },
  optimizeDeps: {
    exclude: []
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/temp_repo/**', '**/_temp_archive/**', '**/dist/**']
  }
})
