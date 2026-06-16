import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store';
import type { WsMessage, Note, Annotation } from '@/types';

const WS_URL = 'ws://localhost:8080';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const {
    currentUser,
    setWsConnected,
    setOtherUsers,
    updateUserCursor,
    setNote,
    setAnnotations,
  } = useStore();

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setWsConnected(true);
        reconnectAttempts.current = 0;

        ws.send(
          JSON.stringify({
            type: 'user-join',
            payload: { user: currentUser },
            userId: currentUser.id,
            timestamp: Date.now(),
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const message: WsMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setWsConnected(false);

        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);
          console.log(`[WebSocket] Reconnecting in ${delay}ms...`);
          setTimeout(connect, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
    }
  }, [currentUser, setWsConnected]);

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
            updateUserCursor(message.userId, message.payload.position);
          }
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

  const sendMessage = useCallback(
    (message: Omit<WsMessage, 'timestamp'>) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            ...message,
            timestamp: Date.now(),
          })
        );
      }
    },
    []
  );

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { sendMessage, wsRef };
}
