export interface Comment {
  id: string;
  lineIndex: number;
  content: string;
  author: string;
  timestamp: number;
  parentId: string | null;
  replies: Comment[];
}

export interface HistoryRecord {
  id: string;
  type: 'version' | 'comment' | 'approve' | 'reject';
  description: string;
  user: string;
  timestamp: number;
}

export type ApprovalStatus = 'pending' | 'reviewing' | 'approved' | 'rejected';

export interface ContractData {
  contractId: string;
  oldContent: string;
  newContent: string;
  comments: Comment[];
  approvalStatus: ApprovalStatus;
  history: HistoryRecord[];
}

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getContract(): Promise<ContractData> {
  const response = await fetch(`${API_BASE}/contract`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<ContractData>(response);
}

export interface AddCommentRequest {
  lineIndex: number;
  content: string;
  author: string;
  parentId?: string;
}

export async function addComment(request: AddCommentRequest): Promise<Comment> {
  const response = await fetch(`${API_BASE}/comment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  return handleResponse<Comment>(response);
}

export interface ApproveRequest {
  action?: 'approve' | 'reject';
  user: string;
  oldContent?: string;
  newContent?: string;
}

export interface ApproveResponse {
  status: ApprovalStatus;
  history: HistoryRecord[];
}

export async function approveContract(request: ApproveRequest): Promise<ApproveResponse> {
  const response = await fetch(`${API_BASE}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  return handleResponse<ApproveResponse>(response);
}

export type WSEventType =
  | 'connected'
  | 'subscribe_ack'
  | 'status_updated'
  | 'comment_added'
  | 'history_updated'
  | 'version_uploaded';

export interface WSMessage {
  type: WSEventType | string;
  payload: unknown;
  timestamp: number;
}

export interface WSHandlers {
  onStatusUpdated?: (status: ApprovalStatus) => void;
  onCommentAdded?: (comment: Comment) => void;
  onHistoryUpdated?: (history: HistoryRecord[]) => void;
  onVersionUploaded?: (oldContent: string, newContent: string) => void;
  onConnected?: () => void;
  onSubscribed?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Event) => void;
}

async function detectBackendPort(): Promise<number> {
  try {
    const response = await fetch(`${API_BASE}/port`);
    if (response.ok) {
      const data = await response.json();
      if (data.port) {
        console.log('[WS] Detected backend port:', data.port);
        return data.port;
      }
    }
  } catch (err) {
    console.warn('[WS] Failed to detect backend port via API, using default');
  }
  return 3001;
}

export function createWebSocketConnection(handlers: WSHandlers = {}): {
  close: () => void;
  isOpen: () => boolean;
  isSubscribed: () => boolean;
} {
  let ws: WebSocket | undefined;
  let closed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempts = 0;
  let subscriptionConfirmed = false;
  const MAX_RECONNECT_ATTEMPTS = 10;
  const RECONNECT_DELAY_BASE = 1000;
  let resolvedWsUrl = '';

  const safeSend = (data: string): boolean => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(data);
        return true;
      } catch (err) {
        console.error('[WS] Failed to send message:', err);
        return false;
      }
    }
    return false;
  };

  const connect = async (): Promise<void> => {
    try {
      subscriptionConfirmed = false;
      if (!resolvedWsUrl) {
        const backendPort = await detectBackendPort();
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const hostname = window.location.hostname;
        resolvedWsUrl = `${protocol}//${hostname}:${backendPort}/ws`;
        console.log('[WS] Connecting to:', resolvedWsUrl);
      }
      ws = new WebSocket(resolvedWsUrl);

      ws.onopen = () => {
        console.log('[WS] TCP connection established, waiting for server hello');
        reconnectAttempts = 0;
        setTimeout(() => {
          if (!subscriptionConfirmed && ws && ws.readyState === WebSocket.OPEN) {
            console.log('[WS] Auto-sending subscribe (fallback timeout)');
            safeSend(JSON.stringify({ type: 'subscribe' }));
          }
        }, 1500);
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          console.log('[WS] Received:', message.type);

          switch (message.type) {
            case 'connected': {
              console.log('[WS] Server hello received, sending subscription request');
              handlers.onConnected?.();
              safeSend(JSON.stringify({ type: 'subscribe' }));
              break;
            }
            case 'subscribe_ack': {
              const payload = message.payload as {
                success: boolean;
                subscribedAt: number;
                events: string[];
              };
              if (payload.success) {
                subscriptionConfirmed = true;
                console.log('[WS] Subscription confirmed, events:', payload.events);
                handlers.onSubscribed?.();
              } else {
                console.error('[WS] Subscription rejected by server');
              }
              break;
            }
            case 'status_updated': {
              if (!subscriptionConfirmed) {
                console.warn('[WS] Skipping status_updated: subscription not confirmed');
                break;
              }
              const payload = message.payload as { status: ApprovalStatus };
              handlers.onStatusUpdated?.(payload.status);
              break;
            }
            case 'comment_added': {
              if (!subscriptionConfirmed) {
                console.warn('[WS] Skipping comment_added: subscription not confirmed');
                break;
              }
              const payload = message.payload as { comment: Comment };
              handlers.onCommentAdded?.(payload.comment);
              break;
            }
            case 'history_updated': {
              if (!subscriptionConfirmed) {
                console.warn('[WS] Skipping history_updated: subscription not confirmed');
                break;
              }
              const payload = message.payload as { history: HistoryRecord[] };
              handlers.onHistoryUpdated?.(payload.history);
              break;
            }
            case 'version_uploaded': {
              if (!subscriptionConfirmed) {
                console.warn('[WS] Skipping version_uploaded: subscription not confirmed');
                break;
              }
              const payload = message.payload as {
                oldContent: string;
                newContent: string;
              };
              handlers.onVersionUploaded?.(payload.oldContent, payload.newContent);
              break;
            }
            case 'error': {
              const payload = message.payload as { code: string; message: string };
              console.error('[WS] Server error:', payload.code, payload.message);
              break;
            }
            case 'pong': {
              break;
            }
            default: {
              console.log('[WS] Unknown message type:', message.type);
            }
          }
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[WS] Transport error:', error);
        handlers.onError?.(error);
      };

      ws.onclose = (event) => {
        console.log('[WS] Connection closed:', event.code, event.reason);
        subscriptionConfirmed = false;
        handlers.onDisconnected?.();

        if (!closed && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const delay = RECONNECT_DELAY_BASE * Math.pow(2, reconnectAttempts - 1);
          console.log(
            `[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`
          );
          reconnectTimer = setTimeout(() => {
            void connect();
          }, delay);
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.error('[WS] Max reconnect attempts reached, giving up');
        }
      };
    } catch (err) {
      console.error('[WS] Failed to create WebSocket:', err);
    }
  };

  void connect();

  return {
    close: () => {
      closed = true;
      subscriptionConfirmed = false;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    },
    isOpen: () => ws?.readyState === WebSocket.OPEN,
    isSubscribed: () => subscriptionConfirmed,
  };
}
