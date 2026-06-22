import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = process.env.PORT || 8080;

const USER_COLORS = [
  '#00e676', '#ff5252', '#448aff', '#ffd740', '#e040fb', '#ff6e40',
  '#18ffff', '#ff80ab', '#b388ff', '#69f0ae', '#ffab40', '#40c4ff',
];

const NAMES_ADJ = ['快乐的', '聪明的', '勇敢的', '可爱的', '神秘的', '闪亮的', '温柔的'];
const NAMES_NOUN = ['小画家', '设计师', '艺术家', '创作者', '绘图员'];

const generateName = () =>
  NAMES_ADJ[Math.floor(Math.random() * NAMES_ADJ.length)] +
  NAMES_NOUN[Math.floor(Math.random() * NAMES_NOUN.length)];

let shapesHistory = [];
let globalVersion = 0;
const undoStacks = new Map();
const redoStacks = new Map();
const clients = new Map();
const shapesById = new Map();

const nextVersion = () => ++globalVersion;

const broadcast = (message, excludeId = null) => {
  const payload = JSON.stringify(message);
  const sentTo = [];
  for (const [id, client] of clients.entries()) {
    if (id !== excludeId && client.ws.readyState === 1) {
      try {
        client.ws.send(payload);
        sentTo.push(id);
      } catch (e) {}
    }
  }
  return sentTo;
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

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    onlineUsers: clients.size,
    shapesCount: shapesHistory.length,
    globalVersion,
  });
});

app.get('/api/shapes', (req, res) => {
  res.json({
    version: globalVersion,
    count: shapesHistory.length,
    shapes: shapesHistory,
  });
});

