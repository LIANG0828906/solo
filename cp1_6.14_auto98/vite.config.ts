import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import Inspector from 'unplugin-vue-dev-locator/vite'
import traeBadgePlugin from 'vite-plugin-trae-solo-badge'

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          tween: ['@tweenjs/tween.js'],
          d3: ['d3-scale'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['three', '@tweenjs/tween.js', 'd3-scale', 'dat.gui'],
  },
  plugins: [
    vue(),
    Inspector(),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#app',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5180,
    host: true,
  },
})
