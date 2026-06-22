import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import http from 'http';
import { SensorSimulator, SensorSnapshot } from './sensorSimulator.js';
import { createDataRoutes } from './dataRoutes.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const simulator = new SensorSimulator();
const dataRoutes = createDataRoutes(simulator);

app.use('/api', dataRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  clients.add(ws);
  
  ws.send(JSON.stringify({
    type: 'init',
    snapshot: simulator.getLatestSnapshot(),
    history: simulator.getHistoryLastSeconds(30)
  }));
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

simulator.on('data', (snapshot: SensorSnapshot) => {
  const message = JSON.stringify({
    type: 'snapshot',
    snapshot
  });
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

simulator.start();

server.listen(PORT, () => {
  console.log(`Sensor simulation server running on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
});
