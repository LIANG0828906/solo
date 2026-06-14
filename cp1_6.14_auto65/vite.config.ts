import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths"
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge'

export default defineConfig({
  build: {
    sourcemap: 'hidden',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'three-vendor': ['three'],
          'r3f-vendor': ['@react-three/fiber', '@react-three/drei', '@react-three/cannon'],
        }
      }
    }
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }),
    tsconfigPaths()
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    include: [
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      '@react-three/cannon',
      'cannon-es',
      'uuid'
    ],
    esbuildOptions: {
      target: 'es2020',
    }
  },
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: false,
    }
  }
})
