import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3003;

app.use(express.static(path.join(__dirname, 'dist')));

interface PlayerState {
  id: string;
  name: string;
  score: number;
  dishesCompleted: number;
}

const players = new Map<string, PlayerState>();

io.on('connection', (socket: Socket) => {
  console.log('玩家连接:', socket.id);
  
  players.set(socket.id, {
    id: socket.id,
    name: `厨师_${socket.id.slice(0, 4)}`,
    score: 0,
    dishesCompleted: 0
  });

  socket.emit('welcome', {
    playerId: socket.id,
    message: '欢迎来到御膳房！'
  });

  io.emit('playerList', Array.from(players.values()));

  socket.on('dishCompleted', (data: { dish: string; score: number }) => {
    const player = players.get(socket.id);
    if (player) {
      player.score += data.score;
      player.dishesCompleted += 1;
      io.emit('scoreUpdate', { playerId: socket.id, ...data, totalScore: player.score });
    }
  });

  socket.on('chatMessage', (data: { message: string }) => {
    const player = players.get(socket.id);
    if (player) {
      io.emit('chatMessage', {
        playerId: socket.id,
        playerName: player.name,
        message: data.message,
        timestamp: Date.now()
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('玩家断开:', socket.id);
    players.delete(socket.id);
    io.emit('playerList', Array.from(players.values()));
  });
});

httpServer.listen(PORT, () => {
  console.log(`御膳房服务器运行在 http://localhost:${PORT}`);
});
