import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

interface Player {
  id: string;
  nickname: string;
  team?: number;
  isDrawer?: boolean;
  ws: WebSocket;
  avatar: string;
}

interface Team {
  id: number;
  name: string;
  players: Player[];
  score: number;
  roundScores: number[];
}

interface Room {
  code: string;
  players: Player[];
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  teams: Team[];
  currentRound: number;
  totalRounds: number;
  currentTeamIndex: number;
  currentDrawerIndex: number;
  currentWord: string;
  currentWordCategory: string;
  roundStartTime: number;
  roundDuration: number;
  hintsUsed: number;
  wrongGuesses: number;
  revealedLetters: boolean[];
}

interface WSMessage {
  type: string;
  data: any;
  roomCode?: string;
  playerId?: string;
}

const rooms = new Map<string, Room>();
const playerToRoom = new Map<string, string>();

const WORD_BANK: { category: string; words: string[] }[] = [
  {
    category: '动物',
    words: ['大象', '长颈鹿', '企鹅', '考拉', '海豚', '蝴蝶', '猫头鹰', '袋鼠', '刺猬', '鹦鹉']
  },
  {
    category: '食物',
    words: ['汉堡', '寿司', '披萨', '冰淇淋', '饺子', '蛋糕', '火锅', '烧烤', '咖啡', '巧克力']
  },
  {
    category: '运动',
    words: ['篮球', '足球', '游泳', '滑雪', '瑜伽', '网球', '射箭', '攀岩', '冲浪', '击剑']
  },
  {
    category: '电影',
    words: ['泰坦尼克号', '阿凡达', '盗梦空间', '哈利波特', '复仇者联盟', '星际穿越', '肖申克的救赎', '千与千寻', '蝙蝠侠', '蜘蛛侠']
  },
  {
    category: '职业',
    words: ['医生', '消防员', '宇航员', '画家', '魔术师', '侦探', '飞行员', '厨师', '建筑师', '科学家']
  },
  {
    category: '天气',
    words: ['龙卷风', '彩虹', '暴风雪', '闪电', '日食', '彩虹', '大雾', '冰雹', '流星雨', '极光']
  }
];

const AVATARS = ['🐱', '🐶', '🐼', '🦊', '🦁', '🐯', '🐸', '🐵', '🐨', '🐰'];

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function pickRandomWord(): { word: string; category: string } {
  const categoryObj = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
  const word = categoryObj.words[Math.floor(Math.random() * categoryObj.words.length)];
  return { word, category: categoryObj.category };
}

function broadcastToRoom(roomCode: string, message: WSMessage, excludeId?: string) {
  const room = rooms.get(roomCode);
  if (!room) return;
  room.players.forEach((player) => {
    if (player.id !== excludeId && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(message));
    }
  });
}

function sendToPlayer(playerId: string, message: WSMessage) {
  const roomCode = playerToRoom.get(playerId);
  if (!roomCode) return;
  const room = rooms.get(roomCode);
  if (!room) return;
  const player = room.players.find((p) => p.id === playerId);
  if (player && player.ws.readyState === WebSocket.OPEN) {
    player.ws.send(JSON.stringify(message));
  }
}

function getPublicRoomState(room: Room) {
  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    players: room.players.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      team: p.team,
      avatar: p.avatar,
      isDrawer: p.isDrawer
    })),
    teams: room.teams.map((t) => ({
      id: t.id,
      name: t.name,
      score: t.score,
      roundScores: t.roundScores,
      players: t.players.map((p) => ({ id: p.id, nickname: p.nickname, avatar: p.avatar }))
    })),
    currentRound: room.currentRound,
    totalRounds: room.totalRounds,
    currentTeamIndex: room.currentTeamIndex,
    roundDuration: room.roundDuration,
    roundStartTime: room.roundStartTime,
    hintsUsed: room.hintsUsed,
    wrongGuesses: room.wrongGuesses,
    revealedLetters: room.revealedLetters,
    currentWordCategory: room.currentWordCategory
  };
}

function startRound(room: Room) {
  room.currentRound++;
  const { word, category } = pickRandomWord();
  room.currentWord = word;
  room.currentWordCategory = category;
  room.roundStartTime = Date.now();
  room.roundDuration = 90;
  room.hintsUsed = 0;
  room.wrongGuesses = 0;
  room.revealedLetters = new Array(word.length).fill(false);

  const team = room.teams[room.currentTeamIndex];
  const drawerIndex = room.currentDrawerIndex % team.players.length;
  team.players.forEach((p, idx) => {
    p.isDrawer = idx === drawerIndex;
  });
  room.currentDrawerIndex++;

  console.log(`Round ${room.currentRound} started. Word: ${word} (${category})`);

  room.players.forEach((player) => {
    const isDrawer = player.isDrawer;
    const msg: WSMessage = {
      type: 'round_start',
      data: {
        ...getPublicRoomState(room),
        word: isDrawer ? word : null,
        wordLength: word.length,
        isDrawer,
        drawerInfo: team.players
          .filter((p) => p.isDrawer)
          .map((p) => ({ id: p.id, nickname: p.nickname, avatar: p.avatar }))
      }
    };
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(msg));
    }
  });
}

