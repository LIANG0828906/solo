import type { Note, User, RoomState } from '../src/utils/types';

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();

  private getOrCreateRoom(roomId: string): RoomState {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, { notes: [], users: [] });
    }
    return this.rooms.get(roomId)!;
  }

  addUser(roomId: string, user: User): void {
    const room = this.getOrCreateRoom(roomId);
    const existingIndex = room.users.findIndex(u => u.id === user.id);
    if (existingIndex === -1) {
      room.users.push(user);
    } else {
      room.users[existingIndex] = user;
    }
  }

  removeUserFromAllRooms(userId: string): string[] {
    const affectedRooms: string[] = [];
    for (const [roomId, room] of this.rooms.entries()) {
      const index = room.users.findIndex(u => u.id === userId);
      if (index !== -1) {
        room.users.splice(index, 1);
        affectedRooms.push(roomId);
        if (room.users.length === 0 && room.notes.length === 0) {
          this.rooms.delete(roomId);
        }
      }
    }
    return affectedRooms;
  }

  getRoomState(roomId: string): RoomState {
    return this.getOrCreateRoom(roomId);
  }

  addNote(roomId: string, note: Note): void {
    const room = this.getOrCreateRoom(roomId);
    room.notes.push(note);
  }

  updateNote(roomId: string, noteId: string, updates: Partial<Note>): void {
    const room = this.getOrCreateRoom(roomId);
    const note = room.notes.find(n => n.id === noteId);
    if (note) {
      Object.assign(note, updates);
    }
  }

  deleteNote(roomId: string, noteId: string): void {
    const room = this.getOrCreateRoom(roomId);
    const index = room.notes.findIndex(n => n.id === noteId);
    if (index !== -1) {
      room.notes.splice(index, 1);
    }
  }

  moveNote(roomId: string, noteId: string, x: number, y: number, group?: string): void {
    const room = this.getOrCreateRoom(roomId);
    const note = room.notes.find(n => n.id === noteId);
    if (note) {
      note.x = x;
      note.y = y;
      if (group !== undefined) {
        note.group = group as Note['group'];
      }
    }
  }

  voteNote(roomId: string, noteId: string, userId: string): { votes: string[] } {
    const room = this.getOrCreateRoom(roomId);
    const note = room.notes.find(n => n.id === noteId);
    if (note) {
      const voteIndex = note.votes.indexOf(userId);
      if (voteIndex === -1) {
        note.votes.push(userId);
      } else {
        note.votes.splice(voteIndex, 1);
      }
      return { votes: [...note.votes] };
    }
    return { votes: [] };
  }
}
