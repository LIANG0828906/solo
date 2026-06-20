import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store';
import type { WsMessage, Note, Annotation } from '@/types';

const WS_URL = 'ws://localhost:8080';
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_DELAY = 500;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const isManualClose = useRef(false);

  const {
    currentUser,
    setWsConnected,
    setOtherUsers,
    updateUserCursor,
    setNote,
    setAnnotations,
  } = useStore();

  const handleMessage = useCallback(
    (message: WsMessage) => {
      switch (message.type) {
        case 'users-update':
          const otherUsers = message.payload.users.filter(
            (u: { id: string }) => u.id !== currentUser.id
          );
          setOtherUsers(otherUsers);
          break;

        case 'cursor':
          if (message.userId !== currentUser.id) {
            const pos = message.payload.position;
            updateUserCursor(message.userId, pos === undefined ? null : pos);
          }
          break;

        case 'user-leave':
          updateUserCursor(message.payload.clientId || message.userId, null);
          break;

        case 'edit':
          if (message.userId !== currentUser.id) {
            const { content, html } = message.payload;
            const existingNote = useStore.getState().note;
            const updatedNote: Note = {
              ...existingNote,
              content,
              html,
              updatedAt: new Date(),
            };
            setNote(updatedNote);
          }
          break;

        case 'annotation':
          if (message.userId !== currentUser.id) {
            const { annotation, action } = message.payload;
            const currentAnnotations = useStore.getState().annotations;

            if (action === 'add') {
              setAnnotations([...currentAnnotations, annotation as Annotation]);
            } else if (action === 'delete') {
              setAnnotations(
                currentAnnotations.filter((a) => a.id !== (annotation as Annotation).id)
              );
            }
          }
          break;
      }
    },
    [currentUser.id, setOtherUsers, updateUserCursor, setNote, setAnnotations]
  );

  const connect = useCallback(() => {
    if (isManualClose.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected to server');
        setWsConnected(true);
        reconnectAttempts.current = 0;

        try {
          ws.send(
            JSON.stringify({
              type: 'user-join',
              payload: { user: currentUser },
              userId: currentUser.id,
              timestamp: Date.now(),
            })
          );
        } catch (e) {
          console.error('[WebSocket] Failed to send join message:', e);
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WsMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Connection closed, code:', event.code);
        setWsConnected(false);

        if (!isManualClose.current && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current++;
          const delay = Math.min(
            INITIAL_DELAY * 2 ** reconnectAttempts.current,
            10000
          );
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})...`);
          setTimeout(connect, delay);
        }
      };

      ws.onerror = (event) => {
        console.log('[WebSocket] Connection error (will attempt reconnection)');
      };
    } catch (error) {
      console.error('[WebSocket] Failed to create WebSocket:', error);

      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts.current++;
        const delay = Math.min(
          INITIAL_DELAY * 2 ** reconnectAttempts.current,
          10000
        );
        setTimeout(connect, delay);
      }
    }
  }, [currentUser, setWsConnected, handleMessage]);

  const sendMessage = useCallback(
    (message: Omit<WsMessage, 'timestamp'>) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(
            JSON.stringify({
              ...message,
              timestamp: Date.now(),
            })
          );
        } catch (e) {
          console.error('[WebSocket] Failed to send message:', e);
        }
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      connect();
    }, 1000);

    return () => {
      clearTimeout(timer);
      isManualClose.current = true;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { sendMessage, wsRef };
}
