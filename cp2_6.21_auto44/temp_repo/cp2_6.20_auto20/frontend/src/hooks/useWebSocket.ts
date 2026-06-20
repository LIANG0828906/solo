import { useEffect, useRef, useCallback, useState } from 'react';
import type { Vote } from '../types';

interface WebSocketHook {
  isConnected: boolean;
  vote: Vote | null;
  connect: (voteId: string) => void;
  disconnect: () => void;
}

export function useWebSocket(voteId?: string): WebSocketHook {
  const [isConnected, setIsConnected] = useState(false);
  const [vote, setVote] = useState<Vote | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback((id: string) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/votes/${id}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'vote_update') {
          setVote(data.data as Vote);
        }
      } catch (e) {
        console.error('WebSocket message parse error:', e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    wsRef.current = ws;
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setVote(null);
  }, []);

  useEffect(() => {
    if (voteId) {
      connect(voteId);
    }
    return () => {
      disconnect();
    };
  }, [voteId, connect, disconnect]);

  return { isConnected, vote, connect, disconnect };
}
