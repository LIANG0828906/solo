import { useEffect, useRef, useCallback } from 'react';
import type {
  WSMessage,
  RatingUpdatedPayload,
  CommentAddedPayload,
  InitSyncPayload,
  PublicCardData,
} from '../types';

type MessageHandler = {
  onInitSync?: (payload: InitSyncPayload) => void;
  onCardCreated?: (card: PublicCardData) => void;
  onRatingUpdated?: (payload: RatingUpdatedPayload) => void;
  onCommentAdded?: (payload: CommentAddedPayload) => void;
};

export function useWebSocket(handlers: MessageHandler, enabled = true) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const connect = useCallback(() => {
    if (!enabled) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          const h = handlersRef.current;

          switch (message.type) {
            case 'INIT_SYNC':
              h.onInitSync?.(message.payload as InitSyncPayload);
              break;
            case 'CARD_CREATED':
              h.onCardCreated?.(message.payload as PublicCardData);
              break;
            case 'RATING_UPDATED':
              h.onRatingUpdated?.(message.payload as RatingUpdatedPayload);
              break;
            case 'COMMENT_ADDED':
              h.onCommentAdded?.(message.payload as CommentAddedPayload);
              break;
          }
        } catch {
        }
      };

      ws.onerror = () => {
      };

      ws.onclose = () => {
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(connect, 2000);
        }
      };
    } catch {
      reconnectTimerRef.current = setTimeout(connect, 2000);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, enabled]);

  return {
    isConnected:
      wsRef.current?.readyState === WebSocket.OPEN,
  };
}