function calculateScore(room: Room): number {
  const elapsed = (Date.now() - room.roundStartTime) / 1000;
  const remaining = Math.max(0, room.roundDuration - elapsed);
  let score = 100;
  score -= room.hintsUsed * 20;
  score -= room.wrongGuesses * 10;
  score += Math.min(50, Math.floor(remaining / 10) * 5);
  return Math.max(0, score);
}

function endRound(room: Room, guessed: boolean) {
  const team = room.teams[room.currentTeamIndex];
  const score = guessed ? calculateScore(room) : 0;
  team.score += score;
  team.roundScores.push(score);

  const isLastRound = room.currentRound >= room.totalRounds;

  broadcastToRoom(room.code, {
    type: 'round_end',
    data: {
      ...getPublicRoomState(room),
      word: room.currentWord,
      roundScore: score,
      teamId: team.id,
      isLastRound,
      guessed
    }
  });

  if (isLastRound) {
    room.status = 'finished';
    const sortedTeams = [...room.teams].sort((a, b) => b.score - a.score);
    setTimeout(() => {
      broadcastToRoom(room.code, {
        type: 'game_end',
        data: {
          ...getPublicRoomState(room),
          finalRankings: sortedTeams.map((t, idx) => ({
            rank: idx + 1,
            teamId: t.id,
            teamName: t.name,
            totalScore: t.score,
            roundScores: t.roundScores,
            players: t.players.map((p) => ({ nickname: p.nickname, avatar: p.avatar }))
          }))
        }
      });
    }, 2000);
    return;
  }

  room.currentTeamIndex = (room.currentTeamIndex + 1) % room.teams.length;
  setTimeout(() => {
    startRound(room);
  }, 4000);
}

function handleJoinRoom(playerId: string, roomCode: string, nickname: string) {
  const room = rooms.get(roomCode);
  const playerWs = [...wss.clients].find(
    (ws: any) => ws.playerId === playerId
  ) as WebSocket | undefined;

  if (!room || !playerWs) return false;

  if (room.players.length >= 4) {
    sendToPlayer(playerId, { type: 'error', data: { message: '房间已满（最多4人）' } });
    return false;
  }

  const player: Player = {
    id: playerId,
    nickname,
    ws: playerWs,
    avatar: AVATARS[room.players.length % AVATARS.length]
  };
  (playerWs as any).playerId = playerId;
  (playerWs as any).roomCode = roomCode;

  room.players.push(player);
  playerToRoom.set(playerId, roomCode);

  sendToPlayer(playerId, {
    type: 'room_joined',
    data: { playerId, room: getPublicRoomState(room) }
  });

  broadcastToRoom(roomCode, {
    type: 'player_joined',
    data: {
      player: {
        id: player.id,
        nickname: player.nickname,
        avatar: player.avatar
      },
      room: getPublicRoomState(room)
    }
  }, playerId);

  return true;
}

app.post('/api/rooms', (req, res) => {
  const { nickname, playerId } = req.body;
  if (!nickname || !playerId) {
    return res.status(400).json({ error: '缺少昵称或玩家ID' });
  }

  let code: string;
  do {
    code = generateRoomCode();
  } while (rooms.has(code));

  const room: Room = {
    code,
    players: [],
    hostId: playerId,
    status: 'waiting',
    teams: [],
    currentRound: 0,
    totalRounds: 3,
    currentTeamIndex: 0,
    currentDrawerIndex: 0,
    currentWord: '',
    currentWordCategory: '',
    roundStartTime: 0,
    roundDuration: 90,
    hintsUsed: 0,
    wrongGuesses: 0,
    revealedLetters: []
  };
  rooms.set(code, room);

  res.json({ roomCode: code });
});

app.get('/api/rooms/:code/exists', (req, res) => {
  const exists = rooms.has(req.params.code);
  res.json({ exists });
});

