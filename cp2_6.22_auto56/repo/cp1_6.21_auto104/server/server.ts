/**
 * 后端服务模块
 * 职责：启动Express服务，提供REST API和WebSocket服务
 * 将传感器数据推送给所有连接客户端
 * 数据流向：sensorSimulator → server.ts → WebSocket/REST API → 前端
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import sensorSimulator, { FullSnapshot, SensorData } from './sensorSimulator.js';

const PORT = 3000;
const WS_RECONNECT_INTERVAL = 3000;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/sensors', (_req, res) => {
  const snapshot = sensorSimulator.getFullSnapshot();
  res.json({
    success: true,
    data: snapshot,
    serverTime: Date.now()
  });
});

app.get('/api/sensors/:roomId', (req, res) => {
  const roomId = parseInt(req.params.roomId, 10);
  const values = sensorSimulator.getRoomValues(roomId);

  if (!values) {
    res.status(404).json({ success: false, error: 'Room not found' });
    return;
  }

  const roomNameMap: Record<number, string> = {
    1: '客厅', 2: '厨房', 3: '卧室', 4: '书房'
  };

  res.json({
    success: true,
    data: {
      roomId,
      roomName: roomNameMap[roomId],
      ...values,
      timestamp: Date.now()
    }
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

interface WSClient {
  id: string;
  lastPing: number;
}

const clients = new Map<string, { ws: any; client: WSClient }>();

function broadcastSnapshot(snapshot: FullSnapshot) {
  const payload = JSON.stringify({
    type: 'snapshot',
    ...snapshot
  });

  clients.forEach(({ ws }) => {
    if (ws.readyState === 1) {
      ws.send(payload);
    }
  });
}

function broadcastUpdates(updates: SensorData[]) {
  const payload = JSON.stringify({
    type: 'updates',
    updates,
    timestamp: Date.now()
  });

  clients.forEach(({ ws }) => {
    if (ws.readyState === 1) {
      ws.send(payload);
    }
  });
}

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  const client: WSClient = {
    id: clientId,
    lastPing: Date.now()
  };

  clients.set(clientId, { ws, client });
  console.log(`[WS] 客户端连接: ${clientId}，当前连接数: ${clients.size}`);

  ws.send(JSON.stringify({
    type: 'welcome',
    clientId,
    reconnectInterval: WS_RECONNECT_INTERVAL,
    serverTime: Date.now()
  }));

  const initialSnapshot = sensorSimulator.getFullSnapshot();
  ws.send(JSON.stringify({
    type: 'snapshot',
    ...initialSnapshot
  }));

  ws.on('message', (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString());
      client.lastPing = Date.now();

      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', serverTime: Date.now() }));
      } else if (data.type === 'requestSnapshot') {
        const snap = sensorSimulator.getFullSnapshot();
        ws.send(JSON.stringify({ type: 'snapshot', ...snap }));
      }
    } catch (err) {
      console.error('[WS] 消息解析错误:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`[WS] 客户端断开: ${clientId}，当前连接数: ${clients.size}`);
  });

  ws.on('error', (err) => {
    console.error(`[WS] 客户端错误 ${clientId}:`, err);
    clients.delete(clientId);
  });
});

sensorSimulator.onUpdate(broadcastUpdates);
sensorSimulator.onSnapshot(broadcastSnapshot);
sensorSimulator.start(2000);

const heartbeatInterval = setInterval(() => {
  const now = Date.now();
  clients.forEach(({ ws, client }, id) => {
    if (now - client.lastPing > 30000) {
      console.log(`[WS] 心跳超时，断开: ${id}`);
      ws.terminate();
      clients.delete(id);
    } else if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'ping', serverTime: now }));
    }
  });
}, 10000);

server.on('close', () => {
  clearInterval(heartbeatInterval);
  sensorSimulator.stop();
  wss.close();
});

process.on('SIGINT', () => {
  console.log('\n[Server] 正在关闭...');
  server.close(() => {
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  智能家居 3D 热力图 - 后端服务`);
  console.log(`========================================`);
  console.log(`  REST API:    http://localhost:${PORT}/api/sensors`);
  console.log(`  WebSocket:   ws://localhost:${PORT}/ws`);
  console.log(`  健康检查:    http://localhost:${PORT}/api/health`);
  console.log(`  房间数:      4 (客厅/厨房/卧室/书房)`);
  console.log(`  更新间隔:    2000ms`);
  console.log(`========================================\n`);
});

export default server;
