import type { CollabOperation, ClientMessage, ServerMessage, Collaborator } from '../types';

type MessageHandler = (message: ServerMessage) => void;

const COLLAB_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

const generateRandomName = (): string => {
  const adjectives = ['创意', '灵动', '深邃', '热情', '冷静', '神秘', '活泼', '优雅'];
  const nouns = ['音乐人', '制作人', '创作者', '设计师', '艺术家', '梦想家'];
  return (
    adjectives[Math.floor(Math.random() * adjectives.length)] +
    nouns[Math.floor(Math.random() * nouns.length)]
  );
};

const getUserName = (): string => {
  let name = localStorage.getItem('audio_collab_user_name');
  if (!name) {
    name = generateRandomName();
    localStorage.setItem('audio_collab_user_name', name);
  }
  return name;
};

const getUserColor = (): string => {
  let color = localStorage.getItem('audio_collab_user_color');
  if (!color) {
    color = COLLAB_COLORS[Math.floor(Math.random() * COLLAB_COLORS.length)];
    localStorage.setItem('audio_collab_user_color', color);
  }
  return color;
};

export class CollabManager {
  private ws: WebSocket | null = null;
  private projectId: string = 'default';
  private userId: string;
  private userName: string;
  private userColor: string;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnected = false;
  private pendingOperations: CollabOperation[] = [];

  constructor(userId: string) {
    this.userId = userId;
    this.userName = getUserName();
    this.userColor = getUserColor();
  }

  public getCurrentUser(): Collaborator {
    return {
      id: this.userId,
      name: this.userName,
      color: this.userColor,
      cursor: null,
    };
  }

  public setUserName(name: string) {
    this.userName = name;
    localStorage.setItem('audio_collab_user_name', name);
  }

  public subscribe(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private notify(message: ServerMessage) {
    this.handlers.forEach((cb) => cb(message));
  }

  public async connect(projectId: string): Promise<boolean> {
    this.projectId = projectId;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/project/${projectId}`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[Collab] WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.sendJoinMessage();
        this.flushPendingOperations();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          this.notify(message);
        } catch (e) {
          console.error('[Collab] Failed to parse message:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('[Collab] WebSocket disconnected');
        this.isConnected = false;
        this.tryReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[Collab] WebSocket error:', error);
      };

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('[Collab] Connection timeout, using local mode');
          resolve(false);
        }, 2000);

        if (this.ws) {
          this.ws.onopen = () => {
            clearTimeout(timeout);
            console.log('[Collab] WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.sendJoinMessage();
            this.flushPendingOperations();
            resolve(true);
          };
        }
      });
    } catch (e) {
      console.error('[Collab] Failed to connect:', e);
      return false;
    }
  }

  private sendJoinMessage() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const message: ClientMessage = {
      type: 'join',
      projectId: this.projectId,
      userId: this.userId,
      userName: this.userName,
    };

    this.ws.send(JSON.stringify(message));
  }

  private tryReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[Collab] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    console.log(`[Collab] Reconnecting in ${delay}ms...`);
    setTimeout(() => {
      this.connect(this.projectId);
    }, delay);
  }

  public sendOperation(operation: CollabOperation) {
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: ClientMessage = {
        type: 'operation',
        operation,
      };
      this.ws.send(JSON.stringify(message));
    } else {
      this.pendingOperations.push(operation);
    }
  }

  private flushPendingOperations() {
    while (this.pendingOperations.length > 0) {
      const op = this.pendingOperations.shift();
      if (op) {
        this.sendOperation(op);
      }
    }
  }

  public broadcastClipAdd(clip: any) {
    const operation: CollabOperation = {
      type: 'clip-add',
      payload: clip,
      userId: this.userId,
      timestamp: Date.now(),
    };
    this.sendOperation(operation);
  }

  public broadcastClipMove(clipId: string, updates: any) {
    const operation: CollabOperation = {
      type: 'clip-move',
      payload: { id: clipId, updates },
      userId: this.userId,
      timestamp: Date.now(),
    };
    this.sendOperation(operation);
  }

  public broadcastClipUpdate(clipId: string, updates: any) {
    const operation: CollabOperation = {
      type: 'clip-update',
      payload: { id: clipId, updates },
      userId: this.userId,
      timestamp: Date.now(),
    };
    this.sendOperation(operation);
  }

  public broadcastClipDelete(clipId: string) {
    const operation: CollabOperation = {
      type: 'clip-delete',
      payload: { id: clipId },
      userId: this.userId,
      timestamp: Date.now(),
    };
    this.sendOperation(operation);
  }

  public broadcastTrackAdd(track: any) {
    const operation: CollabOperation = {
      type: 'track-add',
      payload: track,
      userId: this.userId,
      timestamp: Date.now(),
    };
    this.sendOperation(operation);
  }

  public broadcastTrackUpdate(trackId: string, updates: any) {
    const operation: CollabOperation = {
      type: 'track-update',
      payload: { id: trackId, updates },
      userId: this.userId,
      timestamp: Date.now(),
    };
    this.sendOperation(operation);
  }

  public broadcastCursorMove(cursor: { x: number; y: number } | null) {
    const operation: CollabOperation = {
      type: 'cursor-move',
      payload: { cursor },
      userId: this.userId,
      timestamp: Date.now(),
    };
    this.sendOperation(operation);
  }

  public generateInviteLink(projectId: string): string {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?project=${projectId}&invite=true`;
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}
