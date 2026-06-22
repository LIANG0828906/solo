import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

const PORT = 3003;
const DATA_DIR = path.join(__dirname, '..', 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface Point {
  x: number;
  y: number;
  timestamp: number;
}

interface DrawAction {
  id: string;
  sessionId: string;
  userId: string;
  color: string;
  thickness: number;
  mode: 'brush' | 'eraser';
  points: Point[];
  startTime: number;
  endTime: number;
}

interface Session {
  id: string;
  name: string;
  createdAt: number;
  actions: DrawAction[];
}

interface CursorInfo {
  userId: string;
  color: string;
  x: number;
  y: number;
}

let sessions: Record<string, Session> = {};

const loadSessions = () => {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      sessions = JSON.parse(data);
    }
  } catch (e) {
    console.error('加载会话数据失败:', e);
    sessions = {};
  }
};

const saveSessions = () => {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  } catch (e) {
    console.error('保存会话数据失败:', e);
  }
};

loadSessions();

if (Object.keys(sessions).length === 0) {
  const defaultSession: Session = {
    id: uuidv4(),
    name: '默认画布 ' + new Date().toLocaleDateString('zh-CN'),
    createdAt: Date.now(),
    actions: [],
  };
  sessions[defaultSession.id] = defaultSession;
  saveSessions();
}

let activeCursors: Record<string, CursorInfo> = {};

const generateRandomColor = (): string => {
  const colors = ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#009688', '#4CAF50', '#FF9800', '#795548'];
  return colors[Math.floor(Math.random() * colors.length)];
};

io.on('connection', (socket: Socket) => {
  const userId = socket.id;
  const userColor = generateRandomColor();

  console.log(`用户连接: ${userId}, 颜色: ${userColor}`);

  socket.emit('user-connected', { userId, color: userColor });
  socket.emit('sessions-list', Object.values(sessions).map(s => ({
    id: s.id,
    name: s.name,
    createdAt: s.createdAt,
    actionCount: s.actions.length,
  })));

  socket.on('join-session', (sessionId: string) => {
    socket.join(sessionId);
    socket.data.currentSession = sessionId;

    const session = sessions[sessionId];
    if (session) {
      socket.emit('session-data', {
        id: session.id,
        name: session.name,
        createdAt: session.createdAt,
        actions: session.actions,
      });
    }

    const cursorsInRoom = Object.values(activeCursors).filter(c => {
      const socketInstance = io.sockets.sockets.get(c.userId);
      return socketInstance?.data.currentSession === sessionId && c.userId !== userId;
    });
    socket.emit('cursors-update', cursorsInRoom);
  });

  socket.on('cursor-move', (data: { x: number; y: number }) => {
    const cursorInfo: CursorInfo = {
      userId,
      color: userColor,
      x: data.x,
      y: data.y,
    };
    activeCursors[userId] = cursorInfo;

    const sessionId = socket.data.currentSession;
    if (sessionId) {
      socket.to(sessionId).emit('cursor-move', cursorInfo);
    }
  });

  socket.on('draw-start', (action: Omit<DrawAction, 'id' | 'userId' | 'points' | 'startTime' | 'endTime'> & { point: Point }) => {
    const sessionId = socket.data.currentSession;
    if (!sessionId || !sessions[sessionId]) return;

    const drawAction: DrawAction = {
      id: uuidv4(),
      sessionId,
      userId,
      color: action.color,
      thickness: action.thickness,
      mode: action.mode,
      points: [action.point],
      startTime: action.point.timestamp,
      endTime: action.point.timestamp,
    };

    socket.data.currentAction = drawAction;

    socket.to(sessionId).emit('draw-start', {
      ...drawAction,
      userId,
    });
  });

  socket.on('draw-continue', (point: Point) => {
    const sessionId = socket.data.currentSession;
    if (!sessionId || !sessions[sessionId]) return;

    const currentAction: DrawAction | undefined = socket.data.currentAction;
    if (currentAction) {
      currentAction.points.push(point);
      currentAction.endTime = point.timestamp;

      socket.to(sessionId).emit('draw-continue', {
        actionId: currentAction.id,
        point,
        userId,
      });
    }
  });

  socket.on('draw-end', (point: Point) => {
    const sessionId = socket.data.currentSession;
    if (!sessionId || !sessions[sessionId]) return;

    const currentAction: DrawAction | undefined = socket.data.currentAction;
    if (currentAction) {
      currentAction.points.push(point);
      currentAction.endTime = point.timestamp;

      sessions[sessionId].actions.push(currentAction);
      saveSessions();

      socket.to(sessionId).emit('draw-end', {
        actionId: currentAction.id,
        point,
        userId,
      });

      io.to(sessionId).emit('session-updated', {
        id: sessionId,
        actionCount: sessions[sessionId].actions.length,
      });

      socket.data.currentAction = null;
    }
  });

  socket.on('clear-canvas', (sessionId: string) => {
    if (sessions[sessionId]) {
      sessions[sessionId].actions = [];
      saveSessions();
      io.to(sessionId).emit('canvas-cleared', sessionId);
      io.to(sessionId).emit('session-updated', {
        id: sessionId,
        actionCount: 0,
      });
    }
  });

  socket.on('create-session', (name: string) => {
    const newSession: Session = {
      id: uuidv4(),
      name: name || `画布 ${new Date().toLocaleString('zh-CN')}`,
      createdAt: Date.now(),
      actions: [],
    };
    sessions[newSession.id] = newSession;
    saveSessions();

    io.emit('sessions-list', Object.values(sessions).map(s => ({
      id: s.id,
      name: s.name,
      createdAt: s.createdAt,
      actionCount: s.actions.length,
    })));

    socket.emit('session-created', newSession.id);
  });

  socket.on('disconnect', () => {
    console.log(`用户断开: ${userId}`);
    delete activeCursors[userId];

    const sessionId = socket.data.currentSession;
    if (sessionId) {
      socket.to(sessionId).emit('cursor-disconnected', userId);
    }
  });
});

app.get('/api/sessions', (req, res) => {
  const list = Object.values(sessions).map(s => ({
    id: s.id,
    name: s.name,
    createdAt: s.createdAt,
    actionCount: s.actions.length,
  }));
  res.json(list);
});

app.get('/api/sessions/:id', (req, res) => {
  const session = sessions[req.params.id];
  if (!session) {
    return res.status(404).json({ error: '会话不存在' });
  }
  res.json(session);
});

app.post('/api/sessions', (req, res) => {
  const { name } = req.body;
  const newSession: Session = {
    id: uuidv4(),
    name: name || `画布 ${new Date().toLocaleString('zh-CN')}`,
    createdAt: Date.now(),
    actions: [],
  };
  sessions[newSession.id] = newSession;
  saveSessions();
  res.status(201).json(newSession);
});

httpServer.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});
