import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 9876,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    minify: 'esbuild',
  },
})
