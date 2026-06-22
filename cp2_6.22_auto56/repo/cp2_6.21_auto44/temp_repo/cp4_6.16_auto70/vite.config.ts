import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import soloBadge from 'vite-plugin-trae-solo-badge'

export default defineConfig({
  plugins: [react(), tsconfigPaths(), soloBadge()],
  server: {
    port: 5173,
  },
})
