import { io, Socket } from 'socket.io-client';

/// <reference types="vite/client" />

export interface MindNode {
  id: string;
  text: string;
  parentId: string | null;
  x: number;
  y: number;
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
  icon?: string;
  children?: MindNode[];
  richText?: {
    bold?: boolean;
    italic?: boolean;
    list?: boolean;
  };
}

interface User {
  id: string;
  name: string;
  avatar: string;
}

export class MindMapSocket {
  private socket: Socket | null = null;
  private onlineUsers: string[] = [];

  connect(canvasId: string, userId: string): void {
    const url = import.meta.env.VITE_SOCKET_URL || '/';
    this.socket = io(`${url}/canvas`, {
      query: { canvasId, userId },
    });

    this.socket.on('online-users', (users: string[]) => {
      this.onlineUsers = users;
    });

    this.socket.on('user-join', (user: User) => {
      if (!this.onlineUsers.includes(user.id)) {
        this.onlineUsers.push(user.id);
      }
    });

    this.socket.on('user-leave', (leftUserId: string) => {
      this.onlineUsers = this.onlineUsers.filter((id) => id !== leftUserId);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.onlineUsers = [];
    }
  }

  onNodeCreate(callback: (node: MindNode) => void): void {
    this.socket?.on('node:create', callback);
  }

  onNodeUpdate(callback: (node: MindNode) => void): void {
    this.socket?.on('node:update', callback);
  }

  onNodeDelete(callback: (nodeId: string) => void): void {
    this.socket?.on('node:delete', callback);
  }

  onNodeMove(callback: (data: { nodeId: string; newParentId: string; x: number; y: number }) => void): void {
    this.socket?.on('node:move', callback);
  }

  onUserJoin(callback: (user: User) => void): void {
    this.socket?.on('user-join', callback);
  }

  onUserLeave(callback: (userId: string) => void): void {
    this.socket?.on('user-leave', callback);
  }

  onVersionRestore(callback: (nodeTree: MindNode[]) => void): void {
    this.socket?.on('version:restore', callback);
  }

  onUserEditing(callback: (data: { userId: string; nodeId: string }) => void): void {
    this.socket?.on('user:editing', callback);
  }

  emitNodeCreate(node: MindNode): void {
    this.socket?.emit('node:create', node);
  }

  emitNodeUpdate(node: MindNode): void {
    this.socket?.emit('node:update', node);
  }

  emitNodeDelete(nodeId: string): void {
    this.socket?.emit('node:delete', nodeId);
  }

  emitNodeMove(data: { nodeId: string; newParentId: string; x: number; y: number }): void {
    this.socket?.emit('node:move', data);
  }

  emitVersionRestore(versionId: string): void {
    this.socket?.emit('version:restore', versionId);
  }

  emitEditing(nodeId: string): void {
    this.socket?.emit('user:editing', nodeId);
  }

  getOnlineUsers(): string[] {
    return this.onlineUsers;
  }
}
