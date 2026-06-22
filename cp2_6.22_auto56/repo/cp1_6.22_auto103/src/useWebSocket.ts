import React, { useRef, useEffect, useCallback } from 'react';
import { WsMessage } from './types';

export function useWebSocket(boardId: string | undefined, onMessage: (msg: WsMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const username = useRef(`User-${Math.floor(Math.random() * 9000 + 1000)}`);

  const connect = useCallback(() => {
    if (!boardId) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', boardId, username: username.current }));
    };

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        onMessageRef.current(msg);
      } catch {}
    };

    ws.onclose = () => {
      setTimeout(() => {
        if (boardId) connect();
      }, 3000);
    };
  }, [boardId]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({ type: 'leave' }));
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return username.current;
}
