import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import net from 'net';

const DEFAULT_BACKEND_PORT = 3001;
const MAX_PORT_TRIES = 10;

async function findBackendPort(): Promise<number> {
  for (let offset = 0; offset < MAX_PORT_TRIES; offset++) {
    const port = DEFAULT_BACKEND_PORT + offset;
    const available = await new Promise<boolean>((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      server.listen(port, '127.0.0.1');
    });
    if (!available) {
      console.log(`[vite] Detected backend running on port ${port}`);
      return port;
    }
  }
  console.log(`[vite] No backend port detected, using default ${DEFAULT_BACKEND_PORT}`);
  return DEFAULT_BACKEND_PORT;
}

function dynamicBackendPort(): Plugin {
  return {
    name: 'dynamic-backend-port',
    async configureServer(server) {
      const backendPort = await findBackendPort();
      console.log(`[vite] Proxying /api -> http://localhost:${backendPort}`);
      console.log(`[vite] WebSocket ws -> ws://localhost:${backendPort}`);

      server.config.server.proxy = {
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
        '/ws': {
          target: `ws://localhost:${backendPort}`,
          ws: true,
          changeOrigin: true,
        },
      };
    },
  };
}

export default defineConfig({
  plugins: [react(), dynamicBackendPort()],
  server: {
    port: 5173,
    strictPort: false,
  },
});
