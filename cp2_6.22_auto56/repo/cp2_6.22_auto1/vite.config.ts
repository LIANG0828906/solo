import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';

function yWebsocketServer(): Plugin {
  let serverProcess: ChildProcess | null = null;

  return {
    name: 'y-websocket-server',
    configureServer() {
      if (serverProcess) return;

      const serverBin = path.resolve(
        process.cwd(),
        'node_modules',
        'y-websocket',
        'bin',
        'server.cjs'
      );

      const env = {
        ...process.env,
        PORT: '1234',
        YPERSISTENCE: '',
      };

      serverProcess = spawn('node', [serverBin], {
        env,
        stdio: 'inherit',
      });

      serverProcess.on('error', (err) => {
        console.error('[y-websocket] Failed to start:', err);
      });

      serverProcess.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          console.warn(`[y-websocket] Exited with code ${code}`);
        }
        serverProcess = null;
      });

      console.log('[y-websocket] Server started on ws://localhost:1234');
    },
    closeBundle() {
      if (serverProcess) {
        serverProcess.kill('SIGTERM');
        serverProcess = null;
      }
    },
  };
}

export default defineConfig({
  build: {
    sourcemap: 'hidden',
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
    tsconfigPaths(),
    yWebsocketServer(),
  ],
  server: {
    port: 5173,
  },
})
