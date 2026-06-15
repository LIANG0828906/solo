import { Server as SocketIOServer, Socket } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { BoardUpdateEvent } from '../src/types/index.js';

let io: SocketIOServer | null = null;

export const initSocketService = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const broadcastBoardUpdate = (event: BoardUpdateEvent): void => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  console.log('Broadcasting boardUpdate:', event);
  io.emit('boardUpdate', event);
};

export const getIo = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
