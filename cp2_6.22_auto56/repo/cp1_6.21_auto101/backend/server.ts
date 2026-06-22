import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import type {
  BoardState,
  BattleLogEntry,
  PlayerColor,
  Move,
  WSClientMessage,
  WSServerMessage,
} from '../src/types';
import {
  createInitialBoard,
  validateMove,
  applyMove,
} from './gameEngine';

interface Room {
  id: string;
  players: {
    white?: string;
    black?: string;
  };
  board: BoardState;
  battleLog: BattleLogEntry[];
  restartVotes: Set<PlayerColor>;
  createdAt: number;
}

const rooms = new Map<string, Room>();
const socketToRoom = new Map<string, { roomId: string; color: PlayerColor }>();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/rooms', (req, res) => {
  const roomId = uuidv4().slice(0, 8);
  const room: Room = {
    id: roomId,
    players: {},
    board: createInitialBoard(),
    battleLog: [],
    restartVotes: new Set(),
    createdAt: Date.now(),
  };
  rooms.set(roomId, room);
  res.json({ roomId });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }
  res.json({
    roomId: room.id,
    hasWhite: !!room.players.white,
    hasBlack: !!room.players.black,
    board: room.board,
    battleLog: room.battleLog,
  });
});

app.post('/api/move/validate', (req, res) => {
  const { roomId, move, playerColor } = req.body as {
    roomId: string;
    move: Move;
    playerColor: PlayerColor;
  };
  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ valid: false, reason: '房间不存在' });
  }
  const result = validateMove(room.board, move, playerColor);
  res.json(result);
});

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function send(ws: WebSocket, msg: WSServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcast(room: Room, msg: WSServerMessage) {
  for (const color of ['white', 'black'] as const) {
    const socketId = room.players[color];
    if (!socketId) continue;
    const clientWs = findWsBySocketId(socketId);
    if (clientWs) send(clientWs, msg);
  }
}

function findWsBySocketId(targetId: string): WebSocket | undefined {
  for (const client of wss.clients) {
    if ((client as any)._socketId === targetId) return client;
  }
  return undefined;
}

wss.on('connection', (ws: WebSocket & { _socketId?: string }) => {
  const socketId = uuidv4();
  (ws as any)._socketId = socketId;

  ws.on('message', (raw) => {
    let data: WSClientMessage;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (data.type === 'join') {
      handleJoin(ws, socketId, data.roomId);
    } else if (data.type === 'move') {
      handleMove(socketId, data.roomId, data.move, data.playerColor);
    } else if (data.type === 'restart') {
      handleRestart(socketId, data.roomId, data.playerColor);
    }
  });

  ws.on('close', () => {
    const info = socketToRoom.get(socketId);
    if (info) {
      const room = rooms.get(info.roomId);
      if (room) {
        if (room.players.white === socketId) delete room.players.white;
        if (room.players.black === socketId) delete room.players.black;
        if (!room.players.white && !room.players.black) {
          setTimeout(() => {
            const cur = rooms.get(info.roomId);
            if (cur && !cur.players.white && !cur.players.black) {
              rooms.delete(info.roomId);
            }
          }, 60000);
        }
      }
      socketToRoom.delete(socketId);
    }
  });
});

function handleJoin(ws: WebSocket, socketId: string, roomId: string) {
  let room = rooms.get(roomId);
  let assignedColor: PlayerColor;

  if (!room) {
    room = {
      id: roomId,
      players: {},
      board: createInitialBoard(),
      battleLog: [],
      restartVotes: new Set(),
      createdAt: Date.now(),
    };
    rooms.set(roomId, room);
  }

  if (!room.players.white) {
    assignedColor = 'white';
    room.players.white = socketId;
  } else if (!room.players.black) {
    assignedColor = 'black';
    room.players.black = socketId;
  } else {
    send(ws, { type: 'move_invalid', reason: '房间已满' });
    return;
  }

  socketToRoom.set(socketId, { roomId, color: assignedColor });

  send(ws, {
    type: 'room_joined',
    roomId,
    playerColor: assignedColor,
    board: room.board,
    battleLog: room.battleLog,
  });

  if (room.players.white && room.players.black) {
    broadcast(room, {
      type: 'player_joined',
      playerColor: assignedColor,
    });
  } else {
    send(ws, { type: 'waiting_for_opponent' });
  }
}

function handleMove(socketId: string, roomId: string, move: Move, playerColor: PlayerColor) {
  const room = rooms.get(roomId);
  if (!room) return;

  const assigned = socketToRoom.get(socketId);
  if (!assigned || assigned.color !== playerColor || assigned.roomId !== roomId) {
    return;
  }

  const validation = validateMove(room.board, move, playerColor);
  if (!validation.valid) {
    const ws = findWsBySocketId(socketId);
    if (ws) send(ws, { type: 'move_invalid', reason: validation.reason || '非法走法' });
    return;
  }

  const result = applyMove(room.board, move);
  room.board = result.board;
  room.battleLog.push(result.battleEntry);

  if (room.board.isGameOver && room.board.winner) {
    broadcast(room, {
      type: 'game_over',
      winner: room.board.winner,
      board: room.board,
      battleLog: room.battleLog,
    });
  } else {
    broadcast(room, {
      type: 'state_update',
      board: room.board,
      battleLog: room.battleLog,
    });
  }
}

function handleRestart(socketId: string, roomId: string, playerColor: PlayerColor) {
  const room = rooms.get(roomId);
  if (!room) return;

  const assigned = socketToRoom.get(socketId);
  if (!assigned || assigned.color !== playerColor || assigned.roomId !== roomId) {
    return;
  }

  room.restartVotes.add(playerColor);

  if (room.restartVotes.size >= 2) {
    room.board = createInitialBoard();
    room.battleLog = [];
    room.restartVotes.clear();
    broadcast(room, {
      type: 'state_update',
      board: room.board,
      battleLog: room.battleLog,
    });
  }
}

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`[backend] Server running on http://localhost:${PORT}`);
});
