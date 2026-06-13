import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type {
  Room,
  Player,
  Bomb,
  WSMessage,
  Obstacle,
  Shockwave,
  Debris,
} from '../shared/types';
import {
  generateObstacles,
  calculateChainReaction,
  createShockwave,
  createDebris,
  updateShockwave,
  updateDebris,
  calculateScore,
  DELAYED_BOMB_TIME,
  MAX_DEBRIS,
} from '../src/physics/explosion';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const rooms = new Map<string, Room>();
const clientRooms = new Map<WebSocket, { roomCode: string; playerId: string }>();

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;
const OBSTACLE_COUNT = 6;
const MAX_PLAYERS = 4;
const TURN_TIME_LIMIT = 60000;

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/room/:code/exists', (req, res) => {
  const exists = rooms.has(req.params.code);
  res.json({ exists });
});

function generateRoomCode(): string {
  let code: string;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms.has(code));
  return code;
}

function createRoom(): Room {
  const obstacles: Obstacle[] = generateObstacles(CANVAS_WIDTH, CANVAS_HEIGHT, OBSTACLE_COUNT);
  return {
    code: '',
    players: [],
    currentPlayerIndex: 0,
    bombs: [],
    obstacles,
    shockwaves: [],
    debris: [],
    gameState: 'waiting',
    roundStartTime: Date.now(),
    roundTimeLimit: TURN_TIME_LIMIT,
  };
}

