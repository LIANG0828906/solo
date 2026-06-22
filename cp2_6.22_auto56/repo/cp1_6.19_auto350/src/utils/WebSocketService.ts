import { io, Socket } from 'socket.io-client';

interface LightConfig {
  id: string;
  type: 'main' | 'fill' | 'spot';
  name: string;
  position: { x: number; y: number; z: number };
  colorTemp: number;
  intensity: number;
  angle?: number;
  penumbra?: number;
}

interface MaterialConfig {
  id: string;
  name: string;
  color: string;
  roughness: number;
  metalness: number;
  bumpScale: number;
}

interface DesignScheme {
  id: string;
  name: string;
  thumbnail: string;
  lights: LightConfig[];
  materials: Record<string, MaterialConfig>;
  createdAt: number;
}

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  connect(url: string = 'http://localhost:3001'): void {
    if (this.socket?.connected) return;

    this.socket = io(url, {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      this.emit('connect', null);
    });

    this.socket.on('disconnect', () => {
      this.emit('disconnect', null);
    });

    this.socket.on('scheme:list', (schemes: DesignScheme[]) => {
      this.emit('scheme:list', schemes);
    });

    this.socket.on('scheme:broadcast', (scheme: DesignScheme) => {
      this.emit('scheme:update', scheme);
    });

    this.socket.on('scheme:delete', ({ id }: { id: string }) => {
      this.emit('scheme:delete', { id });
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  saveScheme(scheme: Omit<DesignScheme, 'id' | 'createdAt'>): void {
    if (!this.socket) return;
    this.socket.emit('scheme:save', scheme);
  }

  updateScheme(scheme: DesignScheme): void {
    if (!this.socket) return;
    this.socket.emit('scheme:update', scheme);
  }

  deleteScheme(id: string): void {
    if (!this.socket) return;
    this.socket.emit('scheme:delete', { id });
  }

  getSchemeList(): void {
    if (!this.socket) return;
    this.socket.emit('scheme:list');
  }

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  onSchemeUpdate(callback: (scheme: DesignScheme) => void): () => void {
    return this.on('scheme:update', callback as (data: unknown) => void);
  }

  onSchemeList(callback: (schemes: DesignScheme[]) => void): () => void {
    return this.on('scheme:list', callback as (data: unknown) => void);
  }

  onSchemeDelete(callback: ({ id }: { id: string }) => void): () => void {
    return this.on('scheme:delete', callback as (data: unknown) => void);
  }

  onConnect(callback: () => void): () => void {
    return this.on('connect', () => callback());
  }

  onDisconnect(callback: () => void): () => void {
    return this.on('disconnect', () => callback());
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

export const webSocketService = new WebSocketService();
