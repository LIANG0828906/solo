import { io, Socket } from 'socket.io-client';
import { GeneticElement, Connection, Position } from '@/models/GeneticElement';
import { useGeneStore } from '@/store/useGeneStore';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(roomId: string = 'default') {
    if (this.socket?.connected) return;

    try {
      this.socket = io('http://localhost:3001', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      });

      const store = useGeneStore.getState();
      const userId = store.currentUserId;

      this.socket.on('connect', () => {
        console.log('[Socket] Connected');
        this.reconnectAttempts = 0;
        useGeneStore.getState().setSocketConnected(true);
        this.socket?.emit('room:join', { roomId, userId, userName: `用户${userId.slice(0, 4)}` });
      });

      this.socket.on('disconnect', () => {
        console.log('[Socket] Disconnected');
        useGeneStore.getState().setSocketConnected(false);
      });

      this.socket.on('connect_error', () => {
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.log('[Socket] Max reconnect attempts reached, working offline');
          this.socket?.disconnect();
        }
      });

      this.socket.on('elements:sync', (data: { elements: GeneticElement[]; connections: Connection[] }) => {
        useGeneStore.getState().syncFromRemote(data.elements, data.connections);
      });

      this.socket.on('element:added', (data: { element: GeneticElement }) => {
        const state = useGeneStore.getState();
        const exists = state.elements.some((el) => el.id === data.element.id);
        if (!exists) {
          useGeneStore.setState((s) => ({ elements: [...s.elements, data.element] }));
        }
      });

      this.socket.on('element:moved', (data: { id: string; position: Position }) => {
        useGeneStore.getState().moveElement(data.id, data.position);
      });

      this.socket.on('element:removed', (data: { id: string }) => {
        useGeneStore.getState().removeElement(data.id);
      });

      this.socket.on('connection:added', (data: { connection: Connection }) => {
        const state = useGeneStore.getState();
        const exists = state.connections.some((c) => c.id === data.connection.id);
        if (!exists) {
          useGeneStore.setState((s) => ({ connections: [...s.connections, data.connection] }));
        }
      });

      this.socket.on('connection:removed', (data: { id: string }) => {
        useGeneStore.getState().removeConnection(data.id);
      });

      this.socket.on('cursor:moved', (data: { userId: string; position: Position }) => {
        useGeneStore.getState().updateRemoteCursor(data.userId, data.position);
      });

      this.socket.on('user:joined', (data: { userId: string; userName: string }) => {
        if (data.userId !== userId) {
          useGeneStore.getState().addRemoteCursor(data.userId, data.userName);
        }
      });

      this.socket.on('user:left', (data: { userId: string }) => {
        useGeneStore.getState().removeRemoteCursor(data.userId);
      });
    } catch (error) {
      console.log('[Socket] Failed to connect, working offline:', error);
      useGeneStore.getState().setSocketConnected(false);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emitElementAdd(element: GeneticElement) {
    this.socket?.emit('element:add', { element });
  }

  emitElementMove(id: string, position: Position) {
    this.socket?.emit('element:move', { id, position });
  }

  emitElementRemove(id: string) {
    this.socket?.emit('element:remove', { id });
  }

  emitConnectionAdd(connection: Connection) {
    this.socket?.emit('connection:add', { connection });
  }

  emitConnectionRemove(id: string) {
    this.socket?.emit('connection:remove', { id });
  }

  emitCursorMove(position: Position) {
    const userId = useGeneStore.getState().currentUserId;
    this.socket?.emit('cursor:move', { userId, position });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