function sendToClient(ws: WebSocket, message: WSMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcastToRoom(roomCode: string, message: WSMessage, excludeId?: string) {
  const room = rooms.get(roomCode);
  if (!room) return;

  for (const [client, info] of clientRooms.entries()) {
    if (info.roomCode === roomCode && info.playerId !== excludeId) {
      sendToClient(client, message);
    }
  }
}

function getRoomState(room: Room): WSMessage {
  return { type: 'GAME_STATE', room };
}

function nextTurn(room: Room) {
  if (room.players.length === 0) return;
  room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
  room.players.forEach((p, i) => {
    p.isCurrentTurn = i === room.currentPlayerIndex;
  });
  room.roundStartTime = Date.now();
  broadcastToRoom(room.code, {
    type: 'NEXT_TURN',
    currentPlayerIndex: room.currentPlayerIndex,
  });
  broadcastToRoom(room.code, getRoomState(room));
}

async function processExplosion(room: Room, initialBombId: string) {
  const initialBomb = room.bombs.find(b => b.id === initialBombId);
  if (!initialBomb || initialBomb.exploded) return;

  const { triggeredBombs, hitObstacles } = calculateChainReaction(
    initialBombId,
    room.bombs,
    room.obstacles
  );

  const totalDelay = 200;
  for (let i = 0; i < triggeredBombs.length; i++) {
    const bomb = triggeredBombs[i];
    setTimeout(() => {
      bomb.exploded = true;
      bomb.isExploding = true;

      const shockwave: Shockwave = createShockwave(bomb);
      room.shockwaves.push(shockwave);

      const debris: Debris[] = createDebris(bomb.position, 50);
      const availableSlots = MAX_DEBRIS - room.debris.length;
      if (availableSlots > 0) {
        room.debris.push(...debris.slice(0, availableSlots));
      }

      room.obstacles.forEach(obs => {
        if (hitObstacles.includes(obs.id)) {
          obs.hitByExplosion = true;
        }
      });

      broadcastToRoom(room.code, getRoomState(room));

      setTimeout(() => {
        bomb.isExploding = false;
      }, 600);
    }, i * totalDelay);
  }

  const score = calculateScore(triggeredBombs, hitObstacles);
  const player = room.players.find(p => p.id === initialBomb.playerId);
  if (player) {
    player.score += score;
    broadcastToRoom(room.code, {
      type: 'SCORE_UPDATE',
      playerId: player.id,
      score: player.score,
      chainBombs: triggeredBombs.length,
      hitObstacles: hitObstacles.length,
    });
  }

  setTimeout(() => {
    room.bombs = room.bombs.filter(b => !b.exploded);
    nextTurn(room);
  }, triggeredBombs.length * totalDelay + 1000);
}

function gameLoop() {
  const now = Date.now();

  for (const room of rooms.values()) {
    room.shockwaves = room.shockwaves.filter(sw => !updateShockwave(sw, now));
    room.debris = updateDebris(room.debris, 16.67);

    for (const bomb of room.bombs) {
      if (bomb.type === 'delayed' && !bomb.exploded && bomb.explodeAt && now >= bomb.explodeAt) {
        processExplosion(room, bomb.id);
      }
    }

    if (room.gameState === 'playing' && room.players.length > 0) {
      const elapsed = now - room.roundStartTime;
      if (elapsed > room.roundTimeLimit) {
        nextTurn(room);
      }
    }

    if (room.shockwaves.length > 0 || room.debris.length > 0) {
      broadcastToRoom(room.code, getRoomState(room));
    }
  }
}

setInterval(gameLoop, 16);

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (data: string) => {
    let msg: WSMessage;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      sendToClient(ws, { type: 'ERROR', message: 'Invalid message format' });
      return;
    }

    switch (msg.type) {
      case 'CREATE_ROOM': {
        if (!msg.nickname || msg.nickname.trim().length === 0) {
          sendToClient(ws, { type: 'ERROR', message: '昵称不能为空' });
          return;
        }

        const code = generateRoomCode();
        const room = createRoom();
        room.code = code;

        const playerId = uuidv4();
        const player: Player = {
          id: playerId,
          nickname: msg.nickname.trim(),
          score: 0,
          isCurrentTurn: true,
        };
        room.players.push(player);
        rooms.set(code, room);
        clientRooms.set(ws, { roomCode: code, playerId });

        sendToClient(ws, { type: 'ROOM_CREATED', roomCode: code, playerId });
        sendToClient(ws, getRoomState(room));
        break;
      }

      case 'JOIN_ROOM': {
        if (!msg.nickname || msg.nickname.trim().length === 0) {
          sendToClient(ws, { type: 'ERROR', message: '昵称不能为空' });
          return;
        }

        const room = rooms.get(msg.roomCode);
        if (!room) {
          sendToClient(ws, { type: 'ERROR', message: '房间不存在' });
          return;
        }
        if (room.players.length >= MAX_PLAYERS) {
          sendToClient(ws, { type: 'ERROR', message: '房间已满（最多4人）' });
          return;
        }

        const playerId = uuidv4();
        const player: Player = {
          id: playerId,
          nickname: msg.nickname.trim(),
          score: 0,
          isCurrentTurn: room.players.length === 0,
        };
        room.players.push(player);
        clientRooms.set(ws, { roomCode: msg.roomCode, playerId });

        if (room.players.length >= 2 && room.gameState === 'waiting') {
          room.gameState = 'playing';
          room.roundStartTime = Date.now();
        }

        sendToClient(ws, { type: 'ROOM_CREATED', roomCode: msg.roomCode, playerId });
        broadcastToRoom(msg.roomCode, { type: 'PLAYER_JOINED', player });
        broadcastToRoom(msg.roomCode, getRoomState(room));
        break;
      }

      case 'PLACE_BOMB': {
        const info = clientRooms.get(ws);
        if (!info) {
          sendToClient(ws, { type: 'ERROR', message: '未加入房间' });
          return;
        }

        const room = rooms.get(info.roomCode);
        if (!room) {
          sendToClient(ws, { type: 'ERROR', message: '房间不存在' });
          return;
        }
        if (room.gameState !== 'playing') {
          sendToClient(ws, { type: 'ERROR', message: '游戏未开始' });
          return;
        }

        const currentPlayer = room.players[room.currentPlayerIndex];
        if (!currentPlayer || currentPlayer.id !== info.playerId) {
          sendToClient(ws, { type: 'ERROR', message: '不是你的回合' });
          return;
        }

        const bomb: Bomb = {
          ...msg.bomb,
          id: uuidv4(),
          playerId: info.playerId,
          placedAt: Date.now(),
          isExploding: false,
          exploded: false,
        };

        if (bomb.type === 'delayed') {
          bomb.explodeAt = Date.now() + DELAYED_BOMB_TIME;
        }

        room.bombs.push(bomb);
        broadcastToRoom(room.code, getRoomState(room));

        if (bomb.type !== 'delayed') {
          setTimeout(() => processExplosion(room, bomb.id), 300);
        }
        break;
      }

      case 'LEAVE_ROOM': {
        const info = clientRooms.get(ws);
        if (!info) return;

        const room = rooms.get(info.roomCode);
        if (room) {
          room.players = room.players.filter(p => p.id !== info.playerId);
          if (room.players.length === 0) {
            rooms.delete(info.roomCode);
          } else {
            if (room.currentPlayerIndex >= room.players.length) {
              room.currentPlayerIndex = 0;
            }
            room.players.forEach((p, i) => {
              p.isCurrentTurn = i === room.currentPlayerIndex;
            });
            if (room.players.length < 2) {
              room.gameState = 'waiting';
            }
            broadcastToRoom(room.code, getRoomState(room));
          }
        }
        clientRooms.delete(ws);
        break;
      }
    }
  });

  ws.on('close', () => {
    const info = clientRooms.get(ws);
    if (!info) return;

    const room = rooms.get(info.roomCode);
    if (room) {
      room.players = room.players.filter(p => p.id !== info.playerId);
      if (room.players.length === 0) {
        rooms.delete(info.roomCode);
      } else {
        if (room.currentPlayerIndex >= room.players.length) {
          room.currentPlayerIndex = 0;
        }
        room.players.forEach((p, i) => {
          p.isCurrentTurn = i === room.currentPlayerIndex;
        });
        if (room.players.length < 2) {
          room.gameState = 'waiting';
        }
        broadcastToRoom(room.code, getRoomState(room));
      }
    }
    clientRooms.delete(ws);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
});
