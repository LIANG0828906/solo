import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;
const BOARD_OP_LIMIT_BYTES = 256;

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const boards = new Map();
const clientSessions = new Map();

function getBoard(boardId) {
  if (!boards.has(boardId)) {
    boards.set(boardId, {
      id: boardId,
      elements: [],
      snapshots: [],
      clients: new Set(),
      opLog: [],
    });
  }
  return boards.get(boardId);
}

app.get('/api/snapshots', (req, res) => {
  const boardId = req.query.boardId || 'default';
  const board = getBoard(boardId);
  res.json({ snapshots: board.snapshots.slice(-100) });
});

app.post('/api/snapshots', (req, res) => {
  const { boardId, snapshot } = req.body;
  if (!boardId || !snapshot) {
    return res.status(400).json({ error: 'missing fields' });
  }
  const board = getBoard(boardId);
  board.snapshots.push(snapshot);
  if (board.snapshots.length > 500) {
    board.snapshots = board.snapshots.slice(-500);
  }
  res.json({ ok: true });
});

app.get('/api/share', (req, res) => {
  const { boardId, role } = req.query;
  const bid = boardId || 'default';
  const r = role === 'viewer' ? 'viewer' : 'editor';
  const token = uuidv4();
  clientSessions.set(token, { boardId: bid, role: r, createdAt: Date.now() });
  const base = `${req.protocol}://${req.get('host')}`;
  res.json({
    url: `${base}/?board=${encodeURIComponent(bid)}&role=${r}&token=${token}`,
    token,
    boardId: bid,
    role: r,
  });
});

app.get('/api/board-state', (req, res) => {
  const boardId = req.query.boardId || 'default';
  const board = getBoard(boardId);
  res.json({
    boardId,
    elements: board.elements,
    clientCount: board.clients.size,
  });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(board, payload, excludeClientId) {
  const data = JSON.stringify(payload);
  board.clients.forEach((client) => {
    if (client.id === excludeClientId) return;
    if (client.ws && client.ws.readyState === 1) {
      try {
        client.ws.send(data);
      } catch (e) {}
    }
  });
}

function applyOpToBoard(board, op) {
  switch (op.type) {
    case 'add':
      if (op.element && !board.elements.find((e) => e.id === op.elementId)) {
        board.elements.push(op.element);
      }
      break;
    case 'remove': {
      const idx = board.elements.findIndex((e) => e.id === op.elementId);
      if (idx >= 0) {
        const el = board.elements[idx];
        board.elements.splice(idx, 1);
        if (el.type === 'sticky') {
          for (let i = board.elements.length - 1; i >= 0; i--) {
            const e = board.elements[i];
            if (e.type === 'line' && (e.fromStickyId === op.elementId || e.toStickyId === op.elementId)) {
              board.elements.splice(i, 1);
            }
          }
        }
      }
      break;
    }
    case 'update':
    case 'move': {
      const el = board.elements.find((e) => e.id === op.elementId);
      if (el && op.delta) {
        Object.assign(el, op.delta);
      }
      break;
    }
  }
  board.opLog.push({ ...op, serverTime: Date.now() });
  if (board.opLog.length > 5000) board.opLog = board.opLog.slice(-5000);
}

wss.on('connection', (ws, req) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const boardId = url.searchParams.get('boardId') || 'default';
    const sessionId = url.searchParams.get('sessionId') || uuidv4();
    const role = url.searchParams.get('role') === 'viewer' ? 'viewer' : 'editor';

    const client = {
      id: sessionId,
      role,
      ws,
      joinedAt: Date.now(),
      boardId,
    };

    const board = getBoard(boardId);
    board.clients.add(client);

    console.log(`[WS] ${client.id} (${role}) joined board ${boardId}, total=${board.clients.size}`);

    try {
      ws.send(JSON.stringify({
        type: 'welcome',
        boardId,
        role,
        clientId: sessionId,
        elements: board.elements,
        clientCount: board.clients.size,
        serverTime: Date.now(),
      }));
    } catch (e) {}

    broadcast(board, {
      type: 'presence',
      action: 'join',
      clientId: sessionId,
      role,
      clientCount: board.clients.size,
    }, client.id);

    ws.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch (e) {
        return;
      }
      if (msg.type === 'ping') {
        try { ws.send(JSON.stringify({ type: 'pong', serverTime: Date.now() })); } catch (e) {}
        return;
      }
      if (msg.type === 'op') {
        if (client.role !== 'editor') return;
        const op = msg.op;
        if (!op || !op.type || !op.elementId) return;
        const opSize = JSON.stringify(op).length;
        if (opSize > BOARD_OP_LIMIT_BYTES * 4) {
          console.warn(`[WS] large op size=${opSize} from ${client.id}`);
        }
        applyOpToBoard(board, op);
        broadcast(board, { type: 'op', op }, client.id);
      } else if (msg.type === 'sync-elements') {
        if (client.role !== 'editor') return;
        if (Array.isArray(msg.elements)) {
          board.elements = msg.elements;
          broadcast(board, { type: 'sync', elements: board.elements }, client.id);
        }
      }
    });

    ws.on('close', () => {
      board.clients.delete(client);
      console.log(`[WS] ${client.id} left board ${boardId}, total=${board.clients.size}`);
      broadcast(board, {
        type: 'presence',
        action: 'leave',
        clientId: sessionId,
        clientCount: board.clients.size,
      }, client.id);
    });

    ws.on('error', () => {
      try { ws.close(); } catch (e) {}
    });
  } catch (e) {
    console.error('[WS] connection handler error', e);
    try { ws.close(); } catch (_) {}
  }
});

setInterval(() => {
  const now = Date.now();
  clientSessions.forEach((value, key) => {
    if (now - value.createdAt > 24 * 60 * 60 * 1000) {
      clientSessions.delete(key);
    }
  });
}, 60 * 60 * 1000);

server.listen(PORT, () => {
  console.log(`[灵感织网 Server] 运行在 http://localhost:${PORT}`);
  console.log(`  - REST API:  http://localhost:${PORT}/api/*`);
  console.log(`  - WebSocket: ws://localhost:${PORT}/ws`);
});
