import type { Server, Socket } from 'socket.io';
import type { Note, Track, User } from '../../../src/types';
import { USER_COLORS } from '../../../src/types';

const generateId = () => Math.random().toString(36).substring(2, 15);

interface RoomData {
  notes: Note[];
  tracks: Track[];
  users: Map<string, User>;
  bpm: number;
  userColorIndex: number;
}

const rooms: Map<string, RoomData> = new Map();

function getOrCreateRoom(roomId: string): RoomData {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      notes: [],
      tracks: [
        {
          id: 'track-1',
          name: '主旋律',
          volume: 0,
          muted: false,
          color: '#6C63FF',
        },
      ],
      users: new Map(),
      bpm: 120,
      userColorIndex: 0,
    };
    rooms.set(roomId, room);
  }
  return room;
}

export function registerSyncHandlers(io: Server, socket: Socket): void {
  socket.on('join_room', ({ roomId, userId, userName }: { roomId: string; userId: string; userName: string }) => {
    socket.join(roomId);
    const room = getOrCreateRoom(roomId);

    const assignedColor = USER_COLORS[room.userColorIndex % USER_COLORS.length];
    room.userColorIndex++;

    const user: User = {
      id: userId,
      name: userName,
      color: assignedColor,
    };

    if (!room.users.has(userId)) {
      room.users.set(userId, user);
    } else {
      const existingUser = room.users.get(userId)!;
      user.color = existingUser.color;
      room.users.set(userId, user);
    }

    socket.emit('room_state', {
      notes: room.notes,
      users: Array.from(room.users.values()),
      tracks: room.tracks,
      bpm: room.bpm,
    });

    socket.to(roomId).emit('user_joined', user);

    socket.on('cursor_move', ({ userId, x, y }: { userId: string; x: number; y: number }) => {
      socket.to(roomId).emit('cursor_update', { userId, x, y });
    });

    socket.on('note_add', ({ note }: { note: Note }) => {
      const r = rooms.get(roomId);
      if (!r) return;
      if (!r.notes.find(n => n.id === note.id)) {
        r.notes.push(note);
      }
      io.to(roomId).emit('note_added', { note, userId });
    });

    socket.on('note_move', ({ noteId, x, y }: { noteId: string; x: number; y: number }) => {
      const r = rooms.get(roomId);
      if (!r) return;
      r.notes = r.notes.map(n => n.id === noteId ? { ...n, x, y } : n);
      io.to(roomId).emit('note_moved', { noteId, x, y, userId });
    });

    socket.on('note_delete', ({ noteId }: { noteId: string }) => {
      const r = rooms.get(roomId);
      if (!r) return;
      r.notes = r.notes.filter(n => n.id !== noteId);
      io.to(roomId).emit('note_deleted', { noteId, userId });
    });

    socket.on('track_update', ({ track }: { track: Track }) => {
      const r = rooms.get(roomId);
      if (!r) return;
      const existing = r.tracks.find(t => t.id === track.id);
      if (!existing) {
        r.tracks.push(track);
      } else {
        r.tracks = r.tracks.map(t => t.id === track.id ? track : t);
      }
      io.to(roomId).emit('track_updated', { track, userId });
    });

    socket.on('bpm_update', ({ bpm }: { bpm: number }) => {
      const r = rooms.get(roomId);
      if (!r) return;
      r.bpm = bpm;
      io.to(roomId).emit('bpm_updated', { bpm, userId });
    });

    socket.on('disconnect', () => {
      const r = rooms.get(roomId);
      if (!r) return;
      r.users.delete(userId);
      io.to(roomId).emit('user_left', { userId });

      if (r.users.size === 0) {
        setTimeout(() => {
          const checkRoom = rooms.get(roomId);
          if (checkRoom && checkRoom.users.size === 0) {
            rooms.delete(roomId);
          }
        }, 60000);
      }
    });
  });
}

export function getRoomState(roomId: string): { notes: Note[]; tracks: Track[]; bpm: number } | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  return {
    notes: room.notes,
    tracks: room.tracks,
    bpm: room.bpm,
  };
}

export function setRoomState(roomId: string, state: { notes: Note[]; tracks: Track[]; bpm: number }, io: Server): void {
  const room = getOrCreateRoom(roomId);
  room.notes = state.notes;
  room.tracks = state.tracks;
  room.bpm = state.bpm;
  io.to(roomId).emit('version_restored', state);
}
