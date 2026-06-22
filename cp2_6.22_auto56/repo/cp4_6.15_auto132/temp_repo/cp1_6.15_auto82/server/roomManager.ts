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
      const existing = room.shapes.find(s => s.id === operation.shape.id);
      if (!existing) {
        room.shapes.push(operation.shape);
      } else {
        const idx = room.shapes.findIndex(s => s.id === operation.shape.id);
        room.shapes[idx] = operation.shape;
      }
    } else if (operation.type === 'update') {
      const idx = room.shapes.findIndex(s => s.id === operation.shape.id);
      if (idx !== -1) {
        if (!operation.prevShape) {
          (operation as Operation & { prevShape?: Shape }).prevShape = room.shapes[idx];
        }
        room.shapes[idx] = operation.shape;
      }
    } else if (operation.type === 'delete') {
      if (!operation.shape) {
        const shape = room.shapes.find(s => s.id === operation.shapeId);
        if (shape) {
          (operation as Operation & { shape?: Shape }).shape = shape;
        }
      }
      room.shapes = room.shapes.filter(s => s.id !== operation.shapeId);
    }

    room.history.push(operation);
    if (room.history.length > 100) {
      room.history = room.history.slice(-100);
    }

    return room;
  }

  undoLastOperationForUser(roomId: string, userId: string): { room: Room; operation: Operation } | undefined {
    const room = this.rooms.get(roomId);
    if (!room || room.history.length === 0) return undefined;

    let opIndex = -1;
    for (let i = room.history.length - 1; i >= 0; i--) {
      const op = room.history[i];
      let opUserId = '';
      if (op.type === 'add' || op.type === 'update') {
        opUserId = op.shape.userId;
      } else if (op.type === 'delete') {
        opUserId = op.shape.userId;
      }
      if (opUserId === userId) {
        opIndex = i;
        break;
      }
    }

    if (opIndex === -1) return undefined;

    const lastOp = room.history[opIndex];
    room.history.splice(opIndex, 1);

    let undoOp: Operation;

    if (lastOp.type === 'add') {
      undoOp = { type: 'delete', shapeId: lastOp.shape.id, shape: lastOp.shape };
      room.shapes = room.shapes.filter(s => s.id !== lastOp.shape.id);
    } else if (lastOp.type === 'delete') {
      undoOp = { type: 'add', shape: lastOp.shape };
      const exists = room.shapes.find(s => s.id === lastOp.shape.id);
      if (!exists) {
        room.shapes.push(lastOp.shape);
      }
    } else if (lastOp.type === 'update') {
      const prevShape = lastOp.prevShape;
      if (prevShape) {
        undoOp = { type: 'update', shape: prevShape, prevShape: lastOp.shape };
        const idx = room.shapes.findIndex(s => s.id === prevShape.id);
        if (idx !== -1) {
          room.shapes[idx] = prevShape;
        }
      } else {
        return undefined;
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
