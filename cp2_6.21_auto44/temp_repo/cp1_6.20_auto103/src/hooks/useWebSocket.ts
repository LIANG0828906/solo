import { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasState, CanvasElement, User, Comment, NotificationItem } from '../types';

interface UseWebSocketOptions {
  onInit?: (state: CanvasState) => void;
  onElementAdd?: (element: CanvasElement) => void;
  onElementUpdate?: (element: CanvasElement) => void;
  onLike?: (data: { elementId: string; userId: string; count: number; liked: boolean }) => void;
  onComment?: (data: { elementId: string; comment: Comment }) => void;
  onUserJoin?: (user: User) => void;
  onUserLeave?: (userId: string) => void;
  onNotification?: (notification: NotificationItem) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const messageQueue = useRef<any[]>([]);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      while (messageQueue.current.length > 0) {
        const msg = messageQueue.current.shift();
        if (msg) ws.send(JSON.stringify(msg));
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = () => {
      setConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleMessage(message);
      } catch (e) {
        console.error('Failed to parse WebSocket message', e);
      }
    };
  }, []);

  const handleMessage = useCallback((message: any) => {
    const { onInit, onElementAdd, onElementUpdate, onLike, onComment, onUserJoin, onUserLeave, onNotification } = options;

    if (message.type === 'batch') {
      message.data.forEach((msg: any) => handleMessage(msg));
      return;
    }

    switch (message.type) {
      case 'init':
        onInit?.(message.data);
        break;
      case 'draw':
      case 'addNote':
        onElementAdd?.(message.data);
        if (message.data.userId) {
          onNotification?.({
            id: `draw-${message.data.id}-${Date.now()}`,
            type: message.type === 'draw' ? 'draw' : 'addNote',
            username: '有人',
            userColor: '#888',
            elementId: message.data.id,
            timestamp: Date.now()
          });
        }
        break;
      case 'updateNote':
        onElementUpdate?.(message.data);
        break;
      case 'like':
        onLike?.(message.data);
        onNotification?.({
          id: `like-${message.data.elementId}-${Date.now()}`,
          type: 'like',
          username: '有人',
          userColor: '#888',
          elementId: message.data.elementId,
          timestamp: Date.now()
        });
        break;
      case 'comment':
        onComment?.(message.data);
        onNotification?.({
          id: `comment-${message.data.comment.id}-${Date.now()}`,
          type: 'comment',
          username: message.data.comment.username || '有人',
          userColor: '#888',
          elementId: message.data.elementId,
          text: message.data.comment.text,
          timestamp: Date.now()
        });
        break;
      case 'userJoin':
        onUserJoin?.(message.data);
        onNotification?.({
          id: `join-${message.data.id}-${Date.now()}`,
          type: 'userJoin',
          username: message.data.username,
          userColor: message.data.color,
          timestamp: Date.now()
        });
        break;
      case 'userLeave':
        onUserLeave?.(message.data.userId);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }, [options]);

  const send = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      messageQueue.current.push(message);
    }
  }, []);

  const sendDraw = useCallback((data: { points: { x: number; y: number }[]; color: string; width: number }) => {
    send({ type: 'draw', data });
  }, [send]);

  const sendAddNote = useCallback((data: { x: number; y: number; color?: string }) => {
    send({ type: 'addNote', data });
  }, [send]);

  const sendUpdateNote = useCallback((data: { id: string; x?: number; y?: number; text?: string }) => {
    send({ type: 'updateNote', data });
  }, [send]);

  const sendLike = useCallback((elementId: string) => {
    send({ type: 'like', data: { elementId } });
  }, [send]);

  const sendComment = useCallback((elementId: string, text: string) => {
    send({ type: 'comment', data: { elementId, text } });
  }, [send]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    connected,
    send,
    sendDraw,
    sendAddNote,
    sendUpdateNote,
    sendLike,
    sendComment
  };
}
