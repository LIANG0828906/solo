import type { ChatMessage } from '@/shared/types';

const WS_URL = 'ws://localhost:3001';

type MessageHandler = (message: ChatMessage) => void;

let ws: WebSocket | null = null;
let messageHandler: MessageHandler | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export function connect(): void {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  ws.onmessage = (event) => {
    try {
      const message: ChatMessage = JSON.parse(event.data);
      messageHandler?.(message);
    } catch {
      console.error('Failed to parse chat message');
    }
  };

  ws.onclose = () => {
    reconnectTimer = setTimeout(() => connect(), 3000);
  };

  ws.onerror = () => {
    ws?.close();
  };
}

export function disconnect(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  ws?.close();
  ws = null;
  messageHandler = null;
}

export function sendMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error('WebSocket is not connected');
    return;
  }

  const payload: ChatMessage = {
    ...message,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };

  ws.send(JSON.stringify(payload));
}

export function onMessage(handler: MessageHandler): void {
  messageHandler = handler;
}
