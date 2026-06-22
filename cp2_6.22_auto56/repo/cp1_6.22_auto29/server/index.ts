import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { getRandomVerse, verifyVerse, buildVerseFromMatch } from './poemEngine';
import type { Verse } from '../src/types';

const PORT = 3001;
const TURN_TIME = 60;
const MAX_PLAYERS = 8;

interface Player {
  id: string;
  socketId: string;
  nickname: string;
  avatarSeed: number;
  isHost: boolean;
  status: 'waiting' | 'answering';
  joinTime: number;
}

interface Room {
  id: string;
  players: Map<string, Player>;
  chain: Verse[];
  currentPlayerId: string | null;
  promptVerse: Verse | null;
  timeLeft: number;
  round: number;
  timer: ReturnType<typeof setInterval> | null;
  turnOrder: string[];
  turnIndex: number;
}

const rooms = new Map<string, Room>();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function publicPlayer(p: Player) {
  return {
    id: p.id,
    nickname: p.nickname,
    avatarSeed: p.avatarSeed,
    isHost: p.isHost,
    status: p.status,
    joinTime: p.joinTime,
  };
}

function broadcastRoomState(room: Room) {
  const players = Array.from(room.players.values()).map(publicPlayer);
  io.to(room.id).emit('roomState', {
    players,
    chain: room.chain,
    currentPlayerId: room.currentPlayerId,
    promptVerse: room.promptVerse,
    timeLeft: room.timeLeft,
    round: room.round,
  });
}

function clearTimer(room: Room) {
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }
}

function getNextPlayerId(room: Room): string | null {
  if (room.turnOrder.length === 0) return null;
  room.turnIndex = (room.turnIndex + 1) % room.turnOrder.length;
  const nextId = room.turnOrder[room.turnIndex];
  return room.players.has(nextId) ? nextId : getNextPlayerId(room);
}

function startTurn(room: Room) {
  clearTimer(room);

  if (room.players.size < 1) return;

  room.turnOrder = Array.from(room.players.values()).map(p => p.id).sort(
    (a, b) => (room.players.get(a)!.joinTime) - (room.players.get(b)!.joinTime)
  );
  if (!room.currentPlayerId || !room.players.has(room.currentPlayerId)) {
    room.turnIndex = 0;
    room.currentPlayerId = room.turnOrder[0];
  } else {
    room.turnIndex = room.turnOrder.indexOf(room.currentPlayerId);
  }

  if (!room.promptVerse) {
    room.promptVerse = getRandomVerse();
  }
  room.timeLeft = TURN_TIME;
  room.round += 1;

  const current = room.players.get(room.currentPlayerId);
  if (current) current.status = 'answering';
  for (const p of room.players.values()) {
    if (p.id !== room.currentPlayerId) p.status = 'waiting';
  }

  io.to(room.id).emit('newPrompt', {
    verse: room.promptVerse,
    playerId: room.currentPlayerId,
  });
  broadcastRoomState(room);

  room.timer = setInterval(() => {
    room.timeLeft -= 1;
    io.to(room.id).emit('timeTick', { timeLeft: room.timeLeft });

    if (room.timeLeft <= 3 && room.timeLeft > 0) {
      io.to(room.id).emit('urgentTick', { timeLeft: room.timeLeft });
    }

    if (room.timeLeft <= 0) {
      clearTimer(room);
      io.to(room.id).emit('verseResult', {
        success: false,
        message: `时间到！轮到下一位出题`,
      });
      advanceTurn(room);
    }
  }, 1000);
}

function advanceTurn(room: Room) {
  if (room.chain.length > 0) {
    const last = room.chain[room.chain.length - 1];
    room.promptVerse = last;
  } else {
    room.promptVerse = getRandomVerse();
  }

  const next = getNextPlayerId(room);
  room.currentPlayerId = next;
  setTimeout(() => startTurn(room), 1500);
}

