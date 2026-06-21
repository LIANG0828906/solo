import type { Server as SocketIOServer } from 'socket.io';
import type { OnlineUser } from '../shared/types.js';

let io: SocketIOServer | null = null;
const onlineUsers: OnlineUser[] = [];

export function setIO(socketIO: SocketIOServer): void {
  io = socketIO;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

export function getOnlineUsers(): OnlineUser[] {
  return onlineUsers;
}

export function addOnlineUser(user: OnlineUser): void {
  onlineUsers.push(user);
}

export function removeOnlineUser(socketId: string): OnlineUser | null {
  const idx = onlineUsers.findIndex(u => u.id === socketId);
  if (idx !== -1) {
    const [left] = onlineUsers.splice(idx, 1);
    return left;
  }
  return null;
}
