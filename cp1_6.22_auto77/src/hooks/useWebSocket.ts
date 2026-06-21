import { useEffect, useRef, useCallback } from 'react';
import { ClientMessage, ServerMessage } from '../types';

export function useWebSocket(
  userId: string,
  userName: string,
  onMessage: (msg: ServerMessage) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const wsUrl = `${protocol}//${host}:3001/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.addEventListener('open', () => {
      const join: ClientMessage = {
        type: 'JOIN',
        userId,
        userName,
      };
      ws.send(JSON.stringify(join));
    });

    ws.addEventListener('message', (ev) => {
      try {
        const msg: ServerMessage = JSON.parse(ev.data);
        setTimeout(() => onMessage(msg), 100);
      } catch (e) {
        console.error('parse ws msg failed', e);
      }
    });

    ws.addEventListener('close', () => {
      if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
      reconnectTimer.current = window.setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) connect();
      }, 2000);
    });

    ws.addEventListener('error', () => {
      ws.close();
    });
  }, [userId, userName, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  return { send };
}
