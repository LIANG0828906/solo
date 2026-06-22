import { useEffect, useRef, useCallback, useState } from 'react';
import { useStore } from '../store';
import type { WSMessage } from '../types';

export function useWebSocket(poemId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [connected, setConnected] = useState(false);
  const setWsConnected = useStore((s) => s.setWsConnected);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const clearReconnect = useCallback(() => {
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!poemId) return;

    const currentUserId = useStore.getState().currentUser.id;
    let wsUrl: string;

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      wsUrl = `ws://localhost:8000/ws?poemId=${poemId}&userId=${currentUserId}`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/ws?poemId=${poemId}&userId=${currentUserId}`;
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setConnected(true);
        setWsConnected(true);

        heartbeatRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WSMessage;
          if (msg.type === 'pong') return;
          useStore.getState().handleWSMessage(msg);
        } catch (_err) {
          void _err;
        }
      };

      ws.onerror = () => {
        setConnected(false);
        setWsConnected(false);
      };

      ws.onclose = () => {
        setConnected(false);
        setWsConnected(false);
        clearHeartbeat();

        if (reconnectAttemptsRef.current < 10) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current += 1;
          reconnectRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (_e) {
      void _e;
      setConnected(false);
      setWsConnected(false);
    }
  }, [poemId, clearHeartbeat, setWsConnected]);

  const send = useCallback((message: WSMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    clearReconnect();
    clearHeartbeat();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
    setWsConnected(false);
    reconnectAttemptsRef.current = 0;

    if (poemId) {
      connect();
    }

    return () => {
      clearReconnect();
      clearHeartbeat();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnected(false);
      setWsConnected(false);
    };
  }, [poemId, connect, clearHeartbeat, clearReconnect, setWsConnected]);

  return { send, connected };
}
