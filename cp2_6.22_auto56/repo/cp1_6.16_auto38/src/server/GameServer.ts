import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import { BoardState, GameState, MoveRecord, PieceColor, PlayerInfo, Position, RoomInfo, WSMessage } from '../shared/types';
import { ChessEngine } from './game/ChessEngine';

interface ClientWS extends WebSocket {
  playerId?: string;
  roomId?: string;
}

interface GameRoom {
  roomId: string;
  players: Map<string, { color: PieceColor; ws: ClientWS }>;
  gameState: GameState;
  timerInterval: NodeJS.Timeout | null;
  lastActivity: number;
}

const rooms = new Map<string, GameRoom>();
const waitingQueue: ClientWS[] = [];
const playerRoomMap = new Map<string, string>();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createInitialState(): GameState {
  return {
    board: ChessEngine.createInitialBoard(),
    currentTurn: 'red',
    redTime: 30 * 60,
    blackTime: 30 * 60,
    moveHistory: [],
    status: 'waiting',
    winner: null,
  };
}

function sendToClient(ws: ClientWS, message: WSMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcastToRoom(roomId: string, message: WSMessage, excludePlayerId?: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.players.forEach((player, playerId) => {
    if (playerId !== excludePlayerId) {
      sendToClient(player.ws, message);
    }
  });
}

function startGame(room: GameRoom) {
  room.gameState.status = 'playing';
  startTimer(room);

  const players = Array.from(room.players.values());
  const playerInfos: PlayerInfo[] = Array.from(room.players.entries()).map(([id, p]) => ({
    id,
    color: p.color,
    name: `玩家${p.color === 'red' ? '红' : '黑'}`,
  }));

  room.players.forEach((player, playerId) => {
    sendToClient(player.ws, {
      type: 'GAME_START',
      payload: {
        roomId: room.roomId,
        players: playerInfos,
        gameState: room.gameState,
        yourColor: player.color,
      },
    });
  });
}

function startTimer(room: GameRoom) {
  if (room.timerInterval) clearInterval(room.timerInterval);

  room.timerInterval = setInterval(() => {
    if (room.gameState.status !== 'playing' && room.gameState.status !== 'check') return;

    if (room.gameState.currentTurn === 'red') {
      room.gameState.redTime--;
      if (room.gameState.redTime <= 0) {
        room.gameState.redTime = 0;
        endGame(room, 'timeout', 'black');
        return;
      }
    } else {
      room.gameState.blackTime--;
      if (room.gameState.blackTime <= 0) {
        room.gameState.blackTime = 0;
        endGame(room, 'timeout', 'red');
        return;
      }
    }

    broadcastToRoom(room.roomId, {
      type: 'TIMER_UPDATE',
      payload: {
        redTime: room.gameState.redTime,
        blackTime: room.gameState.blackTime,
      },
    });
  }, 1000);
}

function endGame(room: GameRoom, status: 'checkmate' | 'stalemate' | 'timeout' | 'resigned', winner: PieceColor) {
  room.gameState.status = status;
  room.gameState.winner = winner;

  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }

  broadcastToRoom(room.roomId, {
    type: 'GAME_OVER',
    payload: {
      status,
      winner,
      gameState: room.gameState,
    },
  });
}

function handleMove(room: GameRoom, playerId: string, from: Position, to: Position) {
  const player = room.players.get(playerId);
  if (!player) return;

  if (player.color !== room.gameState.currentTurn) {
    sendToClient(player.ws, { type: 'INVALID_MOVE', payload: { reason: '不是你的回合' } });
    return;
  }

  if (room.gameState.status !== 'playing' && room.gameState.status !== 'check') {
    sendToClient(player.ws, { type: 'INVALID_MOVE', payload: { reason: '游戏已结束' } });
    return;
  }

  const validation = ChessEngine.isValidMove(room.gameState.board, from, to, room.gameState.currentTurn);
  if (!validation.valid) {
    sendToClient(player.ws, { type: 'INVALID_MOVE', payload: { reason: validation.reason } });
    return;
  }

  const piece = room.gameState.board[from.row][from.col]!;
  const boardBefore = ChessEngine.cloneBoard(room.gameState.board);
  const { newBoard, captured } = ChessEngine.makeMove(room.gameState.board, from, to);
  const notation = ChessEngine.generateNotation(from, to, piece, boardBefore);

  const moveRecord: MoveRecord = {
    from,
    to,
    piece: { ...piece },
    captured: captured ? { ...captured } : null,
    notation,
    timestamp: Date.now(),
    redTime: room.gameState.redTime,
    blackTime: room.gameState.blackTime,
  };

  room.gameState.moveHistory.push(moveRecord);
  room.gameState.board = newBoard;

  const nextTurn: PieceColor = room.gameState.currentTurn === 'red' ? 'black' : 'red';
  room.gameState.currentTurn = nextTurn;

  const inCheck = ChessEngine.isInCheck(newBoard, nextTurn);
  const endResult = ChessEngine.checkGameEnd(newBoard, nextTurn);

  if (endResult.ended) {
    room.gameState.board = newBoard;
    endGame(room, endResult.status!, endResult.winner!);
  } else if (inCheck) {
    room.gameState.status = 'check';
  } else {
    room.gameState.status = 'playing';
  }

  broadcastToRoom(room.roomId, {
    type: 'MOVE_MADE',
    payload: {
      from,
      to,
      piece: moveRecord.piece,
      captured: moveRecord.captured,
      notation,
      currentTurn: room.gameState.currentTurn,
      status: room.gameState.status,
      redTime: room.gameState.redTime,
      blackTime: room.gameState.blackTime,
    },
  });
}

