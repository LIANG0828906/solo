import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { roomManager, RoomState, RoundState, RoundResult, FinalResult } from './rooms';

// 创建Express应用
const app = express();

// 启用CORS中间件
app.use(cors());

// 启用JSON解析中间件
app.use(express.json());

// 健康检查路由
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: Date.now(),
  });
});

// 创建HTTP服务器
const server = http.createServer(app);

// 创建Socket.IO服务器并挂载到HTTP服务器上
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// 定义Socket事件处理类型
interface ClientToServerEvents {
  'room:create': (data: { nickname: string; config: { totalRounds: number; timePerQuestion: number; teamCount: number } }) => void;
  'room:join': (data: { nickname: string; roomCode: string }) => void;
  'room:leave': () => void;
  'player:ready': (ready: boolean) => void;
  'game:start': () => void;
  'game:answer': (data: { answerId: string }) => void;
  'game:useHelp': () => void;
  'game:helpAnswer': (data: { answerId: string; targetTeamId: string }) => void;
  'game:nextRound': () => void;
}

interface ServerToClientEvents {
  'room:created': (data: { roomCode: string; playerId: string }) => void;
  'room:joined': (data: { room: RoomState; playerId: string }) => void;
  'room:error': (message: string) => void;
  'room:update': (room: RoomState) => void;
  'game:started': (state: RoomState) => void;
  'game:newRound': (round: RoundState) => void;
  'game:roundEnd': (data: RoundResult) => void;
  'game:ended': (data: FinalResult) => void;
}

// 工具函数：向房间内所有玩家广播房间更新
const broadcastRoomUpdate = (roomCode: string): void => {
  const room = roomManager.getRoomState(roomCode);
  if (room) {
    io.to(roomCode).emit('room:update', room);
  }
};

// 处理新的Socket连接
io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  // 当前连接的玩家所在房间码
  let currentRoomCode: string | null = null;
  // 当前连接的玩家ID
  let currentPlayerId: string | null = null;

  // 创建房间事件
  socket.on('room:create', (data) => {
    const { nickname, config } = data;
    const result = roomManager.createRoom(config, nickname, socket.id);
    currentRoomCode = result.roomCode;
    currentPlayerId = result.playerId;
    socket.join(result.roomCode);
    socket.emit('room:created', result);
    broadcastRoomUpdate(result.roomCode);
  });

  // 加入房间事件
  socket.on('room:join', (data) => {
    const { nickname, roomCode } = data;
    const result = roomManager.joinRoom(roomCode, nickname, socket.id);
    if (!result) {
      socket.emit('room:error', '房间不存在或游戏已开始');
      return;
    }
    currentRoomCode = roomCode;
    currentPlayerId = result.playerId;
    socket.join(roomCode);
    socket.emit('room:joined', result);
    broadcastRoomUpdate(roomCode);
  });

  // 离开房间事件
  socket.on('room:leave', () => {
    if (currentRoomCode && currentPlayerId) {
      const roomCode = currentRoomCode;
      roomManager.leaveRoom(currentRoomCode, currentPlayerId);
      socket.leave(roomCode);
      currentRoomCode = null;
      currentPlayerId = null;
      broadcastRoomUpdate(roomCode);
    }
  });

  // 玩家就绪事件
  socket.on('player:ready', (ready: boolean) => {
    if (currentRoomCode && currentPlayerId) {
      roomManager.setPlayerReady(currentRoomCode, currentPlayerId, ready);
      broadcastRoomUpdate(currentRoomCode);
    }
  });

  // 开始游戏事件
  socket.on('game:start', () => {
    if (!currentRoomCode) return;
    const room = roomManager.startGame(currentRoomCode);
    if (!room) {
      socket.emit('room:error', '无法开始游戏');
      return;
    }
    const roundState = roomManager.getNextQuestion(currentRoomCode);
    io.to(currentRoomCode).emit('game:started', room);
    if (roundState) {
      io.to(currentRoomCode).emit('game:newRound', roundState);
    }
    broadcastRoomUpdate(currentRoomCode);
  });

  // 提交答案事件
  socket.on('game:answer', (data) => {
    if (!currentRoomCode || !currentPlayerId) return;
    roomManager.submitAnswer(currentRoomCode, currentPlayerId, data.answerId);
    broadcastRoomUpdate(currentRoomCode);
  });

  // 使用求援事件
  socket.on('game:useHelp', () => {
    if (!currentRoomCode || !currentPlayerId) return;
    roomManager.useHelp(currentRoomCode, currentPlayerId);
    broadcastRoomUpdate(currentRoomCode);
  });

  // 代答事件
  socket.on('game:helpAnswer', (data) => {
    if (!currentRoomCode || !currentPlayerId) return;
    roomManager.submitHelpAnswer(currentRoomCode, currentPlayerId, data.answerId, data.targetTeamId);
    broadcastRoomUpdate(currentRoomCode);
  });

  // 下一回合事件
  socket.on('game:nextRound', () => {
    if (!currentRoomCode) return;
    const result = roomManager.endRound(currentRoomCode);
    if (result) {
      io.to(currentRoomCode).emit('game:roundEnd', result.roundResult);
      if (result.finalResult) {
        io.to(currentRoomCode).emit('game:ended', result.finalResult);
      } else {
        const roundState = roomManager.getNextQuestion(currentRoomCode);
        if (roundState) {
          io.to(currentRoomCode).emit('game:newRound', roundState);
        }
      }
    }
    broadcastRoomUpdate(currentRoomCode);
  });

  // 断开连接事件
  socket.on('disconnect', () => {
    if (currentRoomCode && currentPlayerId) {
      const roomCode = currentRoomCode;
      roomManager.leaveRoom(roomCode, currentPlayerId);
      currentRoomCode = null;
      currentPlayerId = null;
      broadcastRoomUpdate(roomCode);
    }
  });
});

// 启动服务器监听3001端口
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default server;
