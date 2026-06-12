import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = process.env.PORT || 8080;

const USER_COLORS = [
  '#00e676',
  '#ff5252',
  '#448aff',
  '#ffd740',
  '#e040fb',
  '#ff6e40',
  '#18ffff',
  '#ff80ab',
  '#b388ff',
  '#69f0ae',
  '#ffab40',
  '#40c4ff',
];

const NAMES_ADJ = ['快乐的', '聪明的', '勇敢的', '可爱的', '神秘的', '闪亮的', '温柔的'];
const NAMES_NOUN = ['小画家', '设计师', '艺术家', '创作者', '绘图员'];

const generateName = () =>
  NAMES_ADJ[Math.floor(Math.random() * NAMES_ADJ.length)] +
  NAMES_NOUN[Math.floor(Math.random() * NAMES_NOUN.length)];

let shapesHistory = [];
const undoStack = new Map();
const redoStack = new Map();

const clients = new Map();

const broadcast = (message, excludeId = null) => {
  const payload = JSON.stringify(message);
  for (const [id, client] of clients.entries()) {
    if (id !== excludeId && client.ws.readyState === 1) {
      try {
        client.ws.send(payload);
      } catch (e) {}
    }
  }
};

const broadcastOnlineUsers = () => {
  const users = [];
  for (const [id, c] of clients.entries()) {
    users.push({ id, color: c.color, name: c.name });
  }
  broadcast({ type: 'online-users', users });
};

const getOnlineUsersList = () => {
  const users = [];
  for (const [id, c] of clients.entries()) {
    users.push({ id, color: c.color, name: c.name });
  }
  return users;
};

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  const color = USER_COLORS[clients.size % USER_COLORS.length];
  const name = generateName();

  clients.set(clientId, {
    ws,
    color,
    name,
    lastActivity: Date.now(),
  });

  undoStack.set(clientId, []);
  redoStack.set(clientId, []);

  console.log(`[WS] Client connected: ${clientId} (${name})`);

  try {
    ws.send(
      JSON.stringify({
        type: 'init',
        userId: clientId,
        shapes: shapesHistory,
        onlineUsers: getOnlineUsersList(),
      }),
    );
  } catch (e) {}

  const joinMsg = { type: 'user-join', user: { id: clientId, color, name } };
  broadcast(joinMsg, clientId);

  if (clients.size > 1) {
    try {
      ws.send(JSON.stringify({ type: 'online-users', users: getOnlineUsersList() }));
    } catch (e) {}
  }
  broadcastOnlineUsers();

  ws.on('message', (rawData) => {
    const client = clients.get(clientId);
    if (!client) return;
    client.lastActivity = Date.now();

    let msg;
    try {
      msg = JSON.parse(rawData.toString());
    } catch (e) {
      return;
    }

    switch (msg.type) {
      case 'draw': {
        if (!msg.shape) return;
        const shape = { ...msg.shape };
        shapesHistory.push(shape);

        const uStack = undoStack.get(clientId);
        if (uStack) uStack.push(shape.id);
        redoStack.set(clientId, []);

        broadcast({ type: 'draw', shape }, clientId);
        break;
      }

      case 'undo': {
        const uStack = undoStack.get(clientId);
        const rStack = redoStack.get(clientId);
        if (!uStack || !rStack) break;
        if (uStack.length === 0) break;

        const lastId = uStack.pop();
        rStack.push(lastId);
        shapesHistory = shapesHistory.filter((s) => s.id !== lastId);

        for (const [otherId] of clients) {
          if (otherId === clientId) continue;
          const otherUndo = undoStack.get(otherId);
          const otherRedo = redoStack.get(otherId);
          if (otherUndo) {
            const idx = otherUndo.indexOf(lastId);
            if (idx >= 0) otherUndo.splice(idx, 1);
          }
        }

        broadcast({ type: 'undo', userId: clientId }, clientId);
        break;
      }

      case 'redo': {
        const uStack = undoStack.get(clientId);
        const rStack = redoStack.get(clientId);
        if (!uStack || !rStack) break;
        if (rStack.length === 0) break;

        const redoId = rStack.pop();
        uStack.push(redoId);
        broadcast({ type: 'redo', userId: clientId }, clientId);
        break;
      }

      case 'cursor': {
        broadcast(
          {
            type: 'cursor',
            userId: clientId,
            position: msg.position,
            color,
          },
          clientId,
        );
        break;
      }

      case 'request-history': {
        try {
          ws.send(
            JSON.stringify({
              type: 'init',
              userId: clientId,
              shapes: shapesHistory,
              onlineUsers: getOnlineUsersList(),
            }),
          );
        } catch (e) {}
        break;
      }
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Client disconnected: ${clientId} (${name})`);
    clients.delete(clientId);
    undoStack.delete(clientId);
    redoStack.delete(clientId);

    broadcast({ type: 'user-leave', userId: clientId });
    broadcastOnlineUsers();
  });

  ws.on('error', (err) => {
    console.error(`[WS] Error for client ${clientId}:`, err.message);
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    onlineUsers: clients.size,
    shapesCount: shapesHistory.length,
  });
});

server.listen(PORT, () => {
  console.log(`CollabrDraw server running on port ${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
