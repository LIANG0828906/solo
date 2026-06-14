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
  | 'status_updated'
  | 'comment_added'
  | 'history_updated'
  | 'version_uploaded';

export interface WSMessage {
  type: WSEventType;
  payload: unknown;
  timestamp: number;
}

export interface WSHandlers {
  onStatusUpdated?: (status: ApprovalStatus) => void;
  onCommentAdded?: (comment: Comment) => void;
  onHistoryUpdated?: (history: HistoryRecord[]) => void;
  onVersionUploaded?: (oldContent: string, newContent: string) => void;
  onConnected?: () => void;
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
} {
  let ws: WebSocket | undefined;
  let closed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 10;
  const RECONNECT_DELAY_BASE = 1000;
  let resolvedWsUrl = '';

  const connect = async (): Promise<void> => {
    try {
      if (!resolvedWsUrl) {
        const backendPort = await detectBackendPort();
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const hostname = window.location.hostname;
        resolvedWsUrl = `${protocol}//${hostname}:${backendPort}/ws`;
        console.log('[WS] Connecting to:', resolvedWsUrl);
      }
      ws = new WebSocket(resolvedWsUrl);

      ws.onopen = () => {
        console.log('[WS] Connection established');
        reconnectAttempts = 0;
        handlers.onConnected?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          console.log('[WS] Received:', message.type);

          switch (message.type) {
            case 'connected':
              handlers.onConnected?.();
              break;
            case 'status_updated': {
              const payload = message.payload as { status: ApprovalStatus };
              handlers.onStatusUpdated?.(payload.status);
              break;
            }
            case 'comment_added': {
              const payload = message.payload as { comment: Comment };
              handlers.onCommentAdded?.(payload.comment);
              break;
            }
            case 'history_updated': {
              const payload = message.payload as { history: HistoryRecord[] };
              handlers.onHistoryUpdated?.(payload.history);
              break;
            }
            case 'version_uploaded': {
              const payload = message.payload as {
                oldContent: string;
                newContent: string;
              };
              handlers.onVersionUploaded?.(payload.oldContent, payload.newContent);
              break;
            }
          }
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        handlers.onError?.(error);
      };

      ws.onclose = (event) => {
        console.log('[WS] Connection closed:', event.code, event.reason);
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
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    },
    isOpen: () => ws?.readyState === WebSocket.OPEN,
  };
}
