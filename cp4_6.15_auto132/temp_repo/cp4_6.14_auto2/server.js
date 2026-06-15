import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const MAX_USERS = 5;

const users = new Map();
let drawHistory = [];
let stickies = [];

io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  socket.on('join', ({ username, color }) => {
    if (users.size >= MAX_USERS) {
      socket.emit('error', { message: '房间已满，最多支持5人同时连接' });
      socket.disconnect();
      return;
    }

    const user = {
      id: socket.id,
      username,
      color,
    };
    users.set(socket.id, user);

    socket.emit('joined', user, [...drawHistory]);
    io.emit('users', Array.from(users.values()));
    io.emit('userJoined', user);

    console.log('用户加入:', username, '当前人数:', users.size);
  });

  socket.on('draw', (event) => {
    if (!users.has(socket.id)) return;

    const isExisting = drawHistory.some((e) => e.id === event.id);
    if (!isExisting) {
      drawHistory.push(event);
      if (drawHistory.length > 500) {
        drawHistory = drawHistory.slice(-500);
      }
    }

    socket.broadcast.emit('draw', event);
  });

  socket.on('cursor', (data) => {
    if (!users.has(socket.id)) return;
    socket.broadcast.emit('cursor', { userId: socket.id, ...data });
  });

  socket.on('stickyUpdate', (sticky) => {
    if (!users.has(socket.id)) return;

    const idx = stickies.findIndex((s) => s.id === sticky.id);
    if (idx >= 0) {
      stickies[idx] = sticky;
    } else {
      stickies.push(sticky);
    }

    socket.broadcast.emit('stickyUpdate', sticky);
  });

  socket.on('undo', (userId) => {
    socket.broadcast.emit('undo', userId);
  });

  socket.on('redo', (userId) => {
    socket.broadcast.emit('redo', userId);
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
    io.emit('users', Array.from(users.values()));
    io.emit('userLeft', socket.id);
    console.log('用户离开:', socket.id, '当前人数:', users.size);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`白板服务器运行在 http://localhost:${PORT}`);
});
