let ws: WebSocket | null = null;
let onMessage: ((data: any) => void) | null = null;

export function connectWebSocket(roomCode: string, nickname: string, callback: (data: any) => void): WebSocket {
  onMessage = callback;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.hostname}:3001`;
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    ws!.send(JSON.stringify({ type: 'join', roomCode, nickname }));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data as string);
      if (onMessage) onMessage(data);
    } catch (e) {
      console.error('WebSocket message parse error:', e);
    }
  };

  ws.onclose = () => {
    setTimeout(() => {
      if (onMessage) {
        connectWebSocket(roomCode, nickname, onMessage);
      }
    }, 3000);
  };

  ws.onerror = () => {
    ws?.close();
  };

  return ws;
}

export function sendWebSocketMessage(data: object) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

export function disconnectWebSocket() {
  onMessage = null;
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
}
