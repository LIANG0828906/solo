import { io, Socket } from 'socket.io-client';
import { ICreative } from '../types';

const socket: Socket = io({
  path: '/socket.io',
});

export const emitCreativeCreated = (data: ICreative): void => {
  socket.emit('creative:created', data);
};

export const emitCreativeVoted = (data: {
  boardRoomId: string;
  creativeId: string;
  userId: string;
}): void => {
  socket.emit('creative:voted', data);
};

export const emitCreativeDeleted = (data: {
  boardRoomId: string;
  creativeId: string;
}): void => {
  socket.emit('creative:deleted', data);
};

export const onCreativeCreated = (
  callback: (data: ICreative) => void
): (() => void) => {
  socket.on('creative:created', callback);
  return () => socket.off('creative:created', callback);
};

export const onCreativeVoted = (
  callback: (data: ICreative) => void
): (() => void) => {
  socket.on('creative:voted', callback);
  return () => socket.off('creative:voted', callback);
};

export const onCreativeDeleted = (
  callback: (data: { boardRoomId: string; creativeId: string }) => void
): (() => void) => {
  socket.on('creative:deleted', callback);
  return () => socket.off('creative:deleted', callback);
};

export const disconnect = (): void => {
  socket.disconnect();
};
