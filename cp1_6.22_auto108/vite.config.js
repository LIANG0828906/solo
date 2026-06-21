import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    include: [
      'monaco-editor/esm/vs/editor/editor.main',
      'monaco-editor/esm/vs/basic-languages/javascript/javascript',
      'monaco-editor/esm/vs/basic-languages/typescript/typescript',
      'monaco-editor/esm/vs/basic-languages/css/css',
      'monaco-editor/esm/vs/basic-languages/html/html',
    ],
  },
  worker: {
    format: 'es',
  },
})
