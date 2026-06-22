import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

export default defineConfig({
  plugins: [
    react(),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
