import type {
  ClientMessage,
  ServerMessage,
  EditOp,
  UserInfo,
  Comment,
  Reply,
  ConflictInfo,
} from '../types';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface CollabEngineOptions {
  userId: string;
  userName: string;
  documentId: string;
  onMessage?: (message: ServerMessage) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

export class CollabEngine {
  private ws: WebSocket | null = null;
  private userId: string;
  private userName: string;
  private documentId: string;
  private status: ConnectionStatus = 'disconnected';
  private onMessageCallback?: (message: ServerMessage) => void;
  private onStatusChangeCallback?: (status: ConnectionStatus) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingMessages: ClientMessage[] = [];

  constructor(options: CollabEngineOptions) {
    this.userId = options.userId;
    this.userName = options.userName;
    this.documentId = options.documentId;
    this.onMessageCallback = options.onMessage;
    this.onStatusChangeCallback = options.onStatusChange;
  }

  connect(): void {
    if (this.ws && this.status === 'connected') return;

    this.setStatus('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('connected');
        this.sendJoin();
        this.flushPendingMessages();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          this.onMessageCallback?.(message);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        this.tryReconnect();
      };

      this.ws.onerror = () => {
        this.setStatus('error');
      };
    } catch (e) {
      console.error('Failed to create WebSocket connection:', e);
      this.setStatus('error');
      this.tryReconnect();
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;

    if (this.ws) {
      this.sendLeave();
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.onStatusChangeCallback?.(status);
  }

  private tryReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setStatus('error');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectTimer = setTimeout(() => {
      if (this.status !== 'connected') {
        this.connect();
      }
    }, delay);
  }

  private send(message: ClientMessage): void {
    if (this.ws && this.status === 'connected') {
      this.ws.send(JSON.stringify(message));
    } else {
      this.pendingMessages.push(message);
    }
  }

  private flushPendingMessages(): void {
    while (this.pendingMessages.length > 0) {
      const msg = this.pendingMessages.shift();
      if (msg && this.ws && this.status === 'connected') {
        this.ws.send(JSON.stringify(msg));
      }
    }
  }

  private sendJoin(): void {
    this.send({
      type: 'join',
      documentId: this.documentId,
      userId: this.userId,
      userName: this.userName,
    });
  }

  private sendLeave(): void {
    this.send({
      type: 'leave',
      documentId: this.documentId,
      userId: this.userId,
    });
  }

  sendEdit(op: EditOp): void {
    this.send({
      type: 'edit',
      documentId: this.documentId,
      userId: this.userId,
      op,
    });
  }

  sendCursor(position: number): void {
    this.send({
      type: 'cursor',
      documentId: this.documentId,
      userId: this.userId,
      position,
    });
  }

  sendSelection(start: number, end: number): void {
    this.send({
      type: 'selection',
      documentId: this.documentId,
      userId: this.userId,
      start,
      end,
    });
  }

  sendComment(comment: Comment): void {
    this.send({
      type: 'comment',
      documentId: this.documentId,
      comment,
    });
  }

  sendResolveComment(commentId: string, resolved: boolean): void {
    this.send({
      type: 'resolveComment',
      documentId: this.documentId,
      commentId,
      resolved,
    });
  }

  sendReplyComment(commentId: string, reply: Reply): void {
    this.send({
      type: 'replyComment',
      documentId: this.documentId,
      commentId,
      reply,
    });
  }

  setOnMessage(callback: (message: ServerMessage) => void): void {
    this.onMessageCallback = callback;
  }

  setOnStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.onStatusChangeCallback = callback;
  }
}
