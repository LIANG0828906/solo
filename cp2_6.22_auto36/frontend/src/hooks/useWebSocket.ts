import { useEffect, useRef, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { ClientEvent, ServerEvent } from '@shared/types';

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  const on = useCallback(<T = any>(event: string, handler: (data: T) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(handler as (data: any) => void);
    return () => {
      listenersRef.current.get(event)?.delete(handler as (data: any) => void);
    };
  }, []);

  const send = useCallback((event: ClientEvent) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message', event);
    }
  }, []);

  useEffect(() => {
    const socket: Socket = io({
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('message', (evt: ServerEvent) => {
      const handlers = listenersRef.current.get(evt.type);
      if (handlers) {
        handlers.forEach((h) => h(evt.payload));
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { connected, send, on };
}
