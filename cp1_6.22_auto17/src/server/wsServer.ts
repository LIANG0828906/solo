import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
app.use(cors());

const server = createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });

interface SimulatedMetrics {
  cpu: number;
  memory: number;
  networkIn: number;
  networkOut: number;
  diskRead: number;
  diskWrite: number;
  timestamp: number;
}

let cpuBase = 35;
let memBase = 55;

function generateMetrics(): SimulatedMetrics {
  cpuBase += (Math.random() - 0.5) * 12;
  cpuBase = Math.max(5, Math.min(95, cpuBase));

  memBase += (Math.random() - 0.5) * 6;
  memBase = Math.max(20, Math.min(90, memBase));

  return {
    cpu: Math.round(cpuBase * 10) / 10,
    memory: Math.round(memBase * 10) / 10,
    networkIn: Math.round(Math.random() * 5000 * 10) / 10,
    networkOut: Math.round(Math.random() * 3000 * 10) / 10,
    diskRead: Math.round(Math.random() * 200 * 10) / 10,
    diskWrite: Math.round(Math.random() * 150 * 10) / 10,
    timestamp: Date.now(),
  };
}

wss.on('connection', (ws: WebSocket) => {
  console.log('[WS] Client connected');

  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      const msg = {
        type: 'metrics',
        data: generateMetrics(),
      };
      ws.send(JSON.stringify(msg));
    }
  }, 1000);

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: msg.timestamp }));
      }
    } catch {
      // ignore
    }
  });

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
    clearInterval(interval);
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`[Server] Express + WebSocket running on http://localhost:${PORT}`);
  console.log(`[WS] WebSocket endpoint: ws://localhost:${PORT}/ws`);
});
