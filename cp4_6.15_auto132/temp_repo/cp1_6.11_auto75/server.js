const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const COLOR_PALETTE = ['#98D8C8', '#F7B7C8', '#A8D8EA', '#FFE66D', '#C5B4E3', '#F4A261', '#81C995', '#FFD3B5', '#B8D4E3', '#E8D5B7'];

const rooms = new Map();
const timers = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms.has(code));
  return code;
}

function serializePoll(poll) {
  return {
    id: poll.id,
    roomCode: poll.roomCode,
    title: poll.title,
    options: poll.options,
    totalVotes: poll.totalVotes,
    createdAt: poll.createdAt,
    endTime: poll.endTime,
    isEnded: poll.isEnded,
    winnerId: poll.winnerId
  };
}

function findWinner(options) {
  if (options.length === 0) return null;
  let maxVotes = -1;
  let winner = null;
  for (const opt of options) {
    if (opt.votes > maxVotes) {
      maxVotes = opt.votes;
      winner = opt;
    }
  }
  return maxVotes > 0 ? winner : null;
}

function endPoll(roomCode) {
  const poll = rooms.get(roomCode);
  if (!poll || poll.isEnded) return;

  poll.isEnded = true;
  const winner = findWinner(poll.options);
  poll.winnerId = winner ? winner.id : null;

  if (timers.has(roomCode)) {
    clearTimeout(timers.get(roomCode));
    timers.delete(roomCode);
  }

  const state = serializePoll(poll);
  io.to(roomCode).emit('poll-state', state);
  io.to(roomCode).emit('poll-ended', { winner, results: state });
}

app.post('/api/create', (req, res) => {
  try {
    const { title, options, duration } = req.body;

    if (!title || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: '标题和至少2个选项是必需的' });
    }
    if (options.length > 10) {
      return res.status(400).json({ error: '最多10个选项' });
    }

    const roomCode = generateRoomCode();
    const pollOptions = options.map((opt, index) => ({
      id: uuidv4(),
      text: opt.text || opt,
      emoji: opt.emoji || null,
      votes: 0,
      color: COLOR_PALETTE[index % COLOR_PALETTE.length]
    }));

    const durationMs = (duration || 600) * 1000;
    const now = Date.now();

    const poll = {
      id: uuidv4(),
      roomCode,
      title,
      options: pollOptions,
      totalVotes: 0,
      createdAt: now,
      endTime: now + durationMs,
      isEnded: false,
      winnerId: null,
      votedClients: new Set()
    };

    rooms.set(roomCode, poll);

    const timer = setTimeout(() => endPoll(roomCode), durationMs);
    timers.set(roomCode, timer);

    res.status(201).json({
      roomCode,
      pollId: poll.id,
      ...serializePoll(poll)
    });
  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({ error: '创建投票失败' });
  }
});

app.get('/api/poll/:roomCode', (req, res) => {
  try {
    const { roomCode } = req.params;
    const { clientId } = req.query;
    const poll = rooms.get(roomCode.toUpperCase());

    if (!poll) {
      return res.status(404).json({ error: '房间不存在' });
    }

    const state = serializePoll(poll);
    if (clientId) {
      state.hasVoted = poll.votedClients.has(clientId);
    }

    res.json(state);
  } catch (error) {
    console.error('Get poll error:', error);
    res.status(500).json({ error: '获取投票失败' });
  }
});

app.post('/api/reset/:roomCode', (req, res) => {
  try {
    const { roomCode } = req.params;
    const code = roomCode.toUpperCase();
    const poll = rooms.get(code);

    if (!poll) {
      return res.status(404).json({ error: '房间不存在' });
    }

    if (timers.has(code)) {
      clearTimeout(timers.get(code));
      timers.delete(code);
    }

    poll.options.forEach(opt => {
      opt.votes = 0;
    });
    poll.totalVotes = 0;
    poll.votedClients.clear();
    poll.isEnded = false;
    poll.winnerId = null;

    const remaining = poll.endTime - poll.createdAt;
    const durationMs = remaining > 0 ? remaining : 600 * 1000;
    poll.createdAt = Date.now();
    poll.endTime = Date.now() + durationMs;

    const timer = setTimeout(() => endPoll(code), durationMs);
    timers.set(code, timer);

    const state = serializePoll(poll);
    io.to(code).emit('poll-state', state);

    res.json({ success: true, endTime: poll.endTime, ...state });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: '重置投票失败' });
  }
});

io.on('connection', (socket) => {
  socket.on('join', ({ roomCode }) => {
    const code = roomCode.toUpperCase();
    const poll = rooms.get(code);

    if (!poll) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }

    socket.join(code);
    socket.emit('poll-state', serializePoll(poll));
  });

  socket.on('vote', ({ roomCode, optionId, clientId }) => {
    const code = roomCode.toUpperCase();
    const poll = rooms.get(code);

    if (!poll) {
      socket.emit('voted', { success: false, message: '房间不存在' });
      return;
    }

    if (poll.isEnded) {
      socket.emit('voted', { success: false, message: '投票已结束' });
      return;
    }

    const voterId = clientId || socket.id;
    if (poll.votedClients.has(voterId)) {
      socket.emit('voted', { success: false, message: '您已经投过票了' });
      return;
    }

    const option = poll.options.find(opt => opt.id === optionId);
    if (!option) {
      socket.emit('voted', { success: false, message: '选项不存在' });
      return;
    }

    option.votes += 1;
    poll.totalVotes += 1;
    poll.votedClients.add(voterId);

    socket.emit('voted', { success: true, optionId, roomCode: code });
    io.to(code).emit('poll-state', serializePoll(poll));
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`✅ 服务器运行在端口 ${PORT}`);
  console.log(`📡 Socket.IO 已就绪`);
});
