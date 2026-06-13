import { Layer, User, RoomState, USER_COLORS } from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

interface Room {
  id: string;
  layers: Layer[];
  users: Map<string, User>;
}

class RoomManager {
  private rooms: Map<string, Room> = new Map();

  createRoom(roomId: string): RoomState {
    if (this.rooms.has(roomId)) {
      return this.getRoomState(roomId);
    }
    const room: Room = {
      id: roomId,
      layers: [],
      users: new Map(),
    };
    this.rooms.set(roomId, room);
    return this.getRoomState(roomId);
  }

  getRoomState(roomId: string): RoomState {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { id: roomId, layers: [], users: [] };
    }
    return {
      id: room.id,
      layers: room.layers,
      users: Array.from(room.users.values()),
    };
  }

  addUser(roomId: string, userName: string): { user: User; state: RoomState } {
    let room = this.rooms.get(roomId);
    if (!room) {
      this.createRoom(roomId);
      room = this.rooms.get(roomId)!;
    }

    const userId = uuidv4();
    const usedColors = Array.from(room.users.values()).map((u) => u.color);
    const availableColors = USER_COLORS.filter((c) => !usedColors.includes(c));
    const color =
      availableColors.length > 0
        ? availableColors[Math.floor(Math.random() * availableColors.length)]
        : USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

    const user: User = {
      id: userId,
      name: userName,
      color,
      cursorX: 0,
      cursorY: 0,
    };

    room.users.set(userId, user);
    return { user, state: this.getRoomState(roomId) };
  }

  removeUser(roomId: string, userId: string): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    room.users.delete(userId);
    if (room.users.size === 0 && room.layers.length === 0) {
      this.rooms.delete(roomId);
      return null;
    }
    return this.getRoomState(roomId);
  }

  updateCursor(
    roomId: string,
    userId: string,
    x: number,
    y: number
  ): User | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const user = room.users.get(userId);
    if (!user) return null;
    user.cursorX = x;
    user.cursorY = y;
    return user;
  }

  addLayer(roomId: string, layer: Layer): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    layer.zIndex = room.layers.length;
    room.layers.push(layer);
    return this.getRoomState(roomId);
  }

  updateLayer(
    roomId: string,
    layerId: string,
    updates: Partial<Layer>
  ): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const layer = room.layers.find((l) => l.id === layerId);
    if (!layer) return null;
    Object.assign(layer, updates);
    return this.getRoomState(roomId);
  }

  deleteLayer(roomId: string, layerId: string): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const index = room.layers.findIndex((l) => l.id === layerId);
    if (index === -1) return null;
    room.layers.splice(index, 1);
    room.layers.forEach((l, i) => (l.zIndex = i));
    return this.getRoomState(roomId);
  }

  reorderLayers(
    roomId: string,
    layerId: string,
    newIndex: number
  ): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const currentIndex = room.layers.findIndex((l) => l.id === layerId);
    if (currentIndex === -1) return null;
    const [layer] = room.layers.splice(currentIndex, 1);
    room.layers.splice(newIndex, 0, layer);
    room.layers.forEach((l, i) => (l.zIndex = i));
    return this.getRoomState(roomId);
  }

  getLayers(roomId: string): Layer[] {
    const room = this.rooms.get(roomId);
    return room ? room.layers : [];
  }

  getUsers(roomId: string): User[] {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.users.values()) : [];
  }

  roomExists(roomId: string): boolean {
    return this.rooms.has(roomId);
  }
}

export const roomManager = new RoomManager();
