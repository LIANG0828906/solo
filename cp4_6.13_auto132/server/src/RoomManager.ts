import { v4 as uuidv4 } from 'uuid';

interface RoomUser {
  ws: any;
  name: string;
}

interface RoomState {
  nodes: any[];
  connections: any[];
}

interface Room {
  users: Map<string, RoomUser>;
  state: RoomState;
}

export class RoomManager {
  rooms: Map<string, Room>;

  constructor() {
    this.rooms = new Map();
  }

  createRoom(): string {
    let code: string;
    do {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (this.rooms.has(code));
    this.rooms.set(code, {
      users: new Map(),
      state: { nodes: [], connections: [] }
    });
    return code;
  }

  createRoomWithCode(roomCode: string): string {
    if (!this.rooms.has(roomCode)) {
      this.rooms.set(roomCode, {
        users: new Map(),
        state: { nodes: [], connections: [] }
      });
    }
    return roomCode;
  }

  joinRoom(roomCode: string, userId: string, userName: string, ws: any): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    if (room.users.size >= 4) return false;
    room.users.set(userId, { ws, name: userName });
    return true;
  }

  leaveRoom(roomCode: string, userId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    room.users.delete(userId);
    if (room.users.size === 0) {
      this.rooms.delete(roomCode);
    }
  }

  getRoomUsers(roomCode: string): { id: string; name: string }[] {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    const users: { id: string; name: string }[] = [];
    room.users.forEach((user, id) => {
      users.push({ id, name: user.name });
    });
    return users;
  }

  getRoomState(roomCode: string): { nodes: any[]; connections: any[] } {
    const room = this.rooms.get(roomCode);
    if (!room) return { nodes: [], connections: [] };
    return room.state;
  }

  updateNode(roomCode: string, node: any): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    const index = room.state.nodes.findIndex((n: any) => n.id === node.id);
    if (index >= 0) {
      room.state.nodes[index] = node;
    } else {
      room.state.nodes.push(node);
    }
  }

  moveNode(roomCode: string, nodeId: string, x: number, y: number): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    const node = room.state.nodes.find((n: any) => n.id === nodeId);
    if (node) {
      node.x = x;
      node.y = y;
    }
  }

  updateNodeParams(roomCode: string, nodeId: string, params: any, editorName: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    const node = room.state.nodes.find((n: any) => n.id === nodeId);
    if (node) {
      node.params = params;
      node.lastEditor = editorName;
    }
  }

  addConnection(roomCode: string, connection: any): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    room.state.connections.push(connection);
  }

  removeNode(roomCode: string, nodeId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    room.state.nodes = room.state.nodes.filter((n: any) => n.id !== nodeId);
    room.state.connections = room.state.connections.filter(
      (c: any) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId
    );
  }

  removeConnection(roomCode: string, connectionId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    room.state.connections = room.state.connections.filter(
      (c: any) => c.id !== connectionId
    );
  }

  broadcastToRoom(roomCode: string, message: any, excludeUserId?: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    const data = JSON.stringify(message);
    room.users.forEach((user, id) => {
      if (id !== excludeUserId && user.ws.readyState === 1) {
        user.ws.send(data);
      }
    });
  }

  getRoomByUserId(userId: string): string | undefined {
    for (const [roomCode, room] of this.rooms) {
      if (room.users.has(userId)) {
        return roomCode;
      }
    }
    return undefined;
  }

  saveRoomState(roomCode: string): any {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    return {
      nodes: room.state.nodes,
      connections: room.state.connections
    };
  }

  loadRoomState(roomCode: string, state: any): void {
    let room = this.rooms.get(roomCode);
    if (!room) {
      room = {
        users: new Map(),
        state: { nodes: [], connections: [] }
      };
      this.rooms.set(roomCode, room);
    }
    room.state.nodes = state.nodes || [];
    room.state.connections = state.connections || [];
  }
}
