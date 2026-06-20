const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const battleLogs = [];

io.on('connection', (socket) => {
  console.log(`[Server] Client connected: ${socket.id}`);

  socket.emit('battle:init', { logs: battleLogs });

  socket.on('character:place', (data) => {
    socket.broadcast.emit('character:place', data);
  });

  socket.on('character:move', (data) => {
    socket.broadcast.emit('character:move', data);
    const log = {
      timestamp: Date.now(),
      type: 'move',
      message: `角色移动到 (${data.x}, ${data.y})`,
      characterId: data.characterId,
    };
    battleLogs.push(log);
    socket.broadcast.emit('battle:log', log);
  });

  socket.on('character:attack', (data) => {
    socket.broadcast.emit('character:attack', data);
    const log = {
      timestamp: Date.now(),
      type: 'attack',
      message: `攻击造成 ${data.damage} 点伤害`,
      characterId: data.attackerId,
      targetId: data.targetId,
    };
    battleLogs.push(log);
    socket.broadcast.emit('battle:log', log);
  });

  socket.on('disconnect', () => {
    console.log(`[Server] Client disconnected: ${socket.id}`);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`[Server] Socket.IO server running on port ${PORT}`);
});
