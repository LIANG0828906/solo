import { useAppStore } from './store';
import { SyncMessage, Highlight, Comment, User } from './types';

type PendingDiff = {
  type: 'highlight:add' | 'highlight:remove' | 'comment:add';
  payload: Highlight | Comment;
};

type ConnectionState = 'disconnected' | 'connecting' | 'connected';

export class SyncManager {
  private ws: WebSocket | null = null;
  private wsUrl: string = '';
  private roomId: string = '';
  private connectionState: ConnectionState = 'disconnected';

  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private reconnectTimer: number | null = null;

  private heartbeatInterval: number | null = null;
  private heartbeatTimeout: number | null = null;
  private heartbeatIntervalMs: number = 30000;
  private heartbeatTimeoutMs: number = 10000;

  private pendingDiffs: PendingDiff[] = [];
  private broadcastTimer: number | null = null;
  private lastHighlightsState: string = '';
  private lastCommentsState: string = '';
  private unsubscribe: (() => void) | null = null;

  private messageQueue: SyncMessage[] = [];
  private listeners: Set<(msg: SyncMessage) => void> = new Set();

  init(roomId: string, wsUrl?: string) {
    this.roomId = roomId;
    if (wsUrl) {
      this.wsUrl = wsUrl;
    }

    const state = useAppStore.getState();
    this.lastHighlightsState = JSON.stringify(state.highlights);
    this.lastCommentsState = JSON.stringify(state.comments);

    state.addUser(state.currentUser);

    this.unsubscribe = useAppStore.subscribe((s, p) => this.onStoreChange(s, p));

    if (this.wsUrl) {
      this.connect();
    } else {
      this.setupBroadcastChannel();
    }
  }

  private broadcastChannel: BroadcastChannel | null = null;

  private setupBroadcastChannel() {
    try {
      this.broadcastChannel = new BroadcastChannel(`highlight-collab-${this.roomId}`);
      this.broadcastChannel.onmessage = (event: MessageEvent<SyncMessage>) => {
        this.handleRemoteMessage(event.data);
      };
      this.connectionState = 'connected';
      this.broadcastUserJoin(useAppStore.getState().currentUser);
    } catch {
      console.warn('BroadcastChannel 不可用，使用本地模式');
    }
  }

