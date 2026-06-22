import { io, Socket } from 'socket.io-client';
import type { Frame, FrameData, User, PixelColor } from './types';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      transports: ['websocket', 'polling']
    });
  }
  return socket;
}

export interface SocketHandlers {
  onUserList: (users: User[]) => void;
  onFramesInit: (frames: Frame[], currentFrameId: string) => void;
  onFrameUpdate: (frameId: string, x: number, y: number, color: PixelColor) => void;
  onFramesUpdate: (frames: Frame[]) => void;
  onFrameLock: (frameId: string, userId: string | undefined) => void;
  onFrameDataReplace: (frameId: string, data: FrameData) => void;
}

export function setupSocketHandlers(socket: Socket, handlers: SocketHandlers): void {
  socket.on('user-list', handlers.onUserList);
  socket.on('frames-init', handlers.onFramesInit);
  socket.on('frame-update', handlers.onFrameUpdate);
  socket.on('frames-update', handlers.onFramesUpdate);
  socket.on('frame-lock', handlers.onFrameLock);
  socket.on('frame-data-replace', handlers.onFrameDataReplace);
}

export function cleanupSocketHandlers(socket: Socket, handlers: SocketHandlers): void {
  socket.off('user-list', handlers.onUserList);
  socket.off('frames-init', handlers.onFramesInit);
  socket.off('frame-update', handlers.onFrameUpdate);
  socket.off('frames-update', handlers.onFramesUpdate);
  socket.off('frame-lock', handlers.onFrameLock);
  socket.off('frame-data-replace', handlers.onFrameDataReplace);
}

export function emitJoin(socket: Socket, user: User): void {
  socket.emit('user-join', user);
}

export function emitPixelUpdate(
  socket: Socket,
  frameId: string,
  x: number,
  y: number,
  color: PixelColor
): void {
  socket.emit('frame-update', { frameId, x, y, color });
}

export function emitFramesUpdate(socket: Socket, frames: Frame[]): void {
  socket.emit('frames-update', frames);
}

export function emitFrameLock(socket: Socket, frameId: string, userId: string | undefined): void {
  socket.emit('frame-lock', { frameId, userId });
}
