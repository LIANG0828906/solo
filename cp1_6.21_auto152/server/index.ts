import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 } from 'uuid';
import battleRoutes from './routes/battleRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import type { RoomState } from '../shared/types.js';

export const rooms = new Map<string, RoomState>();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/battle', battleRoutes);
app.use('/api/rooms', roomRoutes);

app.use('/api/health', (_req, res) => {
  res.json({ success: true, message: 'ok' });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  socket.on('join-room', (roomId: string, playerId: string) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }
    socket.join(roomId);
    io.to(roomId).emit('room-updated', room);
  });

  socket.on('play-card', (data: { roomId: string; playerId: string; cardIndex: number; targetEnemyIndex: number }) => {
    const room = rooms.get(data.roomId);
    if (!room || !room.battleState) return;
    io.to(data.roomId).emit('battle-updated', room.battleState);
    io.to(data.roomId).emit('player-highlight', { playerId: data.playerId, action: 'play-card' });
  });

  socket.on('end-turn', (data: { roomId: string; playerId: string }) => {
    const room = rooms.get(data.roomId);
    if (!room || !room.battleState) return;
    io.to(data.roomId).emit('battle-updated', room.battleState);
    io.to(data.roomId).emit('player-highlight', { playerId: data.playerId, action: 'end-turn' });
  });

  socket.on('disconnect', () => {});
});

export { app, io };

export function startServer() {
  const PORT = 3001;
  httpServer.listen(PORT, () => {
    console.log(`Abyss Echo server running on port ${PORT}`);
  });
}

if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/')) {
  startServer();
}
