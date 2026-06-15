import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import RoomManager from './roomManager';
import { User, Operation } from '../src/types';

const PORT = 3001;

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

const roomManager = new RoomManager();

interface JoinRoomData {
  roomId: string;
  user: User;
}

interface OperationData {
  roomId: string;
  operation: Operation;
}

interface UndoData {
  roomId: string;
  userId: string;
}

io.on('connection', (socket: Socket) => {
  console.log(`Client connected: ${socket.id}`);

  let currentRoomId: string | null = null;
  let currentUserId: string | null = null;

  socket.on('join_room', (data: JoinRoomData) => {
    const { roomId, user } = data;
    currentRoomId = roomId;
    currentUserId = user.id;

    const { room, isNew } = roomManager.addUser(roomId, user);
    socket.join(roomId);

    console.log(`User ${user.nickname} (${user.id}) joined room ${roomId}`);

    socket.emit('room_state', {
      shapes: roomManager.getShapes(roomId),
      users: roomManager.getUsersList(roomId),
    });

    if (isNew) {
      socket.to(roomId).emit('user_joined', user);
    }

    console.log(`Room ${roomId} now has ${room.users.size} users`);
  });

  socket.on('operation', (data: OperationData) => {
    const { roomId, operation } = data;
    
    const room = roomManager.addOperation(roomId, operation);
    if (room) {
      socket.to(roomId).emit('operation', operation);
      console.log(`Operation ${operation.type} broadcasted to room ${roomId}`);
    }
  });

  socket.on('request_undo', (data: UndoData) => {
    const { roomId, userId } = data;
    
    const result = roomManager.undoLastOperationForUser(roomId, userId);
    if (result) {
      const { operation } = result;
      io.to(roomId).emit('undo_performed', operation);
      console.log(`Undo performed in room ${roomId} by user ${userId}`);
    }
  });

  socket.on('leave_room', (data: { roomId: string; userId: string }) => {
    const { roomId, userId } = data;
    const room = roomManager.removeUser(roomId, userId);
    socket.leave(roomId);
    if (room) {
      socket.to(roomId).emit('user_left', userId);
      console.log(`User ${userId} left room ${roomId}`);
    }
    currentRoomId = null;
    currentUserId = null;
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    if (currentRoomId && currentUserId) {
      const room = roomManager.removeUser(currentRoomId, currentUserId);
      if (room) {
        socket.to(currentRoomId).emit('user_left', currentUserId);
        console.log(`User ${currentUserId} removed from room ${currentRoomId} (disconnect)`);
      }
    }
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server ready for collaborative whiteboard`);
});
