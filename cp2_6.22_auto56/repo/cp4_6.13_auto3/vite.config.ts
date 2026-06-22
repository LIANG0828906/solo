import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths()
  ],
  assetsInclude: ['**/*.svg', '**/*.woff2', '**/*.woff', '**/*.ttf'],
  worker: {
    format: 'es'
  }
})
