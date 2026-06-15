import express = require('express');
import http = require('http');
import socketio = require('socket.io');
import path = require('path');

const { Server } = socketio;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

type Socket = socketio.Socket;

interface Player {
  id: string;
  name: string;
  score: number;
  throws: ThrowRecord[];
  isHost: boolean;
}

interface ThrowRecord {
  angle: number;
  power: number;
  score: number;
  startX: number;
  startY: number;
}

interface Room {
  id: string;
  players: Player[];
  hostId: string;
  gameStarted: boolean;
  currentPlayerIndex: number;
  currentThrowCount: number;
  round: number;
}

const rooms = new Map<string, Room>();

const MAX_PLAYERS = 4;
const MAX_THROWS_PER_PLAYER = 5;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));

function generateRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

function broadcastRoomState(room: Room): void {
  io.to(room.id).emit('room_state', {
    id: room.id,
    players: room.players,
    hostId: room.hostId,
    gameStarted: room.gameStarted,
    currentPlayerIndex: room.currentPlayerIndex,
    currentThrowCount: room.currentThrowCount,
    round: room.round
  });
}

function calculateThrowScore(angle: number, power: number, startX: number, startY: number): number {
  const normalizedPower = Math.min(Math.max(power, 0), 100);
  const normalizedAngle = Math.min(Math.max(angle, 0), 180);
  
  const targetAngle = 90;
  const targetPower = 75;
  
  const angleDiff = Math.abs(normalizedAngle - targetAngle);
  const powerDiff = Math.abs(normalizedPower - targetPower);
  
  const baseScore = 100;
  const anglePenalty = angleDiff * 0.8;
  const powerPenalty = powerDiff * 0.6;
  
  const distanceFactor = 1 - (Math.abs(startX - 400) / 800 + Math.abs(startY - 300) / 600) * 0.1;
  
  const finalScore = Math.max(0, Math.round((baseScore - anglePenalty - powerPenalty) * distanceFactor));
  return finalScore;
}

