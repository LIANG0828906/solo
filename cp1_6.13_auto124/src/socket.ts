import { io, type Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '../../shared/types';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export function getSocket(): TypedSocket {
  if (!socket) {
    socket = io('/', { transports: ['websocket', 'polling'] });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