wss.on('connection', (ws: WebSocket & { playerId?: string; roomCode?: string }) => {
  const tempId = uuidv4();
  ws.playerId = tempId;

  ws.send(JSON.stringify({ type: 'connected', data: { tempId } }));

  ws.on('message', (raw) => {
    let msg: WSMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    const { type, data, roomCode, playerId } = msg;

    switch (type) {
      case 'init_connection': {
        ws.playerId = data.playerId;
        break;
      }

      case 'create_and_join': {
        const code = roomCode!;
        handleJoinRoom(data.playerId, code, data.nickname);
        break;
      }

      case 'join_room': {
        handleJoinRoom(data.playerId, roomCode!, data.nickname);
        break;
      }

      case 'leave_room': {
        const room = rooms.get(roomCode!);
        if (!room) break;
        room.players = room.players.filter((p) => p.id !== playerId);
        playerToRoom.delete(playerId!);
        if (room.players.length === 0) {
          rooms.delete(roomCode!);
        } else {
          if (room.hostId === playerId) {
            room.hostId = room.players[0].id;
          }
          broadcastToRoom(roomCode!, {
            type: 'player_left',
            data: { playerId, room: getPublicRoomState(room) }
          });
        }
        break;
      }

      case 'start_game': {
        const room = rooms.get(roomCode!);
        if (!room || room.hostId !== playerId) break;
        if (room.players.length < 2) {
          sendToPlayer(playerId!, { type: 'error', data: { message: '至少需要2名玩家' } });
          break;
        }

        const shuffled = [...room.players].sort(() => Math.random() - 0.5);
        const numTeams = Math.max(2, Math.ceil(shuffled.length / 2));
        const teams: Team[] = [];
        for (let i = 0; i < numTeams; i++) {
          teams.push({
            id: i,
            name: `队伍 ${String.fromCharCode(65 + i)}`,
            players: [],
            score: 0,
            roundScores: []
          });
        }

        shuffled.forEach((player, idx) => {
          const teamIdx = idx % numTeams;
          player.team = teamIdx;
          teams[teamIdx].players.push(player);
        });

        room.teams = teams;
        room.status = 'playing';
        room.currentRound = 0;
        room.currentTeamIndex = 0;
        room.currentDrawerIndex = 0;

        broadcastToRoom(roomCode!, {
          type: 'teams_assigned',
          data: {
            room: getPublicRoomState(room),
            teams: teams.map((t) => ({
              id: t.id,
              name: t.name,
              players: t.players.map((p) => ({
                id: p.id,
                nickname: p.nickname,
                avatar: p.avatar
              }))
            }))
          }
        });

        setTimeout(() => startRound(room), 4000);
        break;
      }

      case 'draw_action': {
        broadcastToRoom(roomCode!, { type: 'draw_action', data }, playerId);
        break;
      }

      case 'canvas_clear': {
        broadcastToRoom(roomCode!, { type: 'canvas_clear', data: {} }, playerId);
        break;
      }

      case 'canvas_undo': {
        broadcastToRoom(roomCode!, { type: 'canvas_undo', data: {} }, playerId);
        break;
      }

      case 'submit_guess': {
        const room = rooms.get(roomCode!);
        if (!room || room.status !== 'playing') break;

        const guess = (data.guess as string).trim().toLowerCase();
        const target = room.currentWord.toLowerCase();

        if (guess === target) {
          broadcastToRoom(roomCode!, {
            type: 'guess_correct',
            data: {
              playerId,
              guess: data.guess,
              word: room.currentWord
            }
          });
          endRound(room, true);
        } else {
          room.wrongGuesses = Math.min(room.wrongGuesses + 1, 5);
          broadcastToRoom(roomCode!, {
            type: 'guess_wrong',
            data: {
              playerId,
              guess: data.guess,
              wrongGuesses: room.wrongGuesses
            }
          });
        }
        break;
      }

      case 'request_hint': {
        const room = rooms.get(roomCode!);
        if (!room || room.status !== 'playing') break;

        const unrevealedIdx: number[] = [];
        room.revealedLetters.forEach((r, i) => {
          if (!r) unrevealedIdx.push(i);
        });

        if (unrevealedIdx.length > 0) {
          const idx = unrevealedIdx[Math.floor(Math.random() * unrevealedIdx.length)];
          room.revealedLetters[idx] = true;
          room.hintsUsed++;

          broadcastToRoom(roomCode!, {
            type: 'hint_granted',
            data: {
              letter: room.currentWord[idx],
              index: idx,
              revealedLetters: [...room.revealedLetters],
              hintsUsed: room.hintsUsed
            }
          });
        }
        break;
      }

      case 'round_timeout': {
        const room = rooms.get(roomCode!);
        if (!room || room.status !== 'playing') break;
        endRound(room, false);
        break;
      }

      case 'chat_message': {
        broadcastToRoom(roomCode!, {
          type: 'chat_message',
          data: { playerId, message: data.message, timestamp: Date.now() }
        }, playerId);
        break;
      }
    }
  });

  ws.on('close', () => {
    const roomCode = ws.roomCode;
    const playerId = ws.playerId;
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;
    room.players = room.players.filter((p) => p.id !== playerId);
    playerToRoom.delete(playerId);
    if (room.players.length === 0) {
      rooms.delete(roomCode);
    } else {
      if (room.hostId === playerId) {
        room.hostId = room.players[0].id;
      }
      broadcastToRoom(roomCode, {
        type: 'player_left',
        data: { playerId, room: getPublicRoomState(room) }
      });
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket path: ws://localhost:${PORT}/ws`);
});
