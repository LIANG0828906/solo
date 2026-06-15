import { Shape, User, Operation } from '../src/types';

interface Room {
  id: string;
  users: Map<string, User>;
  shapes: Shape[];
  history: Operation[];
}

class RoomManager {
  private rooms: Map<string, Room> = new Map();

  createRoom(roomId: string): Room {
    const room: Room = {
      id: roomId,
      users: new Map(),
      shapes: [],
      history: [],
    };
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getOrCreateRoom(roomId: string): Room {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = this.createRoom(roomId);
    }
    return room;
  }

  addUser(roomId: string, user: User): { room: Room; isNew: boolean } {
    const room = this.getOrCreateRoom(roomId);
    const isNew = !room.users.has(user.id);
    room.users.set(user.id, user);
    return { room, isNew };
  }

  removeUser(roomId: string, userId: string): Room | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;
    room.users.delete(userId);
    if (room.users.size === 0) {
      setTimeout(() => {
        const r = this.rooms.get(roomId);
        if (r && r.users.size === 0) {
          this.rooms.delete(roomId);
        }
      }, 5 * 60 * 1000);
    }
    return room;
  }

  addOperation(roomId: string, operation: Operation): Room | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    if (operation.type === 'add') {
      room.shapes.push(operation.shape);
    } else if (operation.type === 'update') {
      const idx = room.shapes.findIndex(s => s.id === operation.shape.id);
      if (idx !== -1) {
        room.shapes[idx] = operation.shape;
      }
    } else if (operation.type === 'delete') {
      room.shapes = room.shapes.filter(s => s.id !== operation.shapeId);
    }

    room.history.push(operation);
    if (room.history.length > 50) {
      room.history = room.history.slice(-50);
    }

    return room;
  }

  undoLastOperation(roomId: string, _userId: string): { room: Room; operation: Operation } | undefined {
    const room = this.rooms.get(roomId);
    if (!room || room.history.length === 0) return undefined;

    const lastOp = room.history[room.history.length - 1];
    room.history.pop();

    let undoOp: Operation;

    if (lastOp.type === 'add') {
      undoOp = { type: 'delete', shapeId: lastOp.shape.id, shape: lastOp.shape };
      room.shapes = room.shapes.filter(s => s.id !== lastOp.shape.id);
    } else if (lastOp.type === 'delete') {
      undoOp = { type: 'add', shape: lastOp.shape };
      room.shapes.push(lastOp.shape);
    } else if (lastOp.type === 'update') {
      undoOp = lastOp;
      const idx = room.shapes.findIndex(s => s.id === lastOp.shape.id);
      if (idx !== -1) {
        room.shapes[idx] = lastOp.shape;
      }
    } else {
      return undefined;
    }

    return { room, operation: undoOp };
  }

  getUsersList(roomId: string): Record<string, User> {
    const room = this.rooms.get(roomId);
    if (!room) return {};
    const users: Record<string, User> = {};
    room.users.forEach((user, id) => {
      users[id] = user;
    });
    return users;
  }

  getShapes(roomId: string): Shape[] {
    const room = this.rooms.get(roomId);
    return room ? [...room.shapes] : [];
  }
}

export default RoomManager;
