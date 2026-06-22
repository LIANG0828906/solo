import React, { createContext, useContext, useRef, useCallback, useEffect, useState } from 'react';

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollData {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  type: 'single' | 'multiple';
  deadline?: number;
  createdAt: number;
  isActive: boolean;
  totalVotes: number;
  hasVoted?: boolean;
  isCreator?: boolean;
}

interface WebSocketMessage {
  type: string;
  poll: PollData;
}

interface WebSocketContextType {
  subscribe: (pollId: string, callback: (poll: PollData) => void) => void;
  unsubscribe: (pollId: string) => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wsRef = useRef<Map<string, WebSocket>>(new Map());
  const callbacksRef = useRef<Map<string, (poll: PollData) => void>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback((pollId: string) => {
    if (wsRef.current.has(pollId)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?pollId=${pollId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        if (data.type === 'poll_update') {
          const callback = callbacksRef.current.get(pollId);
          if (callback) {
            callback(data.poll);
          }
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current.delete(pollId);
    };

    ws.onerror = () => {
      console.error('WebSocket error');
    };

    wsRef.current.set(pollId, ws);
  }, []);

  const subscribe = useCallback((pollId: string, callback: (poll: PollData) => void) => {
    callbacksRef.current.set(pollId, callback);
    connect(pollId);
  }, [connect]);

  const unsubscribe = useCallback((pollId: string) => {
    callbacksRef.current.delete(pollId);
    const ws = wsRef.current.get(pollId);
    if (ws) {
      ws.close();
      wsRef.current.delete(pollId);
    }
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current.forEach((ws) => {
        ws.close();
      });
      wsRef.current.clear();
      callbacksRef.current.clear();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ subscribe, unsubscribe, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};