  connect() {
    if (!this.wsUrl || this.connectionState === 'connected') return;

    this.connectionState = 'connecting';

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        this.startHeartbeat();

        const joinMsg: SyncMessage = {
          type: 'user:join',
          payload: useAppStore.getState().currentUser,
          roomId: this.roomId,
          senderId: useAppStore.getState().currentUser.id,
          timestamp: Date.now(),
        };
        this.sendOverWebSocket(joinMsg);

        this.flushMessageQueue();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = this.deserializeMessage(event.data);
          if (msg) {
            this.handleRemoteMessage(msg);
          }
        } catch (e) {
          console.error('消息解析失败', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket 错误', error);
        this.stopHeartbeat();
      };

      this.ws.onclose = () => {
        this.connectionState = 'disconnected';
        this.stopHeartbeat();
        this.scheduleReconnect();
      };
    } catch (e) {
      console.error('WebSocket 连接失败', e);
      this.connectionState = 'disconnected';
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('达到最大重连次数，使用本地模式');
      if (!this.broadcastChannel) {
        this.setupBroadcastChannel();
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = window.setInterval(() => {
      if (this.connectionState === 'connected' && this.ws?.readyState === WebSocket.OPEN) {
        const pingMsg: SyncMessage = {
          type: 'user:join' as any,
          payload: { id: useAppStore.getState().currentUser.id, nickname: 'ping', color: '', avatarIndex: 0 },
          roomId: this.roomId,
          senderId: useAppStore.getState().currentUser.id,
          timestamp: Date.now(),
        };
        this.sendOverWebSocket(pingMsg);

        this.heartbeatTimeout = window.setTimeout(() => {
          console.warn('心跳超时，连接已断开');
          this.ws?.close();
        }, this.heartbeatTimeoutMs);
      }
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private serializeMessage(msg: SyncMessage): string {
    return JSON.stringify(msg);
  }

  private deserializeMessage(data: string): SyncMessage | null {
    try {
      const msg = JSON.parse(data);
      if (msg.type && msg.payload && msg.roomId) {
        return msg as SyncMessage;
      }
      return null;
    } catch {
      return null;
    }
  }

  private sendOverWebSocket(msg: SyncMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(this.serializeMessage(msg));
    } else {
      this.messageQueue.push(msg);
    }
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      if (msg) {
        this.sendOverWebSocket(msg);
      }
    }
  }

  private onStoreChange(state: ReturnType<typeof useAppStore.getState>, previousState: any) {
    if (this.roomId !== state.roomId) {
      this.roomId = state.roomId;
      this.reconnect();
      return;
    }

    const newHighlightsState = JSON.stringify(state.highlights);
    const newCommentsState = JSON.stringify(state.comments);

    if (newHighlightsState !== this.lastHighlightsState) {
      if (state.highlights.length > previousState.highlights.length) {
        const newHighlight = state.highlights[state.highlights.length - 1];
        if (newHighlight.userId === state.currentUser.id) {
          this.enqueueDiff({ type: 'highlight:add', payload: newHighlight });
        }
      }
      this.lastHighlightsState = newHighlightsState;
    }

    if (newCommentsState !== this.lastCommentsState) {
      if (state.comments.length > previousState.comments.length) {
        const newComment = state.comments[state.comments.length - 1];
        if (newComment.userId === state.currentUser.id) {
          this.enqueueDiff({ type: 'comment:add', payload: newComment });
        }
      }
      this.lastCommentsState = newCommentsState;
    }
  }

  subscribe(callback: (msg: SyncMessage) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(msg: SyncMessage) {
    for (const listener of this.listeners) {
      try {
        listener(msg);
      } catch (e) {
        console.error('监听器执行失败', e);
      }
    }
  }

  private enqueueDiff(diff: PendingDiff) {
    this.pendingDiffs.push(diff);
    this.scheduleBroadcast();
  }

  private scheduleBroadcast() {
    if (this.broadcastTimer !== null) return;
    this.broadcastTimer = window.setTimeout(() => {
      this.flushPending();
      this.broadcastTimer = null;
    }, 100);
  }

  private flushPending() {
    if (this.pendingDiffs.length === 0) return;
    const state = useAppStore.getState();
    for (const diff of this.pendingDiffs) {
      const msg: SyncMessage = {
        type: diff.type,
        payload: diff.payload,
        roomId: this.roomId,
        senderId: state.currentUser.id,
        timestamp: Date.now(),
      };

      if (this.ws && this.connectionState === 'connected') {
        this.sendOverWebSocket(msg);
      } else if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(msg);
      }
    }
    this.pendingDiffs = [];
  }

  private handleRemoteMessage(msg: SyncMessage) {
    if (msg.roomId !== this.roomId) return;
    const state = useAppStore.getState();
    if (msg.senderId === state.currentUser.id) return;

    this.notifyListeners(msg);

    switch (msg.type) {
      case 'highlight:add':
        state.addHighlightFromRemote(msg.payload as Highlight);
        break;
      case 'highlight:remove':
        state.removeHighlight((msg.payload as Highlight).id);
        break;
      case 'comment:add':
        state.addCommentFromRemote(msg.payload as Comment);
        break;
      case 'user:join': {
        const user = msg.payload as User;
        if (user.nickname !== 'ping') {
          state.addUser(user);
          if (this.broadcastChannel || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
            this.broadcastUserJoin(state.currentUser);
          }
        }
        break;
      }
      case 'user:leave':
        state.removeUser((msg.payload as User).id);
        break;
    }
  }

  private broadcastUserJoin(user: User) {
    const msg: SyncMessage = {
      type: 'user:join',
      payload: user,
      roomId: this.roomId,
      senderId: user.id,
      timestamp: Date.now(),
    };

    if (this.ws && this.connectionState === 'connected') {
      this.sendOverWebSocket(msg);
    } else if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(msg);
    }
  }

  private reconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    if (this.wsUrl) {
      this.connectionState = 'disconnected';
      this.connect();
    } else {
      this.setupBroadcastChannel();
    }
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  destroy() {
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.broadcastTimer !== null) {
      clearTimeout(this.broadcastTimer);
      this.broadcastTimer = null;
    }

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.ws) {
      const leaveMsg: SyncMessage = {
        type: 'user:leave',
        payload: useAppStore.getState().currentUser,
        roomId: this.roomId,
        senderId: useAppStore.getState().currentUser.id,
        timestamp: Date.now(),
      };
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(this.serializeMessage(leaveMsg));
      }
      this.ws.close();
      this.ws = null;
    }

    if (this.broadcastChannel) {
      const leaveMsg: SyncMessage = {
        type: 'user:leave',
        payload: useAppStore.getState().currentUser,
        roomId: this.roomId,
        senderId: useAppStore.getState().currentUser.id,
        timestamp: Date.now(),
      };
      this.broadcastChannel.postMessage(leaveMsg);
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    this.connectionState = 'disconnected';
    this.listeners.clear();
    this.messageQueue = [];
    this.pendingDiffs = [];
  }
}

export const syncManager = new SyncManager();
