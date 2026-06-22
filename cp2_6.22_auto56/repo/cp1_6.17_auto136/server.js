const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const rooms = {};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

app.post('/api/rooms', (req, res) => {
  const { nickname } = req.body;
  if (!nickname) {
    return res.status(400).json({ error: '昵称不能为空' });
  }
  const roomId = generateRoomCode();
  rooms[roomId] = {
    id: roomId,
    users: [nickname],
    messages: [],
    createdAt: Date.now(),
  };
  res.json({ roomId, onlineCount: 1 });
});

app.post('/api/rooms/join', (req, res) => {
  const { roomId, nickname } = req.body;
  if (!roomId || !nickname) {
    return res.status(400).json({ error: '房间码和昵称不能为空' });
  }
  const room = rooms[roomId];
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }
  if (!room.users.includes(nickname)) {
    room.users.push(nickname);
  }
  res.json({ roomId: room.id, onlineCount: room.users.length });
});

app.post('/api/rooms/:roomId/messages', (req, res) => {
  const { roomId } = req.params;
  const room = rooms[roomId];
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }
  const msg = req.body;
  if (!msg.id) {
    msg.id = uuidv4();
  }
  if (!msg.timestamp) {
    msg.timestamp = Date.now();
  }
  room.messages.push(msg);
  res.json({ success: true, message: msg });
});

app.get('/api/rooms/:roomId/messages', (req, res) => {
  const { roomId } = req.params;
  const room = rooms[roomId];
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }
  res.json(room.messages);
});

app.get('/api/rooms/:roomId/export', (req, res) => {
  const { roomId } = req.params;
  const room = rooms[roomId];
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }
  res.json({
    roomId: room.id,
    onlineCount: room.users.length,
    messageCount: room.messages.length,
    messages: room.messages,
    exportedAt: new Date().toISOString(),
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`诗语疗愈后端服务已启动: http://localhost:${PORT}`);
});
