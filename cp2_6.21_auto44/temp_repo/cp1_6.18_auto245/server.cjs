const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('create-room', () => {
    let roomCode;
    do {
      roomCode = generateRoomCode();
    } while (rooms.has(roomCode));

    rooms.set(roomCode, {
      nodes: [],
      connections: [],
      clients: new Set(),
    });

    socket.join(roomCode);
    rooms.get(roomCode).clients.add(socket.id);
    socket.data.currentRoom = roomCode;

    console.log('Room created:', roomCode, 'by', socket.id);
    socket.emit('room-created', { roomCode });
  });

  socket.on('join-room', (data) => {
    const { roomCode, nodes, connections } = data || {};
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('join-error', { error: '房间不存在' });
      return;
    }

    socket.join(roomCode);
    room.clients.add(socket.id);
    socket.data.currentRoom = roomCode;

    if (room.nodes.length === 0 && nodes && nodes.length > 0) {
      room.nodes = nodes;
      room.connections = connections || [];
    }

    console.log('Client', socket.id, 'joined room', roomCode);
    socket.emit('room-state', {
      nodes: room.nodes,
      connections: room.connections,
    });
  });

  socket.on('node-added', (data) => {
    const { roomCode, node, connection } = data || {};
    const room = rooms.get(roomCode);
    if (!room) return;

    if (!node.id) node.id = uuidv4();

    room.nodes.push(node);
    if (connection) {
      room.connections.push(connection);
    }

    socket.to(roomCode).emit('node-added', data);
  });

  socket.on('node-updated', (data) => {
    const { roomCode, id, changes } = data || {};
    const room = rooms.get(roomCode);
    if (!room) return;

    const nodeIndex = room.nodes.findIndex((n) => n.id === id);
    if (nodeIndex !== -1) {
      room.nodes[nodeIndex] = { ...room.nodes[nodeIndex], ...changes, updatedAt: Date.now() };
    }

    socket.to(roomCode).emit('node-updated', data);
  });

  socket.on('node-deleted', (data) => {
    const { roomCode, nodeIds, connectionIds } = data || {};
    const room = rooms.get(roomCode);
    if (!room) return;

    const idsToDelete = new Set(nodeIds || []);
    room.nodes = room.nodes.filter((n) => !idsToDelete.has(n.id));
    room.connections = room.connections.filter((c) => !(connectionIds || []).includes(c.id));

    socket.to(roomCode).emit('node-deleted', data);
  });

  socket.on('undo-performed', (data) => {
    const { roomCode, snapshot } = data || {};
    const room = rooms.get(roomCode);
    if (!room || !snapshot) return;

    room.nodes = snapshot.nodes || [];
    room.connections = snapshot.connections || [];

    socket.to(roomCode).emit('undo-performed', data);
  });

  socket.on('redo-performed', (data) => {
    const { roomCode, snapshot } = data || {};
    const room = rooms.get(roomCode);
    if (!room || !snapshot) return;

    room.nodes = snapshot.nodes || [];
    room.connections = snapshot.connections || [];

    socket.to(roomCode).emit('redo-performed', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    for (const [roomCode, room] of rooms.entries()) {
      if (room.clients.has(socket.id)) {
        room.clients.delete(socket.id);
        if (room.clients.size === 0) {
          rooms.delete(roomCode);
          console.log('Room', roomCode, 'deleted (empty)');
        }
      }
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log('Server is running on http://localhost:' + PORT);
  console.log('Health check: http://localhost:' + PORT + '/health');
});
