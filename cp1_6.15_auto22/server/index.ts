import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './roomManager';
import type { Note, User } from '../src/utils/types';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('joinRoom', ({ roomId, user }: { roomId: string; user: User }) => {
    socket.join(roomId);
    roomManager.addUser(roomId, user);
    
    const state = roomManager.getRoomState(roomId);
    socket.emit('roomState', state);
    
    socket.to(roomId).emit('userJoined', { user });
    console.log(`User ${user.name} joined room ${roomId}`);
  });

  socket.on('addNote', ({ roomId, note }: { roomId: string; note: Note }) => {
    roomManager.addNote(roomId, note);
    socket.to(roomId).emit('noteAdded', { note });
  });

  socket.on('updateNote', ({ roomId, noteId, updates }: { roomId: string; noteId: string; updates: Partial<Note> }) => {
    roomManager.updateNote(roomId, noteId, updates);
    socket.to(roomId).emit('noteUpdated', { noteId, updates });
  });

  socket.on('deleteNote', ({ roomId, noteId }: { roomId: string; noteId: string }) => {
    roomManager.deleteNote(roomId, noteId);
    socket.to(roomId).emit('noteDeleted', { noteId });
  });

  socket.on('moveNote', ({ roomId, noteId, x, y, group }: { roomId: string; noteId: string; x: number; y: number; group?: string }) => {
    roomManager.moveNote(roomId, noteId, x, y, group);
    socket.to(roomId).emit('noteMoved', { noteId, x, y, group });
  });

  socket.on('voteNote', ({ roomId, noteId, userId }: { roomId: string; noteId: string; userId: string }) => {
    const result = roomManager.voteNote(roomId, noteId, userId);
    socket.to(roomId).emit('noteVoted', { noteId, votes: result.votes, userId });
    socket.emit('noteVoted', { noteId, votes: result.votes, userId });
  });

  socket.on('disconnect', () => {
    const rooms = roomManager.removeUserFromAllRooms(socket.id);
    rooms.forEach(roomId => {
      socket.to(roomId).emit('userLeft', { userId: socket.id });
    });
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
