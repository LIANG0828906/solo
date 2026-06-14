import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getServerPort = () => {
  try {
    const portFile = path.resolve(__dirname, '.server-port');
    if (fs.existsSync(portFile)) {
      const port = parseInt(fs.readFileSync(portFile, 'utf-8').trim(), 10);
      if (!isNaN(port) && port > 0) {
        return port;
      }
    }
  } catch (e) {
    // ignore
  }
  return 3001;
};

export default defineConfig(() => {
  const apiPort = getServerPort();
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