wss.on('connection', (ws, req) => {
  const clientId = uuidv4();
  const color = USER_COLORS[clients.size % USER_COLORS.length];
  const name = generateName();
  const userAgent = req.headers['user-agent'] || 'unknown';

  clients.set(clientId, {
    ws,
    color,
    name,
    lastActivity: Date.now(),
    lastKnownVersion: 0,
    userAgent,
  });

  undoStacks.set(clientId, []);
  redoStacks.set(clientId, []);

  console.log(`[WS+] Client connected: ${clientId.slice(0, 8)} (${name}) total=${clients.size}`);

  const initVersion = nextVersion();
  try {
    ws.send(
      JSON.stringify({
        type: 'init',
        userId: clientId,
        shapes: shapesHistory,
        onlineUsers: getOnlineUsersList(),
        version: initVersion,
      }),
    );
  } catch (e) {
    console.error('[WS] Failed to send init:', e);
  }

  const joinMsg = { type: 'user-join', user: { id: clientId, color, name } };
  broadcast(joinMsg, clientId);
  broadcastOnlineUsers();

  ws.on('message', (rawData) => {
    const client = clients.get(clientId);
    if (!client) return;
    client.lastActivity = Date.now();

    let msg;
    try {
      msg = JSON.parse(rawData.toString());
    } catch (e) {
      console.warn('[WS] Bad JSON from', clientId.slice(0, 8));
      return;
    }

    if (msg.lastKnownVersion !== undefined) {
      client.lastKnownVersion = msg.lastKnownVersion;
    }

    switch (msg.type) {
      case 'draw': {
        if (!msg.shape || typeof msg.shape !== 'object') return;

        if (msg.lastKnownVersion !== undefined && msg.lastKnownVersion < globalVersion - 1) {
          try {
            ws.send(
              JSON.stringify({
                type: 'sync-error',
                expectedVersion: globalVersion,
                actualVersion: msg.lastKnownVersion,
                message: 'Version mismatch, server state applied',
              }),
            );
            ws.send(
              JSON.stringify({
                type: 'init',
                userId: clientId,
                shapes: shapesHistory,
                onlineUsers: getOnlineUsersList(),
                version: globalVersion,
              }),
            );
          } catch (e) {}
          return;
        }

        const operationId = uuidv4();
        const newVersion = nextVersion();
        const shape = {
          ...msg.shape,
          version: newVersion,
          operationId,
          timestamp: Date.now(),
          userId: clientId,
        };

        shapesHistory.push(shape);
        shapesById.set(shape.id, shape);

        const uStack = undoStacks.get(clientId);
        if (uStack) {
          uStack.push({
            shapeId: shape.id,
            operationId,
            versionAt: newVersion,
          });
        }
        redoStacks.set(clientId, []);

        broadcast({ type: 'draw', shape, version: newVersion }, clientId);
        console.log(`[DRAW] ${clientId.slice(0, 8)} type=${shape.type} id=${shape.id.slice(0, 8)} v=${newVersion}`);
        break;
      }

      case 'undo': {
        const uStack = undoStacks.get(clientId);
        const rStack = redoStacks.get(clientId);
        if (!uStack || !rStack) break;
        if (uStack.length === 0) break;

        const op = uStack.pop();
        const shapeIdx = shapesHistory.findIndex((s) => s.id === op.shapeId);
        if (shapeIdx < 0) break;

        const [removedShape] = shapesHistory.splice(shapeIdx, 1);
        shapesById.delete(op.shapeId);
        rStack.push({ ...op, shape: removedShape });

        const newVersion = nextVersion();
        broadcast(
          {
            type: 'undo',
            userId: clientId,
            operationId: op.operationId,
            shapeId: op.shapeId,
            version: newVersion,
          },
          clientId,
        );
        console.log(`[UNDO] ${clientId.slice(0, 8)} shape=${op.shapeId.slice(0, 8)} v=${newVersion}`);
        break;
      }

      case 'redo': {
        const uStack = undoStacks.get(clientId);
        const rStack = redoStacks.get(clientId);
        if (!uStack || !rStack) break;
        if (rStack.length === 0) break;

        const op = rStack.pop();
        if (!op.shape) break;

        const newVersion = nextVersion();
        const restoredShape = { ...op.shape, version: newVersion };

        shapesHistory.push(restoredShape);
        shapesById.set(op.shapeId, restoredShape);
        uStack.push({
          shapeId: op.shapeId,
          operationId: op.operationId,
          versionAt: newVersion,
        });

        broadcast(
          {
            type: 'redo',
            userId: clientId,
            operationId: op.operationId,
            shapeId: op.shapeId,
            shape: restoredShape,
            version: newVersion,
          },
          clientId,
        );
        console.log(`[REDO] ${clientId.slice(0, 8)} shape=${op.shapeId.slice(0, 8)} v=${newVersion}`);
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
              version: globalVersion,
            }),
          );
        } catch (e) {}
        break;
      }

      default:
        console.warn(`[WS] Unknown message type from ${clientId.slice(0, 8)}: ${msg.type}`);
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`[WS-] Client disconnected: ${clientId.slice(0, 8)} (${name}) code=${code} total=${clients.size - 1}`);
    clients.delete(clientId);
    undoStacks.delete(clientId);
    redoStacks.delete(clientId);

    for (const cursorClient of clients.values()) {
      try {
        cursorClient.ws.send(JSON.stringify({ type: 'cursor', userId: clientId, position: null, color }));
      } catch (e) {}
    }

    broadcast({ type: 'user-leave', userId: clientId });
    broadcastOnlineUsers();
  });

  ws.on('error', (err) => {
    console.error(`[WS!] Error for client ${clientId.slice(0, 8)}:`, err.message);
  });
});

server.listen(PORT, () => {
  const now = new Date().toISOString();
  console.log('========================================');
  console.log('  CollabrDraw Server');
  console.log('========================================');
  console.log(`  Started:   ${now}`);
  console.log(`  Port:      ${PORT}`);
  console.log(`  WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`  Health:    http://localhost:${PORT}/api/health`);
  console.log('========================================');
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  wss.close(() => {
    server.close(() => process.exit(0));
  });
  setTimeout(() => process.exit(0), 3000);
});
