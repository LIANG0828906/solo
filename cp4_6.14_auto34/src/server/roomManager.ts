import { v4 as uuidv4 } from 'uuid';
import type { FlowNode, FlowEdge, User, ClientMessage, ServerMessage } from '../types';
import { USER_COLORS } from '../types';
import { snapshotManager } from './snapshotManager';
import type { WebSocket } from 'ws';

interface Room {
  id: string;
  users: User[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  clients: Map<string, WebSocket>;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  constructor() {
    (globalThis as any).rooms = this.rooms;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  joinRoom(roomId: string, userId: string, userName: string, ws: WebSocket): { user: User; room: Room } {
    let room = this.rooms.get(roomId);
    
    if (!room) {
      room = {
        id: roomId,
        users: [],
        nodes: [],
        edges: [],
        clients: new Map(),
      };
      this.rooms.set(roomId, room);
    }

    let user = room.users.find(u => u.id === userId);
    if (!user) {
      const existingColors = room.users.map(u => u.color);
      const availableColor = USER_COLORS.find(c => !existingColors.includes(c)) || USER_COLORS[room.users.length % USER_COLORS.length];
      
      user = {
        id: userId,
        name: userName,
        color: availableColor,
        roomId,
      };
      room.users.push(user);
    }

    room.clients.set(userId, ws);

    this.broadcast(roomId, {
      type: 'user-join',
      user,
    }, userId);

    return { user, room };
  }

  leaveRoom(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.clients.delete(userId);
    room.users = room.users.filter(u => u.id !== userId);

    this.broadcast(roomId, {
      type: 'user-leave',
      userId,
    });

    if (room.users.length === 0) {
      setTimeout(() => {
        const currentRoom = this.rooms.get(roomId);
        if (currentRoom && currentRoom.users.length === 0) {
          this.rooms.delete(roomId);
        }
      }, 30000);
    }
  }

  broadcast(roomId: string, message: ServerMessage, excludeUserId?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const messageStr = JSON.stringify(message);
    
    room.clients.forEach((client, userId) => {
      if (userId !== excludeUserId && client.readyState === 1) {
        client.send(messageStr);
      }
    });
  }

  applyOperation(roomId: string, op: ClientMessage, userId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    switch (op.type) {
      case 'node-add':
        room.nodes.push(op.data);
        snapshotManager.recordActivity(roomId, userId);
        break;
      case 'node-update':
        const nodeIdx = room.nodes.findIndex(n => n.id === op.data.id);
        if (nodeIdx !== -1) {
          room.nodes[nodeIdx] = { ...room.nodes[nodeIdx], ...op.data };
        }
        snapshotManager.recordActivity(roomId, userId);
        break;
      case 'node-delete':
        room.nodes = room.nodes.filter(n => n.id !== op.id);
        room.edges = room.edges.filter(e => e.sourceId !== op.id && e.targetId !== op.id);
        snapshotManager.recordActivity(roomId, userId);
        break;
      case 'edge-add':
        room.edges.push(op.data);
        snapshotManager.recordActivity(roomId, userId);
        break;
      case 'edge-update':
        const edgeIdx = room.edges.findIndex(e => e.id === op.data.id);
        if (edgeIdx !== -1) {
          room.edges[edgeIdx] = { ...room.edges[edgeIdx], ...op.data };
        }
        snapshotManager.recordActivity(roomId, userId);
        break;
      case 'edge-delete':
        room.edges = room.edges.filter(e => e.id !== op.id);
        snapshotManager.recordActivity(roomId, userId);
        break;
      case 'cursor-move':
        break;
    }

    if (op.type !== 'cursor-move') {
      this.broadcast(roomId, op as any);
    } else {
      this.broadcast(roomId, op as any, userId);
    }
  }

  sendInitState(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const client = room.clients.get(userId);
    if (!client || client.readyState !== 1) return;

    const message: ServerMessage = {
      type: 'init-state',
      nodes: room.nodes,
      edges: room.edges,
      users: room.users,
    };
    
    client.send(JSON.stringify(message));
  }
}

export const roomManager = new RoomManager();
