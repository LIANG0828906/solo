import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const onlineUsers = new Map();
let latestNodes = null;

io.on('connection', (socket) => {
  const userId = socket.id;
  const userInfo = {
    id: userId,
    connectedAt: Date.now(),
  };
  onlineUsers.set(userId, userInfo);
  console.log(`[WebSocket] 用户连接: ${userId}, 当前在线: ${onlineUsers.size}`);

  if (latestNodes) {
    socket.emit('init-state', { nodes: latestNodes });
  }

  socket.on('addNode', (data) => {
    io.emit('addNode', data);
  });

  socket.on('removeNode', (data) => {
    io.emit('removeNode', data);
  });

  socket.on('moveNode', (data) => {
    socket.broadcast.emit('moveNode', data);
    if (data.nodes) {
      latestNodes = data.nodes;
    }
  });

  socket.on('editNode', (data) => {
    io.emit('editNode', data);
    if (data.nodes) {
      latestNodes = data.nodes;
    }
  });

  socket.on('changeColor', (data) => {
    io.emit('changeColor', data);
  });

  socket.on('setNote', (data) => {
    io.emit('setNote', data);
  });

  socket.on('saveSnapshot', (data) => {
    io.emit('saveSnapshot', data);
    if (data.nodes) {
      latestNodes = data.nodes;
    }
  });

  socket.on('restore', (data) => {
    io.emit('restore', data);
    if (data.nodes) {
      latestNodes = data.nodes;
    }
  });

  socket.on('undo', () => {
    socket.broadcast.emit('undo');
  });

  socket.on('redo', () => {
    socket.broadcast.emit('redo');
  });

  socket.on('state-update', (data) => {
    if (data.nodes) {
      latestNodes = data.nodes;
    }
    socket.broadcast.emit('state-update', data);
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(userId);
    console.log(`[WebSocket] 用户断开: ${userId}, 当前在线: ${onlineUsers.size}`);
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    onlineUsers: onlineUsers.size,
    timestamp: Date.now(),
  });
});

app.get('/api/users', (_req, res) => {
  res.json({
    users: Array.from(onlineUsers.values()),
    count: onlineUsers.size,
  });
});

const PORT = 3002;
server.listen(PORT, () => {
  console.log(`[Server] 协作思维导图服务器启动成功`);
  console.log(`[Server] HTTP:  http://localhost:${PORT}`);
  console.log(`[Server] WS:    ws://localhost:${PORT}`);
});
