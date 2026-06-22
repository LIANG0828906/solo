import { io, Socket } from 'socket.io-client';
import type { Note, Track, User } from '@/types';

export type SyncEventHandler = {
  onRoomState?: (data: { notes: Note[]; users: User[]; tracks: Track[]; bpm: number }) => void;
  onUserJoined?: (user: User) => void;
  onUserLeft?: (userId: string) => void;
  onCursorUpdate?: (data: { userId: string; x: number; y: number }) => void;
  onNoteAdded?: (data: { note: Note; userId: string }) => void;
  onNoteMoved?: (data: { noteId: string; x: number; y: number; userId: string }) => void;
  onNoteDeleted?: (data: { noteId: string; userId: string }) => void;
  onTrackUpdated?: (data: { track: Track; userId: string }) => void;
  onBpmUpdated?: (data: { bpm: number; userId: string }) => void;
  onVersionRestored?: (data: { notes: Note[]; tracks: Track[]; bpm: number }) => void;
};

class SyncClient {
  private socket: Socket | null = null;
  private handlers: SyncEventHandler = {};
  private roomId: string = '';
  private userId: string = '';
  private userName: string = '';

  connect(roomId: string, userId: string, userName: string): void {
    this.roomId = roomId;
    this.userId = userId;
    this.userName = userName;

    this.socket = io({
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this.socket?.emit('join_room', { roomId, userId, userName });
    });

    this.socket.on('room_state', (data) => {
      this.handlers.onRoomState?.(data);
    });

    this.socket.on('user_joined', (user: User) => {
      this.handlers.onUserJoined?.(user);
    });

    this.socket.on('user_left', ({ userId }: { userId: string }) => {
      this.handlers.onUserLeft?.(userId);
    });

    this.socket.on('cursor_update', (data: { userId: string; x: number; y: number }) => {
      this.handlers.onCursorUpdate?.(data);
    });

    this.socket.on('note_added', (data: { note: Note; userId: string }) => {
      this.handlers.onNoteAdded?.(data);
    });

    this.socket.on('note_moved', (data: { noteId: string; x: number; y: number; userId: string }) => {
      this.handlers.onNoteMoved?.(data);
    });

    this.socket.on('note_deleted', (data: { noteId: string; userId: string }) => {
      this.handlers.onNoteDeleted?.(data);
    });

    this.socket.on('track_updated', (data: { track: Track; userId: string }) => {
      this.handlers.onTrackUpdated?.(data);
    });

    this.socket.on('bpm_updated', (data: { bpm: number; userId: string }) => {
      this.handlers.onBpmUpdated?.(data);
    });

    this.socket.on('version_restored', (data: { notes: Note[]; tracks: Track[]; bpm: number }) => {
      this.handlers.onVersionRestored?.(data);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  on(handlers: SyncEventHandler): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  sendCursorMove(x: number, y: number): void {
    this.socket?.emit('cursor_move', { userId: this.userId, x, y });
  }

  sendNoteAdd(note: Note): void {
    this.socket?.emit('note_add', { note });
  }

  sendNoteMove(noteId: string, x: number, y: number): void {
    this.socket?.emit('note_move', { noteId, x, y });
  }

  sendNoteDelete(noteId: string): void {
    this.socket?.emit('note_delete', { noteId });
  }

  sendTrackUpdate(track: Track): void {
    this.socket?.emit('track_update', { track });
  }

  sendBpmUpdate(bpm: number): void {
    this.socket?.emit('bpm_update', { bpm });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const syncClient = new SyncClient();
