import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { TransportUpdate } from './types';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [recentUpdates, setRecentUpdates] = useState<TransportUpdate[]>([]);

  useEffect(() => {
    const socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] 已连接');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket] 已断开');
    });

    socket.on('transport-update', (update: TransportUpdate) => {
      setRecentUpdates(prev => {
        const updated = [update, ...prev];
        return updated.slice(0, 10);
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const clearUpdates = useCallback(() => {
    setRecentUpdates([]);
  }, []);

  return {
    isConnected,
    recentUpdates,
    clearUpdates,
    socket: socketRef.current
  };
}
