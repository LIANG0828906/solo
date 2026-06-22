import type { ClientMessage, ServerMessage, FlowNode, FlowEdge } from '../../types';
import { useFlowStore } from '../store/useFlowStore';

function generateOpId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private roomId: string | null = null;
  private userId: string | null = null;
  private userName: string | null = null;

  connect(roomId: string, userId: string, userName: string): void {
    this.roomId = roomId;
    this.userId = userId;
    this.userName = userName;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:3001`;
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.send({
        type: 'join',
        roomId,
        userId,
        userName,
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.tryReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private tryReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    setTimeout(() => {
      if (this.roomId && this.userId && this.userName) {
        this.connect(this.roomId, this.userId, this.userName);
      }
    }, 1000 * this.reconnectAttempts);
  }

  private handleMessage(message: ServerMessage): void {
    const store = useFlowStore.getState();

    switch (message.type) {
      case 'init-state':
        store.setIsRestoreAnimating(true);
        store.setNodes(message.nodes);
        store.setEdges(message.edges);
        store.setUsers(message.users);
        setTimeout(() => store.setIsRestoreAnimating(false), 300);
        break;
      case 'user-join':
        store.addUser(message.user);
        break;
      case 'user-leave':
        store.removeUser(message.userId);
        break;
      case 'node-add':
        store.addNode(message.data);
        break;
      case 'node-update':
        store.updateNode(message.data.id, message.data);
        break;
      case 'node-delete':
        store.deleteNode(message.id);
        break;
      case 'edge-add':
        store.addEdge(message.data);
        break;
      case 'edge-update':
        store.updateEdge(message.data.id, message.data);
        break;
      case 'edge-delete':
        store.deleteEdge(message.id);
        break;
      case 'cursor-move':
        store.updateCursor(message.userId, message.x, message.y);
        break;
      case 'snapshot-created':
        store.addSnapshot(message.snapshot);
        break;
    }
  }

  send(message: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const opTypes = ['node-add', 'node-update', 'node-delete', 'edge-add', 'edge-update', 'edge-delete'];
      let msgToSend: ClientMessage = message;
      if (opTypes.includes(message.type) && !message.opId) {
        msgToSend = { ...message, opId: generateOpId() };
      }
      this.ws.send(JSON.stringify(msgToSend));
    }
  }

  addNode(node: FlowNode): void {
    this.send({ type: 'node-add', data: node });
  }

  updateNode(id: string, updates: Partial<FlowNode>): void {
    this.send({ type: 'node-update', data: { id, ...updates } });
  }

  deleteNode(id: string): void {
    this.send({ type: 'node-delete', id });
  }

  addEdge(edge: FlowEdge): void {
    this.send({ type: 'edge-add', data: edge });
  }

  updateEdge(id: string, updates: Partial<FlowEdge>): void {
    this.send({ type: 'edge-update', data: { id, ...updates } });
  }

  deleteEdge(id: string): void {
    this.send({ type: 'edge-delete', id });
  }

  updateCursor(x: number, y: number): void {
    if (this.userId) {
      this.send({ type: 'cursor-move', userId: this.userId, x, y });
    }
  }

  disconnect(): void {
    if (this.roomId && this.userId) {
      this.send({ type: 'leave', roomId: this.roomId, userId: this.userId });
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new WebSocketClient();
