import { createServer } from 'vite';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const HEARTBEAT_INTERVAL = 30000;
const MAX_HISTORY = 10;

const boardState = {
  paths: [],
  notes: [],
};

const clients = new Map();
const undoStack = new Map();
const redoStack = new Map();
const userNicknames = new Map();

function generateNickname() {
  const animals = ['熊猫', '狐狸', '鲸鱼', '企鹅', '松鼠', '考拉', '海豚', '麋鹿', '水獭', '刺猬', '树懒', '猫头鹰'];
  const adjectives = ['匿名', '神秘', '快乐', '温柔', '勇敢', '机灵', '悠闲', '闪亮', '甜蜜', '酷酷'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adj}${animal}`;
}

function broadcast(message, excludeId = null) {
  const data = JSON.stringify(message);
  for (const [id, ws] of clients) {
    if (id === excludeId) continue;
    if (ws.readyState === 1) ws.send(data);
  }
}

function saveToHistory(userId, actionItem) {
  if (!undoStack.has(userId)) undoStack.set(userId, []);
  const stack = undoStack.get(userId);
  stack.push(actionItem);
  if (stack.length > MAX_HISTORY) stack.shift();
  redoStack.set(userId, []);
}

wss.on('connection', (ws) => {
  const userId = uuidv4();
  const nickname = generateNickname();
  clients.set(userId, ws);
  userNicknames.set(userId, nickname);
  undoStack.set(userId, []);
  redoStack.set(userId, []);

  ws.send(
    JSON.stringify({
      type: 'init',
      state: { ...boardState },
      yourId: userId,
      nickname,
      timestamp: Date.now(),
    }),
  );

  broadcast(
    { type: 'user-join', userId, nickname, userCount: clients.size },
    userId,
  );

  ws.send(
    JSON.stringify({
      type: 'user-join',
      userId,
      nickname,
      userCount: clients.size,
      self: true,
    }),
  );

  let alive = true;
  ws.isAlive = true;
  ws.userId = userId;

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      switch (msg.type) {
        case 'heartbeat':
          ws.isAlive = true;
          ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
          break;

        case 'draw-start': {
          const path = {
            ...msg.path,
            userId,
            id: msg.path.id || uuidv4(),
            createdAt: msg.path.createdAt || Date.now(),
          };
          boardState.paths.push(path);
          saveToHistory(userId, path);
          broadcast({ type: 'draw-start', path, userId }, userId);
          break;
        }

        case 'draw-point': {
          const targetPath = boardState.paths.find((p) => p.id === msg.pathId);
          if (targetPath) {
            targetPath.points.push(msg.point);
            broadcast(
              { type: 'draw-point', pathId: msg.pathId, point: msg.point, userId },
              userId,
            );
          }
          break;
        }

        case 'draw-end': {
          broadcast({ type: 'draw-end', pathId: msg.pathId, userId }, userId);
          break;
        }

        case 'note-add': {
          const note = {
            ...msg.note,
            userId,
            id: msg.note.id || uuidv4(),
            createdAt: msg.note.createdAt || Date.now(),
          };
          boardState.notes.push(note);
          saveToHistory(userId, note);
          broadcast({ type: 'note-add', note, userId }, userId);
          break;
        }

        case 'note-update': {
          const noteIdx = boardState.notes.findIndex((n) => n.id === msg.note.id);
          if (noteIdx !== -1) {
            boardState.notes[noteIdx] = { ...boardState.notes[noteIdx], ...msg.note };
            broadcast(
              { type: 'note-update', note: boardState.notes[noteIdx], userId },
              userId,
            );
          }
          break;
        }

        case 'undo': {
          const stack = undoStack.get(userId) || [];
          const action = stack.pop();
          if (action) {
            const redo = redoStack.get(userId) || [];
            redo.push(action);
            redoStack.set(userId, redo);

            if (action.type === 'path') {
              boardState.paths = boardState.paths.filter((p) => p.id !== action.id);
            } else if (action.type === 'note') {
              boardState.notes = boardState.notes.filter((n) => n.id !== action.id);
            }

            broadcast(
              { type: 'undo', userId, actionId: action.id, actionType: action.type },
              null,
            );
          }
          break;
        }

        case 'redo': {
          const redo = redoStack.get(userId) || [];
          const action = redo.pop();
          if (action) {
            const stack = undoStack.get(userId) || [];
            stack.push(action);
            undoStack.set(userId, stack);

            if (action.type === 'path') {
              boardState.paths.push(action);
            } else if (action.type === 'note') {
              boardState.notes.push(action);
            }

            broadcast(
              { type: 'redo', userId, actionId: action.id, actionType: action.type, action },
              null,
            );
          }
          break;
        }

        case 'clear': {
          boardState.paths = [];
          boardState.notes = [];
          undoStack.set(userId, []);
          redoStack.set(userId, []);
          broadcast({ type: 'clear', userId }, null);
          break;
        }
      }
    } catch (e) {
      console.error('WS message error:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(userId);
    userNicknames.delete(userId);
    broadcast(
      { type: 'user-leave', userId, nickname, userCount: clients.size },
      null,
    );
  });

  ws.on('error', (err) => {
    console.error(`WS error for user ${userId}:`, err);
  });
});

setInterval(() => {
  for (const [userId, ws] of clients) {
    if (ws.isAlive === false) {
      clients.delete(userId);
      userNicknames.delete(userId);
      broadcast(
        { type: 'user-leave', userId, nickname: userNicknames.get(userId) || '未知用户', userCount: clients.size },
        null,
      );
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
  }
}, HEARTBEAT_INTERVAL);

async function start() {
  const vite = await createServer({
    root: __dirname,
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      users: clients.size,
      paths: boardState.paths.length,
      notes: boardState.notes.length,
    });
  });

  const PORT = process.env.PORT || 5173;
  server.listen(PORT, () => {
    console.log(`\n  🎨 协作白板服务已启动  `);
    console.log(`  ➜  本地地址:   http://localhost:${PORT}`);
    console.log(`  ➜  健康检查:   http://localhost:${PORT}/api/health`);
    console.log(`  ➜  在线用户:   ${clients.size}\n`);
  });
}

start().catch(console.error);
