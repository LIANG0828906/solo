import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { WsAction } from '../types';

interface SocketContextType {
  sendMessage: (action: WsAction) => void;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

interface SocketProviderProps {
  children: React.ReactNode;
  onMessage: (action: WsAction) => void;
}

export function SocketProvider({ children, onMessage }: SocketProviderProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const messageQueueRef = useRef<WsAction[]>([]);
  const onMessageRef = useRef(onMessage);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const sendMessage = useCallback((action: WsAction) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
    } else {
      messageQueueRef.current.push(action);
    }
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      while (messageQueueRef.current.length > 0) {
        const action = messageQueueRef.current.shift();
        if (action) ws.send(JSON.stringify(action));
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const action: WsAction = JSON.parse(event.data);
        onMessageRef.current(action);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ sendMessage, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
