import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from './store';
import { getWsUrl } from './api';
import { WSMessage, Task, UserCursor } from './types';
import { v4 as uuidv4 } from 'uuid';

export const useWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const addNotification = useAppStore((state) => state.addNotification);
  const setTasks = useAppStore((state) => state.setTasks);
  const addTask = useAppStore((state) => state.addTask);
  const updateTask = useAppStore((state) => state.updateTask);
  const deleteTask = useAppStore((state) => state.deleteTask);
  const setCursor = useAppStore((state) => state.setCursor);
  const removeCursor = useAppStore((state) => state.removeCursor);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WSMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'tasks_sync':
          setTasks(message.data as Task[]);
          break;
        case 'task_created':
          addTask(message.data as Task);
          break;
        case 'task_updated':
          updateTask(message.data as Task);
          break;
        case 'task_deleted':
          deleteTask(message.data as string);
          break;
        case 'cursor_move':
          setCursor(message.data as UserCursor);
          break;
        case 'user_leave':
          removeCursor(message.data as string);
          break;
        case 'conflict':
          addNotification({
            id: uuidv4(),
            type: 'warning',
            message: message.data.message || '检测到任务时间冲突！',
            timestamp: Date.now()
          });
          break;
        case 'user_join':
          break;
      }
    } catch (error) {
      console.error('WebSocket message parsing error:', error);
    }
  }, [setTasks, addTask, updateTask, deleteTask, setCursor, removeCursor, addNotification]);

  const connect = useCallback(() => {
    try {
      const url = getWsUrl() + `?userId=${currentUserId}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = handleMessage;

      ws.onclose = () => {
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
        }
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, 2000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }, [currentUserId, handleMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendCursorMove = useCallback((cursor: UserCursor) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'cursor_move',
        data: cursor
      }));
    }
  }, []);

  return { sendCursorMove };
};
