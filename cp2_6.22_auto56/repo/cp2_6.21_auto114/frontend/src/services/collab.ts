import type { NodeData, RelationData } from '../types';

type WSMessage =
  | { type: 'user_joined'; userId: string; username: string; color: string }
  | { type: 'user_left'; userId: string }
  | { type: 'cursor_update'; userId: string; x: number; y: number }
  | { type: 'node_added'; userId: string; node: NodeData }
  | { type: 'node_updated'; userId: string; nodeId: string; changes: Partial<NodeData> }
  | { type: 'node_deleted'; userId: string; nodeId: string }
  | { type: 'relation_added'; userId: string; relation: RelationData }
  | { type: 'relation_deleted'; userId: string; relationId: string }
  | { type: 'hello'; userId: string; username: string; color: string }
  | { type: 'users_list'; users: Array<{ id: string; username: string; color: string }> }
  | { type: 'error'; message: string };

export interface CollabCallbacks {
  onUserJoined?: (userId: string, username: string, color: string) => void;
  onUserLeft?: (userId: string) => void;
  onCursorUpdate?: (userId: string, x: number, y: number) => void;
  onNodeAdded?: (node: NodeData, remoteUserId: string) => void;
  onNodeUpdated?: (nodeId: string, changes: Partial<NodeData>, remoteUserId: string) => void;
  onNodeDeleted?: (nodeId: string, remoteUserId: string) => void;
  onRelationAdded?: (rel: RelationData, remoteUserId: string) => void;
  onRelationDeleted?: (relationId: string, remoteUserId: string) => void;
  onUsersList?: (users: Array<{ id: string; username: string; color: string }>) => void;
  onError?: (message: string) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export class CollabClient {
  private ws: WebSocket | null = null;
  private treeId: string;
  private userId: string;
  private username: string;
  private color: string;
  private callbacks: CollabCallbacks;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private cursorThrottle = 0;

  constructor(
    treeId: string,
    userId: string,
    username: string,
    color: string,
    callbacks: CollabCallbacks,
  ) {
    this.treeId = treeId;
    this.userId = userId;
    this.username = username;
    this.color = color;
    this.callbacks = callbacks;
  }

  connect(): void {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${proto}//${window.location.host}/ws/family-trees/${this.treeId}?user=${encodeURIComponent(this.username)}&uid=${this.userId}&color=${encodeURIComponent(this.color)}`;
    try {
      this.ws = new WebSocket(url);
    } catch (e) {
      console.warn('Collab WebSocket not available, running offline', e);
      return;
    }
    this.ws.onopen = () => {
      this.callbacks.onConnected?.();
      this.sendRaw({
        type: 'hello',
        userId: this.userId,
        username: this.username,
        color: this.color,
      });
    };
    this.ws.onclose = () => {
      this.callbacks.onDisconnected?.();
      this.scheduleReconnect();
    };
    this.ws.onerror = () => {
      console.warn('Collab WebSocket error');
    };
    this.ws.onmessage = (ev) => {
      try {
        const msg: WSMessage = JSON.parse(ev.data);
        this.handleMessage(msg);
      } catch (e) {
        console.warn('Invalid collab message', e);
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connect(), 3000);
  }

  private handleMessage(msg: WSMessage): void {
    switch (msg.type) {
      case 'user_joined':
        if (msg.userId !== this.userId) {
          this.callbacks.onUserJoined?.(msg.userId, msg.username, msg.color);
        }
        break;
      case 'user_left':
        this.callbacks.onUserLeft?.(msg.userId);
        break;
      case 'users_list':
        this.callbacks.onUsersList?.(
          msg.users.filter((u) => u.id !== this.userId),
        );
        break;
      case 'cursor_update':
        if (msg.userId !== this.userId) {
          this.callbacks.onCursorUpdate?.(msg.userId, msg.x, msg.y);
        }
        break;
      case 'node_added':
        if (msg.userId !== this.userId) this.callbacks.onNodeAdded?.(msg.node, msg.userId);
        break;
      case 'node_updated':
        if (msg.userId !== this.userId)
          this.callbacks.onNodeUpdated?.(msg.nodeId, msg.changes, msg.userId);
        break;
      case 'node_deleted':
        if (msg.userId !== this.userId) this.callbacks.onNodeDeleted?.(msg.nodeId, msg.userId);
        break;
      case 'relation_added':
        if (msg.userId !== this.userId)
          this.callbacks.onRelationAdded?.(msg.relation, msg.userId);
        break;
      case 'relation_deleted':
        if (msg.userId !== this.userId)
          this.callbacks.onRelationDeleted?.(msg.relationId, msg.userId);
        break;
      case 'error':
        this.callbacks.onError?.(msg.message);
        break;
    }
  }

  private sendRaw(payload: WSMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(JSON.stringify(payload));
    } catch (e) {
      console.warn('Collab send failed', e);
    }
  }

  sendCursor(x: number, y: number): void {
    const now = performance.now();
    if (now - this.cursorThrottle < 33) return;
    this.cursorThrottle = now;
    this.sendRaw({ type: 'cursor_update', userId: this.userId, x, y });
  }

  sendNodeAdded(node: NodeData): void {
    this.sendRaw({ type: 'node_added', userId: this.userId, node });
  }
  sendNodeUpdated(nodeId: string, changes: Partial<NodeData>): void {
    this.sendRaw({ type: 'node_updated', userId: this.userId, nodeId, changes });
  }
  sendNodeDeleted(nodeId: string): void {
    this.sendRaw({ type: 'node_deleted', userId: this.userId, nodeId });
  }
  sendRelationAdded(relation: RelationData): void {
    this.sendRaw({ type: 'relation_added', userId: this.userId, relation });
  }
  sendRelationDeleted(relationId: string): void {
    this.sendRaw({ type: 'relation_deleted', userId: this.userId, relationId });
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }
}