io.on('connection', (socket) => {
  socket.on('createRoom', ({ nickname }: { nickname: string }) => {
    const roomId = generateRoomCode();
    const playerId = uuidv4();

    const player: Player = {
      id: playerId,
      socketId: socket.id,
      nickname: nickname.slice(0, 12) || '匿名诗人',
      avatarSeed: Math.floor(Math.random() * 1000),
      isHost: true,
      status: 'waiting',
      joinTime: Date.now(),
    };

    const room: Room = {
      id: roomId,
      players: new Map(),
      chain: [],
      currentPlayerId: null,
      promptVerse: null,
      timeLeft: TURN_TIME,
      round: 0,
      timer: null,
      turnOrder: [],
      turnIndex: 0,
    };
    room.players.set(playerId, player);
    rooms.set(roomId, room);

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerId = playerId;

    socket.emit('roomCreated', { roomId, playerId });

    io.to(roomId).emit('playerJoined', { player: publicPlayer(player) });
    io.to(roomId).emit('fluteSound', { playerId });

    broadcastRoomState(room);
  });

  socket.on('joinRoom', ({ roomId, nickname }: { roomId: string; nickname: string }) => {
    const code = roomId.toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) {
      socket.emit('error', { message: '房间不存在，请检查房间号' });
      return;
    }
    if (room.players.size >= MAX_PLAYERS) {
      socket.emit('error', { message: '房间已满（最多8人）' });
      return;
    }

    const playerId = uuidv4();
    const player: Player = {
      id: playerId,
      socketId: socket.id,
      nickname: nickname.slice(0, 12) || '匿名诗人',
      avatarSeed: Math.floor(Math.random() * 1000),
      isHost: false,
      status: 'waiting',
      joinTime: Date.now(),
    };
    room.players.set(playerId, player);

    socket.join(code);
    socket.data.roomId = code;
    socket.data.playerId = playerId;

    socket.emit('roomJoined', { roomId: code, playerId });
    io.to(code).emit('playerJoined', { player: publicPlayer(player) });
    io.to(code).emit('fluteSound', { playerId });

    broadcastRoomState(room);

    if (!room.currentPlayerId && room.players.size >= 1) {
      setTimeout(() => startTurn(room), 1200);
    }
  });

  socket.on('submitVerse', ({ roomId, verse }: { roomId: string; verse: string }) => {
    const code = roomId.toUpperCase().trim();
    const room = rooms.get(code);
    const playerId = socket.data.playerId;

    if (!room) { socket.emit('error', { message: '房间不存在' }); return; }
    if (!playerId || !room.players.has(playerId)) { socket.emit('error', { message: '未加入房间' }); return; }
    if (room.currentPlayerId !== playerId) { socket.emit('error', { message: '不是你的回合' }); return; }
    if (!room.promptVerse) { socket.emit('error', { message: '暂无出题' }); return; }

    const result = verifyVerse(room.promptVerse, verse);

    if (!result.valid) {
      socket.emit('verseResult', {
        success: false,
        message: result.reason,
        chain: room.chain,
      });
      return;
    }

    const built = buildVerseFromMatch(verse, result.matchedPoem, result.matchedLine ?? -1);
    const submittedVerse: Verse = { ...built, submittedBy: playerId, id: uuidv4() };

    room.chain.push(submittedVerse);

    io.to(code).emit('verseResult', {
      success: true,
      message: result.reason,
      chain: room.chain,
      lastVerse: submittedVerse,
    });

    advanceTurn(room);
  });

  socket.on('leaveRoom', () => {
    handleLeave(socket);
  });

  socket.on('disconnect', () => {
    handleLeave(socket);
  });
});

function handleLeave(socket: any) {
  const roomId = socket.data.roomId;
  const playerId = socket.data.playerId;
  if (!roomId || !playerId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  const wasCurrent = room.currentPlayerId === playerId;
  room.players.delete(playerId);

  io.to(roomId).emit('playerLeft', { playerId });

  if (room.players.size === 0) {
    clearTimer(room);
    rooms.delete(roomId);
    return;
  }

  const host = Array.from(room.players.values()).sort((a, b) => a.joinTime - b.joinTime)[0];
  if (host) host.isHost = true;

  broadcastRoomState(room);

  if (wasCurrent) {
    advanceTurn(room);
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

server.listen(PORT, () => {
  console.log(`[server] 诗词接龙后端已启动: http://localhost:${PORT}`);
});