io.on('connection', (socket: Socket) => {
  console.log(`[SOCKET] 客户端连接: ${socket.id}`);

  socket.on('create_room', ({ playerName, roomId }: { playerName: string; roomId?: string }) => {
    console.log(`[SOCKET] create_room - 玩家: ${playerName}, 房间ID: ${roomId || '自动生成'}`);
    
    const finalRoomId = roomId || generateRoomId();
    
    if (rooms.has(finalRoomId)) {
      socket.emit('error', { message: '房间已存在' });
      return;
    }

    const newPlayer: Player = {
      id: socket.id,
      name: playerName,
      score: 0,
      throws: [],
      isHost: true
    };

    const newRoom: Room = {
      id: finalRoomId,
      players: [newPlayer],
      hostId: socket.id,
      gameStarted: false,
      currentPlayerIndex: 0,
      currentThrowCount: 0,
      round: 0
    };

    rooms.set(finalRoomId, newRoom);
    socket.join(finalRoomId);

    socket.emit('room_created', { roomId: finalRoomId });
    broadcastRoomState(newRoom);
    
    console.log(`[SOCKET] 房间创建成功: ${finalRoomId}, 房主: ${playerName}`);
  });

  socket.on('join_room', ({ playerName, roomId }: { playerName: string; roomId: string }) => {
    console.log(`[SOCKET] join_room - 玩家: ${playerName}, 房间ID: ${roomId}`);
    
    const room = getRoom(roomId);
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }

    if (room.players.length >= MAX_PLAYERS) {
      socket.emit('error', { message: '房间已满' });
      return;
    }

    if (room.gameStarted) {
      socket.emit('error', { message: '游戏已开始，无法加入' });
      return;
    }

    const existingPlayer = room.players.find(p => p.id === socket.id);
    if (existingPlayer) {
      socket.emit('error', { message: '您已在房间中' });
      return;
    }

    const newPlayer: Player = {
      id: socket.id,
      name: playerName,
      score: 0,
      throws: [],
      isHost: false
    };

    room.players.push(newPlayer);
    socket.join(roomId);

    socket.emit('room_joined', { roomId: room.id });
    socket.to(roomId).emit('player_joined', { player: newPlayer });
    broadcastRoomState(room);
    
    console.log(`[SOCKET] 玩家加入成功: ${playerName} -> ${roomId}`);
  });

  socket.on('start_game', (roomId: string) => {
    console.log(`[SOCKET] start_game - 房间ID: ${roomId}`);
    
    const room = getRoom(roomId);
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }

    if (room.hostId !== socket.id) {
      socket.emit('error', { message: '仅房主可开始游戏' });
      return;
    }

    if (room.players.length < 1) {
      socket.emit('error', { message: '至少需要1名玩家' });
      return;
    }

    room.gameStarted = true;
    room.currentPlayerIndex = 0;
    room.currentThrowCount = 0;
    room.round = 1;

    room.players.forEach(player => {
      player.score = 0;
      player.throws = [];
    });

    io.to(roomId).emit('game_started', { room });
    broadcastRoomState(room);
    
    console.log(`[SOCKET] 游戏开始: ${roomId}`);
  });

  socket.on('throw_arrow', ({ roomId, angle, power, startX, startY }: { roomId: string; angle: number; power: number; startX: number; startY: number }) => {
    console.log(`[SOCKET] throw_arrow - 房间ID: ${roomId}, 玩家: ${socket.id}, 角度: ${angle}, 力度: ${power}`);
    
    const room = getRoom(roomId);
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }

    if (!room.gameStarted) {
      socket.emit('error', { message: '游戏未开始' });
      return;
    }

    const currentPlayer = room.players[room.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id !== socket.id) {
      socket.emit('error', { message: '不是您的回合' });
      return;
    }

    if (room.currentThrowCount >= MAX_THROWS_PER_PLAYER) {
      socket.emit('error', { message: '您已完成本轮投掷' });
      return;
    }

    const throwScore = calculateThrowScore(angle, power, startX, startY);
    
    const throwRecord: ThrowRecord = {
      angle,
      power,
      score: throwScore,
      startX,
      startY
    };

    currentPlayer.throws.push(throwRecord);
    currentPlayer.score += throwScore;

    io.to(roomId).emit('throw_broadcast', {
      playerId: socket.id,
      playerName: currentPlayer.name,
      angle,
      power,
      startX,
      startY,
      score: throwScore
    });

    room.currentThrowCount++;

    io.to(roomId).emit('score_update', {
      players: room.players,
      lastThrow: {
        playerId: socket.id,
        score: throwScore,
        throwNumber: room.currentThrowCount
      }
    });

    broadcastRoomState(room);
    
    console.log(`[SOCKET] 投掷完成 - 玩家: ${currentPlayer.name}, 得分: ${throwScore}, 累计: ${currentPlayer.score}`);
  });

  socket.on('player_turn_end', (roomId: string) => {
    console.log(`[SOCKET] player_turn_end - 房间ID: ${roomId}, 玩家: ${socket.id}`);
    
    const room = getRoom(roomId);
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }

    if (!room.gameStarted) {
      socket.emit('error', { message: '游戏未开始' });
      return;
    }

    const currentPlayer = room.players[room.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id !== socket.id) {
      socket.emit('error', { message: '不是您的回合' });
      return;
    }

    if (room.currentThrowCount < MAX_THROWS_PER_PLAYER) {
      socket.emit('error', { message: `还需投掷 ${MAX_THROWS_PER_PLAYER - room.currentThrowCount} 次` });
      return;
    }

    room.currentPlayerIndex++;
    room.currentThrowCount = 0;

    if (room.currentPlayerIndex >= room.players.length) {
      room.currentPlayerIndex = 0;
      room.round++;

      if (room.round > 1) {
        room.gameStarted = false;
        
        const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
        const winner = sortedPlayers[0];
        
        io.to(roomId).emit('game_finished', {
          players: room.players,
          winner: {
            id: winner.id,
            name: winner.name,
            score: winner.score
          }
        });
        
        console.log(`[SOCKET] 游戏结束 - 房间: ${roomId}, 胜者: ${winner.name}, 分数: ${winner.score}`);
        broadcastRoomState(room);
        return;
      }
    }

    const nextPlayer = room.players[room.currentPlayerIndex];
    io.to(roomId).emit('turn_changed', {
      currentPlayerIndex: room.currentPlayerIndex,
      currentPlayer: nextPlayer,
      round: room.round,
      throwCount: room.currentThrowCount
    });

    broadcastRoomState(room);
    
    console.log(`[SOCKET] 回合切换 - 下一位: ${nextPlayer.name}, 轮次: ${room.round}`);
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] 客户端断开连接: ${socket.id}`);
    
    let affectedRoomId: string | null = null;
    
    for (const [roomId, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        affectedRoomId = roomId;
        const leftPlayer = room.players[playerIndex];
        
        room.players.splice(playerIndex, 1);
        
        socket.to(roomId).emit('player_left', {
          playerId: socket.id,
          playerName: leftPlayer.name
        });

        if (room.players.length === 0) {
          rooms.delete(roomId);
          console.log(`[SOCKET] 房间已删除: ${roomId} (无玩家)`);
        } else {
          if (room.hostId === socket.id) {
            room.hostId = room.players[0].id;
            room.players[0].isHost = true;
          }

          if (room.gameStarted) {
            if (playerIndex === room.currentPlayerIndex) {
              if (room.currentPlayerIndex >= room.players.length) {
                room.currentPlayerIndex = 0;
                room.round++;
                
                if (room.round > 1) {
                  room.gameStarted = false;
                  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
                  const winner = sortedPlayers[0];
                  
                  io.to(roomId).emit('game_finished', {
                    players: room.players,
                    winner: {
                      id: winner.id,
                      name: winner.name,
                      score: winner.score
                    }
                  });
                }
              }
            } else if (playerIndex < room.currentPlayerIndex) {
              room.currentPlayerIndex--;
            }
          }

          broadcastRoomState(room);
        }

        console.log(`[SOCKET] 玩家离开: ${leftPlayer.name} -> ${roomId}`);
        break;
      }
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`[SERVER] 服务器启动，监听端口 ${PORT}`);
});
