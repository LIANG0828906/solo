import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { GameEngine } from '../src/game/GameEngine';
import { Ship, EchoResult, TURN_DURATION, SONAR_DELAY } from '../src/types';
import { generateRoomCode } from '../src/utils/arrayHelpers';

interface Player {
  id: string;
  name: string;
  socketId: string;
  ships: Ship[];
  sonarResults: { x: number; y: number; result: EchoResult }[];
  sunkCount: number;
}

interface Room {
  code: string;
  players: Player[];
  currentTurn: string;
  turnExpiry: number;
  gameStarted: boolean;
  gameOver: boolean;
  winner: string | null;
  turnTimer: NodeJS.Timeout | null;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map<string, Room>();
const gameEngine = new GameEngine();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

function getPlayerBySocketId(socketId: string): { player: Player; room: Room } | null {
  for (const room of rooms.values()) {
    const player = room.players.find(p => p.socketId === socketId);
    if (player) {
      return { player, room };
    }
  }
  return null;
}

function startTurnTimer(room: Room) {
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
  }

  room.turnExpiry = Date.now() + TURN_DURATION * 1000;
  
  room.turnTimer = setTimeout(() => {
    if (!room.gameOver && room.gameStarted) {
      const nextPlayer = room.players.find(p => p.id !== room.currentTurn);
      
      if (nextPlayer) {
        room.currentTurn = nextPlayer.id;
        io.to(room.code).emit('turn_change', {
          currentTurn: nextPlayer.id,
          timeRemaining: TURN_DURATION,
        });
        startTurnTimer(room);
      }
    }
  }, TURN_DURATION * 1000);
}

function checkGameEnd(room: Room): boolean {
  for (const player of room.players) {
    const allSunk = player.ships.every(ship => ship.sunk);
    if (allSunk) {
      room.gameOver = true;
      room.winner = room.players.find(p => p.id !== player.id)?.id || null;
      
      if (room.turnTimer) {
        clearTimeout(room.turnTimer);
        room.turnTimer = null;
      }

      const winnerPlayer = room.players.find(p => p.id === room.winner);
      const loserPlayer = room.players.find(p => p.id !== room.winner);

      for (const p of room.players) {
        io.to(p.socketId).emit('game_over', {
          winner: room.winner,
          mySunkCount: p.id === room.winner ? (loserPlayer?.sunkCount || 0) : (winnerPlayer?.sunkCount || 0),
          opponentSunkCount: p.id === room.winner ? (winnerPlayer?.sunkCount || 0) : (loserPlayer?.sunkCount || 0),
        });
      }

      return true;
    }
  }
  return false;
}

