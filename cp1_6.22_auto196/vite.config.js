import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      css: {
        additionalData: `
          :root {
            --bg-primary: #1A1B2E;
            --bg-panel: #25273D;
            --border-color: #3C3F5E;
            --text-primary: #E2E8F0;
            --text-secondary: #94A3B8;
            --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
        `,
      },
    },
  },
})
