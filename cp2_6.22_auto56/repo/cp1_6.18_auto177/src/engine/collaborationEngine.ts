import type { BoardElement, IncrementalOp, DiffHighlight, StickyNote } from '../types';
import { v4 as uuidv4 } from 'uuid';

type SyncListener = (elements: BoardElement[]) => void;
type ConnectionListener = (connected: boolean, role: 'editor' | 'viewer') => void;
type LoadingListener = (loading: boolean) => void;

const RECONNECT_DELAY_MS = 500;
const MAX_RECONNECT_DELAY_MS = 5000;
const SYNC_TIMEOUT_MS = 200;

export class CollaborationEngine {
  private ws: WebSocket | null = null;
  private boardId: string = 'default';
  private sessionId: string = uuidv4();
  private role: 'editor' | 'viewer' = 'editor';
  private connected = false;
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private shouldReconnect = true;
  private pendingOps: IncrementalOp[] = [];
  private syncTimer: number | null = null;
  private syncListeners: SyncListener[] = [];
  private connectionListeners: ConnectionListener[] = [];
  private loadingListeners: LoadingListener[] = [];
  private localElements: Map<string, BoardElement> = new Map();
  private onRemoteOp: ((op: IncrementalOp) => void) | null = null;

  constructor() {}

  getSessionId(): string {
    return this.sessionId;
  }

  getRole(): 'editor' | 'viewer' {
    return this.role;
  }

  isConnected(): boolean {
    return this.connected;
  }

  setRemoteOpHandler(handler: (op: IncrementalOp) => void) {
    this.onRemoteOp = handler;
  }

  onSync(listener: SyncListener) {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  onConnection(listener: ConnectionListener) {
    this.connectionListeners.push(listener);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
    };
  }

  onLoading(listener: LoadingListener) {
    this.loadingListeners.push(listener);
    return () => {
      this.loadingListeners = this.loadingListeners.filter(l => l !== listener);
    };
  }

  connect(boardId: string, role: 'editor' | 'viewer' = 'editor'): Promise<void> {
    this.boardId = boardId;
    this.role = role;
    this.shouldReconnect = true;
    return this.establishConnection();
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.closeWebSocket();
  }

  private closeWebSocket() {
    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    if (this.connected) {
      this.connected = false;
      this.connectionListeners.forEach(l => l(false, this.role));
    }
  }

  private establishConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.closeWebSocket();
        this.emitLoading(true);

        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = `${proto}//${window.location.host}/ws?boardId=${encodeURIComponent(this.boardId)}&sessionId=${this.sessionId}&role=${this.role}`;

        this.ws = new WebSocket(url);
        let resolved = false;

        this.ws.onopen = () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          this.emitLoading(false);
          this.connectionListeners.forEach(l => l(true, this.role));
          this.flushPendingOps();
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };

        this.ws.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            this.handleMessage(data);
          } catch (e) {
            console.error('[CollabEngine] parse error', e);
          }
        };

        this.ws.onerror = (err) => {
          console.error('[CollabEngine] ws error', err);
          this.emitLoading(false);
          if (!resolved) {
            resolved = true;
            reject(err);
          }
        };

        this.ws.onclose = () => {
          this.emitLoading(false);
          if (this.connected) {
            this.connected = false;
            this.connectionListeners.forEach(l => l(false, this.role));
          }
          if (this.shouldReconnect) {
            this.scheduleReconnect();
          }
          if (!resolved) {
            resolved = true;
            reject(new Error('Connection closed'));
          }
        };

        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            reject(new Error('Connection timeout'));
          }
        }, 5000);
      } catch (e) {
        reject(e);
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer !== null) return;
    this.reconnectAttempts++;
    const delay = Math.min(
      RECONNECT_DELAY_MS * Math.pow(2, Math.min(this.reconnectAttempts, 5)),
      MAX_RECONNECT_DELAY_MS
    );
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.establishConnection().catch(() => {});
    }, delay);
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'op': {
        const op = data.op as IncrementalOp;
        if (op.senderId === this.sessionId) return;
        this.applyRemoteOp(op);
        break;
      }
      case 'sync': {
        const elements = data.elements as BoardElement[];
        this.localElements.clear();
        elements.forEach(e => this.localElements.set(e.id, e));
        this.syncListeners.forEach(l => l([...this.localElements.values()]));
        break;
      }
      case 'welcome': {
        if (data.elements) {
          const elements = data.elements as BoardElement[];
          this.localElements.clear();
          elements.forEach(e => this.localElements.set(e.id, e));
          this.syncListeners.forEach(l => l([...this.localElements.values()]));
        }
        break;
      }
    }
  }

  private applyRemoteOp(op: IncrementalOp) {
    switch (op.type) {
      case 'add':
        if (op.element) {
          this.localElements.set(op.elementId, op.element);
        }
        break;
      case 'remove':
        this.localElements.delete(op.elementId);
        this.localElements.forEach((el) => {
          if (el.type === 'line') {
            if (el.fromStickyId === op.elementId || el.toStickyId === op.elementId) {
              this.localElements.delete(el.id);
            }
          }
        });
        break;
      case 'update':
      case 'move': {
        const existing = this.localElements.get(op.elementId);
        if (existing && op.delta && existing.type === 'sticky') {
          const updated = { ...existing, ...op.delta } as StickyNote;
          this.localElements.set(op.elementId, updated);
        }
        break;
      }
    }
    if (this.onRemoteOp) {
      this.onRemoteOp(op);
    }
    this.syncListeners.forEach(l => l([...this.localElements.values()]));
  }

  sendOp(op: Omit<IncrementalOp, 'senderId' | 'timestamp'>) {
    if (this.role !== 'editor') return;
    const fullOp: IncrementalOp = {
      ...op,
      senderId: this.sessionId,
      timestamp: Date.now(),
    };
    const serialized = JSON.stringify({ type: 'op', op: fullOp });
    if (serialized.length > 200 && op.type === 'add' && op.element && op.element.type === 'brush') {
      console.warn('[CollabEngine] large op size', serialized.length);
    }
    if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(serialized);
      } catch (e) {
        this.pendingOps.push(fullOp);
      }
    } else {
      this.pendingOps.push(fullOp);
    }
  }

  private flushPendingOps() {
    if (!this.connected || !this.ws) return;
    while (this.pendingOps.length > 0) {
      const op = this.pendingOps.shift();
      if (!op) break;
      try {
        this.ws.send(JSON.stringify({ type: 'op', op }));
      } catch (e) {
        this.pendingOps.unshift(op);
        break;
      }
    }
  }

  setLocalElements(elements: BoardElement[]) {
    this.localElements.clear();
    elements.forEach(e => this.localElements.set(e.id, e));
  }

  private emitLoading(loading: boolean) {
    this.loadingListeners.forEach(l => l(loading));
  }
}

export const collaborationEngine = new CollaborationEngine();