function removePlayerFromRoom(playerId: string) {
  const roomId = playerRoomMap.get(playerId);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  room.players.delete(playerId);
  playerRoomMap.delete(playerId);

  if (room.players.size === 0) {
    if (room.timerInterval) clearInterval(room.timerInterval);
    rooms.delete(roomId);
  } else {
    if (room.gameState.status === 'playing' || room.gameState.status === 'check') {
      const remainingPlayer = Array.from(room.players.values())[0];
      endGame(room, 'resigned', remainingPlayer.color);
    }
    broadcastToRoom(roomId, {
      type: 'PLAYER_DISCONNECTED',
      payload: { playerId },
    });
  }
}

function matchPlayers(ws1: ClientWS, ws2: ClientWS) {
  const roomId = generateRoomCode();
  const room: GameRoom = {
    roomId,
    players: new Map(),
    gameState: createInitialState(),
    timerInterval: null,
    lastActivity: Date.now(),
  };

  const firstColor: PieceColor = Math.random() < 0.5 ? 'red' : 'black';
  const secondColor: PieceColor = firstColor === 'red' ? 'black' : 'red';

  ws1.playerId = ws1.playerId || uuidv4();
  ws2.playerId = ws2.playerId || uuidv4();

  ws1.roomId = roomId;
  ws2.roomId = roomId;

  room.players.set(ws1.playerId, { color: firstColor, ws: ws1 });
  room.players.set(ws2.playerId, { color: secondColor, ws: ws2 });

  playerRoomMap.set(ws1.playerId, roomId);
  playerRoomMap.set(ws2.playerId, roomId);

  rooms.set(roomId, room);

  sendToClient(ws1, {
    type: 'MATCH_FOUND',
    payload: { roomId, yourColor: firstColor },
  });
  sendToClient(ws2, {
    type: 'MATCH_FOUND',
    payload: { roomId, yourColor: secondColor },
  });

  startGame(room);
}

wss.on('connection', (ws: ClientWS) => {
  ws.playerId = uuidv4();

  sendToClient(ws, {
    type: 'GAME_STATE',
    payload: { playerId: ws.playerId },
  });

  ws.on('message', (data: Buffer) => {
    try {
      const message: WSMessage = JSON.parse(data.toString());
      handleMessage(ws, message);
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  });

  ws.on('close', () => {
    const idx = waitingQueue.indexOf(ws);
    if (idx !== -1) waitingQueue.splice(idx, 1);

    if (ws.playerId) {
      removePlayerFromRoom(ws.playerId);
    }
  });
});

function handleMessage(ws: ClientWS, message: WSMessage) {
  switch (message.type) {
    case 'CREATE_ROOM': {
      const roomId = generateRoomCode();
      const room: GameRoom = {
        roomId,
        players: new Map(),
        gameState: createInitialState(),
        timerInterval: null,
        lastActivity: Date.now(),
      };

      const color: PieceColor = Math.random() < 0.5 ? 'red' : 'black';
      ws.roomId = roomId;
      room.players.set(ws.playerId!, { color, ws });
      playerRoomMap.set(ws.playerId!, roomId);
      rooms.set(roomId, room);

      sendToClient(ws, {
        type: 'ROOM_CREATED',
        payload: { roomId, yourColor: color },
      });
      break;
    }

    case 'JOIN_ROOM': {
      const { roomCode } = message.payload;
      const room = rooms.get(roomCode);

      if (!room) {
        sendToClient(ws, { type: 'JOIN_FAILED', payload: { reason: '房间不存在' } });
        return;
      }

      if (room.players.size >= 2) {
        sendToClient(ws, { type: 'JOIN_FAILED', payload: { reason: '房间已满' } });
        return;
      }

      const existingPlayer = Array.from(room.players.values())[0];
      const color: PieceColor = existingPlayer.color === 'red' ? 'black' : 'red';

      ws.roomId = roomCode;
      room.players.set(ws.playerId!, { color, ws });
      playerRoomMap.set(ws.playerId!, roomCode);

      sendToClient(ws, {
        type: 'JOIN_SUCCESS',
        payload: { roomId: roomCode, yourColor: color },
      });

      startGame(room);
      break;
    }

    case 'RANDOM_MATCH': {
      waitingQueue.push(ws);

      if (waitingQueue.length >= 2) {
        const p1 = waitingQueue.shift()!;
        const p2 = waitingQueue.shift()!;
        matchPlayers(p1, p2);
      }
      break;
    }

    case 'MAKE_MOVE': {
      const { from, to } = message.payload;
      const roomId = ws.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      handleMove(room, ws.playerId!, from, to);
      break;
    }

    case 'CHAT_MESSAGE': {
      const roomId = ws.roomId;
      if (!roomId) return;
      broadcastToRoom(roomId, {
        type: 'CHAT_MESSAGE',
        payload: {
          playerId: ws.playerId,
          message: message.payload.message,
          color: rooms.get(roomId)?.players.get(ws.playerId!)?.color,
        },
      });
      break;
    }

    case 'RESIGN': {
      const roomId = ws.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      const player = room.players.get(ws.playerId!);
      if (!player) return;
      const winner: PieceColor = player.color === 'red' ? 'black' : 'red';
      endGame(room, 'resigned', winner);
      break;
    }

    case 'REQUEST_REPLAY': {
      const roomId = ws.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      sendToClient(ws, {
        type: 'REPLAY_DATA',
        payload: {
          moveHistory: room.gameState.moveHistory,
          pgn: ChessEngine.boardToPGN(room.gameState.moveHistory),
        },
      });
      break;
    }
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', rooms: rooms.size, waiting: waitingQueue.length });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Chess server running on port ${PORT}`);
});
