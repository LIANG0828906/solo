import { useRef, useEffect, useCallback, useState } from 'react';
import type { WSMessage, WSMessageType } from '@/types';

interface UseWebSocketOptions {
  url: string;
  tripId?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    url,
    tripId,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const messageListenersRef = useRef<Map<WSMessageType, Set<(data: unknown) => void>>>(
    new Map()
  );
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const wsUrl = tripId ? `${url}?tripId=${tripId}` : url;
      const token = localStorage.getItem('token');
      const fullUrl = token ? `${wsUrl}&token=${token}` : wsUrl;

      wsRef.current = new WebSocket(fullUrl);

      wsRef.current.onopen = () => {
        setState({ isConnected: true, isConnecting: false, error: null });
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);

          if (message.type === 'ping') {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            }
            return;
          }

          const listeners = messageListenersRef.current.get(message.type);
          if (listeners) {
            listeners.forEach((listener) => listener(message.data));
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setState((prev) => ({ ...prev, error: 'WebSocket连接错误' }));
      };

      wsRef.current.onclose = (event) => {
        setState({ isConnected: false, isConnecting: false, error: null });

        if (autoReconnect && event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          reconnectTimerRef.current = window.setTimeout(() => {
            connect();
          }, reconnectInterval * Math.min(reconnectAttemptsRef.current, 5));
        }
      };
    } catch (e) {
      setState((prev) => ({ ...prev, isConnecting: false, error: '连接创建失败' }));
    }
  }, [url, tripId, autoReconnect, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
  }, []);

  const send = useCallback(
    (type: WSMessageType, data: unknown) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket is not connected. Message not sent.');
        return false;
      }

      const message: WSMessage = {
        type,
        tripId: tripId || '',
        userId: JSON.parse(localStorage.getItem('user') || '{}').id || '',
        data,
        timestamp: Date.now(),
      };

      wsRef.current.send(JSON.stringify(message));
      return true;
    },
    [tripId]
  );

  const on = useCallback((type: WSMessageType, listener: (data: unknown) => void) => {
    if (!messageListenersRef.current.has(type)) {
      messageListenersRef.current.set(type, new Set());
    }
    messageListenersRef.current.get(type)!.add(listener);

    return () => {
      messageListenersRef.current.get(type)?.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (tripId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [tripId, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    send,
    on,
  };
}

export default useWebSocket;
