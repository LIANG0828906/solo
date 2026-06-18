const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const IdeaModel = require('./models/idea');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

app.get('/api/ideas', (req, res) => {
  const ideas = IdeaModel.getAll();
  res.json(ideas);
});

app.post('/api/ideas', (req, res) => {
  const idea = IdeaModel.create(req.body);
  res.status(201).json(idea);
});

app.post('/api/ideas/batch', (req, res) => {
  const ideas = IdeaModel.replaceAll(req.body);
  res.status(201).json(ideas);
});

app.put('/api/ideas/:id', (req, res) => {
  const idea = IdeaModel.update(req.params.id, req.body);
  if (!idea) {
    return res.status(404).json({ error: '灵感不存在' });
  }
  res.json(idea);
});

app.delete('/api/ideas/:id', (req, res) => {
  const deleted = IdeaModel.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: '灵感不存在' });
  }
  res.json({ success: true });
});

io.on('connection', (socket) => {
  console.log('客户端连接:', socket.id);

  socket.on('node:create', (node) => {
    console.log('创建节点:', node.id);
    socket.broadcast.emit('node:created', node);
  });

  socket.on('node:update', (id, updates) => {
    socket.broadcast.emit('node:updated', id, updates);
  });

  socket.on('node:delete', (id) => {
    socket.broadcast.emit('node:deleted', id);
  });

  socket.on('nodes:connect', (sourceId, targetId) => {
    socket.broadcast.emit('nodes:connected', sourceId, targetId);
  });

  socket.on('node:editing', (nodeId, userId) => {
    socket.broadcast.emit('node:editing', nodeId, userId);
  });

  socket.on('nodes:import', (nodes) => {
    socket.broadcast.emit('nodes:imported', nodes);
  });

  socket.on('disconnect', () => {
    console.log('客户端断开:', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`灵感速写服务器运行在 http://localhost:${PORT}`);
});
