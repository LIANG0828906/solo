import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { getSong, SongData, NoteData } from './songManager';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PLAYER_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#eab308'];

interface Player {
  id: string;
  nickname: string;
  color: string;
  ws: WebSocket;
  roomId: string | null;
  score: number;
  combo: number;
  maxCombo: number;
  perfect: number;
  good: number;
  miss: number;
  wins: number;
  totalGames: number;
}

interface Room {
  id: string;
  players: Map<string, Player>;
  state: 'waiting' | 'countdown' | 'playing' | 'finished';
  songData: SongData | null;
  startTime: number;
  countdownTimer: NodeJS.Timeout | null;
  gameTimer: NodeJS.Timeout | null;
  readyPlayers: Set<string>;
}

const players = new Map<string, Player>();
const rooms = new Map<string, Room>();
const leaderboard: Map<string, { playerId: string; nickname: string; wins: number; totalGames: number }> = new Map();

const mockLeaderboardData = [
  { nickname: '节奏大师', wins: 156, totalGames: 203 },
  { nickname: '音符猎手', wins: 142, totalGames: 198 },
  { nickname: '节拍王者', wins: 128, totalGames: 187 },
  { nickname: 'MelodyPro', wins: 115, totalGames: 176 },
  { nickname: 'BeatMaster', wins: 98, totalGames: 154 },
  { nickname: '音速玩家', wins: 87, totalGames: 142 },
  { nickname: 'RhythmKing', wins: 76, totalGames: 130 },
  { nickname: '音乐达人', wins: 65, totalGames: 118 },
  { nickname: 'NoteNinja', wins: 54, totalGames: 95 },
  { nickname: '鼓点精灵', wins: 43, totalGames: 82 },
];

mockLeaderboardData.forEach((data, i) => {
  const id = `mock_${i}`;
  leaderboard.set(id, { playerId: id, ...data });
});

function getLeaderboardArray() {
  return Array.from(leaderboard.values())
    .sort((a, b) => b.wins - a.wins)
    .map(entry => ({
      ...entry,
      winRate: entry.totalGames > 0 ? Math.round((entry.wins / entry.totalGames) * 100) : 0,
    }));
}

function broadcastLeaderboard() {
  const data = JSON.stringify({
    type: 'LEADERBOARD_UPDATE',
    leaderboard: getLeaderboardArray(),
  });
  players.forEach(p => {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(data);
    }
  });
}

