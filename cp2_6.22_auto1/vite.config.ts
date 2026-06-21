import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

function yWebsocketServer(): Plugin {
  return {
    name: 'y-websocket-server',
    configureServer() {
      import('ws').then(({ default: WebSocketServer }) => {
        import('y-websocket/bin/utils.js').then(({ setupWSConnection }) => {
          const wss = new WebSocketServer({ port: 1234 });
          const docs = new Map();
          wss.on('connection', (ws, req) => {
            const url = new URL(req.url || '', 'http://localhost');
            const room = url.searchParams.get('room') || 'default';
            console.log(`[y-websocket] Connection for room: ${room}`);
            if (!docs.has(room)) {
              const { Doc } = require('yjs');
              docs.set(room, new Doc());
            }
            setupWSConnection(ws, req, { doc: docs.get(room) });
          });
          console.log('[y-websocket] Server running on ws://localhost:1234');
        });
      });
    }
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
})
