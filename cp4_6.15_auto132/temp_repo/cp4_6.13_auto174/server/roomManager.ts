import { v4 as uuidv4 } from 'uuid';
import {
  WhiteboardElement,
  Operation,
  User,
  RoomState,
  StickyElement,
  OperationType,
} from '../shared/types';

const MAX_HISTORY = 100;

class RoomManager {
  private rooms: Map<string, RoomState> = new Map();

  createRoom(roomId: string): boolean {
    if (this.rooms.has(roomId)) {
      return false;
    }
    this.rooms.set(roomId, {
      id: roomId,
      users: new Map(),
      elements: [],
      operations: [],
      nextSeq: 1,
    });
    return true;
  }

  roomExists(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  addUser(roomId: string, userId: string, userName: string): User | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const user: User = {
      id: userId,
      name: userName,
      color: this.generateColor(userId),
    };
    room.users.set(userId, user);
    return user;
  }

  removeUser(roomId: string, userId: string): User | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const user = room.users.get(userId);
    if (user) {
      room.users.delete(userId);
    }
    if (room.users.size === 0) {
      this.rooms.delete(roomId);
    }
    return user || null;
  }

  getUsers(roomId: string): User[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.users.values());
  }

  addElement(roomId: string, element: WhiteboardElement): Operation | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const seq = room.nextSeq++;
    const timestamp = Date.now();
    const op: Operation = {
      id: uuidv4(),
      type: 'element:add',
      roomId,
      userId: element.userId,
      timestamp,
      seq,
      payload: { ...element, timestamp, seq },
    };

    room.elements.push({ ...element, timestamp, seq } as WhiteboardElement);
    this.pushHistory(room, op);
    return op;
  }

  updateElement(roomId: string, elementId: string, updates: Partial<WhiteboardElement>): Operation | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const idx = room.elements.findIndex((e) => e.id === elementId);
    if (idx === -1) return null;

    const seq = room.nextSeq++;
    const timestamp = Date.now();
    const updated = { ...room.elements[idx], ...updates, timestamp, seq } as WhiteboardElement;
    room.elements[idx] = updated;

    let opType: OperationType = 'element:update';
    if (updated.type === 'sticky') {
      if ('x' in updates || 'y' in updates) {
        opType = 'sticky:move';
      } else if ('text' in updates) {
        opType = 'sticky:text';
      }
    }

    const op: Operation = {
      id: uuidv4(),
      type: opType,
      roomId,
      userId: updated.userId,
      timestamp,
      seq,
      payload: updated,
    };

    this.pushHistory(room, op);
    return op;
  }

  deleteElement(roomId: string, elementId: string, userId: string): Operation | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const idx = room.elements.findIndex((e) => e.id === elementId);
    if (idx === -1) return null;

    const seq = room.nextSeq++;
    const timestamp = Date.now();
    const deleted = room.elements[idx];
    room.elements.splice(idx, 1);

    const op: Operation = {
      id: uuidv4(),
      type: 'element:delete',
      roomId,
      userId,
      timestamp,
      seq,
      payload: { id: elementId, elementType: deleted.type },
    };

    this.pushHistory(room, op);
    return op;
  }

  clearCanvas(roomId: string, userId: string): Operation | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const seq = room.nextSeq++;
    const timestamp = Date.now();
    room.elements = [];

    const op: Operation = {
      id: uuidv4(),
      type: 'canvas:clear',
      roomId,
      userId,
      timestamp,
      seq,
      payload: {},
    };

    this.pushHistory(room, op);
    return op;
  }

  appendPathPoints(roomId: string, elementId: string, newPoints: Array<{ x: number; y: number }>, userId: string): Operation | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const idx = room.elements.findIndex((e) => e.id === elementId);
    if (idx === -1) return null;

    const el = room.elements[idx];
    if (el.type !== 'path') return null;

    const seq = room.nextSeq++;
    const timestamp = Date.now();
    el.points.push(...newPoints);
    (el as any).timestamp = timestamp;
    (el as any).seq = seq;

    const op: Operation = {
      id: uuidv4(),
      type: 'draw:point',
      roomId,
      userId,
      timestamp,
      seq,
      payload: { id: elementId, points: newPoints, timestamp, seq },
    };

    this.pushHistory(room, op);
    return op;
  }

  getElements(roomId: string): WhiteboardElement[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return room.elements;
  }

  getHistory(roomId: string): Operation[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return room.operations.slice();
  }

  getNextSeq(roomId: string): number {
    const room = this.rooms.get(roomId);
    if (!room) return 0;
    return room.nextSeq;
  }

  private pushHistory(room: RoomState, op: Operation): void {
    room.operations.push(op);
    if (room.operations.length > MAX_HISTORY) {
      room.operations.shift();
    }
  }

  private generateColor(userId: string): string {
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308',
      '#84cc16', '#22c55e', '#10b981', '#14b8a6',
      '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
      '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  }
}

export const roomManager = new RoomManager();
