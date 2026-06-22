import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

function copyIndexHtmlPlugin() {
  return {
    name: 'copy-index-html',
    writeBundle() {
      const src = path.resolve(__dirname, 'index.html');
      const dest = path.resolve(__dirname, 'dist', 'index.html');
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log('Copied index.html to dist/');
      }
    },
  };
}

export default defineConfig({
  root: './',
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
  build: {
    outDir: './dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: './src/main.ts',
      },
      output: {
        entryFileNames: 'bundle.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    plugins: [copyIndexHtmlPlugin()],
  },
  plugins: [copyIndexHtmlPlugin()],
});