io.on('connection', (socket: Socket) => {
  console.log('Client connected:', socket.id);

  socket.on('create_room', ({ playerName }: { playerName: string }) => {
    const roomCode = generateRoomCode();
    const playerId = uuidv4();

    const room: Room = {
      code: roomCode,
      players: [],
      currentTurn: '',
      turnExpiry: 0,
      gameStarted: false,
      gameOver: false,
      winner: null,
      turnTimer: null,
    };

    const player: Player = {
      id: playerId,
      name: playerName,
      socketId: socket.id,
      ships: [],
      sonarResults: [],
      sunkCount: 0,
    };

    room.players.push(player);
    rooms.set(roomCode, room);

    socket.join(roomCode);
    socket.emit('room_created', { roomCode, playerId });
  });

  socket.on('join_room', ({ roomCode, playerName }: { roomCode: string; playerName: string }) => {
    const room = rooms.get(roomCode.toUpperCase());

    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }

    if (room.players.length >= 2) {
      socket.emit('error', { message: '房间已满' });
      return;
    }

    if (room.gameStarted) {
      socket.emit('error', { message: '游戏已开始' });
      return;
    }

    const playerId = uuidv4();
    const player: Player = {
      id: playerId,
      name: playerName,
      socketId: socket.id,
      ships: [],
      sonarResults: [],
      sunkCount: 0,
    };

    room.players.push(player);
    socket.join(roomCode);

    const player1Ships = gameEngine.generateRandomShipLayout();
    const player2Ships = gameEngine.generateRandomShipLayout();

    room.players[0].ships = player1Ships;
    room.players[1].ships = player2Ships;

    const firstPlayer = Math.random() > 0.5 ? room.players[0].id : room.players[1].id;
    room.currentTurn = firstPlayer;
    room.gameStarted = true;

    const opponent = room.players.find(p => p.id !== playerId)!;

    socket.emit('room_joined', {
      roomCode,
      playerId,
      opponentName: opponent.name,
      myShips: player2Ships,
      firstPlayer,
    });

    socket.to(roomCode).emit('opponent_joined', {
      opponentName: playerName,
      myShips: player1Ships,
      firstPlayer,
    });

    startTurnTimer(room);
  });

  socket.on('sonar_fire', async ({ roomCode, playerId, x, y }: {
    roomCode: string;
    playerId: string;
    x: number;
    y: number;
  }) => {
    const room = rooms.get(roomCode.toUpperCase());
    if (!room || room.gameOver || !room.gameStarted) return;

    const attacker = room.players.find(p => p.id === playerId);
    const defender = room.players.find(p => p.id !== playerId);

    if (!attacker || !defender) return;
    if (room.currentTurn !== playerId) return;

    if (room.turnTimer) {
      clearTimeout(room.turnTimer);
      room.turnTimer = null;
    }

    const existingResult = attacker.sonarResults.find(r => r.x === x && r.y === y);
    if (existingResult) return;

    await new Promise(resolve => setTimeout(resolve, SONAR_DELAY));

    const { result, hitShip, hitCell } = gameEngine.getSonarResult(x, y, defender.ships);

    attacker.sonarResults.push({ x, y, result });

    let sunkShip: Ship | undefined;
    if (hitShip && hitCell) {
      const shipIndex = defender.ships.findIndex(s => s.id === hitShip.id);
      if (shipIndex !== -1) {
        defender.ships[shipIndex] = gameEngine.processHit(defender.ships[shipIndex], hitCell);
        if (defender.ships[shipIndex].sunk) {
          sunkShip = defender.ships[shipIndex];
          attacker.sunkCount++;
          defender.sunkCount = defender.ships.filter(s => s.sunk).length;
        }
      }
    }

    socket.emit('sonar_result', {
      x,
      y,
      result,
      sunkShip,
    });

    socket.to(roomCode).emit('opponent_sonar', {
      x,
      y,
      result,
    });

    if (checkGameEnd(room)) return;

    room.currentTurn = defender.id;
    io.to(roomCode).emit('turn_change', {
      currentTurn: defender.id,
      timeRemaining: TURN_DURATION,
    });

    startTurnTimer(room);
  });

  socket.on('chat_message', ({ roomCode, playerId, content }: {
    roomCode: string;
    playerId: string;
    content: string;
  }) => {
    const room = rooms.get(roomCode.toUpperCase());
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    const timestamp = Date.now();
    io.to(roomCode).emit('chat_message', {
      senderName: player.name,
      content,
      timestamp,
    });
  });

  socket.on('turn_timeout', ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
    const room = rooms.get(roomCode.toUpperCase());
    if (!room || room.gameOver || !room.gameStarted) return;
    if (room.currentTurn !== playerId) return;

    const nextPlayer = room.players.find(p => p.id !== playerId);
    if (!nextPlayer) return;

    room.currentTurn = nextPlayer.id;
    io.to(roomCode).emit('turn_change', {
      currentTurn: nextPlayer.id,
      timeRemaining: TURN_DURATION,
    });

    startTurnTimer(room);
  });

  socket.on('leave_room', ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
    const room = rooms.get(roomCode.toUpperCase());
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
      const remainingPlayer = room.players.find(p => p.id !== playerId);
      if (remainingPlayer) {
        socket.to(roomCode).emit('opponent_disconnected', {});
      }

      room.players.splice(playerIndex, 1);

      if (room.players.length === 0) {
        if (room.turnTimer) {
          clearTimeout(room.turnTimer);
        }
        rooms.delete(roomCode);
      }
    }

    socket.leave(roomCode);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const result = getPlayerBySocketId(socket.id);
    
    if (result) {
      const { player, room } = result;
      
      if (room.turnTimer) {
        clearTimeout(room.turnTimer);
        room.turnTimer = null;
      }

      const remainingPlayer = room.players.find(p => p.id !== player.id);
      if (remainingPlayer) {
        io.to(remainingPlayer.socketId).emit('opponent_disconnected', {});
      }

      const playerIndex = room.players.findIndex(p => p.id === player.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
      }

      if (room.players.length === 0) {
        rooms.delete(room.code);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`EchoBattleship server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});