function generateRoomId(): string {
  let id: string;
  do {
    id = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (rooms.has(id));
  return id;
}

function sendToPlayer(player: Player, message: unknown) {
  if (player.ws.readyState === WebSocket.OPEN) {
    player.ws.send(JSON.stringify(message));
  }
}

function broadcastToRoom(room: Room, message: unknown, excludeId?: string) {
  const data = JSON.stringify(message);
  room.players.forEach((p) => {
    if (p.id !== excludeId && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(data);
    }
  });
}

function getPublicPlayer(player: Player) {
  return {
    id: player.id,
    nickname: player.nickname,
    color: player.color,
    score: player.score,
    combo: player.combo,
    maxCombo: player.maxCombo,
    perfect: player.perfect,
    good: player.good,
    miss: player.miss,
  };
}

function getRoomPublicPlayers(room: Room) {
  return Array.from(room.players.values()).map(getPublicPlayer);
}

function calculateRank(score: number, totalNotes: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  const maxScore = totalNotes * 300;
  const ratio = score / maxScore;
  if (ratio >= 0.95) return 'S';
  if (ratio >= 0.85) return 'A';
  if (ratio >= 0.70) return 'B';
  if (ratio >= 0.50) return 'C';
  return 'D';
}

function resetPlayerStats(player: Player) {
  player.score = 0;
  player.combo = 0;
  player.maxCombo = 0;
  player.perfect = 0;
  player.good = 0;
  player.miss = 0;
}

function endGame(room: Room) {
  if (room.gameTimer) {
    clearTimeout(room.gameTimer);
    room.gameTimer = null;
  }
  room.state = 'finished';

  const results = Array.from(room.players.values()).map(p => {
    p.totalGames++;
    const rank = calculateRank(p.score, room.songData?.notes.length || 1);
    
    const lbEntry = leaderboard.get(p.id);
    if (lbEntry) {
      lbEntry.totalGames = p.totalGames;
    } else {
      leaderboard.set(p.id, {
        playerId: p.id,
        nickname: p.nickname,
        wins: 0,
        totalGames: p.totalGames,
      });
    }
    
    return {
      playerId: p.id,
      nickname: p.nickname,
      score: p.score,
      maxCombo: p.maxCombo,
      perfect: p.perfect,
      good: p.good,
      miss: p.miss,
      rank,
      wins: p.wins,
    };
  });

  results.sort((a, b) => b.score - a.score);
  if (results.length > 0) {
    const winnerId = results[0].playerId;
    const winner = room.players.get(winnerId);
    if (winner) {
      winner.wins++;
      const lbEntry = leaderboard.get(winnerId);
      if (lbEntry) {
        lbEntry.wins = winner.wins;
      }
      results[0].wins = winner.wins;
    }
  }

  const message = { type: 'GAME_END', results };
  broadcastToRoom(room, message);

  setTimeout(() => {
    broadcastLeaderboard();
  }, 500);
}

function startGame(room: Room) {
  room.state = 'playing';
  room.songData = getSong();
  room.startTime = Date.now() + 500;

  const startMessage = {
    type: 'GAME_START',
    songData: room.songData,
    startTime: room.startTime,
  };
  broadcastToRoom(room, startMessage);

  room.players.forEach(p => resetPlayerStats(p));

  room.gameTimer = setTimeout(() => {
    endGame(room);
  }, (room.songData?.duration || 90000) + 2000);
}

function startCountdown(room: Room) {
  if (room.state !== 'waiting') return;
  
  const playerCount = room.players.size;
  if (playerCount < 2) return;
  
  room.state = 'countdown';
  let countdown = 3;

  const tick = () => {
    broadcastToRoom(room, { type: 'GAME_COUNTDOWN', countdown });
    countdown--;
    
    if (countdown < 0) {
      if (room.countdownTimer) {
        clearInterval(room.countdownTimer);
        room.countdownTimer = null;
      }
      startGame(room);
    }
  };

  tick();
  room.countdownTimer = setInterval(tick, 1000);
}

function handleJoinRoom(player: Player, roomId?: string) {
  let room: Room | undefined;
  
  if (roomId) {
    room = rooms.get(roomId);
    if (!room) {
      sendToPlayer(player, { type: 'ERROR', message: '房间不存在' });
      return;
    }
    if (room.players.size >= 4) {
      sendToPlayer(player, { type: 'ERROR', message: '房间已满' });
      return;
    }
    if (room.state !== 'waiting') {
      sendToPlayer(player, { type: 'ERROR', message: '游戏已开始，无法加入' });
      return;
    }
  } else {
    for (const r of rooms.values()) {
      if (r.state === 'waiting' && r.players.size < 4) {
        room = r;
        break;
      }
    }
    if (!room) {
      const newRoomId = generateRoomId();
      room = {
        id: newRoomId,
        players: new Map(),
        state: 'waiting',
        songData: null,
        startTime: 0,
        countdownTimer: null,
        gameTimer: null,
        readyPlayers: new Set(),
      };
      rooms.set(newRoomId, room);
    }
  }

  const playerIndex = room.players.size;
  player.color = PLAYER_COLORS[playerIndex];
  player.roomId = room.id;
  resetPlayerStats(player);
  room.players.set(player.id, player);

  sendToPlayer(player, {
    type: 'ROOM_JOINED',
    roomId: room.id,
    players: getRoomPublicPlayers(room),
    leaderboard: getLeaderboardArray(),
  });

  broadcastToRoom(room, {
    type: 'PLAYER_JOINED',
    player: getPublicPlayer(player),
  }, player.id);

  if (room.players.size >= 2) {
    setTimeout(() => {
      if (room && room.state === 'waiting' && room.players.size >= 2) {
        startCountdown(room);
      }
    }, 1500);
  }
}

function handleNoteHit(player: Player, noteIndex: number, timestamp: number, trackIndex: number) {
  if (!player.roomId) return;
  const room = rooms.get(player.roomId);
  if (!room || room.state !== 'playing' || !room.songData) return;

  const note = room.songData.notes[noteIndex];
  if (!note || note.track !== trackIndex) return;

  const gameTime = timestamp - room.startTime;
  const diff = Math.abs(gameTime - note.time);

  let hitType: 'perfect' | 'good' | 'miss';
  let points = 0;

  if (diff <= 50) {
    hitType = 'perfect';
    points = 300;
    player.perfect++;
    player.combo++;
  } else if (diff <= 100) {
    hitType = 'good';
    points = 100;
    player.good++;
    player.combo++;
  } else {
    hitType = 'miss';
    player.miss++;
    player.combo = 0;
  }

  player.score += points * (1 + Math.floor(player.combo / 10) * 0.1);
  player.maxCombo = Math.max(player.maxCombo, player.combo);

  const scoreData = {
    score: Math.floor(player.score),
    combo: player.combo,
    maxCombo: player.maxCombo,
    perfect: player.perfect,
    good: player.good,
    miss: player.miss,
    hitType,
  };

  sendToPlayer(player, { type: 'SCORE_UPDATE', playerId: player.id, score: scoreData });
  broadcastToRoom(room, { type: 'SCORE_UPDATE', playerId: player.id, score: scoreData }, player.id);
}

function handleRestartGame(player: Player) {
  if (!player.roomId) return;
  const room = rooms.get(player.roomId);
  if (!room || room.state !== 'finished') return;

  room.readyPlayers.add(player.id);

  if (room.readyPlayers.size >= Math.ceil(room.players.size / 2)) {
    room.readyPlayers.clear();
    if (room.countdownTimer) {
      clearInterval(room.countdownTimer);
    }
    if (room.gameTimer) {
      clearTimeout(room.gameTimer);
    }
    room.state = 'waiting';
    room.songData = null;
    startCountdown(room);
  }
}

function handleLeaveRoom(player: Player) {
  if (!player.roomId) return;
  const room = rooms.get(player.roomId);
  if (!room) return;

  room.players.delete(player.id);
  broadcastToRoom(room, { type: 'PLAYER_LEFT', playerId: player.id });
  player.roomId = null;

  if (room.players.size === 0) {
    if (room.countdownTimer) clearInterval(room.countdownTimer);
    if (room.gameTimer) clearTimeout(room.gameTimer);
    rooms.delete(room.id);
  }
}

wss.on('connection', (ws) => {
  const playerId = uuidv4();
  const player: Player = {
    id: playerId,
    nickname: 'Player',
    color: PLAYER_COLORS[0],
    ws,
    roomId: null,
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfect: 0,
    good: 0,
    miss: 0,
    wins: 0,
    totalGames: 0,
  };
  players.set(playerId, player);

  sendToPlayer(player, {
    type: 'LEADERBOARD_UPDATE',
    leaderboard: getLeaderboardArray(),
  });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      
      switch (msg.type) {
        case 'SET_NICKNAME':
          player.nickname = msg.nickname || 'Player';
          break;
        case 'CREATE_ROOM':
          player.nickname = msg.nickname || player.nickname;
          handleJoinRoom(player);
          break;
        case 'RANDOM_MATCH':
          player.nickname = msg.nickname || player.nickname;
          handleJoinRoom(player);
          break;
        case 'JOIN_ROOM':
          player.nickname = msg.nickname || player.nickname;
          handleJoinRoom(player, msg.roomId);
          break;
        case 'NOTE_HIT':
          handleNoteHit(player, msg.noteIndex, msg.timestamp, msg.trackIndex);
          break;
        case 'RESTART_GAME':
          handleRestartGame(player);
          break;
        case 'LEAVE_ROOM':
          handleLeaveRoom(player);
          break;
      }
    } catch (e) {
      console.error('Message parse error:', e);
    }
  });

  ws.on('close', () => {
    handleLeaveRoom(player);
    players.delete(playerId);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Game server running on port ${PORT}`);
});
