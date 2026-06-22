import { io, Socket } from 'socket.io-client';

const socket: Socket = io('/', {
  path: '/socket.io',
  autoConnect: true
});

export function emit<T = any>(event: string, data?: T): void {
  socket.emit(event, data);
}

export function on<T = any>(event: string, callback: (data: T) => void): () => void {
  socket.on(event, callback);
  return () => socket.off(event, callback);
}

export default socket;
