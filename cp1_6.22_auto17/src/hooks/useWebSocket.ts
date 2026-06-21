import { useCallback, useEffect, useRef } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { WsMessage } from '@/types';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const {
    setConnectionStatus,
    setLatency,
    setLastTimestamp,
    setMetrics,
    triggerPulse,
    setErrorMessage,
  } = useDashboardStore();

  const connect = useCallback((url: string) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    setConnectionStatus('connecting');
    setErrorMessage(null);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        triggerPulse();
        setTimeout(() => useDashboardStore.setState({ pulseEffect: false }), 600);

        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const msg: WsMessage = { type: 'ping', timestamp: Date.now() };
            ws.send(JSON.stringify(msg));
          }
        }, 5000);
      };

      ws.onmessage = (event) => {
        try {
          const msg: WsMessage = JSON.parse(event.data);
          if (msg.type === 'metrics' && msg.data) {
            setMetrics(msg.data);
            setLastTimestamp(msg.data.timestamp);
          } else if (msg.type === 'pong' && msg.timestamp) {
            const rtt = Date.now() - msg.timestamp;
            setLatency(rtt);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        setConnectionStatus('error');
        setErrorMessage('连接失败，请检查WebSocket地址');
        setTimeout(() => setErrorMessage(null), 3000);
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        if (pingRef.current) {
          clearInterval(pingRef.current);
          pingRef.current = null;
        }
      };
    } catch {
      setConnectionStatus('error');
      setErrorMessage('无效的WebSocket地址');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  }, [setConnectionStatus, triggerPulse, setErrorMessage, setMetrics, setLastTimestamp, setLatency]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (pingRef.current) {
      clearInterval(pingRef.current);
      pingRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, [setConnectionStatus]);

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (pingRef.current) clearInterval(pingRef.current);
    };
  }, []);

  return { connect, disconnect };
}
