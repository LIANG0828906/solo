import { useState, useEffect, useCallback, useRef } from 'react';
import type { Pet } from '../types';

interface WSMessage {
  type: string;
  data: unknown;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  pet: Pet | null;
  connect: (userId: string) => void;
  disconnect: () => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [pet, setPet] = useState<Pet | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const userIdRef = useRef<string | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback((userId: string) => {
    userIdRef.current = userId;
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'auth', userId }));
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        
        if (message.type === 'connected') {
          setIsConnected(true);
        } else if (message.type === 'stateUpdate') {
          const data = message.data as { pet: Pet };
          setPet(data.pet);
        } else if (message.type === 'friendUpdate') {
          console.log('收到好友更新:', message.data);
        }
      } catch (e) {
        console.error('WebSocket消息解析失败:', e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      
      reconnectTimerRef.current = setTimeout(() => {
        if (userIdRef.current) {
          connect(userIdRef.current);
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket错误:', error);
    };
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    pet,
    connect,
    disconnect,
  };
};
