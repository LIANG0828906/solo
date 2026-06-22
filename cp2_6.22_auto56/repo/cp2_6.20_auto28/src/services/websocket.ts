import { io, Socket } from 'socket.io-client';
import type { WSMessage, CollaboratorCursor, StoryNode, StoryEdge, Character, CharacterRelation } from '@/types';

type MessageHandler = (message: WSMessage) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private storyId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(storyId: string, onStatusChange?: (connected: boolean) => void): void {
    if (this.socket && this.storyId === storyId) return;

    this.disconnect();
    this.storyId = storyId;

    try {
      this.socket = io('/ws', {
        path: '/ws/socket.io',
        transports: ['websocket', 'polling'],
        query: { storyId },
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on('connect', () => {
        this.reconnectAttempts = 0;
        onStatusChange?.(true);
      });

      this.socket.on('disconnect', () => {
        onStatusChange?.(false);
      });

      this.socket.on('connect_error', () => {
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          onStatusChange?.(false);
          this.simulateLocalMessages();
        }
      });

      this.socket.on('message', (msg: WSMessage) => {
        this.handlers.forEach((h) => h(msg));
      });

      this.socket.on('node:update', (payload: StoryNode) => {
        this.handlers.forEach((h) => h({ type: 'node:update', payload }));
      });

      this.socket.on('node:create', (payload: StoryNode) => {
        this.handlers.forEach((h) => h({ type: 'node:create', payload }));
      });

      this.socket.on('node:delete', (payload: { id: string }) => {
        this.handlers.forEach((h) => h({ type: 'node:delete', payload }));
      });

      this.socket.on('edge:create', (payload: StoryEdge) => {
        this.handlers.forEach((h) => h({ type: 'edge:create', payload }));
      });

      this.socket.on('edge:update', (payload: StoryEdge) => {
        this.handlers.forEach((h) => h({ type: 'edge:update', payload }));
      });

      this.socket.on('edge:delete', (payload: { id: string }) => {
        this.handlers.forEach((h) => h({ type: 'edge:delete', payload }));
      });

      this.socket.on('cursor:move', (payload: CollaboratorCursor) => {
        this.handlers.forEach((h) => h({ type: 'cursor:move', payload }));
      });

      this.socket.on('character:update', (payload: Character) => {
        this.handlers.forEach((h) => h({ type: 'character:update', payload }));
      });

      this.socket.on('character:create', (payload: Character) => {
        this.handlers.forEach((h) => h({ type: 'character:create', payload }));
      });

      this.socket.on('relation:create', (payload: CharacterRelation) => {
        this.handlers.forEach((h) => h({ type: 'relation:create', payload }));
      });

      this.socket.on('relation:update', (payload: CharacterRelation) => {
        this.handlers.forEach((h) => h({ type: 'relation:update', payload }));
      });

    } catch {
      onStatusChange?.(true);
      this.simulateLocalMessages();
    }
  }

  private simulateLocalMessages(): void {
    // WebSocket 不可用时，启用本地模拟模式
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.storyId = null;
  }

  subscribe(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  sendNodeUpdate(node: StoryNode): void {
    if (this.socket?.connected) {
      this.socket.emit('node:update', node);
    }
  }

  sendNodeCreate(node: StoryNode): void {
    if (this.socket?.connected) {
      this.socket.emit('node:create', node);
    }
  }

  sendNodeDelete(id: string): void {
    if (this.socket?.connected) {
      this.socket.emit('node:delete', { id });
    }
  }

  sendEdgeCreate(edge: StoryEdge): void {
    if (this.socket?.connected) {
      this.socket.emit('edge:create', edge);
    }
  }

  sendEdgeUpdate(edge: StoryEdge): void {
    if (this.socket?.connected) {
      this.socket.emit('edge:update', edge);
    }
  }

  sendEdgeDelete(id: string): void {
    if (this.socket?.connected) {
      this.socket.emit('edge:delete', { id });
    }
  }

  sendCursorMove(cursor: CollaboratorCursor): void {
    if (this.socket?.connected) {
      this.socket.emit('cursor:move', cursor);
    }
  }

  sendCharacterUpdate(char: Character): void {
    if (this.socket?.connected) {
      this.socket.emit('character:update', char);
    }
  }

  sendCharacterCreate(char: Character): void {
    if (this.socket?.connected) {
      this.socket.emit('character:create', char);
    }
  }

  sendRelationCreate(rel: CharacterRelation): void {
    if (this.socket?.connected) {
      this.socket.emit('relation:create', rel);
    }
  }

  sendRelationUpdate(rel: CharacterRelation): void {
    if (this.socket?.connected) {
      this.socket.emit('relation:update', rel);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const wsService = new WebSocketService();

export default wsService;
