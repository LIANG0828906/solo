import { useState, useEffect, useRef, useCallback } from 'react';
import type { WSMessage } from '../types';

interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: unknown;
  send: (message: WSMessage) => void;
  subscribe: (callback: (message: unknown) => void) => () => void;
}

function throttle<T extends (...args: unknown[]) => void>(fn: T, limit: number): T {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  const throttled = (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          const savedArgs = lastArgs;
          lastArgs = null;
          throttled(...savedArgs);
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };

  return throttled as T;
}

export function useWebSocket(url: string): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<unknown>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const subscribersRef = useRef<Set<(message: unknown) => void>>(new Set());
  const reconnectAttemptsRef = useRef(0);
  const heartbeatIntervalRef = useRef<number | null>(null);

  const throttledMessageHandler = useCallback(
    throttle((message: unknown) => {
      setLastMessage(message);
      subscribersRef.current.forEach((callback) => callback(message));
    }, 100),
    []
  );

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        heartbeatIntervalRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'heartbeat' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          throttledMessageHandler(message);
        } catch {
          throttledMessageHandler(event.data);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        reconnectAttemptsRef.current += 1;
        const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000);

        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, delay);
      };
    } catch {
      setIsConnected(false);
    }
  }, [url, throttledMessageHandler]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((message: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const subscribe = useCallback((callback: (message: unknown) => void) => {
    subscribersRef.current.add(callback);
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  return {
    isConnected,
    lastMessage,
    send,
    subscribe,
  };
}
