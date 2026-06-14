import { io, Socket } from 'socket.io-client';
import type { Note, User, RoomState } from './types';

let socket: Socket | null = null;

export const initSocket = (): Socket => {
  if (!socket) {
    socket = io('http://localhost:5173', {
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinRoom = (roomId: string, user: User): void => {
  if (socket) {
    socket.emit('joinRoom', { roomId, user });
  }
};

export const addNote = (roomId: string, note: Note): void => {
  if (socket) {
    socket.emit('addNote', { roomId, note });
  }
};

export const updateNote = (roomId: string, noteId: string, updates: Partial<Note>): void => {
  if (socket) {
    socket.emit('updateNote', { roomId, noteId, updates });
  }
};

export const deleteNote = (roomId: string, noteId: string): void => {
  if (socket) {
    socket.emit('deleteNote', { roomId, noteId });
  }
};

export const moveNote = (roomId: string, noteId: string, x: number, y: number, group?: 'problem' | 'solution' | 'action'): void => {
  if (socket) {
    socket.emit('moveNote', { roomId, noteId, x, y, group });
  }
};

export const voteNote = (roomId: string, noteId: string, userId: string): void => {
  if (socket) {
    socket.emit('voteNote', { roomId, noteId, userId });
  }
};

export type SocketEventHandlers = {
  onRoomState?: (state: RoomState) => void;
  onNoteAdded?: (data: { note: Note }) => void;
  onNoteUpdated?: (data: { noteId: string; updates: Partial<Note> }) => void;
  onNoteDeleted?: (data: { noteId: string }) => void;
  onNoteMoved?: (data: { noteId: string; x: number; y: number; group?: 'problem' | 'solution' | 'action' }) => void;
  onNoteVoted?: (data: { noteId: string; votes: string[]; userId: string }) => void;
  onUserJoined?: (data: { user: User }) => void;
  onUserLeft?: (data: { userId: string }) => void;
};

export const registerSocketEvents = (handlers: SocketEventHandlers): (() => void) => {
  if (!socket) return () => {};

  const unregisterFns: (() => void)[] = [];

  const register = <T>(event: string, handler?: (data: T) => void) => {
    if (handler) {
      const wrapped = (data: T) => handler(data);
      socket!.on(event, wrapped);
      unregisterFns.push(() => socket!.off(event, wrapped));
    }
  };

  register<RoomState>('roomState', handlers.onRoomState);
  register<{ note: Note }>('noteAdded', handlers.onNoteAdded);
  register<{ noteId: string; updates: Partial<Note> }>('noteUpdated', handlers.onNoteUpdated);
  register<{ noteId: string }>('noteDeleted', handlers.onNoteDeleted);
  register<{ noteId: string; x: number; y: number; group?: 'problem' | 'solution' | 'action' }>('noteMoved', handlers.onNoteMoved);
  register<{ noteId: string; votes: string[]; userId: string }>('noteVoted', handlers.onNoteVoted);
  register<{ user: User }>('userJoined', handlers.onUserJoined);
  register<{ userId: string }>('userLeft', handlers.onUserLeft);

  return () => {
    unregisterFns.forEach(fn => fn());
  };
};
