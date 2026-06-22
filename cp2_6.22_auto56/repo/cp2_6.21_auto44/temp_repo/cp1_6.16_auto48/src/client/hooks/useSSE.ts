import { useEffect, useRef, useCallback } from 'react';
import type { SSEEvent, SSEEventType } from '@shared/types';

type EventHandler = (event: SSEEvent) => void;

export function useSSE(handlers: Partial<Record<SSEEventType, EventHandler>>) {
  const esRef = useRef<EventSource | null>(null);
  const handlersRef = useRef(handlers);

  handlersRef.current = handlers;

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }
    const es = new EventSource('/api/sse');
    es.onmessage = (e) => {
      try {
        const event: SSEEvent = JSON.parse(e.data);
        const handler = handlersRef.current[event.type];
        if (handler) {
          handler(event);
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };
    es.onerror = () => {
      es.close();
      setTimeout(connect, 3000);
    };
    esRef.current = es;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [connect]);
}
