import { useEffect, useRef, useCallback } from 'react';
import type { WebSocketMessage, Feedback, CrashReport, HeatmapPoint } from '../types';

type MessageHandler = (data: any) => void;

export function useWebSocket(demoId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      if (demoId) {
        sendMessage('subscribe', { demoId });
      }
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        const handlers = handlersRef.current.get(message.type);
        if (handlers) {
          handlers.forEach((handler) => handler(message.payload));
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    wsRef.current.onclose = () => {
      setTimeout(connect, 3000);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [demoId]);

  const sendMessage = useCallback((type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const on = useCallback((type: string, handler: MessageHandler) => {
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, new Set());
    }
    handlersRef.current.get(type)!.add(handler);
  }, []);

  const off = useCallback((type: string, handler: MessageHandler) => {
    const handlers = handlersRef.current.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (demoId) {
        sendMessage('unsubscribe', { demoId });
      }
      wsRef.current?.close();
    };
  }, [connect, demoId, sendMessage]);

  return {
    sendMessage,
    on,
    off,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN
  };
}
